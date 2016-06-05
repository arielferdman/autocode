import Autocode from '../autocode'
import fs from 'fs'
import mkdirp from 'mkdirp'
import path from 'path'
import request from 'sync-request'
import semver from 'semver'
import untar from 'untar.js'
import userHome from 'user-home'
import zlib from 'zlib'

export default function update() {
	const modulesPath = path.join(userHome, '.autocode/module')
	if (!fs.existsSync(modulesPath)) {
		mkdirp.sync(modulesPath)
	}

	let config
	if (this.config) {
		config = this.config
	} else {
		config = this.load()
	}

	if (!config.imports) {
		return
	}

	const loadedModules = {}
	const submodules = []
	const loadModules = modules => {
		const results = []
		Object.entries(modules).forEach(([moduleName, moduleVersionQuery]) => {
			let moduleConfig
			let modulePath
			let moduleVersion = null
			let release
			let tarballUrl
			const modulePathName = moduleName.replace(/\./, '/')
			if (!loadedModules[moduleName]) {
				loadedModules[moduleName] = []
			}
			if (loadedModules[moduleName].indexOf(moduleVersionQuery) !== -1) {
				return
			} else {
				loadedModules[moduleName].push(moduleVersionQuery)
			}
			if (moduleVersionQuery.match(/^(\.|\/)/)) {
				modulePath = moduleVersionQuery
				moduleConfig = new Autocode(modulePath).config
				if (moduleConfig.imports) {
					loadModules(moduleConfig.imports)
				} else {
					loadModules(moduleConfig.modules)
				}
				return
			}
			console.log(`UPDATE ${moduleName} ${moduleVersionQuery}`)
			const headers = {
				'User-Agent': 'Crystal Autocode <support@autocode.run> (https://autocode.run/autocode)',
			}
			let accessTokenUrl = ''
			if (process.env.GITHUB_ACCESS_TOKEN) {
				accessTokenUrl += `?access_token=${process.env.GITHUB_ACCESS_TOKEN}`
			}
			let url
			if (moduleVersionQuery === 'latest') {
				url = `https://api.github.com/repos/${moduleName}/releases/latest${accessTokenUrl}`
			} else {
				url = `https://api.github.com/repos/${moduleName}/releases${accessTokenUrl}`
			}
			const resp = request('get', url, {
				headers,
				allowRedirectHeaders: ['User-Agent'],
			})
			if (resp.statusCode !== 200) {
				throw new Error(`Module (${moduleName}) does not exist in the Crystal Hub.`)
			}

			if (moduleVersionQuery === 'latest') {
				release = JSON.parse(resp.body.toString())
				moduleVersion = semver.clean(release.tag_name)
				tarballUrl = release.tarball_url
			} else {
				const releases = JSON.parse(resp.body.toString())
				if (!releases[0]) {
					throw new Error(`Repository not found for module: ${moduleName}`)
				}
				for (let j = 0, len = releases.length; j < len; j++) {
					release = releases[j]
					if (semver.satisfies(release.tag_name, moduleVersionQuery)) {
						moduleVersion = semver.clean(release.tag_name)
						tarballUrl = release.tarball_url
						break
					}
				}
				if (!moduleVersion) {
					throw new Error(`No matches for ${moduleName} ${moduleVersionQuery}`)
				}
			}
			console.log(`DOWNLOAD ${moduleVersion}`)
			modulePath = `${modulesPath}${config.host}/${modulePathName}/${moduleVersion}`
			url = `${tarballUrl}${accessTokenUrl}`
			const response = request('get', url, {
				headers,
				allowRedirectHeaders: ['User-Agent'],
			})
			const data = zlib.gunzipSync(response.body)
			untar.untar(data).forEach(file => {
				const filename = file.filename.split('/').slice(1).join('/')
				const filePath = path.dirname(filename)
				mkdirp.sync(`${modulePath}/${filePath}`)
				const buffer = new Buffer(file.fileData.length)
				let i = 0
				while (i < file.fileData.length) {
					buffer.writeUInt8(file.fileData[i], i)
					i++
				}
				fs.writeFileSync(`${modulePath}/${filename}`, buffer)
				if (moduleVersionQuery === 'latest') {
					const linkPath = `${modulesPath}${config.host}/${modulePathName}/latest`
					if (fs.existsSync(linkPath)) {
						fs.unlinkSync(linkPath)
					}
					return fs.symlinkSync(modulePath, linkPath)
				}
			})
			submodules.push(modulePath)
			moduleConfig = new Autocode(modulePath).config
			if (moduleConfig.imports) {
				results.push(loadModules(moduleConfig.imports))
			} else {
				results.push(loadModules(moduleConfig.modules))
			}
		})
		return results
	}

	loadModules(config.imports)

	submodules.forEach(submodule => {
		const autocode = new Autocode(submodule)
		autocode.build({
			skipGeneration: true,
		})
	})

	console.log(`\nDONE!`)
}
