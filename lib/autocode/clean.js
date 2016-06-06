import fs from 'fs-extra'

export default function clean() {
	console.log('Cleaning...')
	fs.removeSync('lib')
	console.log('Done.')
}
