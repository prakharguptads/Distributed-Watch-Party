const express = require('express');
const app = express();
const server = require('http').createServer(app);
const ioUtils = require('./utils/io');
const Rooms = require('./utils/Rooms');
const bodyParser = require('body-parser');
const axios = require('axios');

// Middleware to parse JSON bodies
app.use(bodyParser.json());
const io = require('socket.io')(server, {
	path: '/socket',
	origins: ['http://localhost:3000'],
	serveClient: false,
});

const PORT = process.env.PORT || 3005;

app.get('/test', (req, res, next) => {
	res.send({ message: 'Hello World' });
});

app.post('/rooms1/:roomId', (req, res) => {
	console.log("received from server")
    const clientIp = req.ip;
    const clientPort = req.socket.remotePort;
    console.log("IP ",clientIp,clientPort)
    const roomId = req.params.roomId;
    const { name, userId } = req.body;
    Rooms.addUser(roomId, name, userId);
    const roomInfo = Rooms.rooms[roomId];
    if (roomInfo) {
        io.emit('updateUserList', Rooms.getUserList(roomId));
        res.json(roomInfo);
		console.log(roomInfo)
    } else {
        res.status(404).json({ error: 'Room not found' });
    }
});

app.post('/rooms1/:roomId/videoStateChange', (req, res) => {
	console.log("received from server video state change")
    const roomId = req.params.roomId;
    const { name, userId, data } = req.body;
    console.log('name, userid, data', name, userId, data);
    const users_address = ['http://localhost:3006'];
    for(var i=0; i<users_address.length; i++){
        const address = users_address[i];
        // address += /rooms1/${roomId}/setVideoState
        // try{
        //     console.log(name,userId);
        //     let a = ${address}/rooms2/${roomId}/setVideoState;
        //     console.log(a);
        //     axios.post(a, {
        //         name: name,
        //         userId: userId,
        //         data: data
        //     });

        // }
        // catch(error){
        //     console.log('failed to send set video state to all', error.message)
        // }
    }
});

app.post('/rooms2/setVideoState', (req, res) => {
	console.log("received from server set video state")
    // const roomId = req.params.roomId;
    const { roomId, name, userId, data} = req.body;
	console.log('roomId', roomId);
	console.log('name, userid, data', name, userId, data);

	// try{
	// 	io.emit('updateVideoState', {
	// 		type: data.type,
	// 		...data.payload,
	// 		user: {
	// 			name: user.name,
	// 			id: socket.id,
	// 		},
	// 	});
	// 	res.json(true);
	// }
	// catch(error){
	// 	console.log("unable to send data to front end", error.message);
	// 	res.status(404).json({error: 'unable to update front end'});
	// }
});

ioUtils.setupIO(io);

server.listen(PORT, () => console.log(`Server started on port: ${PORT}`));
