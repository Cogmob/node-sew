module.exports = sew;

var glob = require('glob');
var fs = require('fs');

function sew(spec) {
    paths = processPaths({
        paths: spec.paths,
        glob: glob
    });

    applyTemplates({
        paths: paths,
        templates: spec.templates,
        fs: fs
    });
}

function processPaths(params) {

}

function applyTemplates(params) {

}
