const _ = require('lodash');
const argv = require('minimist')(process.argv.slice(2));
const CryptoJS = require('crypto-js');
const request = require('request');

const coins = argv._.length ? argv._ : ['BQX', 'XRP', 'ADA'];
const apiKey = '8shF97AOQnlkBXC3ZsNPhDbQTmRC4Qj9fBc4GvuH2VNqYBkWGdoTJfGskoxGl89N';
const secretKey = 'dcW9AIIXjR7ODYdMBVVOBSB5CLG1GoMUJIVhqNnCt71uom6WvDbS1IjR3ILbbejo';
const denominators = ['BTC', 'ETH'];
const conversions = {
	ETH: {
		BTC: {
			symbol: 'ETHBTC'
		}
	},
	BTC: {
		ETH: {
			symbol: 'ETHBTC',
			inverted: true
		}
	}
};

const lib = require('./lib/binance.js')({_, CryptoJS, request});

lib.getData({coins, apiKey, secretKey, denominators, conversions})
		.then(result => {
			const percent = value => {
				if (value < 1) {
					return `-${_.round((1 - value) * 100, 2)}%`;
				}
				return `+${_.round((value - 1) * 100, 2)}%`;
			};
			
			_.each(result.denominators, (qty, denom) => {
				console.log(denom, qty);
			});
			
			_.each(result.coins, (coinData, coin) => {
				console.log(coin, coinData.free, coinData.locked);
				_.each(coinData.symbols, (symbolData, symbol) => {
					if (!isNaN(symbolData.buyAvg)) {
						console.log(symbol, symbolData.buyAvg, symbolData.price, percent(symbolData.price / symbolData.buyAvg));
						_.each(symbolData.converted, (conversion, denominator) => {
							const convertedSymbolData = _.find(coinData.symbols, {denominator});
							console.log(symbol, '->', conversion.symbol, conversion.buyAvg, convertedSymbolData.price, percent(convertedSymbolData.price / conversion.buyAvg));
						});
					}
				});
			});
		})
		.catch(error => {
			console.error(error);
		});