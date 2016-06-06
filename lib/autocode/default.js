let cson, fs, mkdirp, userHome

cson = require('season')

fs = require('fs')

mkdirp = require('mkdirp')

userHome = require('user-home')

export default opts => {
	let crystal, crystal_file, crystal_path, key, method, value
	key = opts._[1]
	method = opts._[2]
	value = opts._[3]
	crystal_path = `${userHome}/.autocode/`
	crystal_file = `${crystal_path}crystal.cson`
	crystal = fs.existsSync(crystal_file) ? cson.readFileSync(crystal_file) : {}
	if (!crystal["default"]) {
		crystal["default"] = {}
	}
	if (!crystal["default"][key]) {
		crystal["default"][key] = []
	}
	switch (method) {
		case 'add':
			crystal["default"][key][value] = {
				path: '.',
				version: 'latest'
			}
			break
		case 'remove':
			delete crystal["default"][key][value]
			break
		default:
			return crystal["default"][key]
	}
	mkdirp.sync(crystal_path)
	fs.writeFileSync(crystal_file, cson.stringifySync(crystal))
	return crystal["default"][key]
}
