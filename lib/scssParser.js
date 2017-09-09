'use strict';

const _C = require('./constants'),
	tools = require('./tools');

let createNode = function (args) {
	if (args === void 0 || args === null)
		return null;

	if (args.isBlock === void 0 || args.isBlock === null)
		args.isBlock = false;

	let nestingLevel = -1;
	let temp = args.parent;
	while (temp && temp != _C.ROOT_TAG) {
		++nestingLevel;
		temp = temp.parent;
	}

	let cIdx = 0;
	if (args.parent) {
		cIdx = args.parent.childNodes.length;
	}

	let node = {
		guid: tools.getGuid,
		type: args.type,
		name: args.name || '',
		data: tools.toDataArray(args.data, args.type),
		depth: nestingLevel,
		parent: args.parent, // Causes recursion issue when serializing if not handled.
		isBlock: args.isBlock,
		childIndex: cIdx,
		childNodes: args.childNodes || []
	};

	if (args.parent) {
		args.parent.childNodes.push(node);
	}

	return node;
}

function isVariableDeclaration(input) {
	/*
	 Step backwards looking for an opening arguments brace '('.
	 ie. @mixin colors($color: blue) {

	 }
	 */
	for (let ii = input.indexOf('$'); ii > 0; ii--) {
		let chr = input[ii];
		if (chr.match(/[@0-9a-z_#{}\.\$\)\s\-]/i)) {
			continue;
		}
		if (chr === '(') {
			return false;
		} else {
			break;
		}
	}
	let pruned = tools.prunedString(input.substr(input.indexOf('$')));
	/*
	 Step forwards looking for an colon.
	 ie. $color: white;
	 */
	for (let ii = 0; ii < pruned.length; ii++) {
		let chr = pruned[ii];
		if (chr.match(/[@0-9a-z_#\.\$\(\)\s\-]/i)) {
			continue;
		}
		return chr === ':';
	}
}

function isFunctionABlock(input) {
	let pruned = tools.prunedString(input.substr(input.indexOf('@')));
	for (let ii = 0; ii < pruned.length; ii++) {
		let chr = pruned[ii];
		if (chr.match(/[@0-9:a-z_#,<>\/\.\$\(\)\s\-]/i)) {
			continue;
		}
		return chr === '{';
	}
}

/*
	I'm sure there is a better way to do this.
	Could we use an object to resolve these instead?
	Would that be any neater?
*/
let getFunctionElement = function (input) {

	let pruned = input[0] === '@' ? input : tools.prunedString(input);

	if (pruned.indexOf('@media') === 0) {
		return _C.MEDIAQUERY_TAG;
	} else if (pruned.indexOf('@mixin') === 0) {
		return _C.MIXIN_TAG;
	} else if (pruned.indexOf('@include') === 0) {
		return _C.INCLUDE_TAG;
	} else if (pruned.indexOf('@import') === 0) {
		return _C.IMPORT_TAG;
	} else if (pruned.indexOf('@error') === 0) {
		return _C.ERROR_TAG;
	} else if (pruned.indexOf('@debug') === 0) {
		return _C.DEBUG_TAG;
	} else if (pruned.indexOf('@return') === 0) {
		return _C.RETURN_TAG;
	} else if (pruned.indexOf('@extend') === 0) {
		return _C.EXTEND_TAG;
	} else if (pruned.indexOf('@warn') === 0) {
		return _C.WARN_TAG;
	} else if (pruned.indexOf('@each') === 0) {
		return _C.FUNC_EACH;
	} else if (pruned.indexOf('@else') === 0) {
		return _C.FUNC_ELSE;
	} else if (pruned.indexOf('@for') === 0) {
		return _C.FUNC_FOR;
	} else if (pruned.indexOf('@if') === 0) {
		return _C.FUNC_IF;
	} else if (pruned.indexOf('@while') === 0) {
		return _C.FUNC_WHILE;
	} else if (pruned.indexOf('@at-root') === 0) {
		return _C.FUNC_AT_ROOT;
	} else if (pruned.indexOf('@function') === 0) {
		return _C.FUNCTION_TAG;
	} else if (pruned.indexOf('@font-face') === 0) {
		return _C.FUNC_FONT_FACE;
	} else {
		return _C.FUNCTION_TAG;
	}
}

let setSingleNodeValue = function (node, input, idx) {
	let varName = '';
	let varValue = '';

	if (node.type === _C.VARIABLE_TAG) {
		while (idx < input.length && input[idx - 1] != ':') {
			varName += input[idx++];
		}
	} else {
		while (idx < input.length && input[idx] != ' ') {
			varName += input[idx++];
		}
	}

	while (idx < input.length && input[idx - 1] != ';') {
		varValue += input[idx++];
	}
	node.name = tools.prunedString(varName);
	let prunedData = tools.prunedString(varValue);
	node.data = tools.toDataArray(prunedData, node.type);

	let remaining = input.substr(idx + 1);
	return remaining;
}

let outputToElement = function (output, currentNode) {

	// Get first non-blank character.
	let pruned = tools.prunedString(output);
	let c = '';
	let i = 0;

	for (; i < pruned.length; i++) {
		if (pruned[i] != ' ' && !_C.LINE_ENDINGS.includes(pruned[i])) {
			c = pruned[i];
			break;
		}
	}

	let elemType = '';

	switch (c) {
		case '.': // It's a class
			elemType = _C.CLASS_TAG;
			break;
		case '@': // Could be a mixin, media query, include or other function
			elemType = getFunctionElement(pruned);
			break;
		case '#': // It's an ID
			elemType = _C.ID_TAG;
			break;
		case '$': // It's a variable (do we know if it is being declared or used?)
			elemType = _C.VARIABLE_TAG;
			break;
		case '&amp;':
		case '&':
			elemType = _C.PARENT_SELECTOR_TAG;
			break;
		default:
			if (c.match(/[a-z\*]/)) {
				elemType = _C.HTML_TAG;
			} else {
				// We need to add something.
				elemType = 'unknown';
			}
			break;
	}

	let node = createNode({
		type: elemType,
		name: pruned,
		parent: currentNode
	});

	return node;
}

let recurse = function (input, currentNode) {
	if (input) {

		let output = '';
		let inDynamicSelector = false;
		for (var idx = 0; idx < input.length; idx++) {

			/*
				Check for strings before comments,
				as comment identifiers may actually be part of a string.
				
				ie. @import "icons/*.png";
			if ((input[idx] === '"' || input[idx] === "'") && // Start of a string
				input[idx - 1] != '\\') { // (check for escaped character)
				let stringStartChr = input[idx];
				for (; idx < input.length; idx++) {
					output += input[idx] || '';
					if (input[idx + 1] == stringStartChr && input[idx] != '\\') {
						break;
					}
				}
				output += stringStartChr;
				let remaining = input.substr(output.length);
				input = remaining;
				idx = -1;
				continue;
			}
			*/

			/*
				Check comments before other content as other content may be inside a comment.
				
				ie. .class { content: "commented out class"; }
			*/
			if (input[idx] === '/' && input[idx + 1] === '/') { // We are in a single line comment. Deal with it.

				var commentString = '';

				while (!_C.LINE_ENDINGS.includes(input[idx - 1])) {
					commentString += input[idx++] || '';
				}

				if (commentString && commentString != '') {
					// Create new node for this, as we cannot have child elements of single line comment.
					var node = createNode({
						type: _C.COMMENT_SINGLE_TAG,
						data: tools.prunedString(commentString),
						parent: currentNode,
						isBlock: false
					});
				}

				input = input.replace(commentString, '').trim();
				output = '';
				idx = -1;
				continue;

			} else if (input[idx] === '/' && input[idx + 1] === '*') { // We are in a multi line comment. Deal with it.

				var commentString = '';

				// If we look backwards (see what we  have added) we should break after adding the comment terminator.
				while (input[idx - 2] != '*' || input[idx - 1] != '/') {
					commentString += input[idx++];
				}

				if (commentString != '') {
					// Create new node for this, only content should be the comment text.
					var node = createNode({
						type: _C.COMMENT_MULTI_TAG,
						data: tools.prunedString(commentString),
						parent: currentNode,
						isBlock: false
					});
				}

				input = input.replace(commentString, '').trim();
				output = '';
				idx = -1;
				continue;

			}

			/*
				Check functions and variables in root node next.
				If not in root they can be processed as part of the block.
			*/
			if (currentNode === rootNode) {
				if (input[idx] === '$') {
					if (input[idx - 1] != '{' && input[idx - 2] != '#') { // Check for variable being used as selector rather than declared
						var checkerString = tools.prunedString(input);
						// Try to catch variables being used as arguments.
						if (isVariableDeclaration(checkerString)) {
							var node = createNode({
								type: _C.VARIABLE_TAG,
								parent: currentNode,
								isBlock: false
							});
							let text = setSingleNodeValue(node, input, idx);
							input = text;
							idx = -1;
							continue;
						}
					}
				} else if (input[idx] === '@') {
					var checkerString = input.substr(idx);
					// We only want to process single line functions here. (ie no curly braces.)
					if (!isFunctionABlock(checkerString)) {
						let tag = getFunctionElement(input);
						let node = createNode({
							type: tag,
							parent: currentNode,
							isBlock: false
						});
						let text = setSingleNodeValue(node, input, idx);
						input = text;
						idx = -1;
						continue;
					}
				}
			}

			/*
				Now process blocks.
			*/
			if (input[idx] === '{') {
				if (input[idx - 1] === '#') {
					inDynamicSelector = true;
					output += input[idx];
				} else {
					/*
						If we are already in a block we need to handle the output as (partly) its content.
						The aim is to split the contents of the current block from the name of the next block.
					*/
					if (currentNode != rootNode && output.length > 0) {
						/*
							First check if we have stepped through a set of rules.
							If we have we might be able to split them from the next block name.
						*/
						if (output.indexOf(';') > -1) {
							var lstRuleIdx = output.lastIndexOf(';'); // Get index of last rule end.
							let blockText = output.substr(0, lstRuleIdx + 1); // Split output to that point.

							currentNode.data = tools.toDataArray(blockText, currentNode.type); // Add the rules to current block.
							output = output.substr(lstRuleIdx + 1); // Remove rules from next blocks name.
						}
					}

					let node = outputToElement(output, currentNode);
					node.isBlock = true;
					output = '';

					let text = input.substr(idx + 1).trim();
					let recursed = recurse(text, node);

					if (recursed) {
						input = recursed.text;
						idx = -1;
					} else {
						input = text || '';
						currentNode = rootNode;
					}
				}
			} else if (input[idx] === '}') {
				if (inDynamicSelector) {
					inDynamicSelector = false;
					output += input[idx];
				} else {
					if (output.length > 0) {
						currentNode.data = tools.toDataArray(output, currentNode.type);
						output = '';
					}
					return {
						node: currentNode.parent,
						text: input.substr(idx + 1).trim() || ''
					};
				}
			} else {
				output += input[idx];
			}
		}
	}
}

let rootNode = {};

let toObj = function (text) {
	rootNode = createNode({
		name: _C.ROOT_TAG,
		type: _C.ROOT_TAG,
		isBlock: true
	});

	recurse(text, rootNode);

	return rootNode;
}

module.exports = function (scss) {
	return {
		input: scss,
		output: toObj(scss)
	};
};