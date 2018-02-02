const _ = require('lodash');
const request = require('request');
const CryptoJS = require('crypto-js');
const WebSocket = require('ws');

const recvWindow = 30000;

const prices = {};
let tickerStream;
const assets = {};
const userDataStream = {};
const tickerStreamSubscriptions = [];

const connectWS = uri => {
	console.log('connecting', uri);
	
	const ws = new WebSocket(uri);
	
	ws.on('error', err => {
		console.error(err);
		ws.close();
	});
	
	return ws;
};

const connectTickerStream = () => {
	tickerStream = connectWS('wss://stream.binance.com:9443/ws/!ticker@arr');
	
	tickerStream.on('message', data => {
		console.log('receiving', 'wss://stream.binance.com:9443/ws/!ticker@arr', data);
		
		try {
			data = JSON.parse(data);
		} catch (err) {
			console.error(err);
			return;
		}
		
		_.each(data, symbolData => {
			prices[symbolData.s] = (+symbolData.c);
		});
		
		while (tickerStreamSubscriptions.length) {
			tickerStreamSubscriptions.pop()(prices);
		}
	});
};

const subscribeToTickerStream = callback => {
	tickerStreamSubscriptions.push(callback);
};

const getPrices = () => new Promise((resolve, reject) => {
	const ws = tickerStream;
	
	if (!ws || ws.readyState === ws.CLOSED) {
		subscribeToTickerStream(resolve);
		connectTickerStream();
		return;
	}
	
	resolve(prices);
});

module.exports = ({apiKey, secretKey}) => {
	const signRequest = qs => {
		const timestamp = Date.now();
		qs = _.assign(qs, {recvWindow, timestamp});
		const queryString = _.map(qs, (value, key) => `${key}=${value}`).join('&');
		qs.signature = CryptoJS.HmacSHA256(queryString, secretKey).toString(CryptoJS.enc.Hex);
		return qs;
	};
	
	const apiRequest = (endpoint, qs = {}, signed = false, method = 'GET') => new Promise((resolve, reject) => {
		const baseUri = 'https://api.binance.com/';
		const uri = `${baseUri}${endpoint}`;
		const headers = {
			'X-MBX-APIKEY': apiKey
		};
		
		if (signed) {
			qs = signRequest(qs);
		}
		
		console.log('request', uri);
		request({uri, qs, headers, method}, (error, response, body) => {
			if (error) {
				console.error(error);
				return reject(error);
			}
			
			console.log('response', uri, body);
			
			body = JSON.parse(body);
			
			if (body.code && body.msg) {
				console.error(apiKey, uri, body.code, body.msg);
				return reject(body.msg);
			}
			
			resolve(body);
		});
	});
	
	const connectUserDataStream = () => new Promise((resolve, reject) => {
		//console.log('requesting user data listenkey');
		apiRequest('/api/v1/userDataStream', {}, false, 'POST')
				.then(({ listenKey }) => {
					//console.log('opening user data stream');
					userDataStream[apiKey] = connectWS('wss://stream.binance.com:9443/ws/' + listenKey);
					
					userDataStream[apiKey].on('message', data => {
						//console.log('receiving user data');
						console.log('receiving', 'wss://stream.binance.com:9443/ws/' + listenKey, data);
						
						data = JSON.parse(data);
						
						if (data.e !== 'outboundAccountInfo') {
							return;
						}
						
						assets[apiKey] = assets[apiKey] || {};
						
						_.each(data.B, balance => {
							assets[apiKey][balance.a] = {
								free: +balance.f,
								locked: +balance.l
							};
						});
						
						resolve(assets[apiKey]);
					});
				});
	});
	
	const getAccountData = () => {
		const ws = userDataStream[apiKey];
		if (!ws || ws.readyState === ws.CLOSED) {
			connectUserDataStream();
		}
		
		if (assets[apiKey]) {
			return Promise.resolve(assets[apiKey]);
		}
		
		//console.log('requesting account data');
		return apiRequest('api/v3/account', {}, true)
				.then(data => {
					//console.log('processing account data');
					
					assets[apiKey] = assets[apiKey] || {};
					
					_.each(data.balances, balance => {
						assets[apiKey][balance.asset] = {
							free: +balance.free,
							locked: +balance.locked
						};
					});
					
					return assets[apiKey];
				});
	};
	
	return {
		getPrices,
		getAccountData,
		getTrades: symbol => apiRequest('api/v3/myTrades', {symbol}, true),
		getChange: symbol => apiRequest('api/v1/ticker/24hr', {symbol})
	};
};
