let prompt, request, signup;

prompt = require('prompt');

request = require('request');

signup = function() {
	let crystal;
	console.log("Ready to signup? Let's go!");
	crystal = this;
	prompt.message = '';
	prompt.delimiter = '';
	prompt.start();
	return prompt.get({
		properties: {
			email: {
				description: 'Enter your email',
				required: true,
				type: 'string'
			},
			username: {
				description: 'Enter your username',
				required: true,
				type: 'string'
			},
			password: {
				description: 'Enter your password',
				hidden: true,
				required: true,
				type: 'string'
			}
		}
	}, (err, result) => {
		if (!result) {
			throw new Error('Email/Username/Password are required.');
		}
		if (!result.email) {
			throw new Error('Email is required.');
		}
		if (!result.username) {
			throw new Error('Username is required.');
		}
		if (!result.password) {
			throw new Error('Password is required.');
		}
		crystal.cache('username', result.username);
		return request.post({
			formData: {
				email: result.email,
				username: result.username,
				password: result.password
			},
			url: crystal.url('api', 'users')
		}, (err, resp, body) => {
			if (!err && resp.statusCode === 200) {
				return console.log("Thanks for signing up!");
			} else if (body.match('duplicate')) {
				return console.log("Username already in use. Please try again!");
			} else {
				return console.log("Unable to signup.");
			}
		});
	});
};

export default signup;
