import _ from 'lodash'
import request from 'browser-request'

let running = false
let _data
const subscribers = {}
let timer

const getInterval = () => (+window.localStorage.getItem('updateInterval') || 5000)

const getHeaders = () => {
  return {
    Cookie: _.map({
      apiKey: window.localStorage.getItem('apiKey'),
      secretKey: window.localStorage.getItem('secretKey')
    }, (value, key) => [key, value].join('=')).join(';')
  }
}

const getQuery = () => ({
  d: window.localStorage.getItem('denominators') || '[]',
  c: window.localStorage.getItem('coins') || '[]',
  v: window.localStorage.getItem('conversions') || '[]'
})

const getData = () => new Promise((resolve, reject) => {
  request({
    uri: '/api/data',
    qs: getQuery(),
    headers: getHeaders()
  }, (error, response, body) => {
    if (error) return reject(error)
    if (typeof body === 'string') return reject(body)
    resolve(JSON.parse(body))
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
			.then(delayedUpdate)
			.catch(notify)
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
