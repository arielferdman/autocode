let fs, mkdirp, save, yaml;

fs = require('fs');

mkdirp = require('mkdirp');

yaml = require('js-yaml');

save = function(opts) {
	let config;
	if (opts == null) {
		opts = {};
	}
	if (!fs.existsSync(`${this.path}/.autocode`)) {
		mkdirp.sync(`${this.path}/.autocode`);
	}
	config = JSON.parse(JSON.stringify(opts.config || this.config));
	if (config.host === 'github.com') {
		delete config.host;
	}
	delete config.path;
	delete config.modules;
	config = yaml.safeDump(config);
	fs.writeFileSync(`${this.path}/.autocode/config.yml`, config);
	return this;
};

export default save;
