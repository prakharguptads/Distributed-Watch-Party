class Rooms {
	/* 
        userId = socket.id
        roomId = hosts's socket id
    */
	constructor() {
		this.rooms = {}; // { users: [...{name, id, roomId}], videoURL: ''}
		this.userMap = {}; // maps socket id to rooms
		this.userid_ip_map = {} // maps userid to user ip
		this.userIps = {} // list of user Ips
	}

	addRoom(roomId, videoId) {
		if (!this.rooms[roomId]) this.rooms[roomId] = { users: [], videoId };
	}

	setVideoId(roomId, videoId) {
		if (this.rooms[roomId]) {
			this.rooms[roomId]['videoId'] = videoId;
		}
	}

	getRoom(roomId) {
		return this.rooms[roomId];
	}

	addUser(roomId, name, userId) {
		this.rooms[roomId]['users'].push({ name, id: userId, roomId });
		this.userMap[userId] = roomId;
	}

	removeUser(userId) {
		const roomId = this.userMap[userId];
		let _user = null;

		if (roomId) {
			// remove user from the room
			const users = this.rooms[roomId]['users'];
			this.rooms[roomId]['users'] = users.filter((user) => {
				if (user.id === userId) {
					_user = user;
				}
				return user.id !== userId;
			});

			// remove user from the user-room mapping
			delete this.userMap[userId];

			// remove room if applicable
			this.removeRoom(roomId);

			return _user;
		}

		return null;
	}

	removeRoom(roomId) {
		if (this.rooms[roomId]['users'].length === 0) delete this.rooms[roomId];
	}

	deleteRoom(roomId){
		if (this.rooms[roomId]) delete this.rooms[roomId];
		if(this.userIps[roomId]) delete this.userIps[roomId];
		if(this.userid_ip_map[roomId]) delete this.userid_ip_map;

		for (const socket in this.userMap) {
			// Check if the current key's value matches the value to delete
			if (this.userMap[socket] === roomId) {
				// If a match is found, delete the key-value pair
				delete this.userMap[socket];
				// Optional: If you only want to delete the first occurrence, break the loop
				// break;
			}
		}
	}

	getUserList(roomId) {
		const room = this.rooms[roomId];
		if (room) {
			return room['users'];
		}
	}

	getUser(userId) {
		const room = this.userMap[userId];
		const users = this.getUserList(room);
		return users.find((user) => user.id === userId);
	}

	showInfo() {
		const rooms = Object.keys(this.rooms);
		rooms.forEach((roomId) => {
			console.log(`Room: ${roomId}`);
			this.rooms[roomId]['users'].forEach((user) => console.log(user));
		});
		console.log("userIps", this.userIps)
	}

	addUserIp(roomId, userId, userIp) {
		if (!this.userIps[roomId]) this.userIps[roomId] = [];
		this.userIps[roomId].push(userIp);
		if (!this.userid_ip_map[roomId]) this.userid_ip_map[roomId] = {};
		this.userid_ip_map[roomId][userId] = userIp;
	}

	getUserIpList(roomId){
		if(!this.userIps[roomId]) return [];
		return this.userIps[roomId]
	}

	getUserIp(roomId, userId){
		return this.userid_ip_map[roomId][userId];
	}
}

module.exports = new Rooms();
