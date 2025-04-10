import express from 'express';
import {Server} from 'socket.io';
import {createServer} from 'http';
import {port, local} from './public/constant.js'; // importation des constantes

const app = express();
const server = createServer(app);

const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

app.use(express.static("public"));

let players = {
    player1 : null,
    player2 : null
};

let cubePositions = {
    Player1Position: { x: 0, y: 100, z: 0 },
    Player2Position: { x: 0, y: 100, z: 0 },
};

io.on('connection', (socket) => {

    let assignedPlayer = null

    if (!players.player1) {           //si pas ou plus de joueur 1
        players.player1 = socket.id;
        assignedPlayer = 'player1';
    } else if (!players.player2) { // meme chose pour j2
        players.player2 = socket.id;
        assignedPlayer = 'player2';
    } else {
        console.log("Server full, disconnecting user", socket.id);
        socket.emit("error", "Game is full");
        socket.disconnect(true);
        return;
    }

    console.log(`Player ${assignedPlayer} connected:`, socket.id);
    socket.emit("player-assigned", assignedPlayer);
    io.emit("update-positions", cubePositions);

    socket.on("move-cube", (position) => {
        if (!assignedPlayer) return;
    
        const key = assignedPlayer === "player1" ? "Player1Position" : "Player2Position";
        cubePositions[key] = position;
        io.emit("update-positions", cubePositions);
      });


    socket.on("disconnect", () => {
        if (players.player1 === socket.id) {
          players.player1 = null;
          console.log("Player1 disconnected:", socket.id);
        } else if (players.player2 === socket.id) {
          players.player2 = null;
          console.log("Player2 disconnected:", socket.id);
        }
      });
});


server.listen(port, () => {
    console.log(`Server running on ${local}`);

});

