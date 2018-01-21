const argv = require('minimist')(process.argv.slice(2));
const _ = require('lodash');
const CryptoJS = require('crypto-js');
const request = require('request');

const apiKey = '8shF97AOQnlkBXC3ZsNPhDbQTmRC4Qj9fBc4GvuH2VNqYBkWGdoTJfGskoxGl89N';
const secretKey = 'dcW9AIIXjR7ODYdMBVVOBSB5CLG1GoMUJIVhqNnCt71uom6WvDbS1IjR3ILbbejo';
const baseUri = 'https://api.binance.com/';
const headers = {
	'X-MBX-APIKEY': apiKey
};
const recvWindow = 5000;

const apiRequest = (endpoint, qs = {}, signed = false) => new Promise((resolve, reject) => {
	const uri = `${baseUri}${endpoint}`;
	if (signed) {
		const timestamp = (new Date()).getTime();
		qs = _.extend(qs, {recvWindow, timestamp});
		const queryString = _.map(qs, (value, key) => `${key}=${value}`).join('&');
		qs.signature = CryptoJS.HmacSHA256(queryString, secretKey).toString(CryptoJS.enc.Hex);
	}
	
	request({uri, qs, headers}, (error, response, body) => {
		if (error) {
			return reject(error);
		}
		
		resolve(JSON.parse(body));
	});
});

const symbol = argv._[0] || 'ETHBTC';

//apiRequest('v3/myTrades', {symbol}, true).then(data => {
//	let sum = 0;
//	let totalQty = 0;
//	_.each(data, trade => {
//		const qty = (+trade.qty);
//		const price = (+trade.price);
//		const total = qty * price;
//		if (trade.isBuyer) {
//			sum += total;
//			totalQty += qty;
//		} else {
//			sum -= total;
//			totalQty -= qty;
//		}
//	});
//	console.log(symbol, sum / totalQty);
//	process.exit();
//});

//apiRequest('v1/aggTrades', {symbol}).then(data => {
//	console.log(data);
//});

Promise.all([
	apiRequest('api/v3/myTrades', {symbol}, true),
	apiRequest('api/v1/ticker/allPrices', {}, false)
]).then(data => {
	const tradesData = data[0];
	let sum = 0;
	let totalQty = 0;
	_.each(tradesData, trade => {
		const qty = (+trade.qty);
		const price = (+trade.price);
		const total = qty * price;
		if (trade.isBuyer) {
			sum += total;
			totalQty += qty;
		} else {
			sum -= total;
			totalQty -= qty;
		}
	});
	const buyPrice = _.round(sum / totalQty, 8);
	
	const priceData = data[1];
	const currentPrice = _.find(priceData, {symbol}).price;
	
	console.log(symbol, buyPrice, currentPrice, _.round((currentPrice / buyPrice) * 100, 2) + '%');
});

//apiRequest('wapi/v3/depositHistory.html').then(data => console.log(data));
