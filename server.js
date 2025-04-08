import express from 'express';
import {Server} from 'socket.io';
import {createServer} from 'http';

const app = express();
const server = createServer(app);

const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });
  
  app.use(express.static("public"));

app.use(express.static("public"));

let players = {}; // socket.id -> player number
let cubePositions = {
    Player1Position: { x: 0, y: 0.44, z: 0 },
    Player2Position: { x: 2, y: 0.44, z: 0 },
};

io.on('connection', (socket) => {

    const connectedCount = Object.keys(players).length;
    if (connectedCount > 2) {                                             //limite le nombre de joueurs à 2
        console.log("Server full, disconnecting user", socket.id);
        socket.emit("error", "Game is full"); // envoie un message d'erreur au client
        socket.disconnect(true);
    }
    const playerNumber = connectedCount === 0 ? 'player1' : 'player2';  // si personne n'est co alors : playerNumber = player1 sinon player2
    players[socket.id] = playerNumber; // associe le socket.id au numéro du joueur

    console.log(`Player ${playerNumber} connected:`);
     
    socket.emit("player-assigned", playerNumber);
    io.emit("update-positions", cubePositions);  // donne la position initiale des cubes aux clients connectés


    socket.on("move-cube", (position) => {
        const player = players[socket.id]; // Met à jour la position du cube du joueur
        if (!player) return;

        const key = player === "player1" ? "Player1Position" : "Player2Position";
        cubePositions[key] = position;
        io.emit("update-positions", cubePositions); // broadcast new positions
    });


    socket.on("disconnect", () => {
        const player = players[socket.id];
        delete players[socket.id];
        console.log(`Player ${player} disconnected:`, socket.id);
      });
});


server.listen(8080, () => {
    console.log("Server running on http://51.210.103.122:8080/");

});

