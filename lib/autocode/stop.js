import path from 'path'
import spawn from 'cross-spawn'

export default function stop() {
	this.stopped = true
	if (!this.config.scripts || !this.config.scripts.stop) {
		return 'No scripts for: stop'
	}
	const cwd = this.path
	console.log(`\nSTOP:`)
	const scripts = this.config.scripts
	let i = 0
	const stopCmd = () => {
		if (!scripts.stop[i]) {
			console.log(`\nDone!`)
			return
		}
		if (scripts.stop[i].title && !scripts.stop[i].command) {
			console.log(`${' STOP TITLE '.bgGreen.white + (' ' + scripts.stop[i].title + ' ').bgWhite} \n`)
			i++
			stopCmd()
			return
		}
		const description = scripts.stop[i].description || scripts.stop[i]
		const command = scripts.stop[i].command || scripts.stop[i]
		let dir
		if (scripts.stop[i].path) {
			if (scripts.stop[i].path.match(/^\//)) {
				dir = scripts.stop[i].path
			} else {
				dir = `${cwd}/${scripts.stop[i].path}`
			}
			dir = path.normalize(dir)
		} else {
			dir = cwd
		}
		console.log(`${' STOP SCRIPT '.bgGreen.white + (' ' + description + ' ').bgWhite} \n${command.gray}`)
		const proc = spawn('bash', ['-c', command], {
			cwd: dir,
		})
		proc.stderr.on('data', data => console.log(data.toString().red))
		proc.stdout.on('error', data => console.log(data.toString()))
		proc.stdout.on('data', data => console.log(data.toString()))
		proc.on('close', () => stopCmd())
		proc.on('error', err => console.log(' ERROR '.bgRed.white + (' ' + err.message + ' ').bgWhite))
		i++
	}
	stopCmd()
	return 'Stopping...'
}
