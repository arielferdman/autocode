import sprintf from 'sprintf'

export default (msg) => {
	const vsprintf = sprintf.vsprintf
	const args = [].slice.apply(arguments)
	args.shift()
	const error = vsprintf(msg, args)
	throw new Error(error)
}
