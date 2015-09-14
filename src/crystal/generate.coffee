# load deps
crystal = {
	load: require './load'
}
colors       = require 'colors'
crypto       = require 'crypto'
cson         = require 'cson-parser'
extend       = require 'extend-combine'
findVersions = require 'find-versions'
fs           = require 'fs'
error        = require '../error'
handlebars   = require 'handlebars'
merge        = require 'merge'
mkdirp       = require 'mkdirp'
mustache     = require 'mustache'
path         = require 'path'
readdir      = require 'fs-readdir-recursive'
season       = require 'season'
semver       = require 'semver'
skeemas      = require 'skeemas'
userHome     = require 'user-home'
yaml         = require 'js-yaml'

force = false
loaded_modules = {}

loadModules = (modules, host) ->
	# load each module
	for module_name of modules
		module_version_query = modules[module_name]
		
		if module_version_query == 'latest'
			module_version = 'latest'
		else
			module_version = null
			# load module from local path
			if module_version_query.match /^(\.|\/)/
				module_versions_path = path.normalize module_version_query
				if fs.existsSync module_versions_path
					module_version = module_version_query
			# determine version of installed module based on semver range
			else
				module_versions_path = path.normalize "#{userHome}/.crystal/module/#{host}/#{module_name}"
				if fs.existsSync module_versions_path
					module_versions = fs.readdirSync module_versions_path
					for model_ver in module_versions
						model_ver = semver.clean model_ver
						if model_ver and semver.satisfies(model_ver, modules[module_name]) and (!module_version or semver.gt(model_ver, module_version))
							module_version = model_ver
		if !module_version
			throw new Error "No matches for Module (#{module_name}) with version (#{module_version_query}). Try: crystal update"
		
		module_alias = module_name.substr(module_name.lastIndexOf('/') + 1)
		
		# module already loaded
		if loaded_modules[module_name] and loaded_modules[module_name][module_version]
			continue
		
		# load module
		#console.log "- #{module_name}@#{module_version}"
		
		# create module object
		if !loaded_modules[module_name]
			loaded_modules[module_name] = {}
		
		# get local module path
		if module_version_query.match /^(\.|\/)/
			module_path = module_version_query
		# get installed module path
		else
			module_path = "#{userHome}/.crystal/module/#{host}/#{module_name}/#{module_version}"
		if !fs.existsSync module_path
			throw new Error "Unknown module (#{module_name}) at version (#{module_version}). Try: crystal update"
		
		# get/validate module config
		module_config = crystal.load module_path
		if !module_config
			throw new Error "Unable to load configuration for module (#{module_name})"
		
		# load exports
		if module_config.exports
			for export_name of module_config.exports
				exported = module_config.exports[export_name]
				
				# add dir
				module_config.exports[export_name].dir = module_path
				
				# handle engine
				if typeof(exported.engine) == 'string' && exported.engine.match(/\./)
					export_path = "#{module_path}/.crystal/engine/#{exported.engine}"
					if fs.existsSync export_path
						engine = require export_path
					else
						engine = exported.engine
					module_config.exports[export_name].engine = engine
					
				# handle helper
				if typeof(exported.helper) == 'string' && exported.helper.match(/\./)
					export_path = "#{module_path}/.crystal/helper/#{exported.helper}"
					if fs.existsSync export_path
						helper = require export_path
					else
						helper = exported.helper
					module_config.exports[export_name].helper = helper
					
				# handle processor
				if typeof(exported.processor) == 'string' && exported.processor.match(/\./)
					export_path = "#{module_path}/.crystal/processor/#{exported.processor}"
					if fs.existsSync export_path
						processor = require export_path
					else
						processor = exported.processor
					module_config.exports[export_name].processor = processor
				
				# handle schema
				if typeof(exported.schema) == 'string' && exported.schema.match(/\./)
					export_path = "#{module_path}/.crystal/schema/#{exported.schema}"
					if fs.existsSync export_path
						schema = yaml.safeLoad fs.readFileSync(export_path)
					else
						schema = exported.schema
					module_config.exports[export_name].schema = schema
				
				# handle spec
				if typeof(exported.spec) == 'string' && exported.spec.match(/\./)
					export_path = "#{module_path}/.crystal/spec/#{exported.spec}"
					if fs.existsSync export_path
						spec = yaml.safeLoad fs.readFileSync(export_path)
					else
						spec = exported.spec
					module_config.exports[export_name].spec = spec
				
				# handle template
				if typeof(exported.template) == 'string' && exported.template.match(/\./)
					export_path = "#{module_path}/.crystal/template/#{exported.template}"
					if fs.existsSync export_path
						template = fs.readFileSync(export_path, 'utf8')
					else
						template = exported.template
					module_config.exports[export_name].template = template
				
				# handle transformer
				if typeof(exported.transformer) == 'string' && exported.transformer.match(/\./)
					export_path = "#{module_path}/.crystal/trans/#{exported.transformer}"
					if fs.existsSync export_path
						transformer = require export_path
					else
						transformer = exported.transformer
					module_config.exports[export_name].transformer = transformer
		
		# add module to loaded modules
		loaded_modules[module_name][module_version] = module_config
		
		# load submoduless
		if module_config.imports
			loadModules module_config.imports, module_config.host
		else if module_config.modules
			loadModules module_config.modules, module_config.host
	
	loaded_modules = sortObject(loaded_modules)

