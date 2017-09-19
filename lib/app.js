'use babel';

export default class ScssLintFormat {

  constructor(lintFilePath) {
    if (lintFilePath === void 0 || lintFilePath === '') {
      return;
    }

    this.lintFilePath = lintFilePath;
  }

  run(data, callback) {
    if (this.lintFilePath && this.lintFilePath !== '') {
      fs.exists(this.lintFilePath, (exists) => {
        if (exists) {
          let lintText = scan(this.lintFilePath, parseAndFormat, false).text.toString();
          this.lintRules = lintParse(lintText).parseFile;
        } else {
          this.lintFilePath === '';
          this.lintRules = lintParse('').linterRules;
        }
        let result = parseAndFormat(data, this.lintRules);
        callback(result);
      });
    } else {
      this.lintFilePath === '';
      this.lintRules = lintParse('').linterRules;
      let result = parseAndFormat(data, this.lintRules);
      callback(result);
    }
  }

  serialize() {}

  destroy() {
    this.lintRules = null;
    this.lintFilePath = null;
  }
}


const lintParse = require('./lintFileParser'),
  fs = require('fs'),
  scan = require('./scan'),
  scssParse = require('./scssParser'),
  scssWrite = require('./scssWriter'),
  find = require('find');

let parseAndFormat = function (data, lintRules) {

  if (data == void 0 || data === '')
    return 'Error: No data supplied';

  var scssObj = scssParse(data);
  if (!scssObj.output) {
    console.error("Could not parse .scss file.");
    return 'Error: Could not parse .scss file';
  }

  var scssText = scssWrite(scssObj.output, lintRules);
  if (!scssText.output) {
    return data;
  }

  return scssText.output;
}