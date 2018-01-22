const config = require('../server/lib/config.js');

const config = {
	coins: ['BQX', 'XRP', 'ADA'],
	apiKey: '8shF97AOQnlkBXC3ZsNPhDbQTmRC4Qj9fBc4GvuH2VNqYBkWGdoTJfGskoxGl89N',
	secretKey: 'dcW9AIIXjR7ODYdMBVVOBSB5CLG1GoMUJIVhqNnCt71uom6WvDbS1IjR3ILbbejo',
	denominators: ['BTC', 'ETH'],
	conversions: {
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
	}
};

console.log(api.getData(config));
