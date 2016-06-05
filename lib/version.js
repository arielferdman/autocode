import findVersions from 'find-versions'

export default version => {
	const versions = findVersions(version, { loose: true })
	if (!versions.length) {
		return null
	}
	return versions[0]
}
