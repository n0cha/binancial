import _ from 'lodash'
import request from 'browser-request'

let running = false
let _data
const subscribers = {}
let timer

const btoa = str => Buffer.from(str).toString('base64')

const getInterval = () => (+window.localStorage.getItem('updateInterval') || 5000)

const getQuery = () => ({
	e: true,
	d: btoa(window.localStorage.getItem('denominators') || '[]'),
	c: btoa(window.localStorage.getItem('coins') || '[]'),
	v: btoa(window.localStorage.getItem('conversions') || '[]'),
	r: btoa(window.localStorage.getItem('currency') || 'USD')
})

const getData = () => new Promise((resolve, reject) => {
	request({
		uri: '/api/data',
		qs: getQuery()
	}, (error, response, body) => {
		if (response.status === 400) {
			stop()
			return reject(new Error('400'))
		}

		if (error || response.statusCode !== 200) {
			return reject(new Error('500'))
		}

		try {
			body = JSON.parse(body)
		} catch (error) {
			return reject(new Error('500'))
		}

		resolve(body)
	})
})

const setData = data => _data = data

const relayData = data => {
	_.each(subscribers, cb => cb(data))
}

const notify = msg => {
	_.each(subscribers, cb => cb(msg))
}

const update = () => {
	timer = undefined
	if (!running) return
	getData()
			.then(setData)
			.then(relayData)
			.catch(notify)
			.finally(delayedUpdate)
}

const delayedUpdate = () => {
	if (!running || timer) return
	timer = _.delay(update, getInterval())
}

const start = () => {
	if (running) return
	running = true
	update()
}

const stop = () => {
	running = false
}

export default {
	subscribe (id, cb) {
		subscribers[id] = cb
		start()
		if (_data) cb(_data)
	},
	unsubscribe (id) {
		delete subscribers[id]
		if (!_.size(subscribers)) stop()
	}
}
