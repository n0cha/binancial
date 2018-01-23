<template>
	<el-aside id="sidebar" width="260px" :class="{'open': active}">
		<el-menu router>
			<div class="logo-container">
				<img class="logo" src="../../../static/binance-logo.png"/>
			</div>
			<el-menu-item index="/">Dashboard</el-menu-item>
			<el-menu-item index="/config">Configuration</el-menu-item>
		</el-menu>
	</el-aside>
</template>

<script>
	export default {
		name: 'Sidebar',
		props: ['active']
	}
</script>

<style lang="scss">
	@import '~scss_vars';
	@import './style.scss';
</style>
