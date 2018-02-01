const _ = require('lodash');
const request = require('request');
const CryptoJS = require('crypto-js');
const WebSocket = require('ws');

const recvWindow = 30000;

const prices = {};
let ws;
const subscriptions = [];

const connect = () => {
	ws = new WebSocket('wss://stream.binance.com:9443/ws/!ticker@arr');
	
	ws.on('message', data => {
		_.each(JSON.parse(data), symbolData => {
			prices[symbolData.s] = (+symbolData.c);
		});
		_.each(subscriptions, resolve => {
			resolve(prices);
		});
	});
	
	// ws.on('close', function close() {
	// 	_.defer(connect);
	// });
};

connect();

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
			if (endpoint === 'api/v3/account') {
				console.log(body);
			}
			resolve(JSON.parse(body));
		});
	});
	
	subscribe = resolve => {
		subscriptions.push(resolve);
	};
	
	const getPrices = () => new Promise((resolve, reject) => {
		if (ws.readyState === ws.CLOSED) {
			subscribe(resolve);
			connect();
			return;
		}
		
		resolve(prices);
	});
	
	return {
		getPrices: () => getPrices(),
		getAccountData: () => apiRequest('api/v3/account', {}, true),
		getTrades: symbol => apiRequest('api/v3/myTrades', {symbol}, true),
		getChange: symbol => apiRequest('api/v1/ticker/24hr', {symbol})
	};
};
