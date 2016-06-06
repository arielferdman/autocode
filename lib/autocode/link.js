let fs, link, mkdirp, userHome

fs = require('fs-extra')

mkdirp = require('mkdirp')

userHome = require('user-home')

link = opts => {
	let dest, dir
	opts = opts || {}
	if (!opts.collection) {
		throw new Error("`collection` is required.")
	} else if (!opts.module) {
		throw new Error("`module` is required.")
	} else if (!opts.version) {
		throw new Error("`version` is required.")
	} else if (!opts.src) {
		throw new Error("`src` is required.")
	}
	dir = `${userHome}/.autocode/module/${opts.collection}/${opts.module}`
	dest = `${dir}/${opts.version}`
	if (fs.existsSync(dest)) {
		if (opts.force !== true) {
			throw new Error(`Module already installed at: ${dest}. Use -f to force link, but be careful: this entire directory will be destroyed.`)
		}
		fs.removeSync(dest)
	}
	if (!fs.existsSync(dir)) {
		mkdirp.sync(dir)
	}
	console.log(`Linking ${opts.collection}.${opts.module}...`)
	console.log(`Source: ${opts.src}`)
	console.log(`Destination: ${dest}`)
	fs.symlinkSync(opts.src, dest)
	return console.log("Done.")
}

export default link