processModules = () ->
	for module_name of loaded_modules
		module_versions = loaded_modules[module_name]
		for version_name of module_versions
			loaded_module = module_versions[version_name]
			
			submodules = {}
			if loaded_module.imports
				loaded_module.modules = loaded_module.imports
			loaded_module.imports = {}
			for submodule_name of loaded_module.modules
				submodule_alias = submodule_name.substr(submodule_name.lastIndexOf('/') + 1)
				submodule_version_query = loaded_module.modules[submodule_name]
				
				if submodule_version_query == 'latest'
					submodule_version = 'latest'
				else
					submodule_version = null
					# load module from local path
					if submodule_version_query.match /^(\.|\/)/
						submodule_versions_path = path.normalize submodule_version_query
						if fs.existsSync submodule_versions_path
							submodule_version = submodule_version_query
					# determine version of installed module based on semver range
					else
						submodule_versions_path = path.normalize "#{userHome}/.crystal/module/#{loaded_module.host}/#{submodule_name}"
						if fs.existsSync submodule_versions_path
							submodule_versions = fs.readdirSync submodule_versions_path
							for model_ver in submodule_versions
								model_ver = semver.clean model_ver
								if model_ver and semver.satisfies(model_ver, submodule_version_query) and (!submodule_version or semver.gt(model_ver, submodule_version))
									submodule_version = model_ver
				if !submodule_version
					throw new Error "No matches for submodule (#{submodule_name}) with version (#{submodule_version_query}). Try: crystal update"
					
				submodule_exports = loaded_modules[submodule_name][submodule_version].exports
				for submodule_export_name of submodule_exports
					submodule_export = submodule_exports[submodule_export_name]
					loaded_module.imports["#{submodule_alias}.#{submodule_export_name}"] = "#{submodule_name}.#{submodule_export_name}"
				
				submodules[submodule_name] = submodule_version
			
			for export_name of loaded_module.exports
				exported = loaded_module.exports[export_name]
				
				if exported.copy and typeof(exported.copy.engine) == 'string'
					test = loaded_module.imports[exported.copy.engine].split('.')
					test2 = test.pop()
					test = test.join('.')
					loaded_modules[module_name][version_name].exports[export_name].copy.engine = loaded_modules[test][submodules[test]].exports[test2].engine
				
				if exported.copy and exported.copy.dest and exported.copy.dest.engine and typeof(exported.copy.dest.engine) == 'string'
					test = loaded_module.imports[exported.copy.dest.engine].split('.')
					test2 = test.pop()
					test = test.join('.')
					loaded_modules[module_name][version_name].exports[export_name].copy.dest.engine = loaded_modules[test][submodules[test]].exports[test2].engine
				
				if typeof(exported.engine) == 'string' and loaded_module.imports[exported.engine]
					test = loaded_module.imports[exported.engine].split('.')
					test2 = test.pop()
					test = test.join('.')
					loaded_modules[module_name][version_name].exports[export_name].engine = loaded_modules[test][submodules[test]].exports[test2].engine
					
				if exported.filename and typeof(exported.filename.engine) == 'string'
					if !loaded_module.imports[exported.filename.engine]
						throw new Error "Import does not exist for alias (#{exported.filename.engine})"
					test = loaded_module.imports[exported.filename.engine].split('.')
					test2 = test.pop()
					test = test.join('.')
					loaded_modules[module_name][version_name].exports[export_name].filename.engine = loaded_modules[test][submodules[test]].exports[test2].engine
				
				if typeof(exported.helper) == 'object'
					helpers = []
					
					for helper_name of exported.helper
						helper = exported.helper[helper_name]
						if !loaded_module.imports[helper] and !loaded_module.exports[helper]
							throw new Error "Import does not exist for alias (#{helper})"
							
						if loaded_module.exports[helper]
							helpers.push {
								callback: loaded_module.exports[helper].helper
								name: helper_name
							}
							
						else
							test = loaded_module.imports[helper].split('.')
							test2 = test.pop()
							test = test.join('.')
							
							helpers.push {
								callback: loaded_modules[test][submodules[test]].exports[test2].helper
								name: helper_name
							}
					
					loaded_modules[module_name][version_name].exports[export_name].helper = helpers
					
				else if typeof(exported.helper) == 'string' and loaded_module.imports[exported.helper]
					test = loaded_module.imports[exported.helper].split('.')
					test2 = test.pop()
					test = test.join('.')
					
					if !loaded_modules[test][submodules[test]].exports[test2]
						throw new Error "Import (#{test2}) does not exist for module (#{test})"
						
					loaded_modules[module_name][version_name].exports[export_name].helper = [{
						callback: loaded_modules[test][submodules[test]].exports[test2].helper
						name: loaded_modules[test][submodules[test]].exports[test2].name
					}]

				if typeof(exported.schema) == 'string' and loaded_module.imports[exported.schema]
					test = loaded_module.imports[exported.schema].split('.')
					test2 = test.pop()
					test = test.join('.')
					loaded_modules[module_name][version_name].exports[export_name].schema = loaded_modules[test][submodules[test]].exports[test2].schema
					
				if typeof(exported.transformer) == 'string' and loaded_module.imports[exported.transformer]
					test = loaded_module.imports[exported.transformer].split('.')
					test2 = test.pop()
					test = test.join('.')
					loaded_modules[module_name][version_name].exports[export_name].transformer = loaded_modules[test][submodules[test]].exports[test2].transformer

