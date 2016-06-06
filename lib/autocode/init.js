import fs from 'fs'
import path from 'path'
import yaml from 'js-yaml'

export default function initFn(opts) {
	let projectPath
	if (opts._ && opts._[1]) {
		projectPath = opts._[1]
	} else {
		projectPath = opts.path || this.path || process.cwd()
	}
	if (!projectPath) {
		throw new Error('Path is required.')
	} else if (!fs.existsSync(projectPath)) {
		throw new Error(`Path does not exist: ${projectPath}`)
	}
	let config = this.load(projectPath)
	if (config !== false) {
		throw new Error(`Autocode has already been initialized in: ${projectPath}`)
	}
	console.log((`Initializing Autocode in: ${projectPath}`).green.bold)
	config = {}
	if (opts.name) {
		config.name = opts.name
	} else {
		config.name = path.basename(projectPath)
	}
	if (opts.description) {
		config.description = opts.description
	}
	if (opts.author) {
		config.author = {
			name: opts.author_name,
			email: opts.author_email,
			url: opts.author_url,
		}
	}
	if (opts.copyright) {
		config.copyright = opts.copyright
	}
	if (opts.modules) {
		config.modules = {}
		Object.entries(opts.modules).forEach(([moduleName, exports]) => {
			config.modules[moduleName] = 'latest'
			if (exports.length) {
				config.imports = {}
				exports.forEach(exp => {
					config.imports[`${exp}`] = `${moduleName}.${exp}`
				})
			}
		})
	}
	config = yaml.safeDump(config)
	if (!fs.existsSync(`${projectPath}/.autocode`)) {
		fs.mkdirSync(`${projectPath}/.autocode`)
	}
	fs.writeFileSync(`${projectPath}/.autocode/config.yml`, config)
	console.log('Autocode initialization is complete.'.green)
	return this.build(projectPath)
}
