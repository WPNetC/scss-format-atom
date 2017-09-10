'use strict';

String.prototype.replaceAt=function(index, replacement) {
    return this.substr(0, index) + replacement+ this.substr(index + replacement.length);
}
String.prototype.toLowerStripped = function() {
 return this.replace(/\s+/g, '-').replace(/[^a-zA-Z-]/g, '').toLowerCase();
}

const _C = require('./constants');

let buffer = '';

let baseRules = {
    betweenBlock: '\r\n',
    indentChar: '\t',
    postComma: ' ',
    postPropColon: ' ',
    postPropName: '',
    postVarName: ' ',
    preBrace: ' ',
    prePostOperator: '',
    postPreParens: '',
    quoteChar: '"',
    sortProperties: false
};

let writeIndent = function (nestingLevel) {
    let result = '';
    for (let i = 0; i < nestingLevel; i++) {
        result += baseRules.indentChar;
    }
    return result;
}

let processLintObject = function (lintRules) {

    // Indentation
    if (lintRules.Indentation.enabled) {
        let c = lintRules.Indentation.character == 'tab' ? '\t' : ' ';
        for (var ii = 1; ii < lintRules.Indentation.width; ii++) {
            c += c;
        }
        baseRules.indentChar = c;
    } else {
        baseRules.indentChar = '';
    }

    // Space between blocks
    if (lintRules.EmptyLineBetweenBlocks.enabled) {
        baseRules.betweenBlock = '\r\n';
    } else {
        baseRules.betweenBlock = '';
    }

    // Space after comma
    if (lintRules.SpaceAfterComma.enabled) {
        if (lintRules.SpaceAfterComma.style === 'no_space') {
            baseRules.postComma = '';
        } else {
            baseRules.postComma = ' ';
        }
    }

    // Space after property colon
    if (lintRules.SpaceAfterPropertyColon.enabled) {
        if (lintRules.SpaceAfterPropertyColon.style === 'no_space') {
            baseRules.postPropColon = '';
        } else if (lintRules.SpaceAfterPropertyColon.style === 'one_space') {
            baseRules.postPropColon = ' ';
        } else {
            baseRules.postPropColon = '\t\t\t';
        }
    }

    // Space after property name
    if (lintRules.SpaceAfterPropertyName.enabled) {
        baseRules.postPropName = ' ';
    } else {
        baseRules.postPropName = '';
    }

    // Space after variable name
    if (lintRules.SpaceAfterVariableName.enabled) {
        baseRules.postVarName = ' ';
    } else {
        baseRules.postVarName = '';
    }

    // Space around operator
    if (lintRules.SpaceAroundOperator.enabled) {
        if (lintRules.SpaceAroundOperator.style === 'no_space') {
            baseRules.prePostOperator = '';
        } else {
            baseRules.prePostOperator = ' ';
        }
    }

    // Space before brace
    if (lintRules.SpaceBeforeBrace.enabled) {
        if (lintRules.SpaceBeforeBrace.style === 'space') {
            baseRules.preBrace = ' ';
        } else {
            baseRules.preBrace = '\r\n';
        }
    }

    // Space between parens
    if (lintRules.SpaceBetweenParens.enabled) {
        let c = '';
        for (var ii = 0; ii < lintRules.SpaceBetweenParens.spaces; ii++) {
            c += ' ';
        }
        baseRules.postPreParens = c;
    } else {
        baseRules.postPreParens = '';
    }

    // Sort properties
    baseRules.sortProperties = lintRules.PropertySortOrder.enabled;

    // String quotes
    if (lintRules.StringQuotes.enabled) {
        if (lintRules.StringQuotes.style === 'double_quotes') {
            baseRules.quoteChar = '"';
        } else {
            baseRules.quoteChar = '\'';
        }
    }
}

