import path from 'path'

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

global.ErrorInvalid = name => {
	this.name = 'ErrorInvalid'
	this.message = `'${name}' is invalid.`
}
global.ErrorInvalid.prototype = Error.prototype

global.ErrorType = (name, type) => {
	this.name = 'ErrorType'
	this.message = `'${name}' must be of type (${type}).`
}
global.ErrorType.prototype = Error.prototype

global.ErrorRequired = name => {
	this.name = 'ErrorRequired'
	this.message = `'${name}' is required.`
}
global.ErrorRequired.prototype = Error.prototype

class Autocode {
	constructor(config, cwd) {
		const methods = [
			'build',
			'cache',
			'generate',
			'hi',
			'info',
			'import',
			'init',
			'install',
			'load',
			'run',
			'save',
			'search',
			'stop',
			'test',
			'update',
			'validate',
		]

		methods.forEach(method => {
			this[method] = require(`./autocode/${method}`)
		})

		if (typeof config === 'object') {
			const validate = this.validate(config)
			if (!validate.valid) {
				let match = 'Failed "type" criteria:'
				if (validate.errors[0].message.match(match)) {
					let message = validate.errors[0].message.replace(
						/Failed "type" criteria: expecting (.*?), found (.*?)$/,
						`\`${validate.errors[0].context.substr(2)}\` must be a \`$1\`, not a \`$2\`.`
					)
					message = message.replace(/\ or\ /, '` or `')
					throw new Error(message)
				}
				match = 'Failed "required" criteria:'
				if (validate.errors[0].message.match(match)) {
					let context = validate.errors[0].context.substr(2).replace(/\//, '.')
					if (context.length) {
						context += '.'
					}
					let message = validate.errors[0].message.replace(
						/Failed "required" criteria: missing property \((.*?)\)$/,
						`\`${context}$1\` is required.`
					)
					message = message.replace(/\ or\ /, '` or `')
					throw new Error(message)
				}
				throw new Error('Config is invalid.')
			}
			this.config = config
			this.path = this.config.path ? this.config.path : process.cwd()
		} else if (typeof config === 'string') {
			this.config = this.load(config)
			this.path = this.config.path ? this.config.path : config
		} else {
			this.config = {}
			this.path = process.cwd()
		}

		if (cwd) {
			this.path = cwd
		}

		if (!this.path.match(/^\//)) {
			this.path = path.normalize(`${process.cwd()}/${this.path}`)
		}

		if (this.config === false) {
			throw new Error(`Unable to load config for (${this.path}).`)
		}

		if (!this.config.host) {
			this.config.host = 'github.com'
		}
	}
}

export default Autocode
