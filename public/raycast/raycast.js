import * as THREE from "https://esm.sh/three@0.160";
import RAPIER from 'https://cdn.skypack.dev/@dimforge/rapier3d-compat';

export function startRaycast(world, camera) {
    window.addEventListener('click', () => {
        // Obtenir la position actuelle de la caméra dans l'espace global
        const getOrigin = new THREE.Vector3();
        camera.getWorldPosition(getOrigin); 
        
        // Obtenir la direction du regard de la caméra (basée sur sa rotation)
        const getDirection = new THREE.Vector3();
        camera.getWorldDirection(getDirection);
        getDirection.normalize();
        
        // Appliquer un léger décalage à l'origine pour éviter de partir de l'intérieur du cube
        const offset = getDirection.clone().multiplyScalar(0.5); // Décalage légèrement devant la caméra
        getOrigin.add(offset);  // Ajoute l'offset à la position de la caméra
        
        // Créer un rayon Rapier en utilisant la nouvelle position (décalée) et la direction
        const origin = new RAPIER.Vector3(getOrigin.x, getOrigin.y, getOrigin.z);
        const direction = new RAPIER.Vector3(getDirection.x, getDirection.y, getDirection.z);
        const ray = new RAPIER.Ray(origin, direction);
        
        // Définir la distance maximale du rayon
        const maxDistance = 75;

        // Lancer le raycast et vérifier s'il y a une collision
        const hit = world.castRay(ray, maxDistance, true);

        // Si une collision est détectée
        if (hit) {
            if (hit.timeOfImpact !== undefined) {
                console.log('Position de la caméra:', getOrigin);
                let hitPoint = ray.pointAt(hit.timeOfImpact);
                console.log("Collision détectée au clic à :", hitPoint);
            } else {
                console.log("Raycast n'a pas détecté d'impact valide.");
            }
        } else {
            console.log("Aucune collision détectée.");
        }
    });
}
