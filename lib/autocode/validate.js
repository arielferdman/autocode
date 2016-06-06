import fs from 'fs'
import path from 'path'
import skeemas from 'skeemas'
import yaml from 'js-yaml'

export default function validateFn(config) {
	const autocodePath = path.resolve(`${__dirname}/../..`)

	let configSchema = yaml.safeLoad(fs.readFileSync(`${autocodePath}/.autocode/config.yml`))
	configSchema = configSchema.exports.ConfigSchema.schema

	const validate = skeemas.validate(config, configSchema)
	return validate
}
