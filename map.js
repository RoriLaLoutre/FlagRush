import * as THREE from 'three';

export function createMap(scene) {
    const wallHeight = 5; // Hauteur des murs
    const wall_H = new THREE.BoxGeometry(25, wallHeight, 2);
    const wall_V = new THREE.BoxGeometry(2, wallHeight, 25);
    const materialWall = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    
    const wall1 = new THREE.Mesh(wall_H, materialWall);
    wall1.position.x = -15;
    wall1.position.y =  2;
    scene.add(wall1);

    const wall2 = new THREE.Mesh(wall_H, materialWall);
    wall2.position.x = 15;
    wall2.position.y = 2;
    scene.add(wall2);

    const wall3 = new THREE.Mesh(wall_V, materialWall);
    wall3.position.z = -15;
    wall3.position.y = 2;
    scene.add(wall3);

    const wall4 = new THREE.Mesh(wall_V, materialWall);
    wall4.position.z = 15;
    wall4.position.y = 2;
    scene.add(wall4);

}
