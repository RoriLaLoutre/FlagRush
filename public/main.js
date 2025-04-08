
const socket = io('http://127.0.0.1:999');
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
const geometry = new THREE.BoxGeometry(0.5 , 1, 0.5);
const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
const cube = new THREE.Mesh(geometry, material);
scene.add(cube);
cube.position.set(0, 0.44, 0); // Position initiale du cube

// Sol noir
const planeGeometry = new THREE.PlaneGeometry(100, 100);
const planeMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
const floor = new THREE.Mesh(planeGeometry, planeMaterial);
floor.rotation.x = -Math.PI / 2;
scene.add(floor);


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

socket.on("position", (pos) => {
  cube.position.set(pos.x, pos.y, pos.z);
});


socket.on("move-cube", (pos) => {
  cube.position.set(pos.x, pos.y, pos.z);
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
    jumpStatus.startY = cube.position.y;
  }
}

function updateJump(currentTime) {
  if (!jumpStatus.isJumping) return;

  const elapsed = currentTime - jumpStatus.startTime;
  const t = elapsed / jumpStatus.duration;

  if (t >= 1) {
    cube.position.y = jumpStatus.startY;
    jumpStatus.isJumping = false;
    return;
  }

  // x va de -1 à 1
  const x = 2 * t - 1;
  const y = -x * x + 1;

  cube.position.y = jumpStatus.startY + y;
}

function animate(currentTime) {
  requestAnimationFrame(animate);

  if (keys.KeyW) {
    cube.position.z -= 0.1;
    socket.emit("move-cube", { x: cube.position.x, y: cube.position.y, z: cube.position.z });
  }
  if (keys.KeyS) {
    cube.position.z += 0.1;
    socket.emit("move-cube", { x: cube.position.x, y: cube.position.y, z: cube.position.z });
  }
  if (keys.KeyA) {
    cube.position.x -= 0.1;
    socket.emit("move-cube", { x: cube.position.x, y: cube.position.y, z: cube.position.z });
  }
  if (keys.KeyD) {
    cube.position.x += 0.1;
    socket.emit("move-cube", { x: cube.position.x, y: cube.position.y, z: cube.position.z });
  }
  if (keys.Space) {
    startJump();
  }

  // Met à jour le saut en fonction du temps
  updateJump(currentTime);

  // Emit à chaque frame (optimisable si besoin)
  socket.emit("move-cube", {
    x: cube.position.x,
    y: cube.position.y,
    z: cube.position.z,
  });
  if (keys.ShiftLeft) {
    cube.position.y -= 0.1;
    socket.emit("move-cube", { x: cube.position.x, y: cube.position.y, z: cube.position.z });
  }
  console.log(cube.position.y);

  renderer.render(scene, camera);
}

animate();
