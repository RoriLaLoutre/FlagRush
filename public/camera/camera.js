import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.1/build/three.module.js";  


export function updateCamera(cube , controls) {
  if (!cube) return;

  const offset = new THREE.Vector3(0, 0.5, 0); // position de la caméra sur le cube (légèrement en hauteur)
  const cubePos = cube.position.clone().add(offset);

  controls.getObject().position.copy(cubePos); // positionne la caméra sur le cube
}

export const myCamera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);