import bluebird from 'bluebird'
import syncRequest from 'sync-request'

const request = bluebird.promisifyAll(syncRequest)

export default function info(opts) {
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

	const headers = {
		'User-Agent': 'Autocode <support@autocode.run> (https://autocode.run/autocode)',
	}

	let accessTokenUrl = ''
	if (process.env.GITHUB_ACCESS_TOKEN) {
		accessTokenUrl += `?access_token=${process.env.GITHUB_ACCESS_TOKEN}`
	}

	console.log((`Getting info for ${name}...`).blue)
	const repoUrl = `https://api.github.com/repos/${name}/releases/latest${accessTokenUrl}`
	const resp = request('get', repoUrl, {
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
