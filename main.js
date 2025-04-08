import * as THREE from 'three';
import { createMap } from './map.js';

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

// Positionner la caméra légèrement au-dessus et pointant vers le bas
camera.position.set(0, 100, 0); // Plus haute position en Y
camera.lookAt(0, 0, 0); // Regarde vers le centre de la scène (origine)


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
const planeMaterial = new THREE.MeshBasicMaterial({ color: 0xf0f0f0 });
const floor = new THREE.Mesh(planeGeometry, planeMaterial);
floor.rotation.x = -Math.PI / 2;
scene.add(floor);

// Sol bleu dans le coin bas gauche
const floorBlueLeftGeometry = new THREE.PlaneGeometry(25, 25);
const floorBlueLeftMaterial = new THREE.MeshBasicMaterial({ color: 0x0000ff });
const floorBlueLeft = new THREE.Mesh(floorBlueLeftGeometry, floorBlueLeftMaterial);
floorBlueLeft.rotation.x = -Math.PI / 2;
floorBlueLeft.position.set(-38, 0, -38); // Positionner en bas à gauche
scene.add(floorBlueLeft);

// Sol bleu dans le coin haut droit
const floorBlueRightGeometry = new THREE.PlaneGeometry(25, 25);
const floorBlueRightMaterial = new THREE.MeshBasicMaterial({ color: 0x0000ff });
const floorBlueRight = new THREE.Mesh(floorBlueRightGeometry, floorBlueRightMaterial);
floorBlueRight.rotation.x = -Math.PI / 2;
floorBlueRight.position.set(38, 0, 38); // Positionner en haut à droite
scene.add(floorBlueRight);


createMap(scene);

// Fonction d'animation
function animate() {
  requestAnimationFrame(animate);

  cubeGreen.rotation.y += 0;
  cubeRed.rotation.y += 0;

  renderer.render(scene, camera);
}

animate();
