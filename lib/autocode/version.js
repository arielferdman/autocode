import cson from 'season'
import fs from 'fs'
import semver from 'semver'
import yaml from 'js-yaml'

export default function versionFn(opts) {
	console.log('Versioning project...')
	const config = this.config('.')
	const currentVersion = config.version
	const version = opts._[1]
	config.version = semver.valid(version)
	if (!config.version) {
		if (['major', 'minor', 'patch'].indexOf(version) === -1) {
			throw new Error(`Invalid version: ${version}`)
		}
		config.version = semver.inc(currentVersion, version)
	}
	const ext = config.ext
	const file = config.file
	delete config.ext
	delete config.file
	switch (ext) {
		case 'yml':
		case 'yaml':
			fs.writeFileSync(file, yaml.safeDump(config))
			break
		case 'cson':
			cson.writeFileSync(file, config)
			break
		case 'json':
			fs.writeFileSync(file, JSON.stringify(config))
			break
		default:
			break
	}
	return console.log(`${config.name} now at version ${config.version}.`)
}
