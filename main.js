import * as THREE from 'three';

// Création de la scène avec un ciel bleu
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
const materialGreen = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
const cubeGreen = new THREE.Mesh(geometry, materialGreen);
cubeGreen.position.x = -1.5;
cubeGreen.position.y = 0.5;
scene.add(cubeGreen);

// Cube rouge
const materialRed = new THREE.MeshBasicMaterial({ color: 0xff0000 });
const cubeRed = new THREE.Mesh(geometry, materialRed);
cubeRed.position.x = 1.5;
cubeRed.position.y = 0.5;
scene.add(cubeRed);

// Sol noir
const planeGeometry = new THREE.PlaneGeometry(100, 100);
const planeMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
const floor = new THREE.Mesh(planeGeometry, planeMaterial);
floor.rotation.x = -Math.PI / 2;
scene.add(floor);

// Fonction d'animation
function animate() {
  requestAnimationFrame(animate);

  cubeGreen.rotation.y += 0;
  cubeRed.rotation.y += 0;

  renderer.render(scene, camera);
}

animate();
