import * as THREE from "https://esm.sh/three@0.160";

export function updateCamera(cube) {
  if (!cube) return;

  const offset = new THREE.Vector3(0, 0.5, 0); // position de la caméra sur le cube (légèrement en hauteur)
  const cubePos = cube.position.clone().add(offset);

  myCamera.position.copy(cubePos);
  myCamera.lookAt(cubePos.x, cubePos.y, cubePos.z -1); // regarde droit devant
}

export const myCamera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);