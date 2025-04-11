import * as THREE from "https://esm.sh/three@0.160";
import RAPIER from 'https://cdn.skypack.dev/@dimforge/rapier3d-compat';

const projectiles = [];
let socket = null; // Sera défini plus tard

export function setSocketInstance(io) {
    socket = io;
}

export function startRaycast(world, camera, scene) {
    window.addEventListener('click', () => {
        if (!socket) return;

        const origin = new THREE.Vector3();
        camera.getWorldPosition(origin);

        const direction = new THREE.Vector3();
        camera.getWorldDirection(direction);
        origin.add(direction.clone().multiplyScalar(0.5)); // décaler le point d'origine

        // Crée et affiche le projectile localement
        createProjectile(world, scene, origin, direction);

        // Envoie le projectile au serveur
        socket.emit("projectile-fired", {
            origin: { x: origin.x, y: origin.y, z: origin.z },
            direction: { x: direction.x, y: direction.y, z: direction.z }
        });
    });
}

export function spawnProjectileFromData(world, scene, origin, direction) {
    const originVec = new THREE.Vector3(origin.x, origin.y, origin.z);
    const directionVec = new THREE.Vector3(direction.x, direction.y, direction.z);
    createProjectile(world, scene, originVec, directionVec);
}

function createProjectile(world, scene, origin, direction) {
    const geometry = new THREE.SphereGeometry(0.2, 16, 16);
    const material = new THREE.MeshStandardMaterial({
        color: 0xff0000,
        emissive: 0xff3333,
        emissiveIntensity: 0.5
    });

    const projectileMesh = new THREE.Mesh(geometry, material);
    projectileMesh.position.copy(origin);
    scene.add(projectileMesh);

    const rigidBodyDesc = RAPIER.RigidBodyDesc.dynamic()
        .setTranslation(origin.x, origin.y, origin.z)
        .setLinearDamping(0.1);
    const rigidBody = world.createRigidBody(rigidBodyDesc);

    const colliderDesc = RAPIER.ColliderDesc.ball(0.2)
        .setRestitution(0.7)
        .setFriction(2)
        .setDensity(1000);
    world.createCollider(colliderDesc, rigidBody);

    const speed = 30;
    rigidBody.setLinvel({
        x: direction.x * speed,
        y: direction.y * speed,
        z: direction.z * speed
    });

    projectiles.push({
        mesh: projectileMesh,
        body: rigidBody,
        createdAt: performance.now()
    });
}

export function updateProjectiles(world, scene) {
    const now = performance.now();
    const maxLifetime = 5000;

    for (let i = projectiles.length - 1; i >= 0; i--) {
        const projectile = projectiles[i];
        const pos = projectile.body.translation();
        projectile.mesh.position.set(pos.x, pos.y, pos.z);
    }
}
