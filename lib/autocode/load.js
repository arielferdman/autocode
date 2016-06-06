import cson from 'season'
import fs from 'fs'
import path from 'path'
import skeemas from 'skeemas'
import xml from 'xml-to-jsobj'
import yaml from 'js-yaml'

const loadConfig = projectPath => {
	let config
	const exts = ['yml', 'yaml', 'cson', 'json', 'xml']
	exts.forEach(ext => {
		const file = path.join(projectPath, `.autocode/config.${ext}`)
		if (fs.existsSync(file)) {
			config = fs.readFileSync(file)
			config = ((() => {
				switch (ext) {
					case 'yml':
					case 'yaml':
						return yaml.safeLoad(config)
					case 'cson':
						return cson.readFileSync(file)
					case 'json':
						return JSON.parse(config)
					case 'xml':
						return xml.parseFromString(config)
					default:
						return true
				}
			}))()
			return false
		}
		return true
	})
	return config
}

export default function load(aProjectPath, shouldValidate) {
	let validate = shouldValidate === undefined ? true : shouldValidate

	const projectPath = aProjectPath || this.path
	if (!projectPath) {
		throw new Error('projectPath for Autocode config is required')
	}

	const config = loadConfig(projectPath)
	if (!config) {
		return false
	}

	const autocodePath = path.join(__dirname, '../..')

	if (validate === false) {
		const autocodeConfigFilename = path.join(autocodePath, '.autocode/config.yml')
		const autocodeConfig = yaml.safeLoad(fs.readFileSync(autocodeConfigFilename))
		return autocodeConfig.exports.ConfigSchema.schema
	}

	const configSchema = loadConfig(autocodePath, false)
	validate = skeemas.validate(config, configSchema)
	if (!validate.valid) {
		console.log('Configuration failed validation:')
		console.log(validate.errors)
		throw new Error(`Invalid Configuration for path: ${projectPath}`)
	}

	if (!config.host) {
		config.host = 'github.com'
	}
	this.config = config
	this.path = projectPath

	return config
}
