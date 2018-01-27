<template>
	<el-form ref="form" label-width="120px">
		<el-form-item label="">
			<div class="info"><p>
				The API key and Secret key are not stored on the server. They're stored locally in a secure cookie, but they do
				pass to the server with each request, protected by HTTPS encryption. Despite this, make sure the key pair you
				supply here is limited to read access.
			</p></div>
		</el-form-item>
		<el-form-item label="API key">
			<el-input v-model="apiKey"></el-input>
		</el-form-item>
		<el-form-item label="Secret key">
			<el-input v-model="secretKey"></el-input>
		</el-form-item>
		<el-form-item label="Currency">
			<el-select v-model="currency" placeholder="please select your zone">
				<el-option v-for="currency in currencies" :key="currency" :value="currency"></el-option>
			</el-select>
		</el-form-item>
		<el-form-item label="Markets">
			<el-checkbox-group v-model="denominators">
				<el-checkbox v-for="market in markets" :key="market" :label="market" border></el-checkbox>
			</el-checkbox-group>
		</el-form-item>
		<el-form-item label="Symbols">
			<el-table :data="symbols" style="width: 100%" :show-header="false">
				<el-table-column prop="symbol" label="Symbol"></el-table-column>
				<el-table-column>
					<template slot-scope="scope">
						<el-button size="mini" @click="deleteSymbol(scope.$index)">Delete</el-button>
					</template>
				</el-table-column>
			</el-table>
		</el-form-item>
		<el-form-item label="Add symbol">
			<el-input v-model="symbol" style="width:100px" @keyup.enter.native="addSymbol"></el-input>
			<el-button @click="addSymbol">Add</el-button>
		</el-form-item>
<!--
		<el-form-item label="Conversions">
			<el-table :data="conversions" style="width: 100%">
				<el-table-column prop="from" label="From"></el-table-column>
				<el-table-column prop="to" label="To"></el-table-column>
				<el-table-column>
					<template slot-scope="scope">
						<el-button size="mini" @click="deleteConversion(scope.$index)">Delete</el-button>
					</template>
				</el-table-column>
			</el-table>
		</el-form-item>
		<el-form-item label="Add conversion">
			<el-select v-model="conversion.from" placeholder="Symbol">
				<el-option v-for="market in markets" :key="market" :label="market" :value="market"></el-option>
			</el-select>
			<el-select v-model="conversion.to" placeholder="Symbol">
				<el-option v-for="market in markets" :key="market" :label="market" :value="market"></el-option>
			</el-select>
			<el-button @click="addConversion">Add</el-button>
		</el-form-item>
-->
		<el-form-item label="Update interval">
			<el-input-number v-model="updateInterval" :min="1000" :step="500"></el-input-number>
			ms
		</el-form-item>
	</el-form>
</template>

<script>
	import _ from 'lodash'
	import ElSelectDropdown from 'element-ui/packages/select/src/select-dropdown'
	
	export default {
		name: 'Configuration',
		components: {ElSelectDropdown},
		data() {
			return {
				markets: ['BTC', 'ETH', 'BNB', 'USDT'],
				apiKey: this.$cookies.get('apiKey'),
				secretKey: this.$cookies.get('secretKey'),
				denominators: JSON.parse(localStorage.getItem('denominators') || '[]'),
				coins: JSON.parse(localStorage.getItem('coins') || '[]'),
				conversions: JSON.parse(localStorage.getItem('conversions') || '[]'),
				updateInterval: localStorage.getItem('updateInterval') || 5000,
				symbol: '',
				conversion: {},
				currencies: ['USD', 'AUD', 'BRL', 'CAD', 'CHF', 'CLP', 'CNY', 'CZK', 'DKK', 'EUR', 'GBP', 'HKD', 'HUF', 'IDR', 'ILS', 'INR', 'JPY', 'KRW', 'MXN', 'MYR', 'NOK', 'NZD', 'PHP', 'PKR', 'PLN', 'RUB', 'SEK', 'SGD', 'THB', 'TRY', 'TWD', 'ZAR'],
				currency: localStorage.getItem('currency') || 'USD'
			}
		},
		computed: {
			symbols() {
				return _.map(this.coins, symbol => ({symbol}))
			}
		},
		watch: {
			apiKey: function (value) {
				this.$cookies.set('apiKey', value, null, null, null, process.env.NODE_ENV === 'production')
			},
			secretKey: function (value) {
				this.$cookies.set('secretKey', value, null, null, null, process.env.NODE_ENV === 'production')
			},
			denominators: value => localStorage.setItem('denominators', JSON.stringify(value)),
			coins: value => localStorage.setItem('coins', JSON.stringify(value)),
			conversions: value => localStorage.setItem('conversions', JSON.stringify(value)),
			updateInterval: value => localStorage.setItem('updateInterval', value),
			currency: value => localStorage.setItem('currency', value)
		},
		methods: {
			addSymbol() {
				this.coins.push(this.symbol.toUpperCase())
				this.symbol = ''
			},
			deleteSymbol(index) {
				this.coins.splice(index, 1)
			},
			addConversion() {
				this.conversions.push(_.mapValues(this.conversion, value => value.toUpperCase()))
				this.conversion = {}
			},
			deleteConversion(index) {
				this.conversions.splice(index, 1)
			}
		}
	}
</script>

<style>
	.info {
		background-color: #fdf6ec;
		padding: 8px 16px;
		border-radius: 4px;
		border-left: 5px solid #e6a23c;
		line-height: 1.8em;
	}
</style>
