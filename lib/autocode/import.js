let autocode

autocode = require('../autocode')

export default function(opts) {
	let config, imported
	if (opts == null) {
		opts = {}
	}
	opts.ignoreOverwrite = true
	imported = this.install(opts)
	config = this.load(process.cwd())
	if (!config.imports) {
		config.imports = {}
	}
	config.imports[imported.name] = `~${imported.version}`
	return this.save({
		config
	})
}
