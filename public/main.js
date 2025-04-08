
const socket = io('http://127.0.0.1:999');

let myPlayer = null;
let myCube = null;

// création de la scène
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

// Cube vert
const geometry = new THREE.BoxGeometry(0.5 , 1, 0.5);  // diemension des cubes joueurs

const materialGreen = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
const materialRed = new THREE.MeshBasicMaterial({ color: 0xff0000  });

const greenCube = new THREE.Mesh(geometry, materialGreen);
const redCube = new THREE.Mesh(geometry, materialRed);


scene.add(greenCube);
scene.add(redCube);

// Sol noir
const planeGeometry = new THREE.PlaneGeometry(100, 100);
const planeMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
const floor = new THREE.Mesh(planeGeometry, planeMaterial);
floor.rotation.x = -Math.PI / 2;
scene.add(floor);

socket.on("player-assigned", (player) => {
  myPlayer = player;
  myCube = myPlayer === "player1" ? greenCube : redCube;
});

socket.on("update-positions", (positions) => {
  greenCube.position.set(
    positions[myPlayer].x,
    positions[myPlayer].y,
    positions[myPlayer].z
  );

  const otherPlayer = myPlayer === 'player1' ? 'player2' : 'player1';
  redCube.position.set(
    positions[otherPlayer].x,
    positions[otherPlayer].y,
    positions[otherPlayer].z
  );
});


function sendMyPosition() {
  if (!myPlayer) return;
  socket.emit("move-cube", {
    x: myCube.position.x,
    y: myCube.position.y,
    z: myCube.position.z,
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


const jumpStatus = {
  isJumping: false,
  startTime: 0,
  duration: 650,
  startY: 0,
};

function startJump() {
  if (!jumpStatus.isJumping) {
    jumpStatus.isJumping = true;
    jumpStatus.startTime = performance.now();
    jumpStatus.startY = myCube.position.y;
  }
}

function updateJump(currentTime) {
  if (!jumpStatus.isJumping) return;

  const elapsed = currentTime - jumpStatus.startTime;
  const t = elapsed / jumpStatus.duration;

  if (t >= 1) {
    myCube.position.y = jumpStatus.startY;
    jumpStatus.isJumping = false;
    return;
  }

  // x va de -1 à 1
  const x = 2 * t - 1;
  const y = -x * x + 1;

  myCube.position.y = jumpStatus.startY + y;
}

function animate(currentTime) {
  requestAnimationFrame(animate);

  if (keys.KeyW) myCube.position.z -= 0.1;
  if (keys.KeyS) myCube.position.z += 0.1;
  if (keys.KeyA) myCube.position.x -= 0.1;
  if (keys.KeyD) myCube.position.x += 0.1;
  if (keys.Space) startJump();
  if (keys.ShiftLeft) myCube.position.y -= 0.1;


  updateJump(currentTime);

  sendMyPosition();

  console.log(myCube.position.y);

  renderer.render(scene, camera);
}

animate();
