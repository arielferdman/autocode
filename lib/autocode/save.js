import fs from 'fs'
import mkdirp from 'mkdirp'
import path from 'path'
import yaml from 'js-yaml'

export default function save(params) {
	const opts = params || {}

	if (!fs.existsSync(`${this.path}/.autocode`)) {
		mkdirp.sync(`${this.path}/.autocode`)
	}

	let config = JSON.parse(JSON.stringify(opts.config || this.config))
	if (config.host === 'github.com') {
		delete config.host
	}
	delete config.path
	delete config.modules
	config = yaml.safeDump(config)

	const configFile = path.join(this.path, '.autocode/config.yml')
	fs.writeFileSync(configFile, config)
}

export default save
