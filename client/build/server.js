'use strict'
// const fs = require('fs')
const path = require('path')
const express = require('express')
const webpack = require('webpack')
const webpackConfig = require('./webpack.dev')
const config = require('./config')
const LogPlugin = require('./log-plugin')
const https = require('https')
const fs = require('fs')
const proxy = require('http-proxy-middleware');

const app = express()

app.use('/api', proxy({
	target: 'http://localhost:7777',
	changeOrigin: true,
	secure: false,
	pathRewrite: {
		'^/api' : ''
	}
}));

const port = config.port
webpackConfig.entry.client = [
  `webpack-hot-middleware/client?reload=true`,
  webpackConfig.entry.client
]

webpackConfig.plugins.push(new LogPlugin(port))

let compiler

try {
  compiler = webpack(webpackConfig)
} catch (err) {
  console.log(err.message)
  process.exit(1)
}

const devMiddleWare = require('webpack-dev-middleware')(compiler, {
  publicPath: webpackConfig.output.publicPath,
  quiet: false,
  hot: true,
  inline: true,
  headers: {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': '*',
    'Access-Control-Allow-Headers': '*'
  }
})
app.use(devMiddleWare)
app.use(
  require('webpack-hot-middleware')(compiler, {
    log: () => {}
  })
)

const mfs = devMiddleWare.fileSystem
const file = path.join(webpackConfig.output.path, 'index.html')

devMiddleWare.waitUntilValid()

app.get('*', (req, res) => {
  devMiddleWare.waitUntilValid(() => {
    const html = mfs.readFileSync(file)
    res.end(html)
  })
})

// const options = {
// 	key: fs.readFileSync('../server/ssl/key.pem'),
// 	cert: fs.readFileSync('../server/ssl/cert.pem'),
// 	requestCert: false,
// 	rejectUnauthorized: false
// };
//
// https.createServer(options, app).listen(port)

app.listen(port);
