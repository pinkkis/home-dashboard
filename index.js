'use strict';

const mqtt = require('mqtt');
const express = require('express');
const bodyParser = require('body-parser');
const r = require('rethinkdb');

const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);

// store temps
let temperatures = {};

// mqtt client
const mqttBrokerUrl = process.env.MQTT_BROKER || 'mqtt://192.168.192.150';
const httpPort = process.env.HTTP_PORT || 3000;
const mqttClient = mqtt.connect(mqttBrokerUrl);

mqttClient.on('connect', function () {
	console.info('MQTT connected');
	mqttClient.subscribe(['home','temps','partyline']);
});

mqttClient.on('message', function (topic, message) {
	// message is Buffer
	console.log('MQTT message: ', topic, message.toString());

	let data = JSON.parse(message.toString());

	data.forEach( t => {
		if (!temperatures[t.id]) {
			temperatures[t.id] = t;
		} else {
			Object.assign(temperatures[t.id], t);
		}
	});

	let temps = Object.keys(temperatures).map(t => temperatures[t]);
	console.log('temps conversion\n', temps, temperatures);

	io.emit(topic, temps);
});

// express

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(express.static(__dirname + '/public'));

app.post('/rename/:id', (req, res) => {
	console.log(req.params.id, req.body.name);
	if (temperatures[req.params.id]) {
		temperatures[req.params.id].name = req.body.name;
	}

	res.status(200).end();
});

server.listen(httpPort, () => {
	console.log('Express listening on port:' + httpPort);
});

// socket io

io.on('connection', (socket) => {
	console.info('Socket.io client connected');

	socket.emit('init', Object.keys(temperatures).map(t => temperatures[t]));
});

// process and error handling