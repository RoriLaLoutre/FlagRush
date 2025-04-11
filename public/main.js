import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.1/build/three.module.js";  
import { PointerLockControls } from "./controls/controls.js"
import RAPIER from 'https://cdn.skypack.dev/@dimforge/rapier3d-compat';
import { createMurs , createFlag ,zoneSpawn1 , zoneSpawn2 ,flagMesh } from './map/map.js';
import { speed , taille_map , local , server, pesanteur , hauteurMur ,fps} from "./constant.js";
import { updateCamera , myCamera } from "./camera/camera.js"
import { light , ambient } from "./lightings/light.js";
import { startRaycast } from "./raycast/raycast.js";

const socket = io(local); // a changer en server pour héberger le jeu


let myPlayer = null;
let myCube = null;
let myBody = null;

let  physicsObjects = [];

let jumpStatus = {
  isJumping: false,
  startTime: 0,
  duration: 650, 
  maxHeight: 2,
  baseY: 0,
};

let world;
await RAPIER.init();
const gravity = { x: 0, y: pesanteur*2, z: 0 };
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

const player1Desc = RAPIER.RigidBodyDesc.dynamic().setTranslation(-12.75, 5, -12.75);
playerBodies.player1 = world.createRigidBody(player1Desc);
playerBodies.player1.lockRotations(true);
world.createCollider(RAPIER.ColliderDesc.cuboid(0.25, 0.5, 0.25), playerBodies.player1);

const player2Desc = RAPIER.RigidBodyDesc.dynamic().setTranslation(12.75, 5, 12.75);  
playerBodies.player2 = world.createRigidBody(player2Desc);  
playerBodies.player2.lockRotations(true);
world.createCollider(RAPIER.ColliderDesc.cuboid(0.25, 0.5, 0.25), playerBodies.player2)





// Cubes joueurs
const geometry = new THREE.BoxGeometry(0.5 , 1, 0.5);

const materialGreen = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
const materialBlue = new THREE.MeshStandardMaterial({ color : 0x0000ff });

const player1Cube = new THREE.Mesh(geometry, materialGreen);
const player2Cube = new THREE.Mesh(geometry, materialBlue);

const cube2Box = new THREE.Box3().setFromObject(player2Cube);  // creation des box pour intersection avec le flag
const cube1Box = new THREE.Box3().setFromObject(player1Cube);


scene.add(player1Cube);
scene.add(player2Cube);

physicsObjects.push({ mesh: player1Cube, body: playerBodies.player1 });
physicsObjects.push({ mesh: player2Cube,body: playerBodies.player2 });

// Sol visuel
const groundGeometry = new THREE.BoxGeometry(taille_map*2, 0.2, taille_map*2);

const texturefloor = new THREE.TextureLoader().load( "./textures/floor.png" );
texturefloor.wrapS = THREE.RepeatWrapping;
texturefloor.wrapT = THREE.RepeatWrapping;
texturefloor.repeat.set(50, 50 );
texturefloor.anisotropy = 16;

const groundMaterial = new THREE.MeshStandardMaterial({ map : texturefloor });
const groundMesh = new THREE.Mesh(groundGeometry, groundMaterial);
groundMesh.position.set(0, -0.1, 0); 

// Création des murs et zones
createMurs(scene, world, hauteurMur);
createFlag(scene);
const zone1box = zoneSpawn1(scene);
const zone2box = zoneSpawn2(scene);

let flagBox = new THREE.Box3().setFromObject(flagMesh); // creation de la box pour le drapeau

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



////////////////////////////////////////////////// SocketIO Zone /////////////////////////////////////////////////////////
// Attribution joueur
socket.on("player-assigned", (player) => {
  myPlayer = player;
  myCube = myPlayer === "player1" ? player1Cube : player2Cube;   // cube vert si j1 sinon cube rouge
  myBody = playerBodies[myPlayer];
});

socket.on("flag-update", ({ holder }) => {
  player1HasFlag = holder === "player1";
  player2HasFlag = holder === "player2";

  if (player1HasFlag) {
    updateFlagPosition(flagMesh, player1Cube);
  } else if (player2HasFlag) {
    updateFlagPosition(flagMesh, player2Cube);
  } else {
    updateFlagPosition(flagMesh, null);
  }
});

