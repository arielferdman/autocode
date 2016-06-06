import changecase from 'change-case'
import pluralize from 'pluralize'

export default function format(singular, plural) {
	if (!singular || !singular.length) {
		throw new Error('"singular" is required in autocode.build.format()')
	}
	const pluralized = plural || pluralize(singular)
	const cases = [
		'camel',
		'constant',
		'dot',
		'lower',
		'param',
		'pascal',
		'path',
		'sentence',
		'snake',
		'swap',
		'title',
		'ucFirst',
		'upper',
	]
	const change = str => {
		const changes = {}
		cases.forEach(c => {
			changes[c.toLowerCase()] = changecase[c](str)
		})
		return changes
	}
	const formatted = change(singular)
	formatted.plural = change(pluralized)
	return formatted
}
