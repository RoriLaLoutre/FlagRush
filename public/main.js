
const socket = io('http://10.3.217.143:3000');
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
const geometry = new THREE.BoxGeometry();
const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
const cube = new THREE.Mesh(geometry, material);
scene.add(cube);

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

function jump(jumpHeight=1 , base_position_y , jumpSpeed=0.1) {
  while (cube.position.y < base_position_y + jumpHeight) {
    cube.position.y += 0.1 * jumpSpeed;
  }
}

function animate() {
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
    jump(1, cube.position.y);
    socket.emit("move-cube", { x: cube.position.x, y: cube.position.y, z: cube.position.z });
  }
  if (keys.ShiftLeft) {
    cube.position.y -= 0.1;
    socket.emit("move-cube", { x: cube.position.x, y: cube.position.y, z: cube.position.z });
  }

  renderer.render(scene, camera);
}

animate();