loadOutputs = (outputs, imports, config) ->
	if !imports
		throw new Error 'No imports available for output'
	
	for output_i of outputs
		output = outputs[output_i]
		
		# validate generator
		if output.generator and !imports[output.generator]
			throw new Error "Generator (#{output.generator}) does not exist for output in config (#{config.name})"
		
		console.log "\nOutput ##{parseInt(output_i)+1}".bold
		
		# load generator from imports
		generator = imports[output.generator] or {}

		# load processors
		output_processor = output.processor
		generator_processor = generator.processor
		if generator_processor
			if typeof(output_processor) == 'string'
				output_processor = [output_processor]
			if typeof(generator_processor) == 'string'
				generator_processor = [generator_processor]
				
			if output_processor && generator_processor
				output_processor = extend true, true, output_processor, generator_processor
			else
				output_processor = generator_processor
		
		if output_processor instanceof Array
			processors = []
			
			for processor in output_processor
				if !imports[processor]
					throw new Error "Import does not exist for alias (#{processor})"
				
				processors.push {
					alias: processor
					callback: imports[processor].processor
				}
			
			output_processor = processors
			
		else if typeof(output_processor) == 'string'
			if !imports[output_processor]
				throw new Error "Import does not exist for alias (#{output_processor})"
				
			output_processor = [{
				alias: output_processor
				callback: imports[output_processor].processor
			}]

		# load spec from file
		spec = {}
		if output.spec
			if output.spec instanceof Array
				for output_spec in output.spec
					if typeof(output_spec) == 'string'
						if imports[output_spec]
							output_spec = imports[output_spec].spec
						else
							spec_filename = ".crystal/spec/#{output_spec}"
							if !fs.existsSync spec_filename
								throw new Error "File (#{spec_filename}) does not exist for spec in output for config (#{config.id})"
							output_spec = yaml.safeLoad fs.readFileSync(spec_filename, 'utf8')
					spec = extend true, true, spec, output_spec
			else if typeof(output.spec) == 'object'
				spec = output.spec
			else if typeof(output.spec) == 'string'
				if imports[output.spec]
					spec = imports[output.spec].spec
				else
					spec_filename = ".crystal/spec/#{output.spec}"
					if !fs.existsSync spec_filename
						throw new Error "File (#{spec_filename}) does not exist for spec in output for config (#{config.id})"
					spec = yaml.safeLoad fs.readFileSync(spec_filename, 'utf8')
			
			# parse spec variables
			console.log "Processed spec.".blue
			if config.debug
				console.log "    - Before:".green
				console.log JSON.stringify spec[i], null, "  "
			spec = parse spec, config, output_processor
			if config.debug
				console.log "    - After:".green
				console.log JSON.stringify spec[i], null, "  "
			
		# validate spec
		if generator.schema
			validate = skeemas.validate spec, generator.schema
			if !validate.valid
				console.log validate.errors
				console.log("ERROR: Specification failed validation.")
				for error in validate.errors
					console.log "- #{error.message} for specification (#{error.context.substr(2)})"
				throw new Error "ERROR: Invalid specification."
		
		# get engine
		engine = output.engine or generator.engine
		if typeof(engine) == 'string'
			if !imports[engine] or !imports[engine].engine
				throw new Error "Engine was not imported: #{engine}"
			engine = imports[engine].engine

		# get helpers
		if helpers
			old_helpers = helpers
		helpers = if generator.helper then generator.helper else null
		
		# get injectors
		injectors = if output.injector then output.injector else null
		
		# copy files
		if generator.copy
			if typeof(generator.copy) == 'object'
				if !generator.copy.src
					throw new Error "Copy requires source"
				copy_src = generator.copy.src
			else if typeof(generator.copy) == 'string'
				copy_src = generator.copy
			else
				throw new Error "Invalid value for copy"
			
			if generator.copy.dest
				if typeof(generator.copy.dest) == 'object'
					if !generator.copy.dest.engine
						throw new Error "Destination engine is required for copy"
					if !generator.copy.dest.value
						throw new Error "Destination value is required for copy"
					copy_dest = generator.copy.dest.engine spec, generator.copy.dest.value, helpers, old_helpers
				else if typeof(generator.copy.dest) == 'string'
					copy_dest = generator.copy.dest
				else
					throw new Error "Invalid Destination for copy"
				if copy_dest.substr(copy_dest.length - 1) != '/'
					copy_dest += '/'
			else
				copy_dest = ''
			
			copy_dir = "#{generator.dir}/.crystal/#{copy_src}"
			if !fs.existsSync copy_dir
				throw new Error "Directory (#{copy_dir}) does not exist in copy"
			
			code_files = readdir copy_dir, (x) ->
				return true
			for code_file in code_files
				copy_filename = "#{output.path}/#{copy_dest}#{code_file}"
				code_dir = copy_filename.substring 0, copy_filename.lastIndexOf('/')+1
				if !fs.existsSync code_dir
					mkdirp.sync code_dir
				fs.writeFileSync "#{copy_filename}", fs.readFileSync "#{copy_dir}/#{code_file}"
				
				console.log "Generated file: #{copy_filename}".green
		
		# validate filename
		generator_filename = output.filename or generator.filename
		if !generator_filename
			continue
		
		# get iterator
		iterator = output.iterator or generator.iterator
		if iterator
			if !spec[iterator]
				throw new Error "Iterator (#{iterator}) not found in spec for generator (#{generator}) in config (#{config.id})"
			files = []
			if spec[iterator] instanceof Array
				for file in spec[iterator]
					files.push file
			else if typeof(spec[iterator]) == 'object'
				for name of spec[iterator]
					files.push name
		else
			files = [generator_filename]

		for i of files
			file = files[i]
			
			if file.name
				filename_options = {
					name: file.name
				}
				file = file.name
			else
				filename_options = []
				filename_options[0] = {}
				filename_options[0][file] = spec
				file_name = null
			
			# pass filename thru engine
			if generator_filename.engine
				filename = generator_filename.engine filename_options, generator_filename.value, helpers, old_helpers
			else
				filename = generator_filename
				
			# append path to filename
			if output.path
				if !fs.existsSync output.path
					mkdirp output.path
				filename = "#{output.path}/#{filename}"
			
			# validate spec
			if !spec
				throw new Error "Spec is required."
				
			# get content from output
			if output.template
				output_path = ".crystal/template/#{output.template}"
				if fs.existsSync output_path
					template = fs.readFileSync(output_path, 'utf8')
				else
					template = output.template
			else
				template = generator.template
			if engine
				if iterator
					content_spec = extend true, true, {}, spec[iterator][i] or spec[iterator][file]
					if content_spec
						content_spec = extend true, true, content_spec, spec
						content_spec.name = file
					if content_spec and content_spec[iterator] and content_spec[iterator][file] and content_spec[iterator][file]['$injector']
						template = inject template, injectors, false
						template = inject template, content_spec[iterator][file]['$injector'], false
						template = inject template, null, true
					else
						template = inject template, injectors, true
					content = engine content_spec, template, helpers, old_helpers
				else
					if template
						template = inject template, injectors, true
					content = engine spec, template, helpers
			else if template
				template = inject template, injectors, true
				content = template
			else if spec
				content = spec
			else
				content = ""
			
			# transform content
			transformer = output.transformer or generator.transformer
			if transformer
				if typeof(transformer) == 'string'
					if !imports[transformer]
						throw new Error "Transformer #{transformer} does not exist"
					transformer = imports[transformer].transformer
				content = transformer content
			else if typeof(content) == 'object'
				content = ""
			
			# get cached checksums
			cache_filename = ".crystal/cache.yml"
			if fs.existsSync cache_filename
				cache = yaml.safeLoad fs.readFileSync(cache_filename, 'utf8')
				if !cache.checksum
					cache.checksum = {}
			else
				cache = {
					checksum: {}
				}
			
			# get file/cache/ checksum
			filename_checksum = crypto.createHash('md5').update(filename, 'utf8').digest('hex')
			if cache.checksum[filename_checksum]
				if !fs.existsSync filename
					if force != true
						throw new Error "ERROR: File (#{filename}) has been manually deleted outside of Crystal. Use -f to force code generation and overwrite this deletion.".red.bold
				else
					cache_checksum = cache.checksum[filename_checksum]
					file_checksum = crypto.createHash('md5').update(fs.readFileSync(filename, 'utf8'), 'utf8').digest('hex')
					
					# validate checksum
					if cache_checksum != file_checksum && force != true
						throw new Error "ERROR: File (#{filename}) has been manually changed outside of Crystal. Use -f to force code generation and overwrite these changes.".red.bold
			
			# get content checksum
			content_checksum = crypto.createHash('md5').update(content, 'utf8').digest('hex')
			
			# cache checksum
			cache.checksum[filename_checksum] = content_checksum
			if !fs.existsSync ".crystal"
				mkdirp.sync ".crystal"
			fs.writeFileSync ".crystal/cache.yml", yaml.safeDump cache

			# write content to file
			file_last_path = filename.lastIndexOf('/')
			if file_last_path != -1
				mkdirp.sync filename.substr(0, file_last_path)
			fs.writeFileSync filename, content
			
			console.log "Generated file: #{filename}".green
			
			#if generator.outputs
				#loadOutputs generator.outputs, generator.imports, config

