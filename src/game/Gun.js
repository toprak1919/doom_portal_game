import * as THREE from 'three';

export class Gun {
  constructor() {
    this.model = new THREE.Group();
  }
  
  update(delta) {
    // Base update method for animations
  }
  
  shoot() {}
}

export class NormalGun extends Gun {
  constructor(audioEngine) {
    super();
    this.audioEngine = audioEngine;
    
    const bodyGeo = new THREE.BoxGeometry(0.4, 0.2, 1);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x555555 });
    const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
    bodyMesh.position.set(0, 0, -0.5);
    
    const barrelGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.5, 8);
    const barrelMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
    const barrelMesh = new THREE.Mesh(barrelGeo, barrelMat);
    barrelMesh.rotation.x = Math.PI / 2;
    barrelMesh.position.set(0, 0, -1.25);
    
    this.model.add(bodyMesh);
    this.model.add(barrelMesh);
  }
  
  shoot() {
    this.audioEngine.playGunshot();
  }
}

export class PortalGun extends Gun {
  constructor(audioEngine) {
    super();
    this.audioEngine = audioEngine;
    
    const baseGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.5, 12);
    const baseMat = new THREE.MeshStandardMaterial({ color: 0x0066ff });
    const baseMesh = new THREE.Mesh(baseGeo, baseMat);
    baseMesh.rotation.z = Math.PI / 2;
    baseMesh.position.set(0, 0, -0.5);
    
    const flareGeo = new THREE.SphereGeometry(0.15, 8, 8);
    const flareMat = new THREE.MeshStandardMaterial({
      color: 0x00ccff,
      emissive: 0x00ccff
    });
    const flareMesh = new THREE.Mesh(flareGeo, flareMat);
    flareMesh.position.set(0, 0, -1);
    
    this.model.add(baseMesh);
    this.model.add(flareMesh);
  }
  
  shootPortal(isLeftClick) {
    this.audioEngine.playPortalSound();
    return isLeftClick ? 'A' : 'B';
  }
} 