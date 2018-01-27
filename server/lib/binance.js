const _ = require('lodash');
const request = require('request');
const CryptoJS = require('crypto-js');

const recvWindow = 30000;

module.exports = ({apiKey, secretKey}) => {
	const signRequest = qs => {
		const timestamp = Date.now();
		qs = _.assign(qs, {recvWindow, timestamp});
		const queryString = _.map(qs, (value, key) => `${key}=${value}`).join('&');
		qs.signature = CryptoJS.HmacSHA256(queryString, secretKey).toString(CryptoJS.enc.Hex);
		return qs;
	};
	
	const apiRequest = (endpoint, qs = {}, signed = false) => new Promise((resolve, reject) => {
		const baseUri = 'https://api.binance.com/';
		const uri = `${baseUri}${endpoint}`;
		const headers = {
			'X-MBX-APIKEY': apiKey
		};
		
		if (signed) {
			qs = signRequest(qs);
		}
		
		request({uri, qs, headers}, (error, response, body) => {
			if (error) {
				console.log(error);
				return reject(error);
			}
			resolve(JSON.parse(body));
		});
	});
	
	return {
		getPrices: () => apiRequest('api/v1/ticker/allPrices'),
		getAccountData: () => apiRequest('api/v3/account', {}, true),
		getTrades: symbol => apiRequest('api/v3/myTrades', {symbol}, true)
	};
};
