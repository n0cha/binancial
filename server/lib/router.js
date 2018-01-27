const _ = require('lodash');
const router = require('express').Router();
const binancial = require('./binancial.js');

const config = {};

router.use((req, res, next) => {
	config.apiKey = req.cookies.apiKey;
	config.secretKey = req.cookies.secretKey;
	if (!config.apiKey) {
		res.statusCode = 400;
		return res.end('Missing API key');
	}
	if (!config.secretKey) {
		res.statusCode = 400;
		return res.end('Missing secret key');
	}
	next();
});

router.get('/data', (req, res) => {
	if (req.query.e) {
		delete req.query.e;
		req.query = _.mapValues(req.query, value => Buffer.from(value, 'base64').toString());
	}
	
	_.assign(config, {
		coins: JSON.parse(req.query.c),
		markets: JSON.parse(req.query.d),
		conversions: JSON.parse(req.query.v),
		currency: req.query.r
	});
	
	binancial.getData(config)
			.then(data => {
				res.json(data);
				res.end();
			})
			.catch(err => {
				console.error(err);
				res.statusCode = 500;
				res.end('An error has occurred');
			})
});

module.exports = router;
