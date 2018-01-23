<template>
	<div>
		<h4>Markets</h4>
		<el-table :data="marketAssets" style="width: 100%">
			<el-table-column prop="symbol" label="Symbol"></el-table-column>
			<el-table-column prop="qty" label="Owned"></el-table-column>
		</el-table>
		<h4>Assets</h4>
		<div id="assetList">
			<div v-for="coin in coinAssets">
				<el-row :gutter="20">
					<el-col :span="6"><div class="grid-content">{{coin.symbol}}</div></el-col>
					<el-col :span="6">{{coin.total}}</el-col>
					<el-col :span="6">{{coin.free}}</el-col>
					<el-col :span="6">{{coin.locked}}</el-col>
				</el-row>
				<el-row :gutter="20" v-for="pair in coin.pairs">
					<el-col :span="4">-></el-col>
					<el-col :span="5"><div class="grid-content">{{pair.symbol}}</div></el-col>
					<el-col :span="5"><div class="grid-content">{{pair.price}}</div></el-col>
					<el-col :span="5"><div class="grid-content">{{pair.buyAvg}}</div></el-col>
					<el-col :span="5"><div class="grid-content" :data-positive="pair.ratio >= 1 ? 'true' : 'false'">{{delta(pair.ratio)}}</div></el-col>
				</el-row>
			</div>
		</div>

		<!--<ul id="assetList">-->
			<!--<li v-for="coin in coinAssets">-->
				<!--<label>{{coin.symbol}}</label>-->
				<!--<span>{{coin.total}}</span>-->
				<!--<span>{{coin.free}}</span>-->
				<!--<span>{{coin.locked}}</span>-->
			<!--</li>-->
		<!--</ul>-->
		<!--<el-table :data="coinAssets" style="width: 100%" row-key="symbol" :expand-row-keys="expandedCoins">-->
			<!--<el-table-column type="expand">-->
				<!--<template slot-scope="coin">-->
					<!--<el-table :data="coin.symbols" style="width: 100%">-->
						<!--<el-table-column prop="symbol" label="Symbol"></el-table-column>-->
					<!--</el-table>-->
				<!--</template>-->
			<!--</el-table-column>-->
			<!--<el-table-column prop="symbol" label="Symbol"></el-table-column>-->
			<!--<el-table-column prop="total" label="Owned"></el-table-column>-->
			<!--<el-table-column prop="free" label="Free"></el-table-column>-->
			<!--<el-table-column prop="locked" label="Locked"></el-table-column>-->
		<!--</el-table>-->
		{{coinAssets}}
	</div>
</template>

<script>
	import _ from 'lodash'
	import api from '../../modules/api.js'
	
	export default {
		name: 'Dashboard',
		components: {},
		mounted: function () {
			api.subscribe('dashboard', this.update.bind(this))
		},
		methods: {
			update: function (data) {
				this.marketData = data;
			},
			delta: value => (value < 1) ? `-${_.round((1 - value) * 100, 2)}%` : `+${_.round((value - 1) * 100, 2)}%`
		},
		computed: {
			marketAssets: function () {
				return _.map(this.marketData.denominators, (qty, symbol) => ({symbol, qty}));
			},
			coinAssets: function () {
				return _.sortBy(_.map(this.marketData.coins, (data, symbol) => _.assign({symbol}, _.assign({pairs: _.sortBy(_.map(data.symbols, (symbolData, symbol) => _.assign({symbol, ratio: symbolData.price / symbolData.buyAvg}, symbolData)), 'symbol')}, data))), 'symbol');
			},
			allSymbols: function () {
				return _.map(this.coins, 'symbol');
			}
		},
		data() {
			return {
				expandedCoins: [],
				markets: ['BTC', 'ETH', 'BNB', 'USDT'],
				apiKey: this.$cookies.get('apiKey'),
				secretKey: this.$cookies.get('secretKey'),
				denominators: JSON.parse(localStorage.getItem('denominators') || '[]'),
				coins: JSON.parse(localStorage.getItem('coins') || '[]'),
				conversions: JSON.parse(localStorage.getItem('conversions') || '[]'),
				updateInterval: localStorage.getItem('updateInterval') || 5000,
				marketData: {}
			}
		}
	}
</script>

<style lang="scss">
	@import '~scss_vars';
	@import './style.scss';
</style>
