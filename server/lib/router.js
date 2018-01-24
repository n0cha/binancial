const _ = require('lodash');
const CryptoJS = require('crypto-js');
const request = require('request');

const router = require('express').Router();
const binance = require('./binance.js')({_, CryptoJS, request});
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
		req.query = _.mapValues(req.query, value => Buffer.from(value, 'base64'));
	}
	_.assign(config, {
		coins: JSON.parse(req.query.c),
		denominators: JSON.parse(req.query.d),
		conversions: JSON.parse(req.query.v),
	});
	binance.getData(config)
			.then(data => {
				res.json(data);
				res.end();
			})
			.catch(err => {
				res.end(err.toString());
			})
});

module.exports = router;
