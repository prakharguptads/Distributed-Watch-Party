// const Rooms = require('./Rooms');
const { parentPort, workerData } = require('worker_threads');
const {roomId, host_userId, serialised_Rooms} = workerData
const Rooms = JSON.parse(serialised_Rooms);
// userIplist = Rooms.getUserList(roomId);
// console.log("userIplist", userIplist);
// if(userIplist.length == 0) console.log("no user joined yet");
port = "3006"
console.log("inside heartbeat.js");

async function send_heartBeat(address) {
    try {
        // Make an HTTP POST request to the other server's API endpoint
        console.log("address", address);
        const response = await axios.post(`${address}/${roomId}/heartbeat`, {
            // host_userId: host_userId,
            type: "hb"
        });
        return response.data;
    } catch (error) {
        // Handle errors, such as network errors or server errors
        console.log(`Failed to send heartbeat of room=${roomId} to userIp=${address}, :${error.message}`);
    }
}

// userIplist = Rooms.getUserList(roomId);
// console.log("userIplist at server", userIplist)

async function sendHeartbeats() {
    while (true) {
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
                await send_heartBeat(address);
            }
        }
        
        await new Promise(resolve => setTimeout(resolve, 5000)); // Wait for 5 seconds
    }
}

sendHeartbeats();


// async function send_heartBeat(address) {
//     try {
//         // Make an HTTP POST request to the other server's API endpoint
// 		console.log("address", address);
//         const response = await axios.post(`${address}/${roomId}/heartbeat`, {
//             // host_userId: host_userId,
//             type: "hb"
//         });
//         return response.data;
//     } catch (error) {
//         // Handle errors, such as network errors or server errors
//         console.log(`Failed to send heartbeat of room=${roomId} to userIp=${address}, :${error.message}`);
//     }
// }

// while(1){
//     userIplist = Rooms.getUserIpList(roomId);
//     console.log("userIplist", userIplist);
//     if(userIplist.length == 0) console.log("no user joined yet");
//     for(var i=0; i<userIplist.length; i++){
//         let ip = userIplist[i];
//         let address = ip + ":" + port;
//         console.log(`Sending heartbeat to ${address}`);
//         send_heartBeat(address);
//     }
//     setTimeout(() => {
//         console.log('This code runs after 3 seconds');
//     }, 5000);
// }

