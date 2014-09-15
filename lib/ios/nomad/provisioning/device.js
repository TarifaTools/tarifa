var Q = require('q'),
    format = require('util').format,
    exec = require('child_process').exec,
    print = require('../../../helper/print'),
    parseProvisionFile = require('../../parse-mobileprovision');

function call(action, user, team, password, uuid, profile_path, devices, verbose) {
    var c = "ios profiles:manage:devices:%s %s \"%s\"=%s -u %s -p '%s' %s",
        device = devices.filter(function (d) { return d.uuid.trim() === uuid; } )[0],
        t = (team ?  (" --team " + team) : ''),
        options = {
            timeout : 40000,
            maxBuffer: 1024 * 400
        };

    if(!device) return Q.reject("uuid is not included in the developer center!");

    return parseProvisionFile(profile_path).then(function (provisioning) {
        var defer = Q.defer(),
            cmd = format(c, action, provisioning.name, device.name.trim(), uuid, user, password, t);

        exec(cmd, options, function (err, stdout, stderr) {
            if(err) {
                if(verbose) {
                    print.error('command: %s', cmd);
                }
                defer.reject('ios stderr ' + err);
                return;
            }

            var output = stdout.toString().split('\n');
            if(verbose) print(output.toString());
            defer.resolve(output.toString());
        });

        return defer.promise;
    });
}

module.exports.add = function (user, team, password, uuid, profile_path, devices, verbose) {
    return  call('add', user, team, password, uuid, profile_path, devices, verbose);
};

module.exports.remove = function (user, team, password, uuid, profile_path, devices, verbose) {
    return  call('remove', user, team, password, uuid, profile_path, devices, verbose);
};
