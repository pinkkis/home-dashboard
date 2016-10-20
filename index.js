'use strict';

const mqtt = require('mqtt');
const express = require('express');
const bodyParser = require('body-parser');
const r = require('rethinkdb');

const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);


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
	io.emit(topic, JSON.parse(message.toString()));
});

// express

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(express.static(__dirname + '/public'));

server.listen(httpPort, () => {
	console.log('Express listening on port:' + httpPort);
});



// socket io

io.on('connection', (socket) => {
	console.info('Socket.io client connected');

	socket.emit('news', { hello: 'world' });

	socket.on('my other event', (data) => {
		console.log(data);
	});
});

// process and error handling