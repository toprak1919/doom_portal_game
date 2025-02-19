// src/game/Portal.js
import * as THREE from 'three';

export class Portal {
  constructor(renderer, id, particleSystem) {
    this.renderer = renderer;
    this.id = id; // "A" or "B"
    this.particleSystem = particleSystem;
    this.active = false;
    
    // Create render target for portal view
    this.renderTarget = new THREE.WebGLRenderTarget(512, 512, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter
    });
    
    // Portal camera for rendering other portal's view
    this.portalCamera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
    
    this.mesh = this.createPortalMesh();
    this.position = new THREE.Vector3();
    this.normal = new THREE.Vector3();
  }

  createPortalMesh() {
    const geo = new THREE.PlaneGeometry(1.5, 2.5);
    const mat = new THREE.MeshBasicMaterial({
      map: this.renderTarget.texture,
      side: THREE.DoubleSide
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.visible = false;
    this.renderer.scene.add(mesh);
    return mesh;
  }

  placePortal(position, normal) {
    this.active = true;
    
    // Add small offset to prevent z-fighting and wall clipping
    const offset = 0.05;
    this.position.copy(position).add(normal.clone().multiplyScalar(offset));
    
    // Store normalized normal for teleportation calculations
    this.normal.copy(normal).normalize();

    // Position and orient the portal mesh
    this.mesh.position.copy(this.position);
    
    // Create quaternion to align portal with wall normal
    const targetDir = this.normal.clone().negate();
    const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), targetDir);
    this.mesh.quaternion.copy(quat);
    
    // Make portal visible
    this.mesh.visible = true;
    
    // Emit portal placement particles
    if (this.particleSystem) {
      // Ring effect around portal edge
      const ringPoints = 8;
      for (let i = 0; i < ringPoints; i++) {
        const angle = (i / ringPoints) * Math.PI * 2;
        const offset = new THREE.Vector3(
          Math.cos(angle) * 0.75,
          Math.sin(angle) * 1.25,
          0
        );
        offset.applyQuaternion(quat);
        const emitPos = this.position.clone().add(offset);
        
        this.particleSystem.emitParticles('portalEffects', emitPos, {
          count: 1,
          speed: 1.5,
          size: 0.15
        });
      }
      
      // Center burst
      this.particleSystem.emitParticles('portalEffects', this.position, {
        count: 20,
        speed: 2,
        size: 0.2
      });
    }
  }

  deactivate() {
    this.active = false;
    this.mesh.visible = false;
  }
}

// Add PortalManager class to handle portal pairs
export class PortalManager {
  constructor(renderer, particleSystem) {
    this.renderer = renderer;
    this.particleSystem = particleSystem;
    this.portalA = new Portal(renderer, 'A', particleSystem);
    this.portalB = new Portal(renderer, 'B', particleSystem);
    this.teleportCooldown = 0;
  }

  updatePortalView(sourcePortal, destPortal, mainCamera) {
    // Hide the source portal's mesh to prevent it from being sampled
    const originalVisibility = sourcePortal.mesh.visible;
    sourcePortal.mesh.visible = false;
    
    // Calculate the relative position and update destPortal.portalCamera
    const relativePos = mainCamera.position.clone().sub(sourcePortal.position);
    const srcQuat = sourcePortal.mesh.quaternion.clone().normalize();
    const dstQuat = destPortal.mesh.quaternion.clone().normalize();
    const deltaQuat = dstQuat.clone().multiply(srcQuat.clone().invert()).normalize();
    const newRelPos = relativePos.applyQuaternion(deltaQuat);
    destPortal.portalCamera.position.copy(destPortal.position).add(newRelPos);
    
    const mainQuat = mainCamera.quaternion.clone().normalize();
    const newQuat = deltaQuat.clone().multiply(mainQuat).normalize();
    destPortal.portalCamera.quaternion.copy(newQuat);
    destPortal.portalCamera.updateMatrixWorld();

    // Update portal camera aspect ratio
    destPortal.portalCamera.aspect = window.innerWidth / window.innerHeight;
    destPortal.portalCamera.updateProjectionMatrix();

    // Render the scene from the destination portal camera into the source portal's render target
    const currentTarget = this.renderer.renderer.getRenderTarget();
    this.renderer.renderer.setRenderTarget(sourcePortal.renderTarget);
    this.renderer.renderer.clear();
    this.renderer.renderer.render(this.renderer.scene, destPortal.portalCamera);
    this.renderer.renderer.setRenderTarget(currentTarget);
    
    // Restore visibility
    sourcePortal.mesh.visible = originalVisibility;
  }

  update(mainCamera) {
    if (!this.portalA.active || !this.portalB.active) return;

    if (this.teleportCooldown > 0) {
      this.teleportCooldown--;
    }

    // Check for portal teleportation
    this.checkTeleportation(this.portalA, this.portalB);
    this.checkTeleportation(this.portalB, this.portalA);

    // Update portal views
    this.updatePortalView(this.portalA, this.portalB, mainCamera);
    this.updatePortalView(this.portalB, this.portalA, mainCamera);
  }

  checkTeleportation(sourcePortal, destPortal) {
    if (this.teleportCooldown > 0) return;

    const playerPos = this.renderer.cameraRig.position;
    const portalPos = sourcePortal.position;
    const portalNormal = sourcePortal.normal;

    // Check if player is close to portal
    const distanceToPortal = playerPos.distanceTo(portalPos);
    if (distanceToPortal > 1.5) return;

    // Check if player is in front of portal
    const playerToPortal = new THREE.Vector3().subVectors(portalPos, playerPos);
    const dotProduct = playerToPortal.dot(portalNormal);
    
    if (dotProduct > 0) {
      this.teleportPlayer(sourcePortal, destPortal);
    }
  }

  teleportPlayer(sourcePortal, destPortal) {
    // Calculate teleport position and rotation
    const playerRig = this.renderer.cameraRig;
    const relativePos = new THREE.Vector3().subVectors(
      playerRig.position,
      sourcePortal.position
    );
    
    // Rotate relative position
    const rotationDiff = new THREE.Quaternion();
    rotationDiff.setFromUnitVectors(
      sourcePortal.normal,
      destPortal.normal.clone().negate()
    );
    relativePos.applyQuaternion(rotationDiff);
    
    // Set new position
    playerRig.position.copy(destPortal.position).add(relativePos);
    
    // Rotate player view
    playerRig.rotation.y += Math.PI;
    
    // Add teleport effects
    this.particleSystem.emitParticles('portalEffects', playerRig.position, {
      count: 30,
      speed: 2,
      size: 0.2
    });
    
    this.teleportCooldown = 10; // Prevent immediate re-teleportation
  }

  placePortal(id, position, normal) {
    const portal = id === 'A' ? this.portalA : this.portalB;
    portal.placePortal(position, normal);
  }
} 