const _ = require('lodash');
const request = require('request');
const symbolMapping = {
	BQX: 'ETHOS'
};

module.exports = {
	mapSymbol: symbol => symbolMapping[symbol] || symbol,
	getTicker: ({currency}) => new Promise((resolve, reject) => {
		const qs = {limit: 0};
		if (currency) {
			_.assign(qs, {convert: currency});
		}
		request({uri: 'https://api.coinmarketcap.com/v1/ticker/', qs}, (error, response, body) => {
			if (error) {
				console.log(error);
				return reject(error);
			}
			resolve(JSON.parse(body));
		});
	})
};
