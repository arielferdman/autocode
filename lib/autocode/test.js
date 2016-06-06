import Autocode from '../autocode'
import diffMark from 'diff-mark'
import fs from 'fs-extra'
import path from 'path'

export default function test(opts) {
	this.path = opts.path || this.path
	const testDir = path.join(this.path, 'src/test')
	if (!fs.existsSync(testDir)) {
		console.log(`Test Directory (${testDir}) does not exist.`)
		return
	}
	const folders = fs.readdirSync(testDir)
	const failedTests = []
	folders.forEach(folder => {
		const project = new Autocode(`${testDir}/${folder}`)
		project.build()
		const files = fs.readdirSync(`${testDir}/${folder}/out`)
		files.forEach(file => {
			if (fs.lstatSync(`${testDir}/${folder}/out/${file}`).isDirectory()) {
				return
			}
			const outContent = fs.readFileSync(`${testDir}/${folder}/out/${file}`)
			const libContent = fs.readFileSync(`${testDir}/${folder}/lib/${file}`)
			const diff = diffMark.diff(outContent.toString('utf8'), libContent.toString('utf8'))
			if (diff.length > 0) {
				failedTests.push(`Test (${folder}) failed for file (${file}).`)
			}
		})
		fs.removeSync(`${testDir}/${folder}/lib`)
	})
	if (failedTests.length) {
		console.log(failedTests)
	} else {
		console.log(`All tests passed for: ${this.path}`)
	}
}
