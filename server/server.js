const express = require('express');
const app = express();
const server = require('http').createServer(app);
const ioUtils = require('./utils/io');
const Rooms = require('./utils/Rooms');
const bodyParser = require('body-parser');
const axios = require('axios');
const {
	generateServerMessage,
	generateUserMessage,
} = require('./utils/message');
let clientIpList = [];
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

app.post('/rooms1/:roomId', async (req, res) => {
	console.log("received from server")
    let clientIp = "http://" + req.ip.split(':')[3];
    const clientPort = req.socket.remotePort;
    console.log("IP ",clientIp,clientPort)
    const roomId = req.params.roomId;
    let { name, userId, port } = req.body;
    clientIp = clientIp+":"+port
    clientIpList.push(clientIp);
    Rooms.addUser(roomId, name, userId);
    Rooms.addUserIp(roomId, userId, clientIp);
    const roomInfo = Rooms.rooms[roomId];
    
    if (roomInfo) {
        io.emit('updateUserList', Rooms.getUserList(roomId));
        res.json(roomInfo);
		console.log(roomInfo)
    } else {
        res.status(404).json({ error: 'Room not found' });
    }
    for(var i=0; i<clientIpList.length; i++){
        const address = clientIpList[i];
        // address += '/rooms1/${roomId}/setVideoState'
        try{
            console.log("yess ",name,userId);
            const a = `${address}/${roomId}/updateUserListOnJoin`;
            // const a = `${address}:3005/rooms2/setVideoState`;
            console.log(a);
            await axios.post(a, {
                roomInfo: roomInfo,
            });

        }
        catch(error){
            console.log('failed to send set video state to all', error.message)
        }
    }
});

app.post('/:roomId/updateUserListOnJoin', (req, res) => {
	console.log("received update userlist msg from host")
    const roomId = req.params.roomId;
    const {roomInfo} = req.body;
    console.log("Roo",roomInfo)
    Rooms.rooms[roomId] = roomInfo
    io.to(roomId).emit('updateUserList', Rooms.getUserList(roomId));
    // last_heartBeat[roomId] = Date.now()
    // res.send("HeartBeat received");
});

app.post('/rooms1/:roomId/videoStateChange', async (req, res) => {
	console.log("received from server video state change")
    const roomId = req.params.roomId;
    const { name, userId, data } = req.body;
    console.log('name, userid, data', name, userId, data);
    const clientIpList = ['http://localhost:3006','http://localhost:3005','http://localhost:3007'];
    for(var i=0; i<clientIpList.length; i++){
        const address = clientIpList[i];
        // address += '/rooms1/${roomId}/setVideoState'
        try{
            console.log("yess ",name,userId);
            const a = `${address}/rooms2/setVideoState`;
            // const a = `${address}:3005/rooms2/setVideoState`;
            console.log(a);
            await axios.post(a, {
                roomId: roomId,
                name: name,
                userId: userId,
                data: data
            });

        }
        catch(error){
            console.log('failed to send set video state to all', error.message)
        }
    }
});

app.post('/rooms2/setVideoState', (req, res) => {
	console.log("received from server set video state")
    // const roomId = req.params.roomId;
    const { roomId, name, userId, data} = req.body;
	console.log('roomId', roomId);
	console.log('name, userid, data', name, userId, data);

	try{
		io.emit('newMessage', generateServerMessage('updateVideoState', {
					type: data.type,
					...data.payload,
					user: {
						name: name,
						id: userId,
					},
				}));
		res.json(true);
	}
	catch(error){
		console.log("unable to send data to front end", error.message);
		res.status(404).json({error: 'unable to update front end'});
	}
});

let last_heartBeat = {}
app.post('/:roomId/heartbeat', (req, res) => {
	console.log("received heartbeat from host")
    // const clientIp = req.ip;
    // clientIpList.push(clientIp);
    // const clientPort = req.socket.remotePort;
    // console.log("IP ",clientIp,clientPort)
    const roomId = req.params.roomId;
    const {type } = req.body;
    last_heartBeat[roomId] = Date.now()
    res.send("HeartBeat received");
});

app.post('/:roomId/updateUserList', (req, res) => {
	console.log("received update userlist msg from host")
    // const clientIp = req.ip;
    // clientIpList.push(clientIp);
    // const clientPort = req.socket.remotePort;
    // console.log("IP ",clientIp,clientPort)
    const roomId = req.params.roomId;
    const {roomInfo} = req.body;
    console.log("Roo",roomInfo)
    Rooms.rooms[roomId] = roomInfo
    io.to(roomId).emit('updateUserList', Rooms.getUserList(roomId));
    // last_heartBeat[roomId] = Date.now()
    // res.send("HeartBeat received");
});

// Check if the POST method is not hit for 10 seconds
setInterval(() => {
    const currentTime = Date.now();
    const rooms = Object.keys(last_heartBeat);
    for(var i=0; i<rooms.length; i++){
        const roomId = rooms[i];
        const timeElapsedSinceLastPost = currentTime - last_heartBeat[roomId];
        if (timeElapsedSinceLastPost >= 15000) {
            console.log("No heartbeat received for 10 seconds");
            Rooms.showInfo();
            Rooms.deleteRoom(roomId);
            delete last_heartBeat[roomId];
            Rooms.showInfo();
            // io.emit('roomDeleted', roomId);
            io.emit('newMessage', generateServerMessage('roomDeleted', {}));
            // Perform any necessary action here, such as sending a notification
        }
    }
}, 1000); // Check every second (you can adjust the interval as needed)

ioUtils.setupIO(io,server,PORT);

server.listen(PORT, () => console.log(`Server started on port: ${PORT}`));
