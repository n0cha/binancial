const express = require('express');
const app = express();
const argv = require('minimist')(process.argv.slice(2));
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const noCache = require('nocache');
const cors = require('cors')
const https = require('https');
const fs = require('fs');

const port = argv.port || 7777;
const root = express.Router();

app.use(cookieParser());
app.use(bodyParser.json());
app.use(cors());
app.use(noCache());
app.use('/', root);

root.use('/', require('./lib/router.js'));

const options = {
	key: fs.readFileSync('ssl/privkey1.pem'),
	cert: fs.readFileSync('ssl/fullchain1.pem'),
	requestCert: false,
	rejectUnauthorized: false
};

https.createServer(options, app).listen(port);

console.log(`Server listening on https://localhost:${port}`);
