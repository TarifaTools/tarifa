var Q = require('q'),
    os = require('os'),
    path = require('path'),
    exec = require('child_process').exec,
    chalk = require('chalk'),
    settings = require('./settings'),
    print = require('../../../helper/print');

var MSG_FXOS_CONNECTED_DEVICES = 'connected firefox devices:';

var parse = function(str) {
    return str.replace('List of devices attached', '')
        .replace(/\*.*\*/g, '')
        .split('\n')
        .filter(function (l) { return l.replace('\t', '').trim().length > 0; })
        .map(function (d) {
            return d.split(' ').filter(function (w) {
                return w.length > 0;
            });
        }).filter(function(d) { return d.length > 0; });
};

var isFirefoxOs = function (device) {
    var defer = Q.defer();
    var cmd = settings.external.adb.name + " -s " + device[0];
    cmd += " shell ls " + settings.external.firefoxos.fs;

    exec(cmd, function (error, stdout, stderr) {
        // build regexp pattern with support for any linefeed ending
        var pattern = new RegExp('^' + settings.external.firefoxos.fs + '\\s+$');
        if (error !== null) defer.reject(error);
        else
            if (pattern.test(stdout.toString())) {
                defer.resolve(device);
            } else {
                defer.reject();
            }

    });
    return defer.promise;
};
var all = function () {
    var defer = Q.defer();
    exec(settings.external.adb.name + " devices -l", function (error, stdout, stderr) {
        if (error !== null) defer.reject(error);
        else
            var candidates = parse(stdout.toString());
            Q.allSettled(candidates.map(isFirefoxOs)).then(function (results) {
                defer.resolve(results
                    .filter(function (result) {
                        return result.state === "fulfilled"
                    })
                    .map(function (result) {
                        return result.value;
                    })
                );
            });
    });
    return defer.promise;
};

var ids = function () {
    return all().then(function (devices) {
        return devices.map(function (device) { return device[0]; });
    });
};

var info = function (verbose) { return verbose ? all() : ids(); };

var show = function (verbose) {
    return info(verbose).then(function (devices) {
        if(!devices.length) {
            print("%s %s", chalk.green(MSG_FXOS_CONNECTED_DEVICES), 'none');
        }
        else if(verbose) {
            print(chalk.green(MSG_FXOS_CONNECTED_DEVICES));
            devices.forEach(function (dev) {
                print('\t%s', dev.join(' '));
            });
        }
        else {
            print(
                "%s\n\t%s",
                chalk.green(MSG_FXOS_CONNECTED_DEVICES),
                devices.join('\n\t')
            );
        }
    });
};

module.exports = {
    info: info,
    print: show
};