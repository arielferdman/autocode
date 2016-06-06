import fs from 'fs-extra'

export default function cleanFn() {
	console.log('Cleaning...')
	fs.removeSync('lib')
	console.log('Done.')
}
