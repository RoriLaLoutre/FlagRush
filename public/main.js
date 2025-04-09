import * as THREE from "https://esm.sh/three@0.160";
import RAPIER from 'https://cdn.skypack.dev/@dimforge/rapier3d-compat';
import { createMurs } from './map/map.js';
import { speed , taille_map , local , server, pesanteur} from "./constant.js";
import { updateCamera , myCamera } from "./camera/camera.js"
import { light , ambient } from "./lightings/light.js";


const socket = io(server); // a changer en server pour héberger le jeu


let myPlayer = null;
let myCube = null;
let myBody = null;
let  physicsObjects = [];
let isJumping;


let world;
await RAPIER.init();
const gravity = { x: 0, y: pesanteur, z: 0 };
world = new RAPIER.World(gravity);


const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb); // bleu ciel

// Création du moteur de rendu
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);


const playerBodies = {   // ici que seront les corps physiques des joueurs
  player1: null,
  player2: null,
};

// player1
const player1Desc = RAPIER.RigidBodyDesc.dynamic().setTranslation(0, 5, 0);
playerBodies.player1 = world.createRigidBody(player1Desc);
playerBodies.player1.lockRotations(true);
world.createCollider(RAPIER.ColliderDesc.cuboid(0.25, 0.5, 0.25), playerBodies.player1);

// player2
const player2Desc = RAPIER.RigidBodyDesc.dynamic().setTranslation(1, 5, 0);  
playerBodies.player2 = world.createRigidBody(player2Desc);  
playerBodies.player2.lockRotations(true);
world.createCollider(RAPIER.ColliderDesc.cuboid(0.25, 0.5, 0.25), playerBodies.player2)


// Cube vert et rouge
const geometry = new THREE.BoxGeometry(0.5 , 1, 0.5);  // diemension des cubes joueurs

const materialGreen = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
const materialRed = new THREE.MeshStandardMaterial({ color: 0xff0000 });

const player1Cube = new THREE.Mesh(geometry, materialGreen);
const player2Cube = new THREE.Mesh(geometry, materialRed);

scene.add(player1Cube);
scene.add(player2Cube);

physicsObjects.push({ mesh: player1Cube, body: playerBodies.player1 });
physicsObjects.push({ mesh: player2Cube,body: playerBodies.player2 });


// visual ground
const groundGeometry = new THREE.BoxGeometry(taille_map*2, 0.2, taille_map*2); 
const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x222222 });
const groundMesh = new THREE.Mesh(groundGeometry, groundMaterial);

groundMesh.position.set(0, -0.1, 0); 
// Creations des murs
createMurs(scene, world);

// physical ground
const groundDesc = RAPIER.RigidBodyDesc.fixed().setTranslation(0, 0, 0);
const groundBody = world.createRigidBody(groundDesc);
const groundCollider = RAPIER.ColliderDesc.cuboid(taille_map, 0.1, taille_map);
world.createCollider(groundCollider, groundBody);


scene.add(groundMesh);
scene.add(light);
scene.add(ambient);
scene.add(light.target);

//shadow casting

player1Cube.castShadow = true;
player2Cube.castShadow = true;

groundMesh.receiveShadow = true;


socket.on("player-assigned", (player) => {
  myPlayer = player;
  myCube = myPlayer === "player1" ? player1Cube : player2Cube;   // cube vert si j1 sinon cube rouge
  myBody = playerBodies[myPlayer];
});

player1Cube.position.set(0, 0.44, 0)
player2Cube.position.set(1, 0.44, 0)

socket.on("update-positions", (positions) => {
  const otherPlayer = myPlayer === 'player1' ? 'player2' : 'player1';

  if (positions.Player1Position && playerBodies.player1 && myPlayer !== 'player1') {
    playerBodies.player1.setTranslation(positions.Player1Position, true);
  }
  if (positions.Player2Position && playerBodies.player2 && myPlayer !== 'player2') {
    playerBodies.player2.setTranslation(positions.Player2Position, true);
  }

  // sync visual positions
  player1Cube.position.set(
    playerBodies.player1.translation().x,
    playerBodies.player1.translation().y,
    playerBodies.player1.translation().z
  );

  player2Cube.position.set(
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

function syncPhysicsToMeshes() {
  for (const { mesh, body } of physicsObjects) {
    const pos = body.translation();
    const rot = body.rotation();

    mesh.position.set(pos.x, pos.y, pos.z);
    mesh.quaternion.set(rot.x, rot.y, rot.z, rot.w);
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
      myBody.applyImpulse({ x: 0, y: 5, z: 0 }, true);
    }
  }

  

  // update mesh positions
  player1Cube.position.copy(playerBodies.player1.translation());
  player2Cube.position.copy(playerBodies.player2.translation());

  sendMyPosition();

  world.step();
  syncPhysicsToMeshes();
  updateCamera(myCube);
  renderer.render(scene, myCamera);
}


animate();
