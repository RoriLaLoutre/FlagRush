import express from 'express';
import {Server} from 'socket.io';
import {createServer} from 'http';

const app = express();
const server = createServer(app);
// const io = new Server(server)

const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });
  
  app.use(express.static("public"));

app.use(express.static("public"));

let cube1Position = { x: 0, y: 0.44, z: 0 };

io.on('connection', (socket) => {
    console.log("User connected", socket.id);
    

    socket.emit("position", cube1Position);


    socket.on("move-cube", (position) => {
        cube1Position = position; // Mise à jour de la position du cube
        io.emit("move-cube", cube1Position); // Envoie la nouvelle position à tous les clients
    });

    socket.on('disconnect', () => {
        console.log("User disconnected", socket.id);
    });
});

server.listen(999, () => {
    console.log("Server running on http://127.0.0.1:999");
});