generate = (opts) ->
	loaded_modules = {}
	
	# get config
	config = this.config
	
	# get opts
	if opts and opts.force
		force = true
	
	# reassign imports
	if config.imports
		config.modules = config.imports
		delete config.imports
	
	# load modules
	if config.modules
		#console.log "Loading modules for #{config.name}..."
		loadModules config.modules, config.host
		processModules()
	
	imports = {}
	for module_name of config.modules
		module_alias = module_name.substr(module_name.lastIndexOf('/') + 1)
		module_version_query = config.modules[module_name]
		
		if module_version_query == 'latest'
			module_version = 'latest'
		else
			module_version = null
			# load module from local path
			if module_version_query.match /^(\.|\/)/
				module_versions_path = path.normalize module_version_query
				if !fs.existsSync module_versions_path
					throw new Error "Module (#{module_name}) not found at local path (#{module_version_query})."
				else
					module_version = module_version_query
			# determine version of installed module based on semver range
			else
				module_versions_path = path.normalize "#{userHome}/.crystal/module/#{config.host}/#{module_name}"
				if fs.existsSync module_versions_path
					module_versions = fs.readdirSync module_versions_path
					for model_ver in module_versions
						model_ver = semver.clean model_ver
						if model_ver and semver.satisfies(model_ver, config.modules[module_name]) and (!module_version or semver.gt(model_ver, module_version))
							module_version = model_ver
		if !module_version
			throw new Error "No matches for Module (#{module_name}) with version (#{module_version_query}). Try: crystal update"
		
		exports = loaded_modules[module_name][module_version].exports
		for export_name of exports
			exported = exports[export_name]
			imports["#{module_alias}.#{export_name}"] = exported
	
	#imports = {}
	#for import_alias of config.imports
	#	console.log import_alias
	#	import_parts = config.imports[import_alias].split('.')
	#	import_name = import_parts.pop()
	#	import_module = import_parts.join('.')
	#	import_version = config.modules[import_module]
	#	
	#	if !loaded_modules[import_module] or !loaded_modules[import_module][import_version]
	#		throw new Error "Unknown module (#{import_module}) for import (#{import_name}) in config (#{config.id})."
	#	else if !loaded_modules[import_module][import_version].exports
	#		throw new Error "Module (#{import_alias}) has no exports."
	#	else if !loaded_modules[import_module][import_version].exports[import_name]
	#		error = "Unknown export (#{import_name}) for module (#{import_module}). Try:"
	#		for export_name of loaded_modules[import_module][import_version].exports
	#			error += "\n- #{export_name}"
	#		throw new Error error.red
	#	
	#	imports[import_alias] = loaded_modules[import_module][import_version].exports[import_name]
	
	# load outputs
	if config.outputs
		console.log "Loading outputs...".bold
		loadOutputs config.outputs, imports, config

