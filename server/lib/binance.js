const _ = require('lodash');
const request = require('request');
const CryptoJS = require('crypto-js');
const WebSocket = require('ws');

const baseUri = 'https://api.binance.com/';
const recvWindow = 30000;

const ticker = {};
let tickerStream;
const tickerStreamSubscriptions = [];
const userData = {};

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
		
		data.forEach(symbolData => {
			ticker[symbolData.s] = {
				price: (+symbolData.c),
				change: (+symbolData.P)
			}
		});
		
		while (tickerStreamSubscriptions.length) {
			tickerStreamSubscriptions.pop()(ticker);
		}
	});
};

const subscribeToTickerStream = callback => {
	tickerStreamSubscriptions.push(callback);
};

const getTicker = () => new Promise((resolve, reject) => {
	const ws = tickerStream;
	
	if (!ws || ws.readyState === ws.CLOSED) {
		subscribeToTickerStream(resolve);
		connectTickerStream();
		return;
	}
	
	resolve(ticker);
});

const signRequest = (qs, secretKey) => {
	const timestamp = Date.now();
	qs = _.assign(qs, {recvWindow, timestamp});
	const queryString = _.map(qs, (value, key) => `${key}=${value}`).join('&');
	qs.signature = CryptoJS.HmacSHA256(queryString, secretKey).toString(CryptoJS.enc.Hex);
	return qs;
};

const apiRequest = (endpoint, {qs = {}, signed = false, method = 'GET', apiKey, secretKey}) => new Promise((resolve, reject) => {
	const uri = `${baseUri}${endpoint}`;
	const headers = {
		'X-MBX-APIKEY': apiKey
	};
	
	if (signed) {
		qs = signRequest(qs, secretKey);
	}
	
	console.log('request', uri);
	request({uri, qs, headers, method}, (error, response, body) => {
		if (error) {
			console.error(error);
			return reject(error);
		}
		
		console.log('response', uri, qs, body);
		
		body = JSON.parse(body);
		
		if (body.code && body.msg) {
			console.error(apiKey, uri, body.code, body.msg);
			return reject(body.msg);
		}
		
		resolve(body);
	});
});

const connectUserDataStream = (apiKey) => {
	apiRequest('api/v1/userDataStream', {apiKey, method: 'POST'})
			.then(({ listenKey }) => {
				const stream = connectWS('wss://stream.binance.com:9443/ws/' + listenKey);
				
				userData[apiKey].stream = stream;
				
				stream.on('message', data => {
					console.log('receiving', 'wss://stream.binance.com:9443/ws/' + listenKey, data);
					
					data = JSON.parse(data);
					
					switch (data.e) {
						case 'outboundAccountInfo':
							_.each(data.B, balance => {
								userData[apiKey].balances[balance.a] = {
									free: +balance.f,
									locked: +balance.l
								};
							});
							break;
						case 'executionReport':
							const symbol = data.s;
							userData[apiKey].trades[symbol].push({
								orderId: data.i,
								price: data.L,
								qty: data.l,
								time: data.T,
								isBuyer: data.S === 'BUY'
							});
							break;
					}
					
				});
			});
};

const getUserData = ({apiKey, secretKey, symbols}) => {
	if (userData[apiKey]) {
		const ws = userData[apiKey].stream;
		
		if (!ws || ws.readyState === ws.CLOSED) {
			connectUserDataStream(apiKey);
		}
		
		return Promise.resolve(userData[apiKey]);
	}
	
	userData[apiKey] = {
		balances: {},
		trades: {}
	};
	
	connectUserDataStream(apiKey);
	
	return Promise.all([
		apiRequest('api/v3/account', {apiKey, secretKey, signed: true})
				.then(data => {
					data.balances.forEach(balance => {
						userData[apiKey].balances[balance.asset] = {
							free: +balance.free,
							locked: +balance.locked
						};
					});
				}),
		Promise.all(symbols.map(symbol => apiRequest('api/v3/myTrades', {apiKey, secretKey, qs: {symbol}, signed: true})
				.then(data => {
					userData[apiKey].trades[symbol] = data;
				})
				.catch(() => {})
		))
	])
			.then(() => {
				return userData[apiKey];
			})
};

module.exports = {
	getTicker,
	getUserData
};
