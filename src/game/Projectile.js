import * as THREE from 'three';

export class Projectile {
  constructor(position, direction, speed = 20) {
    this.position = position.clone();
    this.direction = direction.clone().normalize();
    this.speed = speed;

    const geo = new THREE.SphereGeometry(0.05, 8, 8);
    const mat = new THREE.MeshBasicMaterial({ color: 0xffff00 });
    this.mesh = new THREE.Mesh(geo, mat);
    this.mesh.position.copy(this.position);
    
    this.lifespan = 3;
    this.age = 0;
  }

  update(delta) {
    const displacement = this.direction.clone().multiplyScalar(this.speed * delta);
    this.position.add(displacement);
    this.mesh.position.copy(this.position);
    this.age += delta;
  }

  isExpired() {
    return this.age > this.lifespan;
  }
} 