// maj des positions
socket.on("update-positions", (positions) => {

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

///////////////////////////////////////////////////////////// Fin SocketIO /////////////////////////////////////////////////////////

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


myCamera.lookAt(new THREE.Vector3(1, 0, 1));
const controls = new PointerLockControls(myCamera, document.body);
scene.add(controls.getObject());

document.addEventListener('keydown', handleLock);
document.addEventListener('click', handleLock);

function handleLock() {
  controls.lock();
}

// check si le jouer est dans sa zone

function isInSpawnZone(playerCube, spawnBox) {
  const playerPos = playerCube.position;
  return (
    playerPos.x > spawnBox.min.x &&
    playerPos.x < spawnBox.max.x &&
    playerPos.z > spawnBox.min.z &&
    playerPos.z < spawnBox.max.z
  );
}

let scorePlayer1 = 0;
let scorePlayer2 = 0;

let printScorePlayer1 =  document.querySelector("#score1");
let printScorePlayer2 =  document.querySelector("#score2");




function updateScore() {
  
  if (player1HasFlag && isInSpawnZone(player1Cube, zone1box,)) {
    scorePlayer1 += 1;
    printScorePlayer1.innerHTML = `Player 1 : ${scorePlayer1}`;;
    socket.emit("score-update", { player: "player1", score: scorePlayer1 });
    player1HasFlag = false; // Reset le drapeau
    console.log("score player 1 : " + scorePlayer1);
    updateFlagPosition(flagMesh, null);
  }

  if (player2HasFlag && isInSpawnZone(player2Cube, zone2box)) {
    scorePlayer2 += 1;
    printScorePlayer2.innerHTML = `Player 2 : ${scorePlayer2}`;
    socket.emit("score-update", { player: "player2", score: scorePlayer2 });
    player2HasFlag = false; // Reset le drapeau
    console.log("score player 2 : " + scorePlayer2);
    updateFlagPosition(flagMesh, null);
  }
}


// logique du jeu et drapeau
let player1HasFlag = false
let player2HasFlag = false;

function updateFlagPosition(flagMesh, playerCube) {
  if ((player1HasFlag || player2HasFlag) && flagMesh && playerCube) {
    flagMesh.position.set(
      playerCube.position.x,
      playerCube.position.y + 1.2,
      playerCube.position.z
    );
  } else if (flagMesh) {
    flagMesh.position.set(0, 0.5, 0); // reinitialize to center
  }
}



function flagLogic() {
    if (!myBody) return;

    const pos = myBody.translation();

    cube1Box.setFromObject(player1Cube);
    cube2Box.setFromObject(player2Cube);
    flagBox.setFromObject(flagMesh);

    if (!player1HasFlag && !player2HasFlag) {

      if (cube1Box.intersectsBox(flagBox)) {
        player1HasFlag = true;
        socket.emit("flag-picked-up", { player: "player1" });
      }
    
      if (cube2Box.intersectsBox(flagBox)) {
        player2HasFlag = true;
        socket.emit("flag-picked-up", { player: "player2" });
      }
    }

    if (player1HasFlag && pos.y < -4) {
      player1HasFlag = false;
      socket.emit("flag-dropped");


      if (myPlayer === "player1") {
        myBody.setTranslation({ x: -12.75, y: 5, z: -12.75 }, true); // zoneSpawn1
        myBody.setLinvel({ x: 0, y: 0, z: 0 }, true);
      }
    }
    
    if (player2HasFlag && pos.y < -4) {
      player2HasFlag = false;
      socket.emit("flag-dropped");

      if (myPlayer === "player2") {
        myBody.setTranslation({ x: 12.75, y: 5, z: 12.75 }, true); // zoneSpawn2
        myBody.setLinvel({ x: 0, y: 0, z: 0 }, true);
      }
    }
    updateScore();
  }


function syncPhysicsToMeshes() {
  for (const { mesh, body } of physicsObjects) {
    const pos = body.translation();
    const rot = body.rotation();

    mesh.position.set(pos.x, pos.y, pos.z);
    mesh.quaternion.set(rot.x, rot.y, rot.z, rot.w);
  }
}

startRaycast(world,myCamera,scene);

function animate(currentTime) {

  setTimeout( () =>{
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
    flagLogic();

    if (player1HasFlag) {
      updateFlagPosition(flagMesh, player1Cube);
    } else if (player2HasFlag) {
      updateFlagPosition(flagMesh, player2Cube);
    }




  } , 1000 / fps)  // limite max 60 fps
  renderer.render(scene, myCamera);
}

animate();
