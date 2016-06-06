import cson from 'season'
import fs from 'fs'
import path from 'path'

export default function data(opts) {
	console.log('Syncing data...')
	const source = opts._[1]
	const dataPath = path.join('src/data', source)
	const dataFiles = fs.readdirSync(dataPath)
	const loadedData = {}
	dataFiles.forEach(dataFile => {
		const dataName = dataFile.split('.')[0]
		const results = cson.readFileSync(`${dataPath}${dataFile}`)
		loadedData[dataName] = results
	})
	console.log(loadedData)
}
