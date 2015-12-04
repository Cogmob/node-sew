var promisify = require("promisify-node");
var deepcopy = require('deepcopy');
var compare = require('dir-compare').compareSync;
var expect = require('chai').expect;
var fsp = require('fs-promise');
var mock = require('mock-fs');
var sew = require('../');
var jsondir = require('jsondir');
var objToDir = promisify(require('jsondir').json2dir);
var q = require('q');

function dirToObj(path) {
    var deferred = q.defer();
    jsondir.dir2json(path, function(err,result) {
        deferred.resolve(result);
    });
    return deferred.promise;
}
        
function delay(ms) {
    var deferred = q.defer();
    setTimeout(deferred.resolve, ms);
    return deferred.promise;
}

var exampleFs = {
    a: {
        b: {
            'c.txt': 'asdf qwer',
            'd.txt': 'dkjfkjdkfjkdjfkd'
        },
        e: 'uieuir',
    },
    f: {
        g: 'h'
    }
};

describe('sew', function() {
    beforeEach(function() {
        process.chdir('/');
        mock({
          'source': { 'f': {} }
        });
    });

    afterEach(function() {
        console.log('after each');
        mock.restore();
    });

    it('should not change', function() {
        return fsp.writeFile('source/f/g', 'i')
            .then(function() {
                return dirToObj('source');
            }).then(function(dir) {
                expect(dir).to.deep.equal({
                    "-path": "/source",
                    "-type": "d",
                    "f": {
                      "-path": "/source/f",
                      "-type": "d",
                      "g": {
                        "-content": "i",
                        "-path": "/source/f/g",
                        "-type": "-"
                      }
                    }
                });
            });
    });
});
