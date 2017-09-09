'use strict';

const fs = require('fs');

module.exports = function scan(dir, callback, isAsync) {
    return {
        path: dir,
        text: read(dir, callback, isAsync)
    };
};

let read = function (dir, callback, isAsync) {
    if (!isAsync) {
        return fs.readFileSync(dir);
    } else {
        return fs.readFile(dir, callback);
    }
}