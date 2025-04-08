import express from 'express';
import { Server } from 'socket.io';
import { createServer } from 'http';

const app = express();
const server = createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(express.static("public"));

let players = {}; // socket.id -> player number
let cubePositions = {
  player1: { x: 0, y: 0.44, z: 0 },
  player2: { x: 1, y: 0.44, z: 0 }
};

io.on('connection', (socket) => {
  const connectedCount = Object.keys(players).length;

  if (connectedCount >= 2) {
    socket.emit("error", "Game is full");
    socket.disconnect(true);
    return;
  }

  const playerNumber = connectedCount === 0 ? 'player1' : 'player2';
  players[socket.id] = playerNumber;

  console.log(`Player ${playerNumber} connected:`, socket.id);

  socket.emit("player-assigned", playerNumber);
  io.emit("update-positions", cubePositions);

  socket.on("move-cube", (position) => {
    const player = players[socket.id];
    if (!player) return;

    cubePositions[player] = position;
    io.emit("update-positions", cubePositions); // broadcast new positions
  });

  socket.on("disconnect", () => {
    const player = players[socket.id];
    delete players[socket.id];
    console.log(`Player ${player} disconnected:`, socket.id);
  });
});

server.listen(999, () => {
  console.log("Server running on http://127.0.0.1:999");
});
