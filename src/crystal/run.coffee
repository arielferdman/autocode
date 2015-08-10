module.exports = (opts) ->
	crystal = this
	
	# load packages
	spawn = require 'cross-spawn'
	
	this.build opts
	
	if !this.project.scripts or !this.project.scripts.run
		return 'Nothing to run.'
	
	scripts = this.project.scripts
	
	i = 0
	runCmd = () ->
		if !scripts.run[i]
			return 'Done.'
		
		# get run cmd/arg
		run = scripts.run[i]
		run = [
			run.substr(0, run.indexOf(' ')),
			run.substr(run.indexOf(' ') + 1)
		]
		cmd = run[0]
		arg = run[1].split ' '
		
		# spawn process
		proc = spawn cmd, arg
		
		# handle process events
		proc.stdout.on 'data', (data) ->
			console.log data.toString()
		proc.on 'exit', (err) ->
			runCmd()
		proc.on 'error', (err) ->
			console.log('run error', err)
		
		runInterval = setInterval (->
			if crystal.stopped
				console.log 'Project was stopped.'
				crystal.stopped = false
				clearInterval runInterval
				proc.kill()
		), 1
		
		i++
	
	runCmd()
	
	return 'Running...'