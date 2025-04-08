import express from 'express';
import {Server} from 'socket.io';
import {createServer} from 'http';

const app = express();
const server = createServer(app);
const io = new Server(server)

let cube1Position = { x: 0, y: 0, z: 0 };

io.on('connection', (socket) => {
    console.log("User connected" , socket.id)

    socket.emit("position", cube1Position);
});

io.on('disconnection', (socket) => {
    console.log("User disconnected" , socket.id)
});

io.on("cube-move", (data) => {
    cube1Position.y += data.direction;
    io.emit("position", cube1Position);
});

server.listen(3000, () => {
    console.log("Server running on http://localhost:3000");
});

