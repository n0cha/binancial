import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

const state = {
	marketData: {},
	connectionState: 200,
	notification: ''
}

const store = new Vuex.Store({
	state,

	getters: {
		connectionState: state => state.connectionState
	},

	mutations: {
		setConnectionState: (state, statusCode) => state.connectionState = statusCode
	},

	actions: {
	}
})

export default store
