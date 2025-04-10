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

      { x: 9.8, y: 0, z: 11.21, w: 5, d: 0.5 },
      { x: -9.8, y: 0, z: 11.21, w: 5, d: 0.5 },

      { x: 9.8, y: 0, z: -11.21, w: 5, d: 0.5 },
      { x: -9.8, y: 0, z: -11.21, w: 5, d: 0.5 },

      // New walls
      { x: 2, y: 0, z: -11, w: 5, d: 0.5 },
      { x: 4.3, y: 0, z: -10, w: 0.5, d: 2 },
      { x: -4.3, y: 0, z: -13, w: 0.5, d: 2 },
      { x: -11, y: 0, z: -4, w: 2, d: 3 },
      { x: -7.5, y: 0, z: 10, w: 0.5, d: 3 },

      { x: -2, y: 0, z: 11, w: 5, d: 0.5 },
      { x: -4.3, y: 0, z: 10, w: 0.5, d: 2 },
      { x: 4.3, y: 0, z: 13, w: 0.5, d: 2 },
      { x: 11, y: 0, z: 4, w: 2, d: 3 },
      { x: 7.5, y: 0, z: -10, w: 0.5, d: 3 },









    ];
  
    murs.forEach(mur => {
      const geometry = new THREE.BoxGeometry(mur.w, hauteur, mur.d);
      const texture = new THREE.TextureLoader().load( "./textures/brick.png" );
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(5, 10 );
      texture.anisotropy = 16; // Améliore la qualité de la texture
      
      const material = new THREE.MeshStandardMaterial({
          map: texture,

       });
      
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

export let flagMesh = null;

export function createFlag(scene, world) {
  // Création du drapeau
    const flagGeometry = new THREE.BoxGeometry(0.1, 1, 0.1);
    const flagMaterial = new THREE.MeshStandardMaterial({ color: 0xFF0000 });
    flagMesh = new THREE.Mesh(flagGeometry, flagMaterial);
    flagMesh.position.set(0, 0.5, 0); // Position initiale du drapeau
    scene.add(flagMesh);
    // Création du sol rouge
    const groundGeometry = new THREE.PlaneGeometry(3, 3); // Taille du sol
    const groundMaterial = new THREE.MeshStandardMaterial({ color: 0xFF0000 });
    const groundMesh = new THREE.Mesh(groundGeometry, groundMaterial);
    groundMesh.rotation.x = - Math.PI / 2; // Incliner le sol pour qu'il soit horizontal
    groundMesh.position.set(0, 0.001, 0); // Position du sol
    scene.add(groundMesh);
  
    // Création de la zone de physique pour le sol
    const groundBodyDesc = RAPIER.RigidBodyDesc.fixed().setTranslation(0, 0, 0);
    const groundBody = world.createRigidBody(groundBodyDesc);
    const groundCollider = RAPIER.ColliderDesc.cuboid(5, 0.05, 5); // Taille du sol pour la physique
    world.createCollider(groundCollider, groundBody);
  
    // Création du drapeau avec physique
    const flagBodyDesc = RAPIER.RigidBodyDesc.fixed().setTranslation(0, 0.5, 0);
    const flagBody = world.createRigidBody(flagBodyDesc);
    const flagCollider = RAPIER.ColliderDesc.cuboid(0.25, 0.5, 0.05); // Taille du drapeau
    world.createCollider(flagCollider, flagBody);
  }
   
  export function zoneSpawn1(scene, world) {
    const spawnGeometry = new THREE.PlaneGeometry(2.5,2.5); // Taille de la zone de spawn    
    const spawnMaterial = new THREE.MeshStandardMaterial({ color: 0x0000ff });
    const spawnMesh = new THREE.Mesh(spawnGeometry, spawnMaterial);    
    spawnMesh.position.set(-12,75, 0.01, -12.75); // Position de la zone de spawn
    spawnMesh.rotation.x = - Math.PI / 2; // Incliner la zone de spawn pour qu'elle soit horizontale
    scene.add(spawnMesh);

  
    // Création de la zone de physique pour le spawn
    const spawnBodyDesc = RAPIER.RigidBodyDesc.fixed().setTranslation(0, 0.05, 0);
    const spawnBody = world.createRigidBody(spawnBodyDesc);
    const spawnCollider = RAPIER.ColliderDesc.cuboid(0.25, 0.05, 0.25); // Taille de la zone de spawn pour la physique
    world.createCollider(spawnCollider, spawnBody);
  }

  export function zoneSpawn2(scene, world) {
    const spawnGeometry = new THREE.PlaneGeometry(2.5,2.5); // Taille de la zone de spawn    
    const spawnMaterial = new THREE.MeshStandardMaterial({ color: 0x0000ff });
    const spawnMesh = new THREE.Mesh(spawnGeometry, spawnMaterial);    
    spawnMesh.position.set(12.75, 0.01, 12.75); // Position de la zone de spawn
    spawnMesh.rotation.x = - Math.PI / 2; // Incliner la zone de spawn pour qu'elle soit horizontale
    scene.add(spawnMesh);

  
    // Création de la zone de physique pour le spawn
    const spawnBodyDesc = RAPIER.RigidBodyDesc.fixed().setTranslation(0, 0.05, 0);
    const spawnBody = world.createRigidBody(spawnBodyDesc);
    const spawnCollider = RAPIER.ColliderDesc.cuboid(0.25, 0.05, 0.25); // Taille de la zone de spawn pour la physique
    world.createCollider(spawnCollider, spawnBody);
  }
  