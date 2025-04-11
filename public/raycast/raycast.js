import * as THREE from "https://esm.sh/three@0.160";
import RAPIER from 'https://cdn.skypack.dev/@dimforge/rapier3d-compat';

const projectiles = [];

export function startRaycast(world, camera, scene) {
    window.addEventListener('click', () => {
        // Get camera position and direction
        const origin = new THREE.Vector3();
        camera.getWorldPosition(origin);
        
        const direction = new THREE.Vector3();
        camera.getWorldDirection(direction);
        
        // Small offset to avoid starting inside player
        origin.add(direction.clone().multiplyScalar(0.5));
        
        // Create Rapier ray
        const rayOrigin = new RAPIER.Vector3(origin.x, origin.y, origin.z);
        const rayDirection = new RAPIER.Vector3(direction.x, direction.y, direction.z);
        const ray = new RAPIER.Ray(rayOrigin, rayDirection);
        
        // Cast ray
        const maxDistance = 75;
        const hit = world.castRay(ray, maxDistance, true);

        if (hit && hit.toi !== undefined) {
            const hitPoint = ray.pointAt(hit.toi);
            console.log("Hit detected at:", hitPoint);

            createProjectile(world, scene, origin, direction);
        } else {
            console.log("No hit detected.");
            createProjectile(world, scene, origin, direction);
        }
    });
}

function createProjectile(world, scene, origin, direction) {
    // Create visual sphere
    const geometry = new THREE.SphereGeometry(0.2, 16, 16);
    const material = new THREE.MeshStandardMaterial({ 
        color: 0xff0000,
        emissive: 0xff3333,
        emissiveIntensity: 0.5
    });
    const projectileMesh = new THREE.Mesh(geometry, material);
    projectileMesh.position.copy(origin);
    scene.add(projectileMesh);

    // Create physics body
    const rigidBodyDesc = RAPIER.RigidBodyDesc.dynamic()
        .setTranslation(origin.x, origin.y, origin.z)
        .setLinearDamping(0.1); // Add some damping
    const rigidBody = world.createRigidBody(rigidBodyDesc);

    const colliderDesc = RAPIER.ColliderDesc.ball(0.2)
        .setRestitution(0.7) // Add bounce
        .setFriction(0.1);
    world.createCollider(colliderDesc, rigidBody);

    // Apply velocity
    const speed = 30;
    rigidBody.setLinvel({
        x: direction.x * speed,
        y: direction.y * speed,
        z: direction.z * speed
    });

    // Add to projectiles array
    projectiles.push({ 
        mesh: projectileMesh, 
        body: rigidBody,
        createdAt: performance.now() 
    });
}

export function updateProjectiles(world, scene) {
    const now = performance.now();
    const maxLifetime = 5000; // 5 seconds
    
    for (let i = projectiles.length - 1; i >= 0; i--) {
        const projectile = projectiles[i];
        const pos = projectile.body.translation();
        
        // Update position
        projectile.mesh.position.set(pos.x, pos.y, pos.z);
    }
}