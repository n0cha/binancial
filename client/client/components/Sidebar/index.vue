<template>
	<el-aside width="300px" height="100%">
		<el-menu theme="dark" router>
			<div class="logo-container">
				<img class="logo" src="../../../static/binance-logo.png"/>
			</div>
			<el-menu-item index="/">Dashboard</el-menu-item>
			<el-menu-item index="/config">Config</el-menu-item>
<!--
			<el-submenu index="1">
				<template slot="title">
					Categories
				</template>
				<el-menu-item-group title="JS Posts">
					<el-menu-item index="/post/1">Post #1</el-menu-item>
					<el-menu-item index="/post/2">Post #2</el-menu-item>
				</el-menu-item-group>
				<el-menu-item-group title="Python Posts">
					<el-menu-item index="/post/3">Post #3</el-menu-item>
				</el-menu-item-group>
				<el-submenu index="1-4">
					<template slot="title">Archived Posts</template>
					<el-menu-item index="/post/4">Post #4</el-menu-item>
				</el-submenu>
			</el-submenu>
			<el-menu-item index="/about">About</el-menu-item>
-->
		</el-menu>
	</el-aside>
</template>

<script>
	export default {
		name: 'Sidebar',
		props: ['active'],
		computed() {
			active: () => {
				console.log(this)
				return this.active
			}
		}
	}
</script>

<style>
	.el-header {
		background-color: #B3C0D1;
		color: #333;
		line-height: 60px;
	}

	.el-aside {
		color: #333;
	}
	
/*
	// You can import all your SCSS variables using webpack alias
	@import '~scss_vars';
	@import './style.scss';
*/
</style>
