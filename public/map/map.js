import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.1/build/three.module.js";  
import RAPIER from 'https://cdn.skypack.dev/@dimforge/rapier3d-compat';

export function createMurs(scene, world , hauteur) {

    const murs = [
      // murs bas 
      { x: -1, y: 0 , z: 4, w:0.5, d: 4},
      { x: 2, y: 0 , z: 3, w:0.5, d: 3},
      { x: 3.25, y: 0 , z: 1.5, w:3, d: 0.5},
      { x: -7, y: 0 , z: 0.5, w:0.5, d: 2},
      { x: -6.5, y: 0 , z: 1.25, w:1, d: 0.5},

      { x: 5.3, y: 0 , z: 7.25, w:3, d: 0.5},
      { x: 7, y: 0 , z: 6, w:0.5, d: 3},

      { x: -5, y: 0 , z: 4.5, w:0.5, d: 1},
      { x: -5.8, y: 0 , z: 4.21, w:2, d: 0.5},

      // murs haut
      { x: 1, y: 0, z: -4, w: 0.5, d: 4 },
      { x: -2, y: 0, z: -3, w: 0.5, d: 3 },
      { x: -3.25, y: 0, z: -1.5, w: 3, d: 0.5 },
      { x: 7, y: 0, z: -0.5, w: 0.5, d: 2 },
      { x: 6.5, y: 0, z: -1.25, w: 1, d: 0.5 },

      { x: -5.3, y: 0, z: -7.25, w: 3, d: 0.5 },
      { x: -7, y: 0, z: -6, w: 0.5, d: 3 },
      { x: 5, y: 0, z: -4.5, w: 0.5, d: 1 },
      { x: 5.8, y: 0, z: -4.21, w: 2, d: 0.5 },
    ];
  
    murs.forEach(mur => {
      const geometry = new THREE.BoxGeometry(mur.w, hauteur, mur.d);
      const material = new THREE.MeshStandardMaterial({ color: 0xcb6ce6 });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(mur.x, mur.y, mur.z);
      scene.add(mesh);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
  
      const bodyDesc = RAPIER.RigidBodyDesc.fixed().setTranslation(mur.x, mur.y, mur.z);
      const body = world.createRigidBody(bodyDesc);
      const collider = RAPIER.ColliderDesc.cuboid(mur.w / 2, hauteur / 2, mur.d / 2);
      world.createCollider(collider, body);
    });
  }
  