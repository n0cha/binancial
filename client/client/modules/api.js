import _ from 'lodash'
import request from 'browser-request'

let running = false
let _data
const subscribers = {}
let timer

const getInterval = () => {
  return (+window.localStorage.getItem('updateInterval') || 5000)
}

const getQuery = () => ({
  d: window.localStorage.getItem('denominators'),
  c: window.localStorage.getItem('coins'),
  v: window.localStorage.getItem('conversions')
})

const getData = () => new Promise((resolve, reject) => {
  request({ uri: 'https://localhost:7777/data', qs: getQuery() }, (error, response, body) => {
    if (error) return reject(error)
    resolve(JSON.parse(body))
  })
})

const setData = data => _data = data

const notify = data => {
  _.each(subscribers, cb => cb(data))
}

const update = () => {
  timer = undefined
  if (!running) return
  getData()
			.then(setData)
			.then(notify)
			.then(delayedUpdate)
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
