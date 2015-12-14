var promisify = require('promisify-node');
var q = require('q');
var fs = require('fs');
var glob = require('./glob');
var colors = require('colors');
var pr = require('./print').pr;
var pro = require('./print').pro;
var io = require('q-io/fs');

var ramda = require('ramda');
var map = ramda.map;
var reduce = ramda.reduce;
var pipe = ramda.pipe;

var monads = require('./monads');
var echo = monads.echo;
var resultM = monads.result;
var mm = monads.getMonadsMonad();
var getWrap = monads.getWrap;
var wrapA = getWrap('a');
var wrapB = getWrap('b');
var wrapC = getWrap('c');


module.exports = sew;


function sew(spec) {
    if (Object.keys(spec).length === 0) return resultM.result();

    pipe(
        mm.bind(echo(spec)),
        mm.tee
    )(null);
    return finish();
}

function finish() {
    return io.copyTree('/source', '/dest');
}

function wrapMethod(i) {
    return wrapC.unit(wrapB.unit(wrapA.unit(i)));
}

function wrapSmaller(i) {
    return wrapB.unit(wrapA.unit(i));
}

function simpleSpec(spec) {
    map(function(key) {
        processPath({
            dest: key,
            source: spec[key]
        });
    }, Object.keys(spec));
}

function processPath(params) {
    return getSourcePaths(params.source)
        .then(function(sourcePaths) {
            applyDestPath({
                dest: params.dest,
                sourcePaths: sourcePaths
            });
        });
}

function getSourcePaths(path) {
    segments = getSegmentDescriptions(path);
    return getFilesFromSegments({
        segments: segments,
        cwd: '/'
    });
}

function applyDestPath(params) {
    return getDestSegmentDescriptions(params)
        .then(function(segments) {
            return writeFilesFromSegments({
                segments: segments,
                cwd: '/'
            });
        });
}

function getSegmentDescriptions(path) {
    subs = path.split('#');
    subs.reverse();
    return reduce(function(acc, str) {
        assign = str.split(':');
        if (assign.length > 1) {
            return {
                segmentLabel: assign[0],
                segmentGlob: assign[1],
                children: acc
            };
        } else {
            return {
                segmentLabel: str,
                segmentGlob: str,
                children: acc
            }
        }
    }, null, subs);
}

function getFilesFromSegments(params) {
    if (params.segments === null) {
        return q({
            path: params.cwd
        });
    } else {
        return glob({
            glob: params.segments.segmentGlob,
            cwd: params.cwd
         }).then(function(paths) {
            return getFilesInSubFolders({
                cwd: params.cwd,
                segments: params.segments,
                paths: paths
            });
        }).then(function(children) {
            return children;
        });
    }
}

function getFilesInSubFolders(params) {
    return q.all(map(function(path) {
        return getFilesFromSegments({
            segments: params.segments.children,
            cwd: path
        });
    }, params.paths)).then(function(children) {
        return q({
            segmentLabel: params.segments.segmentLabel,
            segmentGlob: params.segments.segmentGlob,
            path: params.cwd,
            children: children
        });
    });
}

function getDestSegmentDescriptions(params) {
    var sections = params.dest.split('#');
    sections.reverse();
    return process({
        sourceSections: params.sourcePaths,
        destSectionLabels: sections,
        cwd: ''
    });
}

function process(params) {
    pr('input');
    pro(params);
    var processedThis;
    return processThis(params)
        .then(function(res) {
            processedThis = res;
            if (params.destSectionLabels.length === 0) return {action:processedThis};
            return processChildren(params);
        }).then(function(processedChildren) {
            pr('output');
            pro({
                action: processedThis.type,
                children: processedChildren,
                path: processedThis.path
            });
            return {
                action: processedThis.type,
                children: processedChildren,
                path: processedThis.path
            };
        });
}

function processThis(params) {
    pr('process this');
    pro(params);
    var label = params.destSectionLabels.pop();
    sourceSection = getSourceSection({
        label: label,
        sections: params.sourceSections
    });
    if (sourceSection) {
        return q({
            type: 'add',
            path: label
        });
    } else {
        return q({
            type: 'move to',
            path: label
        });
    }
}

function processChildren(params) {
    pr('processchildren');
    pro(params);
    return q.all(map(function(child) {
        return process({
            sourceSections: child,
            destSectionLabels: params.destSectionLabels,
            cwd: child.path
        });
    }, params.sourceSections.children));
}

function  getSourceSection(params) {
    if (!params.sections.hasOwnProperty('segmentLabel')) return null;
    if (params.sections.segmentLabel === params.label) return params.sections;
    return getSourceSection({
        label: params.label,
        sections: params.sections.children
    });
}

function writeFilesFromSegments(segments) {
    return q(segments);
}
