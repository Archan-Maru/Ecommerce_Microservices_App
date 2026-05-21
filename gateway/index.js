const express = require('express');
const cors = require('cors');
const proxy = require("express-http-proxy");


const app = express();
app.use(cors());
app.use(express.json());

const proxyWithBase = (basePath, target) =>
	proxy(target, {
		proxyReqPathResolver: (req) => req.url,
	});

app.use('/customer', proxyWithBase('/customer', 'http://localhost:8001'));
app.use('/shopping', proxyWithBase('/shopping', 'http://localhost:8003'));
app.use('/', proxy('http://localhost:8002'));


app.listen(8000, () => {
	console.log('Gateway is Listening to Port 8000')
})