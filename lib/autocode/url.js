export default function urlFn(host, uri) {
	let url = ((() => {
		switch (host) {
			case 'api': {
				if (process.env.CRYSTAL_API_URL) {
					return process.env.CRYSTAL_API_URL
				}
				return 'https://api.autocode.run/'
			}
			case 'hub': {
				if (process.env.CRYSTAL_HUB_URL) {
					return process.env.CRYSTAL_HUB_URL
				}
				return 'https://hub.autocode.run/'
			}
			case 'web': {
				if (process.env.CRYSTAL_WEB_URL) {
					return process.env.CRYSTAL_WEB_URL
				}
				return 'https://autocode.run/'
			}
			default: {
				return null
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
