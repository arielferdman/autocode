import path from 'path'
import spawn from 'cross-spawn'

export default function run(opts) {
	this.build(opts)
	if (!this.config.scripts || !this.config.scripts.run) {
		return `\n${' DONE! '.bgGreen.white}`
	}
	const cwd = this.path
	console.log(`\nRUN:`)
	const scripts = this.config.scripts
	let i = 0
	const runCmd = () => {
		if (!scripts.run[i]) {
			console.log(`\nDONE!`)
			return
		}
		if (scripts.run[i].title && !scripts.run[i].command) {
			console.log(`\n${scripts.run[i].title}\n`)
			i++
			runCmd()
			return
		}
		const description = scripts.run[i].description || scripts.run[i]
		const command = scripts.run[i].command || scripts.run[i]
		let dir
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
		console.log(`RUN SCRIPT: ${description}\n${command}`)
		const proc = spawn('bash', ['-c', command], {
			cwd: dir,
		})
		proc.on('close', () => runCmd())
		proc.on('error', err => console.log(`\nERROR: ${err.message}`))
		i++
	}
	runCmd()
	return 'Running...'
}
