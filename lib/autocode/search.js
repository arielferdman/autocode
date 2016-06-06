import request from 'request'

export default function search(opts) {
	let name
	if (typeof opts === 'object') {
		if (opts._ && opts._[1]) {
			name = opts._[1]
		} else if (opts.name) {
			name = opts.name
		}
	} else if (typeof name === 'string') {
		name = opts
	}
	if (!name) {
		throw new Error("'name' is required for autocode search")
	}

	console.log(`Searching for generators matching name (${name})...`)
	return request.get({
		qs: {
			name: `%${name}%`,
		},
		url: this.url('api', 'modules'),
	}, (err, resp, body) => {
		if (err || resp.statusCode !== 200) {
			throw new Error('Search failed.')
		}
		const modules = JSON.parse(body)
		console.log(`Found ${modules.length} generator(s)!`)
		const results = []
		modules.forEach(mod => {
			results.push(console.log(`- ${mod.Collection.name}.${mod.name}`))
		})
		return results
	})
}
