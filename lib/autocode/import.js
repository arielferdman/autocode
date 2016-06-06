export default function importFn(params) {
	const opts = params || {}
	opts.ignoreOverwrite = true

	const imported = this.install(opts)
	const config = this.load(process.cwd())

	if (!config.imports) {
		config.imports = {}
	}
	config.imports[imported.name] = `~${imported.version}`

	this.save({
		config,
	})
}
