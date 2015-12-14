var glob = require('glob');

exports.glob = function(params) {
    var deferred = q.defer();
    cbGlob(
        params.glob,
        {
            cwd: params.cwd
        },
        function(err, files) {
            if (err) deferred.reject(err)
            deferred.resolve(files);
        }
    );
    return deferred.promise;
}

