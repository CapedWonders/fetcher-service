const db = require('../db/models/index.js');

const bodyParser = require('body-parser');
const express = require('express');
const app = express();
const { dailyFetch } = require('../helpers/events');

const wrap = fn => (...args) => fn(...args).catch(args[2]);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

//TODO cron job to fetch every 24 hours

//TODO cron job to check DB for newly relevant events

app.listen(3000, () => console.log('Listening on port 3000!'));
