import * as THREE from "https://esm.sh/three@0.160";
import RAPIER from 'https://cdn.skypack.dev/@dimforge/rapier3d-compat';
import { speed , taille_map , local , server, pesanteur} from "./constant.js";
const socket = io(local); // a changer en server pour héberger le jeu
let myPlayer = null;
let myCube = null;
let myBody = null;
let isJumping;

let world;
await RAPIER.init();
const gravity = { x: 0, y: pesanteur, z: 0 };
world = new RAPIER.World(gravity);



const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb); // bleu ciel

// Création de la caméra
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,  
  1000
);
camera.position.set(0, 2, 5); // Légèrement en hauteur pour voir les cubes et le sol

// Création du moteur de rendu
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);


const playerBodies = {   // ici que seront les corps physiques des joueurs
  player1: null,
  player2: null,
};

// player1
const player1Desc = RAPIER.RigidBodyDesc.dynamic().setTranslation(0, 1, 0);
playerBodies.player1 = world.createRigidBody(player1Desc);
world.createCollider(RAPIER.ColliderDesc.cuboid(0.25, 0.5, 0.25), playerBodies.player1);

// player2
const player2Desc = RAPIER.RigidBodyDesc.dynamic().setTranslation(1, 1, 0);  
playerBodies.player2 = world.createRigidBody(player2Desc);  
world.createCollider(RAPIER.ColliderDesc.cuboid(0.25, 0.5, 0.25), playerBodies.player2)

world.step();

// Cube vert et rouge
const geometry = new THREE.BoxGeometry(0.5 , 1, 0.5);  // diemension des cubes joueurs

const materialGreen = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
const materialRed = new THREE.MeshBasicMaterial({ color: 0xff0000  });

const greenCube = new THREE.Mesh(geometry, materialGreen);
const redCube = new THREE.Mesh(geometry, materialRed);

scene.add(greenCube);
scene.add(redCube);

// visual ground
const groundGeometry = new THREE.BoxGeometry(taille_map*2, 0.2, taille_map*2); 
const groundMaterial = new THREE.MeshBasicMaterial({ color: 0x222222 });
const groundMesh = new THREE.Mesh(groundGeometry, groundMaterial);

groundMesh.position.set(0, -0.1, 0); 

scene.add(groundMesh);

// physical ground
const groundDesc = RAPIER.RigidBodyDesc.fixed().setTranslation(0, 0, 0);
const groundBody = world.createRigidBody(groundDesc);
const groundCollider = RAPIER.ColliderDesc.cuboid(taille_map, 0.1, taille_map);
world.createCollider(groundCollider, groundBody);

socket.on("player-assigned", (player) => {
  myPlayer = player;
  myCube = myPlayer === "player1" ? greenCube : redCube;   // cube vert si j1 sinon cube rouge
  myBody = playerBodies[myPlayer];
});

greenCube.position.set(0, 0.44, 0)
redCube.position.set(1, 0.44, 0)

socket.on("update-positions", (positions) => {
  const otherPlayer = myPlayer === 'player1' ? 'player2' : 'player1';

  if (positions.Player1Position && playerBodies.player1 && myPlayer !== 'player1') {
    playerBodies.player1.setTranslation(positions.Player1Position, true);
  }
  if (positions.Player2Position && playerBodies.player2 && myPlayer !== 'player2') {
    playerBodies.player2.setTranslation(positions.Player2Position, true);
  }

  // sync visual positions
  greenCube.position.set(
    playerBodies.player1.translation().x,
    playerBodies.player1.translation().y,
    playerBodies.player1.translation().z
  );

  redCube.position.set(
    playerBodies.player2.translation().x,
    playerBodies.player2.translation().y,
    playerBodies.player2.translation().z
  );
});


function sendMyPosition() {
  if (!myPlayer || !myBody) return;
  const pos = myBody.translation();
  socket.emit("move-cube", {
    x: pos.x,
    y: pos.y,
    z: pos.z,
  });
}


const keys = {
  KeyW: false,
  KeyS: false,
  KeyA: false,
  KeyD: false,
  Space: false,
  ShiftLeft: false,
};

document.addEventListener("keydown", (e) => {
  if (e.code in keys) {
    keys[e.code] = true;
  }
});

document.addEventListener("keyup", (e) => {
  if (e.code in keys) {
    keys[e.code] = false;
  }
});


function updateJump(){
  if (myBody) {
    const vel = myBody.linvel();
    if (Math.abs(vel.y) < 0.01) {
      isJumping = false;
    }
  }
}

function animate() {
  requestAnimationFrame(animate);
  updateJump();

  const movement = { x: 0, y: 0, z: 0 };
  if (keys.KeyW) movement.z -= speed;
  if (keys.KeyS) movement.z += speed;
  if (keys.KeyA) movement.x -= speed;
  if (keys.KeyD) movement.x += speed;

  if (myBody) myBody.setLinvel(movement, true);

  

  if (keys.Space && isJumping === false) {
    const vel = myBody.linvel();
    if (Math.abs(vel.y) < 0.01) {
      isJumping = true;
      myBody.applyImpulse({ x: 0, y: 2, z: 0 }, true);
    }
  }

  world.step();

  // update mesh positions
  greenCube.position.copy(playerBodies.player1.translation());
  redCube.position.copy(playerBodies.player2.translation());

  sendMyPosition();

  renderer.render(scene, camera);
}


animate();
