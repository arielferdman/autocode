let cwd, force, generate, inject, loadOutputs, loadProcessor, loadSchemaRefs, parse, processModules, requireFromString, sortObject

import Autocode from '../autocode'
import colors from 'colors'
import crypto from 'crypto'
import extend from 'extend-combine'
import fs from 'fs'
import error from '../error'
import mkdirp from 'mkdirp'
import path from 'path'
import readdir from 'fs-readdir-recursive'
import request from 'sync-request'
import semver from 'semver'
import skeemas from 'skeemas'
import userHome from 'user-home'
import yaml from 'js-yaml'

cwd = process.cwd()

force = false

let loadedModules = {}

let imports = {}

requireFromString = (code, modules_path) => {
	let e, error1, m
	try {
		m = new module.constructor()
		m.paths = [`${modules_path}`]
		m._compile(code, modules_path)
		return m.exports
	} catch (error1) {
		e = error1
		return code
	}
}

const loadModules = (modules, host) => {
	let engine, export_name, export_path, exported, exported_spec, helper, j, k, len, len1, model_ver, module_alias, module_config, module_name, module_path, module_version, module_version_query, module_versions, module_versions_path, processor, ref, schema, spec, template, transformer
	for (module_name in modules) {
		module_version_query = modules[module_name]
		if (module_version_query === 'latest') {
			module_version = 'latest'
		} else {
			module_version = null
			if (module_version_query.match(/^(\.|\/)/)) {
				module_versions_path = path.normalize(module_version_query)
				if (fs.existsSync(module_versions_path)) {
					module_version = module_version_query
				}
			} else {
				module_versions_path = path.normalize(`${userHome}/.autocode/module/${host}/${module_name}`)
				if (fs.existsSync(module_versions_path)) {
					module_versions = fs.readdirSync(module_versions_path)
					for (j = 0, len = module_versions.length; j < len; j++) {
						model_ver = module_versions[j]
						model_ver = semver.clean(model_ver)
						if (model_ver && semver.satisfies(model_ver, modules[module_name]) && (!module_version || semver.gt(model_ver, module_version))) {
							module_version = model_ver
						}
					}
				}
			}
		}
		if (!module_version) {
			throw new Error(`No matches for Module (${module_name}) with version (${module_version_query}). Try: autocode update`)
		}
		module_alias = module_name.substr(module_name.lastIndexOf('/') + 1)
		if (loadedModules[module_name] && loadedModules[module_name][module_version]) {
			continue
		}
		if (!loadedModules[module_name]) {
			loadedModules[module_name] = {}
		}
		if (module_version_query.match(/^(\.|\/)/)) {
			module_path = module_version_query
		} else {
			module_path = `${userHome}/.autocode/module/${host}/${module_name}/${module_version}`
		}
		if (!fs.existsSync(module_path)) {
			throw new Error(`Unknown module (${module_name}) at version (${module_version}). Try: autocode update`)
		}
		const module_project = new Autocode(module_path)
		module_config = module_project.load()
		if (!module_config) {
			throw new Error(`Unable to load configuration for module (${module_name})`)
		}
		if (module_config.exports) {
			for (export_name in module_config.exports) {
				exported = module_config.exports[export_name]
				module_config.exports[export_name].dir = module_path
				if (typeof exported.engine === 'string') {
					export_path = path.normalize(`${module_path}/.autocode/engine/${exported.engine}`)
					if (fs.existsSync(export_path)) {
						engine = require(export_path)
					} else {
						engine = requireFromString(exported.engine, `${module_path}/node_modules`)
					}
					module_config.exports[export_name].engine = engine
				}
				if (typeof exported.helper === 'string') {
					export_path = path.normalize(`${module_path}/.autocode/helper/${exported.helper}`)
					if (fs.existsSync(export_path)) {
						helper = require(export_path)
					} else {
						helper = requireFromString(exported.helper, `${module_path}/node_modules`)
					}
					module_config.exports[export_name].helper = helper
				}
				if (typeof exported.processor === 'string') {
					export_path = path.normalize(`${module_path}/.autocode/processor/${exported.processor}`)
					if (fs.existsSync(export_path)) {
						processor = require(export_path)
					} else {
						processor = requireFromString(exported.processor, `${module_path}/node_modules`)
					}
					module_config.exports[export_name].processor = processor
				}
				if (typeof exported.schema === 'string') {
					if (exported.schema.match(/^https?:/)) {
						schema = request('get', exported.schema, {
							allowRedirectHeaders: ['User-Agent']
						})
						console.log(schema)
						schema = yaml.safeLoad(schema.body.toString())
					} else {
						export_path = path.normalize(`${module_path}/.autocode/schema/${exported.schema}`)
						if (fs.existsSync(export_path)) {
							schema = yaml.safeLoad(fs.readFileSync(export_path))
						} else if (module_config.exports[exported.schema]) {
							schema = module_config.exports[exported.schema].schema
						} else {
							schema = exported.schema
						}
					}
					module_config.exports[export_name].schema = schema
				}
				if (exported.spec instanceof Array) {
					spec = {}
					ref = exported.spec
					for (k = 0, len1 = ref.length; k < len1; k++) {
						exported_spec = ref[k]
						export_path = `${module_path}/.autocode/spec/${exported_spec}`
						if (fs.existsSync(export_path)) {
							exported_spec = yaml.safeLoad(fs.readFileSync(export_path))
						} else {
							exported_spec = exported_spec
						}
						spec = extend(true, true, spec, exported_spec)
					}
					module_config.exports[export_name].spec = spec
				} else if (typeof exported.spec === 'string' && exported.spec.match(/\./)) {
					if (exported.spec.match(/^https?:\/\//)) {
						spec = request('get', exported.spec, {
							allowRedirectHeaders: ['User-Agent']
						})
						module_config.exports[export_name].spec = yaml.safeLoad(spec.body)
					} else {
						export_path = `${module_path}/.autocode/spec/${exported.spec}`
						if (fs.existsSync(export_path)) {
							spec = yaml.safeLoad(fs.readFileSync(export_path))
						} else {
							spec = exported.spec
						}
						module_config.exports[export_name].spec = spec
					}
				}
				if (typeof exported.template === 'string') {
					export_path = path.normalize(`${module_path}/.autocode/template/${exported.template}`)
					if (fs.existsSync(export_path)) {
						template = fs.readFileSync(export_path, 'utf8')
					} else {
						template = exported.template
					}
					module_config.exports[export_name].template = template
				}
				if (typeof exported.transformer === 'string') {
					export_path = path.normalize(`${module_path}/.autocode/trans/${exported.transformer}`)
					if (fs.existsSync(export_path)) {
						transformer = require(export_path)
					} else {
						transformer = requireFromString(exported.transformer, `${module_path}/node_modules`)
					}
					module_config.exports[export_name].transformer = transformer
				}
			}
		}
		loadedModules[module_name][module_version] = module_config
		if (module_config.imports) {
			loadModules(module_config.imports, module_config.host)
		} else if (module_config.modules) {
			loadModules(module_config.modules, module_config.host)
		}
	}
	return loadedModules = sortObject(loadedModules)
}

processModules = () => {
	let export_name, exported, helper, helper_name, helpers, loaded_module, model_ver, module_name, module_versions, results, submodule_alias, submodule_export, submodule_export_name, submodule_exports, submodule_name, submodule_version, submodule_version_query, submodule_versions, submodule_versions_path, submodules, test, test2, version_name
	results = []
	for (module_name in loadedModules) {
		module_versions = loadedModules[module_name]
		results.push(((() => {
			let j, len, results1
			results1 = []
			for (version_name in module_versions) {
				loaded_module = module_versions[version_name]
				submodules = {}
				if (loaded_module.imports) {
					loaded_module.modules = loaded_module.imports
				}
				loaded_module.imports = {}
				for (submodule_name in loaded_module.modules) {
					submodule_alias = submodule_name.substr(submodule_name.lastIndexOf('/') + 1)
					submodule_version_query = loaded_module.modules[submodule_name]
					if (submodule_version_query === 'latest') {
						submodule_version = 'latest'
					} else {
						submodule_version = null
						if (submodule_version_query.match(/^(\.|\/)/)) {
							submodule_versions_path = path.normalize(submodule_version_query)
							if (fs.existsSync(submodule_versions_path)) {
								submodule_version = submodule_version_query
							}
						} else {
							submodule_versions_path = path.normalize(`${userHome}/.autocode/module/${loaded_module.host}/${submodule_name}`)
							if (fs.existsSync(submodule_versions_path)) {
								submodule_versions = fs.readdirSync(submodule_versions_path)
								for (j = 0, len = submodule_versions.length; j < len; j++) {
									model_ver = submodule_versions[j]
									model_ver = semver.clean(model_ver)
									if (model_ver && semver.satisfies(model_ver, submodule_version_query) && (!submodule_version || semver.gt(model_ver, submodule_version))) {
										submodule_version = model_ver
									}
								}
							}
						}
					}
					if (!submodule_version) {
						throw new Error(`No matches for submodule (${submodule_name}) with version (${submodule_version_query}). Try: autocode update`)
					}
					submodule_exports = loadedModules[submodule_name][submodule_version].exports
					for (submodule_export_name in submodule_exports) {
						submodule_export = submodule_exports[submodule_export_name]
						loaded_module.imports[`${submodule_alias}.${submodule_export_name}`] = `${submodule_name}.${submodule_export_name}`
					}
					submodules[submodule_name] = submodule_version
				}
				results1.push(((() => {
					let results2
					results2 = []
					for (export_name in loaded_module.exports) {
						exported = loaded_module.exports[export_name]
						if (exported.copy && typeof exported.copy.engine === 'string') {
							test = loaded_module.imports[exported.copy.engine].split('.')
							test2 = test.pop()
							test = test.join('.')
							loadedModules[module_name][version_name].exports[export_name].copy.engine = loadedModules[test][submodules[test]].exports[test2].engine
						}
						if (exported.copy && exported.copy.dest && exported.copy.dest.engine && typeof exported.copy.dest.engine === 'string') {
							test = loaded_module.imports[exported.copy.dest.engine].split('.')
							test2 = test.pop()
							test = test.join('.')
							loadedModules[module_name][version_name].exports[export_name].copy.dest.engine = loadedModules[test][submodules[test]].exports[test2].engine
						}
						if (typeof exported.engine === 'string' && loaded_module.imports[exported.engine]) {
							test = loaded_module.imports[exported.engine].split('.')
							test2 = test.pop()
							test = test.join('.')
							loadedModules[module_name][version_name].exports[export_name].engine = loadedModules[test][submodules[test]].exports[test2].engine
						}
						if (exported.filename && typeof exported.filename.engine === 'string') {
							if (!loaded_module.imports[exported.filename.engine]) {
								throw new Error(`Import does not exist for alias (${exported.filename.engine})`)
							}
							test = loaded_module.imports[exported.filename.engine].split('.')
							test2 = test.pop()
							test = test.join('.')
							loadedModules[module_name][version_name].exports[export_name].filename.engine = loadedModules[test][submodules[test]].exports[test2].engine
						}
						if (typeof exported.helper === 'object') {
							helpers = []
							for (helper_name in exported.helper) {
								helper = exported.helper[helper_name]
								if (!loaded_module.imports[helper] && !loaded_module.exports[helper]) {
									throw new Error(`Import does not exist for alias (${helper})`)
								}
								if (loaded_module.exports[helper]) {
									helpers.push({
										callback: loaded_module.exports[helper].helper,
										name: helper_name
									})
								} else {
									test = loaded_module.imports[helper].split('.')
									test2 = test.pop()
									test = test.join('.')
									helpers.push({
										callback: loadedModules[test][submodules[test]].exports[test2].helper,
										name: helper_name
									})
								}
							}
							loadedModules[module_name][version_name].exports[export_name].helper = helpers
						} else if (typeof exported.helper === 'string' && loaded_module.imports[exported.helper]) {
							test = loaded_module.imports[exported.helper].split('.')
							test2 = test.pop()
							test = test.join('.')
							if (!loadedModules[test][submodules[test]].exports[test2]) {
								throw new Error(`Import (${test2}) does not exist for module (${test})`)
							}
							loadedModules[module_name][version_name].exports[export_name].helper = [
								{
									callback: loadedModules[test][submodules[test]].exports[test2].helper,
									name: loadedModules[test][submodules[test]].exports[test2].name
								}
							]
						}
						if (typeof exported.schema === 'string' && loaded_module.imports[exported.schema]) {
							test = loaded_module.imports[exported.schema].split('.')
							test2 = test.pop()
							test = test.join('.')
							loadedModules[module_name][version_name].exports[export_name].schema = loadedModules[test][submodules[test]].exports[test2].schema
						}
						if (typeof exported.transformer === 'string' && loaded_module.imports[exported.transformer]) {
							test = loaded_module.imports[exported.transformer].split('.')
							test2 = test.pop()
							test = test.join('.')
							results2.push(loadedModules[module_name][version_name].exports[export_name].transformer = loadedModules[test][submodules[test]].exports[test2].transformer)
						} else {
							results2.push(void 0)
						}
					}
					return results2
				}))())
			}
			return results1
		}))())
	}
	return results
}

loadOutputs = (outputs, imports, config) => {
	let cache, cache_checksum, cache_filename, code_dir, code_file, code_files, content, content_checksum, content_spec, copy_dest, copy_dir, copy_filename, copy_src, engine, file, file_checksum, file_last_path, file_name, filename, filename_checksum, filename_options, files, gen_name, gen_prefix, gen_schema, gen_suffix, generator, generator_filename, generator_processor, helpers, i, injectors, iterator, j, k, l, len, len1, len2, len3, n, name, output, output_i, output_path, output_processor, output_spec, ref, ref1, ref2, results, schema_name, schema_prefix, schema_suffix, spec, spec_filename, template, transformer, validate
	if (!imports) {
		throw new Error('No imports available for output')
	}
	if (!(outputs instanceof Array)) {
		outputs = sortObject(outputs)
	}
	results = []
	for (output_i in outputs) {
		output = outputs[output_i]
		if (!(outputs instanceof Array)) {
			if (output.filename === true) {
				delete output.filename
			} else if (output.filename && output.filename.engine && imports[output.filename.engine]) {
				output.filename = {
					engine: imports[output.filename.engine],
					value: output_i
				}
			} else if (!output.filename) {
				output.filename = output_i
			}
		}
		if (output.generator && !imports[output.generator]) {
			throw new Error(`Generator (${output.generator}) does not exist for output in config (${config.name})`)
		}
		generator = imports[output.generator] || {}
		output_processor = output.processor
		generator_processor = generator.processor
		output_processor = loadProcessor(output_processor, generator_processor, imports)
		spec = {}
		if (output.spec) {
			if (output.spec instanceof Array) {
				ref = output.spec
				for (j = 0, len = ref.length; j < len; j++) {
					output_spec = ref[j]
					if (typeof output_spec === 'string') {
						if (imports[output_spec]) {
							output_processor = loadProcessor(imports[output_spec].processor, null, imports)
							output_spec = imports[output_spec].spec
						} else if (output_spec.match(/^https?:\/\//)) {
							output_spec = request('get', output_spec, {
								allowRedirectHeaders: ['User-Agent']
							})
							output_spec = yaml.safeLoad(spec.body)
						} else {
							spec_filename = `${cwd}/.autocode/spec/${output_spec}`
							if (!fs.existsSync(spec_filename)) {
								throw new Error(`File (${spec_filename}) does not exist for spec in output for config (${config.id})`)
							}
							output_spec = yaml.safeLoad(fs.readFileSync(spec_filename, 'utf8'))
						}
					}
					output_spec = parse(output_spec, config, output_processor)
					spec = extend(true, true, spec, output_spec)
				}
			} else {
				if (typeof output.spec === 'object') {
					spec = output.spec
				} else if (typeof output.spec === 'string') {
					if (imports[output.spec]) {
						output_processor = loadProcessor(imports[output.spec].processor, null, imports)
						spec = imports[output.spec].spec
					} else if (output.spec.match(/^https?:\/\//)) {
						spec = request('get', output.spec, {
							allowRedirectHeaders: ['User-Agent']
						})
						spec = yaml.safeLoad(spec.body)
					} else {
						spec_filename = `${cwd}/.autocode/spec/${output.spec}`
						if (!fs.existsSync(spec_filename)) {
							throw new Error(`File (${spec_filename}) does not exist for spec in output for config (${config.id})`)
						}
						spec = yaml.safeLoad(fs.readFileSync(spec_filename, 'utf8'))
					}
				}
				spec = parse(spec, config, output_processor)
			}
		}
		if (generator.schema) {
			gen_schema = generator.schema
			if (typeof gen_schema === 'string') {
				gen_name = output.generator.split('.')
				if (!gen_name.length) {
					throw new Error(`Invalid generator name: ${gen_name}`)
				}
				if (gen_name.length > 1) {
					gen_prefix = gen_name[0]
					gen_suffix = gen_name[1]
					if (!imports[`${gen_prefix}.${gen_suffix}`] || !imports[`${gen_prefix}.${gen_suffix}`].schema) {
						throw new Error(`Schema does not exist for: ${gen_prefix}.${gen_suffix}`)
					}
					gen_schema = imports[`${gen_prefix}.${gen_suffix}`].schema
				} else {
					gen_name = gen_name[0]
					if (!imports[`${gen_name}`] || !imports[`${gen_name}`].schema) {
						throw new Error(`Schema does not exist for: ${gen_name}`)
					}
					gen_schema = imports[`${gen_name}`].schema
					if (typeof gen_schema === 'string') {
						schema_name = gen_schema.split('.')
						if (!schema_name.length) {
							throw new Error(`Invalid schema: ${schema_name}`)
						}
						if (schema_name.length > 1) {
							schema_prefix = schema_name[0]
							schema_suffix = schema_name[1]
							if (!imports[`${schema_prefix}.${schema_suffix}`] || !imports[`${schema_prefix}.${schema_suffix}`].schema) {
								throw new Error(`Schema does not exist for: ${schema_prefix}.${schema_suffix}`)
							}
							gen_schema = imports[`${schema_prefix}.${schema_suffix}`].schema
						} else {
							schema_name = schema_name[0]
							if (!imports[`${schema_name}`] || !imports[`${schema_name}`].schema) {
								throw new Error(`Schema does not exist: ${schema_name}`)
							}
							gen_schema = imports[`${schema_name}`].schema
						}
					}
				}
			}
			gen_schema = loadSchemaRefs(gen_schema)
			validate = skeemas.validate(spec, gen_schema)
			if (!validate.valid) {
				console.log(validate.errors)
				console.log("ERROR: Specification failed validation.")
				ref1 = validate.errors
				for (k = 0, len1 = ref1.length; k < len1; k++) {
					error3 = ref1[k]
					console.log(`- ${error3.message} for specification (${error3.context.substr(2)}) in generator (${output.generator})`)
				}
				throw new Error("ERROR: Invalid specification.")
			}
		}
		engine = output.engine || generator.engine
		if (typeof engine === 'string') {
			if (!imports[engine] || !imports[engine].engine) {
				throw new Error(`Engine was not imported (${engine}) at path ${config.path}`)
			}
			engine = imports[engine].engine
		}
		helpers = generator.helper ? generator.helper : null
		injectors = output.injector ? output.injector : null
		if (generator.copy) {
			if (typeof generator.copy === 'object') {
				if (!generator.copy.src) {
					throw new Error("Copy requires source")
				}
				copy_src = generator.copy.src
			} else if (typeof generator.copy === 'string') {
				copy_src = generator.copy
			} else {
				throw new Error("Invalid value for copy")
			}
			if (generator.copy.dest) {
				if (typeof generator.copy.dest === 'object') {
					if (!generator.copy.dest.engine) {
						throw new Error("Destination engine is required for copy")
					}
					if (!generator.copy.dest.value) {
						throw new Error("Destination value is required for copy")
					}
					copy_dest = generator.copy.dest.engine(spec, generator.copy.dest.value, helpers)
				} else if (typeof generator.copy.dest === 'string') {
					copy_dest = generator.copy.dest
				} else {
					throw new Error("Invalid Destination for copy")
				}
				if (copy_dest.substr(copy_dest.length - 1) !== '/') {
					copy_dest += '/'
				}
			} else {
				copy_dest = ''
			}
			copy_dir = `${generator.dir}/.autocode/${copy_src}`
			if (!fs.existsSync(copy_dir)) {
				throw new Error(`Directory (${copy_dir}) does not exist in copy`)
			}
			code_files = readdir(copy_dir, x => true)
			for (l = 0, len2 = code_files.length; l < len2; l++) {
				code_file = code_files[l]
				copy_filename = `${output.path}/${copy_dest}${code_file}`
				code_dir = copy_filename.substring(0, copy_filename.lastIndexOf('/') + 1)
				if (!fs.existsSync(code_dir)) {
					mkdirp.sync(code_dir)
				}
				fs.writeFileSync(`${cwd}/${copy_filename}`, fs.readFileSync(`${copy_dir}/${code_file}`))
				console.log((`Generated file: ${copy_filename}`).green)
			}
		}
		generator_filename = output.filename || generator.filename
		if (!generator_filename) {
			continue
		}
		iterator = output.iterator || generator.iterator
		if (iterator) {
			if (!spec[iterator]) {
				throw new Error(`Iterator (${iterator}) not found in spec for generator (${generator}) in config (${config.id})`)
			}
			files = []
			if (spec[iterator] instanceof Array) {
				ref2 = spec[iterator]
				for (n = 0, len3 = ref2.length; n < len3; n++) {
					file = ref2[n]
					files.push(file)
				}
			} else if (typeof spec[iterator] === 'object') {
				for (name in spec[iterator]) {
					files.push(name)
				}
			}
		} else {
			files = [generator_filename]
		}
		results.push(((() => {
			let results1
			results1 = []
			for (i in files) {
				file = files[i]
				if (file.name) {
					filename_options = {
						name: file.name
					}
					file = file.name
				} else {
					filename_options = []
					filename_options[0] = {}
					filename_options[0][file] = spec
					file_name = null
				}
				if (generator_filename.engine) {
					filename = generator_filename.engine(filename_options, generator_filename.value, helpers)
				} else {
					filename = generator_filename
				}
				if (output.path) {
					if (!fs.existsSync(output.path)) {
						mkdirp(output.path)
					}
					filename = `${output.path}/${filename}`
				}
				if (!spec) {
					throw new Error("Spec is required.")
				}
				if (output.template) {
					output_path = `${cwd}/.autocode/template/${output.template}`
					if (fs.existsSync(output_path)) {
						template = fs.readFileSync(output_path, 'utf8')
					} else {
						template = output.template
					}
				} else {
					template = generator.template
				}
				if (engine) {
					if (iterator) {
						content_spec = extend(true, true, {}, spec[iterator][i] || spec[iterator][file])
						if (content_spec) {
							content_spec = extend(true, true, content_spec, spec)
							content_spec.name = file
						}
						if (content_spec && content_spec[iterator] && content_spec[iterator][file] && content_spec[iterator][file]['$injector']) {
							template = inject(template, injectors, false)
							template = inject(template, content_spec[iterator][file]['$injector'], false)
							template = inject(template, null, true)
						} else {
							template = inject(template, injectors, true)
						}
						content = engine(content_spec, template, helpers, process.cwd())
					} else {
						if (template) {
							template = inject(template, injectors, true)
						}
						content = engine(spec, template, helpers, process.cwd())
					}
				} else if (template) {
					template = inject(template, injectors, true)
					content = template
				} else if (spec) {
					content = spec
				} else {
					content = ""
				}
				transformer = output.transformer || generator.transformer
				if (transformer) {
					if (typeof transformer === 'string') {
						if (!imports[transformer]) {
							throw new Error(`Transformer ${transformer} does not exist`)
						}
						transformer = imports[transformer].transformer
					}
					content = transformer(content)
				} else if (typeof content === 'object') {
					content = ""
				}
				cache_filename = `${cwd}/.autocode/cache.yml`
				if (fs.existsSync(cache_filename)) {
					cache = yaml.safeLoad(fs.readFileSync(cache_filename, 'utf8'))
					if (!cache.checksum) {
						cache.checksum = {}
					}
				} else {
					cache = {
						checksum: {}
					}
				}
				filename_checksum = crypto.createHash('md5').update(filename, 'utf8').digest('hex')
				if (cache.checksum[filename_checksum]) {
					if (!fs.existsSync(filename)) {
						if (force !== true) {
							throw new Error((`ERROR: File (${filename}) has been manually deleted outside of Autocode. Use -f to force code generation and overwrite this deletion.`).red.bold)
						}
					} else {
						cache_checksum = cache.checksum[filename_checksum]
						file_checksum = crypto.createHash('md5').update(fs.readFileSync(filename, 'utf8'), 'utf8').digest('hex')
						if (cache_checksum !== file_checksum && force !== true) {
							throw new Error((`ERROR: File (${filename}) has been manually changed outside of Autocode. Use -f to force code generation and overwrite these changes.`).red.bold)
						}
					}
				}
				content_checksum = crypto.createHash('md5').update(content, 'utf8').digest('hex')
				cache.checksum[filename_checksum] = content_checksum
				if (!fs.existsSync(`${cwd}/.autocode`)) {
					mkdirp.sync(`${cwd}/.autocode`)
				}
				fs.writeFileSync(`${cwd}/.autocode/cache.yml`, yaml.safeDump(cache))
				file_last_path = filename.lastIndexOf('/')
				if (file_last_path !== -1) {
					mkdirp.sync(filename.substr(0, file_last_path))
				}
				fs.writeFileSync(`${cwd}/${filename}`, content)
				results1.push(console.log(`- ${filename}`))
			}
			return results1
		}))())
	}
	return results
}

loadProcessor = (output_processor, generator_processor, imports) => {
	let j, len, processor, processors
	if (generator_processor) {
		if (typeof output_processor === 'string') {
			output_processor = [output_processor]
		}
		if (typeof generator_processor === 'string') {
			generator_processor = [generator_processor]
		}
		if (output_processor && generator_processor) {
			output_processor = extend(true, true, output_processor, generator_processor)
		} else {
			output_processor = generator_processor
		}
	}
	if (output_processor instanceof Array) {
		processors = []
		for (j = 0, len = output_processor.length; j < len; j++) {
			processor = output_processor[j]
			if (!imports[processor]) {
				throw new Error(`Import does not exist for alias (${processor})`)
			}
			processors.push({
				alias: processor,
				callback: imports[processor].processor
			})
		}
		output_processor = processors
	} else if (typeof output_processor === 'string') {
		if (!imports[output_processor]) {
			throw new Error(`Import does not exist for alias (${output_processor})`)
		}
		output_processor = [
			{
				alias: output_processor,
				callback: imports[output_processor].processor
			}
		]
	}
	return output_processor
}

loadSchemaRefs = schema => {
	let property_name, resp, schema_path
	if (schema['$ref'] && !!schema['$ref'].match(/^http:\/\//)) {
		schema_path = path.join(userHome, '.autocode/schema/', `${schema['$ref'].replace(/(^http:\/\/|#)/g, '')}.json`)
		if (!fs.existsSync(schema_path)) {
			console.log(`Loading schema for ref: ${schema['$ref']}`)
			resp = request('get', schema['$ref'], {
				allowRedirectHeaders: ['User-Agent']
			})
			if (!fs.existsSync(path.dirname(schema_path))) {
				mkdirp.sync(path.dirname(schema_path))
			}
			fs.writeFileSync(schema_path, resp)
		}
		schema = yaml.safeLoad(fs.readFileSync(schema_path))
		return schema
	}
	if (schema.properties) {
		for (property_name in schema.properties) {
			if (schema.properties[property_name].properties) {
				schema.properties[property_name] = loadSchemaRefs(schema.properties[property_name])
			} else {
				schema.properties[property_name] = loadSchemaRefs(schema.properties[property_name])
			}
		}
	}
	if (schema.definitions) {
		for (property_name in schema.definitions) {
			if (schema.definitions[property_name].definitions) {
				schema.definitions[property_name] = loadSchemaRefs(schema.definitions[property_name])
			} else {
				schema.definitions[property_name] = loadSchemaRefs(schema.definitions[property_name])
			}
		}
	}
	return schema
}

generate = function(opts) {
	let config, export_name, exported, exports, j, len, model_ver, module_alias, module_name, module_version, module_version_query, module_versions, module_versions_path
	loadedModules = {}
	config = this.config
	cwd = this.path
	if (opts && opts.force) {
		force = true
	}
	if (config.imports) {
		config.modules = config.imports
		if (config.name) {
			config.modules[config.name] = cwd
		}
	}
	if (config.modules) {
		loadModules(config.modules, config.host)
		processModules()
	}
	for (module_name in config.modules) {
		module_alias = module_name.substr(module_name.lastIndexOf('/') + 1)
		module_version_query = config.modules[module_name]
		if (module_version_query === 'latest') {
			module_version = 'latest'
		} else {
			module_version = null
			if (module_version_query.match(/^(\.|\/)/)) {
				module_versions_path = path.normalize(module_version_query)
				if (!fs.existsSync(module_versions_path)) {
					throw new Error(`Module (${module_name}) not found at local path (${module_version_query}).`)
				} else {
					module_version = module_version_query
				}
			} else {
				module_versions_path = path.normalize(`${userHome}/.autocode/module/${config.host}/${module_name}`)
				if (fs.existsSync(module_versions_path)) {
					module_versions = fs.readdirSync(module_versions_path)
					for (j = 0, len = module_versions.length; j < len; j++) {
						model_ver = module_versions[j]
						model_ver = semver.clean(model_ver)
						if (model_ver && semver.satisfies(model_ver, config.modules[module_name]) && (!module_version || semver.gt(model_ver, module_version))) {
							module_version = model_ver
						}
					}
				}
			}
		}
		if (!module_version) {
			throw new Error(`No matches for Module (${module_name}) with version (${module_version_query}). Try: autocode update`)
		}
		exports = loadedModules[module_name][module_version].exports
		for (export_name in exports) {
			exported = exports[export_name]
			if (module_alias === config.name) {
				imports[`${export_name}`] = exported
			}
			imports[`${module_alias}.${export_name}`] = exported
		}
	}
	if (config.outputs) {
		console.log("Generating outputs...".bold)
		loadOutputs(config.outputs, imports, config)
	}
	({
		imports
	})
	return this
}

inject = (template, injectors, remove_injector) => {
	if (remove_injector == null) {
		remove_injector = true
	}
	return template.replace(/([	|\t]+)?>>>[a-z_]*<<<\n?/ig, injector => {
		let inj, inject_final, injected, injector_tabs, j, len, ref
		injector_tabs = injector.match(/^[\s]+>/g)
		if (injector_tabs) {
			injector_tabs = injector_tabs[0].substr(0, injector_tabs[0].length - 1)
		} else {
			injector_tabs = ''
		}
		injector = injector.replace(/[\s]+/g, '')
		injector = injector.substr(3, injector.length - 6)
		if (injectors && injectors[injector]) {
			if (injectors[injector] instanceof Array) {
				injected = injectors[injector].join("\n")
			} else if ((injectors[injector].substr(0, 1) === '/' || injectors[injector].substr(0, 2) === './') && fs.existsSync(`${cwd}/.autocode/${injectors[injector]}`)) {
				injected = fs.readFileSync(`${cwd}/.autocode/${injectors[injector]}`, 'utf8')
			} else {
				injected = injectors[injector]
			}
			if (remove_injector === true) {
				inject_final = ''
			} else {
				inject_final = `${injector_tabs}>>>${injector}<<<\n`
			}
			ref = injected.split("\n")
			for (j = 0, len = ref.length; j < len; j++) {
				inj = ref[j]
				inject_final += `${injector_tabs}${inj}\n`
			}
			return inject_final += ""
		} else if (remove_injector === true) {
			return ''
		} else {
			return `${injector_tabs}>>>${injector}<<<\n`
		}
	})
}

parse = (spec, config, processors) => {
	let i, j, k, l, len, len1, len2, len3, n, proc, processor, ref, ref1, s
	if (spec['$processor']) {
		if (typeof spec['$processor'] === 'string') {
			spec['$processor'] = [spec['$processor']]
		}
		ref = spec['$processor']
		for (j = 0, len = ref.length; j < len; j++) {
			proc = ref[j]
			for (k = 0, len1 = processors.length; k < len1; k++) {
				processor = processors[k]
				if (processor.alias === proc) {
					spec['$value'] = processor.callback(spec['$value'])
				}
			}
		}
		return spec['$value']
	} else if (typeof spec['$value'] === 'string' && imports[spec['$value']] && imports[spec['$value']].spec) {
		if (spec['$key']) {
			return imports[spec['$value']].spec[spec['$key']]
		} else {
			return imports[spec['$value']].spec
		}
	}
	for (i in spec) {
		s = spec[i]
		if (s === void 0) {
			continue
		}
		if (typeof s === 'object' && !s['$processor']) {
			spec[i] = parse(spec[i], config, processors)
		} else if (typeof s === 'string' && s.substr(0, 1) === '$' && config[s.substr(1)]) {
			spec[i] = config[s.substr(1)]
		}
		if (spec[i]['$processor']) {
			if (typeof spec[i]['$processor'] === 'string') {
				spec[i]['$processor'] = [spec[i]['$processor']]
			}
			ref1 = spec[i]['$processor']
			for (l = 0, len2 = ref1.length; l < len2; l++) {
				proc = ref1[l]
				if (processors) {
					for (n = 0, len3 = processors.length; n < len3; n++) {
						processor = processors[n]
						if (processor.alias === proc) {
							if (typeof spec[i]['$value'] === 'string') {
								if (imports[spec[i]['$value']]) {
									spec[i]['$value'] = imports[spec[i]['$value']].spec
								} else if (spec[i]['$value'].match(/^https?:\/\//)) {
									spec[i]['$value'] = request('get', spec[i]['$value'], {
										allowRedirectHeaders: ['User-Agent']
									})
									spec[i]['$value'] = yaml.safeLoad(spec[i]['$value'].body)
								}
							}
							spec[i]['$value'] = processor.callback(spec[i]['$value'])
						}
					}
				}
			}
			spec[i] = spec[i]['$value']
		}
	}
	return spec
}

sortObject = object => Object.keys(object).sort().reduce(((result, key) => {
	result[key] = object[key]
	return result
}), {})

export default generate
