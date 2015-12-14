var changeDirFormat = require("./changeDirFormat");
var promisify = require("promisify-node");
var deepcopy = require('deepcopy');
var expect = require('chai').expect;
var mock = require('mock-fs');
var sew = require('../');
var jsondir = require('jsondir');
var objToDir = promisify(require('jsondir').json2dir);
var q = require('q');
var fs = require('fs');
var map = require('ramda').map;
var sentenceCase = require('change-case').sentenceCase;
var reduce = require('ramda').reduce;

function dirToObj(path) {
    var deferred = q.defer();

    jsondir.dir2json(path, function(err,result) {
        deferred.resolve(result);
    });

    return deferred.promise;
}

function pr(ob) {
    console.log(JSON.stringify(ob,null,4));
}

filenames = fs.readdirSync('test/scenarios');

scenarios = reduce(function(acc, filename) {
    split = filename.split('.');
    if (split[1] !== 'js') return acc;

    testModule = require('./scenarios/'+split[0]);
    testModule.name = sentenceCase(filename.split('.'));
    acc.push(testModule);
    return acc;
}, [], filenames);

describe('sew', function() {
    beforeEach(function() {
        process.chdir('/');
        mock({});
    });

    afterEach(function() {
        mock.restore();
    });

    map(function(scenario) {
        it(scenario.name, function() {
            return objToDir(changeDirFormat(scenario.setup))
                .then(function() {
                    return sew(scenario.sewConfig);
                }).then(function() {
                    return dirToObj(scenario.resultPath);
                }).then(function(dir) {
                    expect(dir)
                        .to.deep.equal(
                            changeDirFormat(scenario.result));
                });
        });
    }, scenarios);

});

