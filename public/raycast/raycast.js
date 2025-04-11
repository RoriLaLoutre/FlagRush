import * as THREE from "https://esm.sh/three@0.160";
import RAPIER from 'https://cdn.skypack.dev/@dimforge/rapier3d-compat';

const projectiles = [];

export function startRaycast(world, camera, scene) {
    window.addEventListener('click', () => {
        // Obtenir la position actuelle de la caméra dans l'espace global
        const getOrigin = new THREE.Vector3();
        camera.getWorldPosition(getOrigin);
        
        // Obtenir la direction du regard de la caméra
        const getDirection = new THREE.Vector3();
        camera.getWorldDirection(getDirection);
        getDirection.normalize();
        
        // Décalage léger pour ne pas commencer à l’intérieur du joueur
        const offset = getDirection.clone().multiplyScalar(0.5);
        getOrigin.add(offset);
        
        // Créer un rayon Rapier
        const origin = new RAPIER.Vector3(getOrigin.x, getOrigin.y, getOrigin.z);
        const direction = new RAPIER.Vector3(getDirection.x, getDirection.y, getDirection.z);
        const ray = new RAPIER.Ray(origin, direction);
        
        const maxDistance = 75;
        const hit = world.castRay(ray, maxDistance, true);

        if (hit && hit.timeOfImpact !== undefined) {
            let hitPoint = ray.pointAt(hit.timeOfImpact);
            console.log("Collision détectée au clic à :", hitPoint);

            // Créer la sphère visuelle
            const geometry = new THREE.SphereGeometry(0.3, 16, 16);
            const material = new THREE.MeshStandardMaterial({ color: 0xff0000 });
            const impactBall = new THREE.Mesh(geometry, material);
            impactBall.position.set(hitPoint.x, hitPoint.y, hitPoint.z);
            scene.add(impactBall);

            // Créer le collider Rapier (statique)
            const rigidBodyDesc = RAPIER.RigidBodyDesc.dynamic().setTranslation(origin.x, origin.y, origin.z);
            const rigidBody = world.createRigidBody(rigidBodyDesc);

            const colliderDesc = RAPIER.ColliderDesc.ball(0.3);
            world.createCollider(colliderDesc, rigidBody);
            projectiles.push({ mesh: impactBall, body: rigidBody });

        } else {
            console.log("Aucune collision détectée.");
        }
    });
}

export function updateProjectiles() {
    for (const { mesh, body } of projectiles) {
        const pos = body.translation();
        mesh.position.set(pos.x, pos.y, pos.z);
    }
}