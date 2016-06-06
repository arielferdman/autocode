export default (host, uri) => {
	let url
	url = ((() => {
		switch (host) {
			case 'api':
				if (process.env.CRYSTAL_API_URL) {
					return process.env.CRYSTAL_API_URL
				} else {
					return "https://api.autocode.run/"
				}
				break
			case 'hub':
				if (process.env.CRYSTAL_HUB_URL) {
					return process.env.CRYSTAL_HUB_URL
				} else {
					return "https://hub.autocode.run/"
				}
				break
			case 'web':
				if (process.env.CRYSTAL_WEB_URL) {
					return process.env.CRYSTAL_WEB_URL
				} else {
					return "https://autocode.run/"
				}
		}
	}))()
	if (!url) {
		throw new Error(`URL does not exist for host: ${host}`)
	}
	if (url.substr(url.length - 1) !== '/') {
		url += '/'
	}
	if (uri) {
		url += uri
	}
	return url
}
