import Autocode from '../autocode'
import fs from 'fs'
import mkdirp from 'mkdirp'
import path from 'path'
import request from 'sync-request'
import semver from 'semver'
import untar from 'untar.js'
import userHome from 'user-home'
import zlib from 'zlib'

export default function installFn(opts) {
	const host = 'github.com'

	let moduleIsLastest = false
	let moduleName
	let moduleParse
	let moduleVersion
	let tagName
	if (typeof opts === 'object' && opts.name) {
		moduleName = opts.name
	}
	if (typeof opts === 'object' && opts.version) {
		moduleVersion = opts.version
	} else if (moduleName.match('@')) {
		moduleParse = moduleName.split('@')
		moduleName = moduleParse[0]
		moduleVersion = moduleParse[1]
	} else {
		moduleVersion = 'latest'
	}
	if (!moduleName) {
		throw new Error('Module Name is required for `autocode install`.')
	}

	console.log((`Loading module (${moduleName})...`).blue)
	const headers = {
		'User-Agent': 'Autocode <support@autocode.run> (https://autocode.run/autocode)',
	}

	let accessTokenUrl = ''
	if (process.env.GITHUB_ACCESS_TOKEN) {
		accessTokenUrl += `?access_token=${process.env.GITHUB_ACCESS_TOKEN}`
	}

	let release
	if (moduleVersion === 'latest') {
		moduleIsLastest = true
		const releaseUrl = `https://api.github.com/repos/${moduleName}/releases/latest${accessTokenUrl}`
		const releaseResp = request('get', releaseUrl, {
			headers,
			allowRedirectHeaders: ['User-Agent'],
		})
		if (releaseResp.statusCode !== 200) {
			throw new Error(`Module (${moduleName}) does not exist on GitHub.`)
		}
		release = JSON.parse(releaseResp.body)
		if (!release) {
			throw new Error(`Unable to locate generator (${name}).`)
		}
		moduleVersion = semver.clean(release.tag_name)
		tagName = release.tag_name
		console.log((`Latest version is ${release.tag_name}.`).green)
	} else {
		moduleIsLastest = false
		const releaseUrl = `https://api.github.com/repos/${moduleName}/releases${accessTokenUrl}`
		const releaseResp = request('get', releaseUrl, {
			headers,
			allowRedirectHeaders: ['User-Agent'],
		})
		if (releaseResp.statusCode !== 200) {
			throw new Error(`Module (${moduleName}) does not exist on GitHub.`)
		}
		const releases = JSON.parse(releaseResp.body)
		if (!releases) {
			throw new Error(`Unable to locate generator (${name}).`)
		}
		releases.forEach((releaseObj, releaseIndex) => {
			const releaseVersion = semver.clean(releaseObj.tag_name)
			if (semver.satisfies(releaseVersion, moduleVersion)) {
				if (releaseIndex === 0) {
					moduleIsLastest = true
				}
				moduleVersion = semver.clean(releaseObj.tag_name)
				release = releaseObj
				tagName = releaseObj.tag_name
				return
			}
		})
		if (!tagName) {
			throw new Error(`Unable to find version (${moduleVersion}) for module (${moduleName}).`)
		}
		console.log((`Found version (${moduleVersion}) with tag (${tagName}).`).green)
	}
	if (opts.force !== true) {
		const configUrl = `https://api.github.com/repos/${moduleName}/contents/.autocode/config.yml${accessTokenUrl}&ref=${tagName}`
		const configResp = request('get', configUrl, {
			headers,
			allowRedirectHeaders: ['User-Agent'],
		})
		if (configResp.statusCode !== 200) {
			throw new Error(`${moduleName} has not implemented Autocode. Use -f to install anyways.`)
		}
	}
	let tarballUrl = release.tarball_url
	console.log((`Downloading from: ${tarballUrl}`).bold)
	tarballUrl += accessTokenUrl
	const tarballResponse = request('get', tarballUrl, {
		headers,
		allowRedirectHeaders: ['User-Agent'],
	})
	if (tarballResponse.statusCode !== 200) {
		throw new Error(`Unable to download module (${moduleName}).`)
	}
	const tarball = zlib.gunzipSync(tarballResponse.body)
	if (!tarball) {
		throw new Error(`Unable to unzip module (${moduleName}).`)
	}
	const modulePath = path.normalize(
		`${userHome}/.autocode/module/${host}/${moduleName}/${moduleVersion}`
	)
	if (fs.existsSync(modulePath) && opts.ignoreOverwrite) {
		return {
			name: moduleName,
			version: moduleVersion,
		}
	}
	untar.untar(tarball).forEach(file => {
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
		if (moduleIsLastest) {
			const linkPath = path.normalize(`${userHome}/.autocode/module/${host}/${moduleName}/latest`)
			if (fs.existsSync(linkPath)) {
				fs.unlinkSync(linkPath)
			}
			return fs.symlinkSync(modulePath, linkPath)
		}
		return true
	})
	const project = new Autocode(modulePath)
	project.update()
	project.build({
		skipGeneration: true,
	})
	console.log((`Successfully installed ${moduleName} at: ${modulePath}`).green)
	return {
		name: moduleName,
		version: moduleVersion,
	}
}
