# load deps
assert   = require 'assert'
colors   = require 'colors'
fs       = require 'fs'
prompt   = require 'prompt'
userHome = require 'user-home'
yaml     = require 'js-yaml'

popular_modules = [
	'official.readme'
	'official.license'
	'official.authors'
	'official.gitignore'
	'official.express'
	'official.wordpress'
	'official.ios'
	'official.npm'
	'official.laravel'
	'official.rails'
]

initProject = (crystal, opts, path) ->
	# validate name
	if !opts.name
		throw new Error 'Name is required.'
	
	# validate version
	if !opts.version
		throw new Error 'Version is required.'
	
	# create config
	config = {
		id: opts.id
		name: opts.name
		version: opts.version
	}
	
	# add description to config
	if opts.description
		config.description = opts.description
	
	config.author = {
		name: opts.author_name
		email: opts.author_email
		url: opts.author_url
	}
	
	config.copyright = opts.copyright
	
	# add modules to config
	if opts.modules
		config.modules = {}
		config.imports = {}
		config.outputs = []
		for module_name of opts.modules
			config.modules[module_name] = 'master'
			for import_name in opts.modules[module_name]
				config.imports[import_name] = "#{module_name}.#{import_name}"
				
				switch module_name
					when 'official.authors'
						config.outputs.push {
							generator: 'AuthorsGenerator'
							spec:
								name: '$name'
								author: '$author'
						}
					when 'official.express'
						switch import_name
							when 'AppGenerator'
								config.outputs.push {
									generator: 'AppGenerator'
									path: 'src/api'
									spec:
										port: 3000
										routes: [
											{
												name: 'module'
												method: 'GET'
												uri: '/v1/modules/:id'
											}
										]
								}
							when 'RouteGenerator'
								config.outputs.push {
									generator: 'RouteGenerator'
									path: 'src/api/routes'
									spec:
										port: 3000
										routes: [
											{
												name: 'home'
												method: 'GET'
												scripts: [
													'scripts/page/home.js'
												]
												styles: [
													'styles/page/home.css'
													'styles/page/home/contribute.css'
												]
												title: 'Home'
												uri: '/v1/modules/:id'
												view: 'home'
											},
											{
												name: 'contact'
												method: 'GET'
												scripts: [
													'scripts/page/home.js'
												]
												styles: [
													'styles/page/home.css'
													'styles/page/home/contribute.css'
												]
												title: 'Home'
												uri: '/v1/modules/:id'
												view: 'home'
											},
											{
												name: 'about'
												method: 'GET'
												scripts: [
													'scripts/page/home.js'
												]
												styles: [
													'styles/page/home.css'
													'styles/page/home/contribute.css'
												]
												title: 'Home'
												uri: '/v1/modules/:id'
												view: 'home'
											},
											{
												name: 'products'
												method: 'GET'
												scripts: [
													'scripts/page/home.js'
												]
												styles: [
													'styles/page/home.css'
													'styles/page/home/contribute.css'
												]
												title: 'Home'
												uri: '/v1/modules/:id'
												view: 'home'
											},
											{
												name: 'services'
												method: 'GET'
												scripts: [
													'scripts/page/home.js'
												]
												styles: [
													'styles/page/home.css'
													'styles/page/home/contribute.css'
												]
												title: 'Home'
												uri: '/v1/modules/:id'
												view: 'home'
											},
											{
												name: 'help'
												method: 'GET'
												scripts: [
													'scripts/page/home.js'
												]
												styles: [
													'styles/page/home.css'
													'styles/page/home/contribute.css'
												]
												title: 'Home'
												uri: '/v1/modules/:id'
												view: 'home'
											},
											{
												name: 'support'
												method: 'GET'
												scripts: [
													'scripts/page/home.js'
												]
												styles: [
													'styles/page/home.css'
													'styles/page/home/contribute.css'
												]
												title: 'Home'
												uri: '/v1/modules/:id'
												view: 'home'
											},
											{
												name: 'tutorials'
												method: 'GET'
												scripts: [
													'scripts/page/home.js'
												]
												styles: [
													'styles/page/home.css'
													'styles/page/home/contribute.css'
												]
												title: 'Home'
												uri: '/v1/modules/:id'
												view: 'home'
											},
											{
												name: 'trial'
												method: 'GET'
												scripts: [
													'scripts/page/home.js'
												]
												styles: [
													'styles/page/home.css'
													'styles/page/home/contribute.css'
												]
												title: 'Home'
												uri: '/v1/modules/:id'
												view: 'home'
											},
											{
												name: 'search'
												method: 'GET'
												scripts: [
													'scripts/page/home.js'
												]
												styles: [
													'styles/page/home.css'
													'styles/page/home/contribute.css'
												]
												title: 'Home'
												uri: '/v1/modules/:id'
												view: 'home'
											}
										]
								}
					when 'official.gitignore'
						config.outputs.push {
							generator: 'GitignoreGenerator'
							spec:
								items: ['.DS_Store', 'node_modules/']
						}
					when 'official.license'
						config.outputs.push {
							generator: 'MITGenerator'
							spec:
								copyright: '$copyright'
						}
					when 'official.npm'
						config.outputs.push {
							generator: 'ConfigGenerator'
							spec:
								dependencies:
									express: 'latest'
						}
					when 'official.readme'
						config.outputs.push {
							generator: 'ReadmeGenerator'
							spec:
								name: '$name'
								version: '$version'
								description: '$description'
						}
	
	# convert config obj to yaml doc
	config = yaml.safeDump config
	
	# create src dir
	if !fs.existsSync "#{path}/.crystal"
		fs.mkdirSync "#{path}/.crystal"
	
	# create crystal config
	fs.writeFileSync "#{path}/.crystal/config.yml", config
	
	console.log 'Crystal initialization is complete.'.green
	
	crystal.build path
	
