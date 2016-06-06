let autocode, diffMark, fs, test

autocode = require('../autocode')

fs = require('fs-extra')

diffMark = require('diff-mark')

test = function(opts) {
	let diff, failed_tests, file, files, folder, folders, i, j, len, len1, libContent, outContent, project, test_dir
	this.path = (function() {
		switch (true) {
			case opts && opts._ && opts._[1]:
				return opts._[1]
			case opts && typeof opts.path === 'string':
				return opts.path
			case this.path !== void 0:
				return this.path
			default:
				return process.cwd()
		}
	}).call(this)
	test_dir = `${this.path}/src/test`
	if (!fs.existsSync(test_dir)) {
		console.log(`Test Directory (${test_dir}) does not exist.`)
		return
	}
	folders = fs.readdirSync(test_dir)
	failed_tests = []
	for (i = 0, len = folders.length; i < len; i++) {
		folder = folders[i]
		project = new autocode(`${test_dir}/${folder}`)
		project.build()
		files = fs.readdirSync(`${test_dir}/${folder}/out`)
		for (j = 0, len1 = files.length; j < len1; j++) {
			file = files[j]
			if (fs.lstatSync(`${test_dir}/${folder}/out/${file}`).isDirectory()) {
				continue
			}
			outContent = fs.readFileSync(`${test_dir}/${folder}/out/${file}`)
			libContent = fs.readFileSync(`${test_dir}/${folder}/lib/${file}`)
			diff = diffMark.diff(outContent.toString('utf8'), libContent.toString('utf8'))
			if (diff.length > 0) {
				failed_tests.push(`Test (${folder}) failed for file (${file}).`)
			}
		}
	}
	if (failed_tests.length) {
		console.log(failed_tests)
	} else {
		console.log(`All tests passed for: ${this.path}`)
	}
	return fs.removeSync(`${test_dir}/${folder}/lib`)
}

export default test
