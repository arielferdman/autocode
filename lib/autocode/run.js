let path

path = require('path')

export default function(opts) {
	let autocode, cwd, i, runCmd, scripts, spawn
	autocode = this
	spawn = require('cross-spawn')
	this.build(opts)
	if (!this.config.scripts || !this.config.scripts.run) {
		return `\n${' DONE! '.bgGreen.white}`
	}
	cwd = this.path
	console.log("\nRUN:".bold)
	scripts = this.config.scripts
	i = 0
	runCmd = () => {
		let command, description, dir, proc
		if (!scripts.run[i]) {
			console.log(`\n${' DONE! '.bgGreen.white}`)
			return
		}
		if (scripts.run[i].title && !scripts.run[i].command) {
			console.log(`${' RUN TITLE '.bgGreen.white + (' ' + scripts.run[i].title + ' ').bgWhite} \n`)
			i++
			runCmd()
			return
		}
		description = scripts.run[i].description || scripts.run[i]
		command = scripts.run[i].command || scripts.run[i]
		if (scripts.run[i].path) {
			if (scripts.run[i].path.match(/^\//)) {
				dir = scripts.run[i].path
			} else {
				dir = `${cwd}/${scripts.run[i].path}`
			}
			dir = path.normalize(dir)
		} else {
			dir = cwd
		}
		console.log(`${' RUN SCRIPT '.bgGreen.white + (' ' + description + ' ').bgWhite} \n${command.gray}`)
		proc = spawn('bash', ['-c', command], {
			cwd: dir
		})
		proc.on('close', err => runCmd())
		proc.on('error', err => console.log(`\n${' ERROR '.bgRed.white}${(' ' + err.message + ' ').bgWhite}`))
		return i++
	}
	runCmd()
	return 'Running...'
}
