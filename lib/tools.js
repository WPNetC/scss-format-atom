'use strict';

let _C = require('./constants');

let pruneString = function (text) {
	if (!text)
		return;

	let result = '';
	var cmntMatch = text.match(_C.REGEX_COMMENTS);
	if (cmntMatch && cmntMatch.length > 0) {
		result = text.replace(/  /g, ' '); // Replace double spaces with single.
	} else {
		result = text.replace(/\r\n/g, ' ')
			.replace(/\n/g, ' ')
			.replace(/\t/g, ' ');
	}
	while (result.indexOf('  ') > -1) {
		result = result.replace(/  /g, ' ');
	}
	return result.trim() || '';
}
exports.prunedString = pruneString;

let toDataArray = function (text, typ) {
	if (!text)
		return;

	let result = [];
	if (typ && typ.indexOf('comment') > -1) {
		result.push({
			name: '',
			value: pruneString(text),
			ruleIndex: result.length
		});
	} else {
		let parts = pruneString(text)
			.split(';')
			.filter(function (entry) {
				return entry.trim() != '';
			});

		for (let item of parts) {
			if (item == void 0 || item === '') {
				continue;
			} else if (typ === _C.VARIABLE_TAG) {
				var subParts = item.split(':')
					.filter(function (entry) {
						return entry.trim() != '';
					});
				if (subParts.length === 2) {
					result.push({
						name: pruneString(subParts[0] + ':'),
						value: pruneString(subParts[1]),
						ruleIndex: result.length
					});
				} else {
					result.push({
						value: pruneString(item),
						ruleIndex: result.length
					});
				}
			} else {
				result.push({
					name: '',
					value: pruneString(item),
					ruleIndex: result.length
				});
			}
		}
	}

	return result
		.sort(function (a, b) {
			if (a.name && b.name) {
				let cA = pruneString(a.name)[0];
				let cB = pruneString(b.name)[0];
				return cA - cB;
			} else {
				if (a.name) {
					return b - a;
				} else if (b.name) {
					return a - b;
				} else {
					let cA = pruneString(a.value)[0];
					let cB = pruneString(b.value)[0];
					return cA - cB;
				}
			}
		});
}
exports.toDataArray = toDataArray;

function guid() {
	function s4() {
		return Math.floor((1 + Math.random()) * 0x10000)
			.toString(16)
			.substring(1);
	}
	return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
		s4() + '-' + s4() + s4() + s4();
}
exports.getGuid = guid;