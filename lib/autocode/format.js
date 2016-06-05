let changecase, pluralize;

changecase = require('change-case');

pluralize = require('pluralize');

export default (singular, plural) => {
	let cases, change, format;
	if (!singular || !singular.length) {
		throw new Error('"singular" is required in crystal.build.format()');
	}
	plural = plural || pluralize(singular);
	cases = ['camel', 'constant', 'dot', 'lower', 'param', 'pascal', 'path', 'sentence', 'snake', 'swap', 'title', 'ucFirst', 'upper'];
	change = str => {
		let c, changes, i, len;
		changes = {};
		for (i = 0, len = cases.length; i < len; i++) {
			c = cases[i];
			changes[c.toLowerCase()] = changecase[c](str);
		}
		return changes;
	};
	format = change(singular);
	format.plural = change(plural);
	return format;
};
