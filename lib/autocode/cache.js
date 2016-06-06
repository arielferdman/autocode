import fs from 'fs'
import path from 'path'
import userHome from 'user-home'
import yaml from 'js-yaml'

export default function cacheFn(key, val, debug) {
	const autocodePath = path.join(userHome, '.autocode')
	const configFile = path.join(autocodePath, 'config.yml')
	const config = fs.existsSync(configFile) ? yaml.safeLoad(fs.readFileSync(configFile)) : {}
	if (!config.cache) {
		config.cache = {}
	}
	if (val !== void 0) {
		config.cache[key] = val
		fs.writeFileSync(configFile, yaml.safeDump(config))
	}
	if (debug) {
		console.log(`File:   ${configFile}`)
		console.log('Method: autocode.cache(key, val)')
		console.log(`Key:    ${key}`)
		console.log(`Value:  ${config.cache[key]}\n`)
	}
	return config.cache[key]
}
