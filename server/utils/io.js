const Rooms = require('./Rooms');
const { Worker} = require('worker_threads');
const {
	generateServerMessage,
	generateUserMessage,
} = require('../utils/message');
const axios = require('axios');

async function fetchRoomInfo(roomId, name, userId, hostname) {
    try {
        // Make an HTTP POST request to the other server's API endpoint
		console.log(name,userId,hostname)
        const response = await axios.post(`http://${hostname}:3005/rooms1/${roomId}`, {
			// const response = await axios.post(`http://localhost:3005/rooms1/${roomId}`, {
            name: name,
            userId: userId
        });
        return response.data;
    } catch (error) {
        // Handle errors, such as network errors or server errors
        console.log(`Failed to fetch room information for roomId ${roomId}: ${error.message}`);
    }
}

async function send_heartBeat(roomId, address) {
    try {
        // Make an HTTP POST request to the other server's API endpoint
        console.log("address", address);
        const response = await axios.post(`${address}/${roomId}/heartbeat`, {
            // host_userId: host_userId,
            type: "hb"
        });
		console.log(response.data);
        return response.data;
    } catch (error) {
        // Handle errors, such as network errors or server errors
        console.log(`Failed to send heartbeat of room=${roomId} to userIp=${address}, :${error.message}`);
		return "Failed to send heartbeat";
    }
}


exports.setupIO = (io) => {
	io.on('connection', (socket) => {
		console.log(`User connected: ${socket.id}`);

		socket.on('join', async (data) => {
			console.log('joining user', data);
			const { roomId, name, userId, videoId, videoURL } = data;
			console.log(`User ${name} just joined in room ${roomId}`);
			console.log("URL ",videoURL)
			let hostname = ""
			if(videoURL)
			{
				const url = new URL(videoURL);
				hostname = url.hostname;
				console.log("hostname ",hostname)
			}

			socket.join(roomId);

			let roomInfo;
			if(videoURL)
			{try {
				// Assuming you have a function `fetchRoomInfo` to fetch room information
				const hn = hostname;
				console.log("hostname", hn);
				roomInfo = await fetchRoomInfo(roomId,name,userId, hn);
				console.log("got ",roomInfo)
			} catch (error) {
				console.error('Error fetching room information:', error);
				// Send a default message if room information cannot be fetched
				socket.emit('newMessage', generateServerMessage('error', { message: 'Room not found' }));
				return;
			}}

			if(roomInfo)
			{
				Rooms.addRoom(roomInfo.users[0].roomId,roomInfo.videoId)
				console.log("Dd")
				for(i=0;i<roomInfo.users.length;i++)
				{
					console.log(roomInfo.users[0].name)
					Rooms.addUser(roomInfo.users[i].roomId, roomInfo.users[i].name, roomInfo.users[i].id);
				}
			}
			else
			{
				// Create the room
				Rooms.addRoom(roomId, videoId);
				Rooms.addUser(roomId, name, userId); // data.userId = socket.id

				const port = '3006';
				async function sendHeartbeats() {
					// while (true) {
						userlist = Rooms.getUserList(roomId);
						console.log("userList", userlist);
				
						userIplist = Rooms.getUserIpList(roomId);
						console.log("userIplist", userIplist);
						
						if (userIplist.length === 0) {
							console.log("No users have joined yet");
						} else {
							for (let i = 0; i < userIplist.length; i++) {
								const ip = userIplist[i];
								const address = `${ip}:${port}`;
								console.log(`Sending heartbeat to ${address}`);
								const response = await send_heartBeat(roomId, address);
								if(response != "HeartBeat received"){
									
								}
							}
						}
						
						// await new Promise(resolve => setTimeout(resolve, 5000)); // Wait for 5 seconds
					// }
				}
				while(true){
					sendHeartbeats();
					await new Promise(resolve => setTimeout(resolve, 5000)); // Wait for 5 seconds
				}

				// Create a thread which will send heartbeat to all users
				// function createWorker (workerData) {
					// const worker = new Worker('./utils/heartBeat.js', { workerData: { roomId, userId, Rooms } });
					// worker.on('error', (err) => { throw err });
					// worker.on('message', (msg) => {
					// 	console.log(msg)
					// 	// primes = primes.concat(msg);
					// });
					// worker.on('exit', () => {
					// 	console.log('host stopped sending heartbeat');
					// });

				// 	return worker
				// }
				  
				// const range = Math.ceil((max - min) / threadCount);
				// let start = min; 
				// for(let i = 0; i <threadCount; i++) {
				// threads.add(createWorker({start, range}));
				// start = start + range + 1;
				// }
			}
			// Rooms.showInfo();

			// emit to all except the joined user
			socket.broadcast.to(roomId).emit(
				'newMessage',
				generateServerMessage('userJoin', {
					roomId,
					name,
					userId,
				})
			);

			// tell everyone in the room to update their userlist
			io.to(roomId).emit('updateUserList', Rooms.getUserList(roomId));

			// if the user joined existing room, tell him about the playing video
			if (!videoId) {
				const room = Rooms.getRoom(roomId);
				socket.emit(
					'newMessage',
					generateServerMessage('changeVideo', {
						videoId: room.videoId,
					})
				);
			}
		});

		socket.on('createMessage', (message) => {
			const user = Rooms.getUser(socket.id);

			if (user) {
				io.to(user.roomId).emit(
					'newMessage',
					generateUserMessage(user.name, user.id, message)
				);
				console.log('new message received', message);
			}
		});

		socket.on('videoStateChange', (data) => {
			const user = Rooms.getUser(socket.id);
			const name = user.name;
			const userId = user.id;
			const roomId = user.roomId;
			console.log('user',  user)
			console.log('videoStateChange trigerred', data);

			// tell host to broadcast others to change video state
			try{
				console.log(name,userId)
				axios.post(`http://localhost:3005/rooms1/${roomId}/videoStateChange`, {
					name: name,
					userId: userId,
					data: data
				});
				// if(response){
				// 	socket.emit('newMessage', 
				// 	generateServerMessage('updateVideoState', {
				// 		type: data.type,
				// 		...data.payload,
				// 		user: {
				// 			name: user.name,
				// 			id: socket.id,
				// 		},
				// 	}));
				// }
			}
			catch(error){
				console.log('failed to send video state change video state', error.message)
			}

			// tell others to update the videoState
			// socket.broadcast.to(user.roomId).emit(
			// 	'newMessage',
			// 	generateServerMessage('updateVideoState', {
			// 		type: data.type,
			// 		...data.payload,
			// 		user: {
			// 			name: user.name,
			// 			id: socket.id,
			// 		},
			// 	})
			// );
		});

		socket.on('changeVideo', (data) => {
			const { videoId } = data;
			const user = Rooms.getUser(socket.id);
			io.to(user.roomId).emit(
				'newMessage',
				generateServerMessage('updateVideoId', { videoId, user })
			);
			Rooms.setVideoId(user.roomId, videoId);
		});

		socket.on('disconnect', () => {
			console.log('User disconnected');
			const user = Rooms.removeUser(socket.id);
			// Rooms.showInfo();
			if(user && user.name) console.log(`${user.name} has left`);

			// io.to(user.roomId).emit(
			// 	'newMessage',
			// 	generateServerMessage('userLeft', {
			// 		name: user.name,
			// 		userId: user.id,
			// 		roomId: user.roomId,
			// 	})
			// );

			// // tell everyone in the room to update their userlist
			// io.to(user.roomId).emit(
			// 	'updateUserList',
			// 	Rooms.getUserList(user.roomId)
			// );
		});
	});
};
