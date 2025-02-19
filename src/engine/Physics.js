// src/engine/Physics.js
import * as THREE from 'three';

export class Physics {
  constructor(renderer) {
    this.renderer = renderer;
    this.wallColliders = []; // Array of {min: Vector3, max: Vector3}
    // Define a capsule for the player (using two endpoints and a radius)
    this.playerCapsule = {
      start: new THREE.Vector3(),
      end: new THREE.Vector3(),
      radius: 0.3
    };
    this.raycaster = new THREE.Raycaster();
  }

  addWallCollider(min, max) {
    this.wallColliders.push({ min: min.clone(), max: max.clone() });
  }

  checkPlayerCollision(playerPos) {
    // Update capsule endpoints relative to playerPos
    this.playerCapsule.start.copy(playerPos);
    this.playerCapsule.end.copy(playerPos).add(new THREE.Vector3(0, 1.6, 0));

    for (const wall of this.wallColliders) {
      const penetration = this.capsuleAABBCollision(this.playerCapsule, wall);
      if (penetration) {
        // Apply horizontal correction only
        penetration.y = 0;
        playerPos.add(penetration);
        // Update capsule positions after correction
        this.playerCapsule.start.add(penetration);
        this.playerCapsule.end.add(penetration);
      }
    }
  }

  capsuleAABBCollision(capsule, aabb) {
    // Find closest point on capsule line segment to AABB
    const segment = capsule.end.clone().sub(capsule.start);
    const segmentLength = segment.length();
    
    if (segmentLength === 0) return null;
    
    segment.normalize();
    const aabbCenter = new THREE.Vector3()
      .addVectors(aabb.min, aabb.max)
      .multiplyScalar(0.5);
    
    const pointOnLine = capsule.start.clone()
      .add(segment.multiplyScalar(
        Math.max(0, Math.min(segmentLength,
          aabbCenter.clone().sub(capsule.start).dot(segment)
        ))
      ));

    // Find closest point on AABB to capsule line
    const closestPoint = new THREE.Vector3();
    for (let i = 0; i < 3; i++) {
      const v = pointOnLine.getComponent(i);
      closestPoint.setComponent(i,
        Math.max(aabb.min.getComponent(i),
          Math.min(aabb.max.getComponent(i), v)
        )
      );
    }

    // Check if closest point is within capsule radius
    const penetrationVector = pointOnLine.clone().sub(closestPoint);
    const distance = penetrationVector.length();
    
    if (distance < capsule.radius) {
      penetrationVector.normalize().multiplyScalar(capsule.radius - distance);
      return penetrationVector;
    }
    
    return null;
  }

  raycast(ray) {
    // Ensure we have a raycaster instance
    if (!this.raycaster) {
      this.raycaster = new THREE.Raycaster();
    }
    this.raycaster.ray.copy(ray);
    
    // Debug: Log ray origin and direction
    console.log("Ray origin:", ray.origin.toArray(), "Ray direction:", ray.direction.toArray());
    
    // Use the global level reference to find the wall mesh
    if (window.level && window.level.mergedWallMesh) {
      const intersections = this.raycaster.intersectObject(window.level.mergedWallMesh, true);
      console.log("Raycast intersections:", intersections);
      return intersections;
    } else {
      console.warn("Wall mesh not found for raycasting");
      return [];
    }
  }
} 