init = (opts) ->
	
	# get crystal
	crystal = this
	
	# get path
	opts.path = opts._[1] || opts.path || this.path || process.cwd()
	
	# validate path
	if !opts.path
		throw new Error 'Path is required.'
	else if !fs.existsSync opts.path
		throw new Error "Path does not exist: #{opts.path}"
	
	# check if crystal config exists
	config = this.config opts.path
	if config != false
		throw new Error "Crystal has already been initialized in: #{opts.path}"
	
	console.log "Initializing Crystal in: #{opts.path}".green.bold
	
	# setup prompt
	prompt.message = ''
	prompt.delimiter = ''
	prompt.start()
	
	if opts.name and opts.name.length and opts.version and opts.version.length
		initProject opts, opts.path
	else
		properties = {}
		
		if !opts.id
			properties.id = {
				description: "ID (ex: acme.website)"
				required: true
				type: 'string'
			}
		if !opts.name
			properties.name = {
				description: "Name (ex: Acme Website)"
				required: true
				type: 'string'
			}
		if !opts.version
			properties.version = {
				default: '0.1.0'
				description: "Version"
				required: true
				type: 'string'
			}
		if !opts.description
			properties.description = {
				description: "Description (ex: website for Acme, Inc.)"
				required: true
				type: 'string'
			}
		if !opts.author_name
			properties.author_name = {
				description: "Author Name (ex: Author)"
				required: true
				type: 'string'
			}
		if !opts.author_email
			properties.author_email = {
				description: "Author Email (ex: author@example.org)"
				required: true
				type: 'string'
			}
		if !opts.author_url
			properties.author_url = {
				description: "Author URL (ex: http://example.org)"
				required: true
				type: 'string'
			}
		if !opts.copyright
			properties.copyright = {
				description: "Copyright (ex: 2015 Acme, Inc.)"
				required: true
				type: 'string'
			}
			
		prompt.get { properties: properties }, (err, result) ->
			if err
				console.log "\nMaybe next time."
			else
				result.id = opts.id || result.id
				result.name = opts.name || result.name
				result.version = opts.version || result.version
				result.description = opts.description || result.description
				result.author_name = opts.author_name || result.author_name
				result.author_email = opts.author_email || result.author_email
				result.author_url = opts.author_url || result.author_url
				result.copyright = opts.copyright || result.copyright
				
				addModule = () ->
					console.log "Choose from popular modules or enter your own:".bold
					for i of popular_modules
						popular_module = popular_modules[i]
						module_i = parseInt(i)+1
						console.log "#{module_i}) #{popular_module}"
						
					prompt.get {
						properties:
							module:
								description: 'Module (ex: 1, 2, official.readme)'
					}, (err, module_result) ->
						if err
							console.log "\nMaybe next time."
						else
							if module_result.module.length
								if !result.modules
									result.modules = {}
								
								if parseInt(module_result.module) > 0 and popular_modules[module_result.module-1]
									module_name = popular_modules[module_result.module-1]
								else
									module_name = module_result.module
								
								if result.modules[module_name]
									console.log "Module (#{module_name}) has already been added"
								else
									result.modules[module_name] = []
									
								addImport(module_name)
							else
								initProject crystal, result, opts.path
								
				addImport = (module_name) ->
					module_path = module_name.replace /\./g, '/'
					
					module_config = crystal.config "#{userHome}/.crystal/module/#{module_path}/master"
					if !module_config
						throw new Error "Config not found for module (#{module_name})"
					if !module_config.exports
						throw new Error "Module (#{module_name}) has no exports"
					
					console.log "Choose exports from this module to import:".bold
					imports = []
					import_i = 1
					for export_name of module_config.exports
						if result.modules[module_name].indexOf(export_name) != -1
							continue
						console.log "#{import_i}) #{export_name}"
						imports.push export_name
						import_i++
					
					if !imports.length
						console.log "All exports have been imported from module (#{module_name})".blue
						addModule()
						return
					
					prompt.get {
						properties:
							import:
								description: 'Import (ex: 1, 2, etc.)'
					}, (err, import_result) ->
						if err
							console.log "\nMaybe next time."
						else
							if import_result.import.length
								if !imports[parseInt(import_result.import)-1]
									console.log "Import (#{import_result.import}) does not exit for module (#{module_name})".red
									addImport module_name
									return
									
								result.modules[module_name].push imports[parseInt(import_result.import)-1]
								addImport module_name
								
							else
								addModule()
								
				addModule()

module.exports = init