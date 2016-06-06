import cson from 'season'
import fs from 'fs'
import path from 'path'

export default function dataFn(opts) {
	console.log('Syncing data...')
	const source = opts._[1]
	const dataPath = path.join('src/data', source)
	const dataFiles = fs.readdirSync(dataPath)
	const data = {}
	dataFiles.forEach(dataFile => {
		const dataName = dataFile.split('.')[0]
		const results = cson.readFileSync(`${dataPath}${dataFile}`)
		data[dataName] = results
	})
	console.log(data)
}