let processBlock = function (node) {
    // Handle space between blocks.
    if (buffer != '') {
        if (node.depth === 0) {
            buffer += baseRules.betweenBlock;
        } else {
            var parHasVals = (node.parent === undefined || node.parent.data === undefined) ?
                false : node.parent.data.length > 0;
            if (parHasVals) {
                buffer += baseRules.betweenBlock;
            }
        }
    }

    // Write block opening
    let sChr = getStartingChar(node);
    buffer += writeIndent(node.depth);
    if (sChr != '' && node.name.indexOf(sChr) != 0) {
        buffer += sChr;
    }
    
    buffer += (node.name.replace(/, /g, ',\r\n' + writeIndent(node.depth)) + baseRules.preBrace + '{\r\n');

    // Write block properties
    if (node.data) {
        // Sort properties if required by lint rules
        let props = node.data;
        if (baseRules.sortProperties) {
            props = node.data.sort(function (a, b) {
                if (a.name && b.name) {
                    // If both are named properties
                    let x = a.name.toLowerStripped();
                    let y = b.name.toLowerStripped();
                    if (x < y) {
                        return -1;
                    }
                    if (x > y) {
                        return 1;
                    }
                    return 0;
                } else if (a.name || b.name) {
                    // If one is named property
                    if (a.name) {
                        let x = a.name.toLowerStripped();
                        let y = b.value.toLowerStripped();
                        if (x < y) {
                            return -1;
                        }
                        if (x > y) {
                            return 1;
                        }
                        return 0;
                    } else if (b.name) {
                        let x = a.value.toLowerStripped();
                        let y = b.name.toLowerStripped();
                        if (x < y) {
                            return -1;
                        }
                        if (x > y) {
                            return 1;
                        }
                        return 0;
                    } else {
                        return 0;
                    }
                } else {
                    // If neither are named properties
                    let x = a.value.toLowerStripped();
                    let y = b.value.toLowerStripped();
                    if (x < y) {
                        return -1;
                    }
                    if (x > y) {
                        return 1;
                    }
                    return 0;
                }
            });
        }


        for (let rIdx = 0; rIdx < props.length; rIdx++) {
            let rule = props[rIdx];
            buffer += writeIndent(node.depth + 1);

            // Adjust quote character if needed
            /* NOT WELL TESTED. COULD BREAK STRINGS CONTAINING THE REPLACEMENT CHAR */
            let firstQuote = -1,
                lastQuote = -1;
            if (baseRules.quoteChar != '"') {
                firstQuote = rule.value.indexOf('"');
                lastQuote = rule.value.lastIndexOf('"');
            } else {
                firstQuote = rule.value.indexOf('\'');
                lastQuote = rule.value.lastIndexOf('\'');
            }
            if (firstQuote > -1 && firstQuote != lastQuote) {
                if (baseRules.quoteChar === '\'') {
                    rule.value = rule.value.replace(/'/g, '\\\'');
                } else {
                    rule.value = rule.value.replace(/"/g, '\\"');
                }

                // Anoyingly we now need to recalulate the indexes of the quotes, as we have just altered the string. :(
                if (baseRules.quoteChar != '"') {
                    firstQuote = rule.value.indexOf('"');
                    lastQuote = rule.value.lastIndexOf('"');
                } else {
                    firstQuote = rule.value.indexOf('\'');
                    lastQuote = rule.value.lastIndexOf('\'');
                }
                rule.value = rule.value.replaceAt(firstQuote, baseRules.quoteChar);
                rule.value = rule.value.replaceAt(lastQuote, baseRules.quoteChar);
            }

            // Write rule
            if (rule.name) {
                buffer += (rule.name + baseRules.postPropName + ':' + baseRules.postPropColon); // Write name with formatted colon. :)
                buffer += (rule.value + ';');
            } else {
                buffer += (rule.value + ';');
            }
            buffer += '\r\n';
        }
    }

    // Write sub-blocks
    if (node.childNodes) {
        for (let child of node.childNodes) {
            recurse(child);
        }
    }
    // Write block close
    buffer += writeIndent(node.depth);
    buffer += '}\r\n';
};

let processNonBlock = function (node) {
    if (node.type === _C.COMMENT_MULTI_TAG || node.type === _C.COMMENT_SINGLE_TAG) {
        for (let ii = 0; ii < node.data.length; ii++) {
            buffer += writeIndent(node.depth);
            buffer += node.data[ii].value;
            buffer += '\r\n';
        }
        return;
    }

    buffer += writeIndent(node.depth); // Write indent
    let sChr = getStartingChar(node);
    if (sChr != '' && node.name.indexOf(sChr) != 0) {
        node.name = sChr + node.name;
    }

    if (node.name.indexOf(':') > -1) {
        node.name = node.name.replace(':', '') + baseRules.postPropName + ':' + baseRules.postPropColon;
    } else if (node.name.indexOf(' ') == -1) {
        node.name += ' ';
    }

    buffer += node.name; // Write name with formatted colon. :)
    buffer += node.data[0].name || '';
    buffer += (node.data[0].value + ';');
    buffer += '\r\n';
};

let getStartingChar = function (node) {
    switch (node.type) {
        case _C.CLASS_TAG:
            return '.';
        case _C.ID_TAG:
            return '#';
        case _C.VARIABLE_TAG:
            return '$';
        case _C.PARENT_SELECTOR_TAG:
            return '&';
        case _C.HTML_TAG:
            return '';
        case _C.COMMENT_SINGLE_TAG:
        case _C.COMMENT_MULTI_TAG:
            return '/';
        default:
            if (node.name.match(/([0-9])+%/)) {
                return '';
            }
            return '@';
    }

}

let recurse = function (currentNode) {
    switch (currentNode.isBlock) {
        case true:
            // These may recurse
            processBlock(currentNode);
            break;
        case false:
        default:
            // These should not
            processNonBlock(currentNode);
            break;
    }
};

let write = function (obj, lintRules) {
    let root = obj;
    if (!root || root.name != _C.ROOT_TAG) {
        console.error("Bad root node: " + root);
        return;
    }

    processLintObject(lintRules);

    buffer = '';
    for (let node of root.childNodes) {
        recurse(node);
    }
    return buffer;
};


module.exports = function (jObj, lintRules) {
    return {
        output: write(jObj, lintRules)
    };
};