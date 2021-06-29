const express = require('express');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const { request } = require('express');
const cors = require('cors');

const port = process.env.PORT || 8081;

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());
app.use(helmet());

const server = app.listen(port, '0.0.0.0', (err) => { //Start express server
    if (err) console.log(err);
    console.info("API server is running! Open http://localhost:%s/ in your browser.", port);
});

// API routes
require('./routes')(app, server);

module.exports = {app, server};