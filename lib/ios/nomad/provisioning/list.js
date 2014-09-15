var Q = require('q'),
    format = require('util').format,
    exec = require('child_process').exec,
    print = require('../../../helper/print');

function parse(stdout) {
    return stdout.toString()
        .split('\n')
        .filter(function (line) { return line.search("Active") >= 0; })
        .map(function (line) {
            var elts = line.split('|');
            return [elts[1], elts[2]];
        });
}

function list(user, team, password, verbose) {
    var defer = Q.defer(),
        options = {
            timeout : 40000,
            maxBuffer: 1024 * 400
        },
        t = (team ?  (" --team " + team) : ''),
        cmd = format("ios profiles:list -u %s -p '%s' %s --type distribution", user, password, t);

    exec(cmd, options, function (err, stdout, stderr) {
        if(err) {
            if(verbose) {
                print.error('command: %s', cmd);
            }
            defer.reject('ios stderr ' + err);
            return;
        }
        defer.resolve(parse(stdout));
    });

    return defer.promise;
}

module.exports = list;
