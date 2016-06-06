let fs, fstream, load, mkdirp, prompt, publish, request, tar, userHome, zlib

fs = require('fs')

fstream = require('./publish/fstream')

load = require('./load')

mkdirp = require('mkdirp')

prompt = require('prompt')

request = require('request')

tar = require('tar-fs')

userHome = require('user-home')

zlib = require('zlib')

publish = function(opts) {
	let config, crystal, dest, dest_dir, dest_file, packer
	crystal = this
	console.log('Publishing...')
	this.path = opts._ && opts._[1] ? opts._[1] : '.'
	dest_dir = `${userHome}/.autocode/tmp`
	mkdirp.sync(dest_dir)
	config = load(this.path)
	dest_file = `${dest_dir}/${config.name}-${config.version}`
	dest = fs.createWriteStream(`${dest_file}.tar`)
	packer = tar.Pack().on('error', err => console.error(`An error occurred: ${err}`)).on('end', () => {
		fs.createReadStream(`${dest_file}.tar`).pipe(zlib.createGzip()).pipe(fs.createWriteStream(`${dest_file}.tgz`))
		fs.unlinkSync(`${dest_file}.tar`)
		prompt.message = ''
		prompt.delimiter = ''
		prompt.start()
		return prompt.get({
			properties: {
				username: {
					"default": crystal.cache('username'),
					description: 'Enter your username',
					required: true,
					type: 'string'
				},
				password: {
					description: 'Enter your password',
					hidden: true,
					required: true,
					type: 'string'
				}
			}
		}, publish)
	})
	publish = (err, result) => {
		let formData
		if (!result) {
			throw new Error('Username/Password is required.')
		}
		if (!result.username) {
			throw new Error('Username is required.')
		}
		if (!result.password) {
			throw new Error('Password is required.')
		}
		if (!crystal.cache('username')) {
			crystal.cache('username', result.username)
		}
		formData = {
			file: fs.createReadStream(`${dest_file}.tgz`),
			name: config.name,
			version: config.version.split('.')
		}
		return request.post({
			auth: {
				username: result.username,
				password: result.password
			},
			formData,
			url: crystal.url('api', 'publish')
		}, (err, resp, body) => {
			let name, version
			fs.unlinkSync(`${dest_file}.tgz`)
			if (err || resp.statusCode !== 200) {
				if (body === 'Version already exists.') {
					name = formData.name
					version = formData.version.join('.')
					throw new Error(`Version already exists (${version}) for generator (${name}).`)
				}
				throw new Error('Unable to publish project.')
			}
			crystal.cache('username', result.username)
			return console.log('Done.')
		})
	}
	return fstream({
		folder: config.version,
		path: this.path,
		type: 'Directory'
	}).on('error', err => console.error(`An error occurred: ${err}`)).pipe(packer).pipe(dest)
}

export default publish