inject = (template, injectors, remove_injector = true) ->
	template.replace /([  |\t]+)?>>>[a-z_]*<<<\n?/ig, (injector) ->
		injector_tabs = injector.match /^[\s]+>/g
		if injector_tabs
			injector_tabs = injector_tabs[0].substr(0, injector_tabs[0].length-1)
		else
			injector_tabs = ''
		injector = injector.replace /[\s]+/g, ''
		injector = injector.substr 3, injector.length-6
		if injectors and injectors[injector]
			if injectors[injector] instanceof Array
				injected = injectors[injector].join "\n"
			else if (injectors[injector].substr(0,1) == '/' or injectors[injector].substr(0,2) == './') and fs.existsSync ".crystal/#{injectors[injector]}"
				injected = fs.readFileSync ".crystal/#{injectors[injector]}", 'utf8'
			else
				injected = injectors[injector]
			if remove_injector == true
				inject_final = ''
			else
				inject_final = "#{injector_tabs}>>>#{injector}<<<\n"
			for inj in injected.split "\n"
				inject_final += "#{injector_tabs}#{inj}\n"
			inject_final += ""
		else if remove_injector == true
			''
		else
			"#{injector_tabs}>>>#{injector}<<<\n"
		
parse = (spec, config, processors) ->
	for i of spec
		s = spec[i]
		
		if typeof(s) == 'object' and !s['$processor']
			spec[i] = parse(spec[i], config, processors)
		else if typeof(s) == 'string' && s.substr(0, 1) == '$' && config[s.substr(1)]
			spec[i] = config[s.substr(1)]
			
		if spec[i]['$processor']
			if typeof(spec[i]['$processor']) == 'string'
				spec[i]['$processor'] = [spec[i]['$processor']]
				
			for proc in spec[i]['$processor']
				for processor in processors
					if processor.alias == proc
						spec[i]['$value'] = processor.callback spec[i]['$value']
						
			spec[i] = spec[i]['$value']
					
	spec

sortObject = (object) ->
  Object.keys(object).sort().reduce ((result, key) ->
    result[key] = object[key]
    result
  ), {}
  

module.exports = generate
