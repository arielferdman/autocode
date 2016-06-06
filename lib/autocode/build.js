import fs from 'fs'
import mkdirp from 'mkdirp'
import path from 'path'
import spawn from 'cross-spawn'

export default function buildFn(params) {
	const opts = params || {}
	switch (true) {
		case opts._ && opts._[1]: {
			this.path = opts._[1]
			break
		}
		case typeof opts.path === 'string': {
			this.path = opts.path
			break
		}
		case this.path !== void 0: {
			this.path = this.path
			break
		}
		default: {
			this.path = process.cwd()
			break
		}
	}

	if (!fs.existsSync(this.path)) {
		mkdirp.sync(this.path)
	}
	const cwd = this.path
	if (!this.config) {
		this.config = this.load()
		if (this.config === false) {
			throw new Error('Unable to load configuration.')
		}
	}
	if (this.config.name) {
		console.log((`\n${this.config.name}`).bold)
	}
	if (this.config.description) {
		console.log(`${this.config.description}`)
	}
	if (this.config.author) {
		console.log(
			`by ${this.config.author.name} <${this.config.author.email}> (${this.config.author.url})`
		)
	}
	console.log(`at ${this.path}\n`)

	if (opts.skipGeneration !== true) {
		this.generate(opts)
		if (opts === false) {
			throw new Error('Unable to generate code.')
		}
	}

	if (
		(opts._ && (opts._[0] === 'publish' || opts._[0] === 'run'))
		|| !this.config.scripts || !this.config.scripts.build || opts.skipScripts
	) {
		console.log(`\n${' DONE! '.bgGreen.white}`)
		if (opts && opts.complete) {
			opts.complete()
		}
		return
	}
	console.log(`\nBUILD:`)
	const scripts = this.config.scripts
	let i = 0
	const buildCmd = () => {
		if (!scripts.build[i]) {
			console.log(`\n${' DONE! '.bgGreen.white}`)
			if (opts && opts.complete) {
				opts.complete()
			}
			return
		}
		if (scripts.build[i].title && !scripts.build[i].command) {
			console.log(scripts.build[i].title)
			i++
			buildCmd()
			return
		}
		const description = scripts.build[i].description || scripts.build[i]
		const command = scripts.build[i].command || scripts.build[i]
		let dir
		if (scripts.build[i].path) {
			if (scripts.build[i].path.match(/^\//)) {
				dir = scripts.build[i].path
			} else {
				dir = `${cwd}/${scripts.build[i].path}`
			}
			dir = path.normalize(dir)
		} else {
			dir = cwd
		}
		console.log(description)
		console.log(command)
		const proc = spawn('bash', ['-c', command], {
			cwd: dir,
		})
		proc.stdout.on('data', data => console.log(data.toString()))
		proc.on('exit', () => buildCmd())
		proc.on('error', err => {
			console.log(`ERROR: ${err.message}`)
			return console.log(JSON.stringify(err, null, '	').red)
		})
		i++
	}
	if (opts && opts.skipScripts === true) {
		return
	}
	buildCmd()
}
