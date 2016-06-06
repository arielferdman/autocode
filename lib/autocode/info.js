let bluebird, info, request

bluebird = require('bluebird')

request = require('sync-request')

request = bluebird.promisifyAll(request)

info = function(opts) {
	let access_token_url, autocode, headers, module, name, repo_url, resp
	autocode = this
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
	headers = {
		'User-Agent': 'Autocode <support@autocode.run> (https://autocode.run/autocode)'
	}
	access_token_url = ''
	if (process.env.GITHUB_ACCESS_TOKEN) {
		access_token_url += `?access_token=${process.env.GITHUB_ACCESS_TOKEN}`
	}
	console.log((`Getting info for ${name}...`).blue)
	repo_url = `https://api.github.com/repos/${name}/releases/latest${access_token_url}`
	resp = request('get', repo_url, {
		headers,
		allowRedirectHeaders: ['User-Agent']
	})
	if (resp.statusCode !== 200) {
		if (resp.statusCode === 404) {
			throw new Error(`Module does not exist: ${name}`)
		} else {
			throw new Error('Unable to get info.')
		}
	}
	module = JSON.parse(resp.body)
	return console.log("Latest Version: ".bold + module.tag_name.substr(1))
}

export default info
