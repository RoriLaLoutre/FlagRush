import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.1/build/three.module.js";  
import { PointerLockControls } from "./controls/controls.js"
import RAPIER from 'https://cdn.skypack.dev/@dimforge/rapier3d-compat';

import { createMurs , createFlag ,zoneSpawn1 , zoneSpawn2} from './map/map.js';

import { speed , taille_map , local , server, pesanteur , hauteurMur} from "./constant.js";

import { updateCamera , myCamera } from "./camera/camera.js"
import { light , ambient } from "./lightings/light.js";

const socket = io(local); // a changer en server pour héberger le jeu


let myPlayer = null;
let myCube = null;
let myBody = null;

let  physicsObjects = [];
let isJumping;


let jumpStatus = {
  isJumping: false,
  startTime: 0,
  duration: 650, 
  maxHeight: 2,
  baseY: 0,
};

let world;
await RAPIER.init();
const gravity = { x: 0, y: pesanteur, z: 0 };
world = new RAPIER.World(gravity);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb); // bleu ciel

// Rendu
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

// Corps des joueurs
const playerBodies = {
  player1: null,
  player2: null,
};

const player1Desc = RAPIER.RigidBodyDesc.dynamic().setTranslation(0, 5, 0);
playerBodies.player1 = world.createRigidBody(player1Desc);
playerBodies.player1.lockRotations(true);
world.createCollider(RAPIER.ColliderDesc.cuboid(0.25, 0.5, 0.25), playerBodies.player1);

const player2Desc = RAPIER.RigidBodyDesc.dynamic().setTranslation(1, 5, 0);  
playerBodies.player2 = world.createRigidBody(player2Desc);  
playerBodies.player2.lockRotations(true);
world.createCollider(RAPIER.ColliderDesc.cuboid(0.25, 0.5, 0.25), playerBodies.player2)


// Cubes joueurs
const geometry = new THREE.BoxGeometry(0.5 , 1, 0.5);

const materialGreen = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
const materialRed = new THREE.MeshStandardMaterial({ color: 0xff0000 });

const player1Cube = new THREE.Mesh(geometry, materialGreen);
const player2Cube = new THREE.Mesh(geometry, materialRed);

scene.add(player1Cube);
scene.add(player2Cube);

physicsObjects.push({ mesh: player1Cube, body: playerBodies.player1 });
physicsObjects.push({ mesh: player2Cube,body: playerBodies.player2 });

// Sol visuel
const groundGeometry = new THREE.BoxGeometry(taille_map*2, 0.2, taille_map*2); 
const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x222222 });
const groundMesh = new THREE.Mesh(groundGeometry, groundMaterial);
groundMesh.position.set(0, -0.1, 0); 

// Création des murs et zones
createMurs(scene, world, hauteurMur);
createFlag(scene, world);
zoneSpawn1(scene, world);
zoneSpawn2(scene, world);

// Sol physique
const groundDesc = RAPIER.RigidBodyDesc.fixed().setTranslation(0, 0, 0);
const groundBody = world.createRigidBody(groundDesc);
const groundCollider = RAPIER.ColliderDesc.cuboid(taille_map, 0.3, taille_map);
world.createCollider(groundCollider, groundBody);

scene.add(groundMesh);
scene.add(light);
scene.add(ambient);
scene.add(light.target);
//shadow casting
player1Cube.castShadow = true;
player2Cube.castShadow = true;
groundMesh.receiveShadow = true;

// Attribution joueur
socket.on("player-assigned", (player) => {
  myPlayer = player;
  myCube = myPlayer === "player1" ? player1Cube : player2Cube;   // cube vert si j1 sinon cube rouge
  myBody = playerBodies[myPlayer];
});

// MàJ des positions
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

// Envoi de ma position au serveur
function sendMyPosition() {
  if (!myPlayer || !myBody) return;
  const pos = myBody.translation();
  socket.emit("move-cube", {
    x: pos.x,
    y: pos.y,
    z: pos.z,
  });
}

// Clavier
const keys = {
  KeyW: false,
  KeyS: false,
  KeyA: false,
  KeyD: false,
  Space: false,
  ShiftLeft: false,
};

document.addEventListener("keydown", (e) => {
  if (e.code in keys) keys[e.code] = true;
});

document.addEventListener("keyup", (e) => {
  if (e.code in keys) keys[e.code] = false;
});


// Gestion du saut fluide
function startJump() {
  if (!jumpStatus.isJumping && myBody) {
    const vel = myBody.linvel();
    if (Math.abs(vel.y) < 0.01) {
      jumpStatus.isJumping = true;
      jumpStatus.startTime = performance.now();
      jumpStatus.baseY = myBody.translation().y;
    }
  }
}

function updateJump(currentTime) {
  if (!jumpStatus.isJumping || !myBody) return;

  const elapsed = currentTime - jumpStatus.startTime;
  const t = elapsed / jumpStatus.duration;

  if (t >= 1) {
    jumpStatus.isJumping = false;
    return;
  }

  const x = 2 * t - 1;
  const y = -x * x + 1;

  const targetY = jumpStatus.baseY + jumpStatus.maxHeight * y;
  const currentY = myBody.translation().y;
  const deltaY = targetY - currentY;

  myBody.setLinvel({ x: myBody.linvel().x, y: deltaY * 20, z: myBody.linvel().z }, true);
}



const controls = new PointerLockControls(myCamera, document.body);
scene.add(controls.getObject());

document.addEventListener('keydown', handleLock);
document.addEventListener('click', handleLock);

function handleLock() {
  controls.lock();
}



function syncPhysicsToMeshes() {
  for (const { mesh, body } of physicsObjects) {
    const pos = body.translation();
    const rot = body.rotation();

    mesh.position.set(pos.x, pos.y, pos.z);
    mesh.quaternion.set(rot.x, rot.y, rot.z, rot.w);
  }
}


function animate(currentTime) {
  requestAnimationFrame(animate);

  if (myBody && controls.isLocked) {
    const direction = new THREE.Vector3();
    const frontVector = new THREE.Vector3();
    const sideVector = new THREE.Vector3();
  
    frontVector.set(0, 0, Number(keys.KeyW) - Number(keys.KeyS));
    sideVector.set(Number(keys.KeyA) - Number(keys.KeyD), 0, 0);
  
    direction.subVectors(frontVector, sideVector);
    direction.normalize().multiplyScalar(speed);
  
    const cameraDirection = controls.getDirection(new THREE.Vector3());
    const right = new THREE.Vector3().crossVectors(cameraDirection, new THREE.Vector3(0, 1, 0));
  
    const moveDir = new THREE.Vector3();
    moveDir.addScaledVector(cameraDirection, direction.z);
    moveDir.addScaledVector(right, direction.x);
  
    moveDir.y = myBody.linvel().y; // garde la vitesse verticale pour le saut
  
    myBody.setLinvel(moveDir, true);
    if (keys.Space) startJump();
  }

  

  // update mesh positions
  player1Cube.position.copy(playerBodies.player1.translation());
  player2Cube.position.copy(playerBodies.player2.translation());

  updateJump(currentTime);
  sendMyPosition();

  world.step();
  syncPhysicsToMeshes();
  updateCamera(myCube , controls);
  renderer.render(scene, myCamera);
}

animate();
