<template>
	<div>
		<!--<el-table :data="coins" style="width: 100%">-->
			<!--<el-table-column prop="symbol" label="Symbol"></el-table-column>-->
		<!--</el-table>-->
		{{marketData}}
	</div>
</template>

<script>
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
			}
		},
		data() {
			return {
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
