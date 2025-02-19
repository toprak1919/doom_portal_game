// src/game/Enemy.js
import * as THREE from 'three';
import { bfsPathfinding } from '../utils/BFS.js';

export class Enemy {
  constructor(renderer, physics, level, x, z) {
    this.renderer = renderer;
    this.physics = physics;
    this.level = level;
    this.group = new THREE.Group();
    this.speed = 2.0;
    this.path = [];
    this.pathIndex = 0;
    this.pathUpdateTime = 0;
    this.PATH_UPDATE_INTERVAL = 1.0; // Update path every second
    
    // Add health system
    this.maxHealth = 100;
    this.health = this.maxHealth;
    this.isDead = false;
    this.hitFlashTime = 0;
    
    // Add hit flash material
    this.normalMaterial = new THREE.MeshLambertMaterial({ color: 0x662222 });
    this.hitMaterial = new THREE.MeshLambertMaterial({ color: 0xff4444 });
    
    this.createModel();
    this.group.position.set(x + 0.5, 0, z + 0.5);
    this.renderer.scene.add(this.group);
  }

  createModel() {
    // Create torso
    const torsoGeo = new THREE.BoxGeometry(0.8, 1.2, 0.4);
    const torsoMat = new THREE.MeshLambertMaterial({ color: 0x662222 });
    this.torsoMesh = new THREE.Mesh(torsoGeo, torsoMat);
    this.torsoMesh.position.y = 0.6;
    this.group.add(this.torsoMesh);

    // Create head
    const headGeo = new THREE.SphereGeometry(0.3, 8, 8);
    const headMat = new THREE.MeshLambertMaterial({ color: 0x883333 });
    this.headMesh = new THREE.Mesh(headGeo, headMat);
    this.headMesh.position.y = 1.4;
    this.group.add(this.headMesh);

    // Create arms
    const armGeo = new THREE.BoxGeometry(0.2, 0.7, 0.2);
    const armMat = new THREE.MeshLambertMaterial({ color: 0x772222 });
    
    this.leftArm = new THREE.Mesh(armGeo, armMat);
    this.leftArm.position.set(-0.5, 0.6, 0);
    this.group.add(this.leftArm);
    
    this.rightArm = new THREE.Mesh(armGeo, armMat);
    this.rightArm.position.set(0.5, 0.6, 0);
    this.group.add(this.rightArm);
  }

  takeDamage(amount) {
    this.health -= amount;
    this.hitFlashTime = 0.1;
    
    // Apply hit flash material
    this.torsoMesh.material = this.hitMaterial;
    this.headMesh.material = this.hitMaterial;
    this.leftArm.material = this.hitMaterial;
    this.rightArm.material = this.hitMaterial;
    
    if (this.health <= 0 && !this.isDead) {
      this.die();
    }
  }

  die() {
    this.isDead = true;
    
    // Emit death particles
    particleSystem.emitParticles('bulletImpacts', this.group.position, {
      count: 30,
      speed: 4,
      size: 0.2
    });
    
    // Remove from scene
    this.renderer.scene.remove(this.group);
    
    // Remove from enemies array
    const index = enemies.indexOf(this);
    if (index > -1) {
      enemies.splice(index, 1);
    }
  }

  update(delta, playerPos) {
    if (this.isDead) return;
    
    // Update hit flash
    if (this.hitFlashTime > 0) {
      this.hitFlashTime -= delta;
      if (this.hitFlashTime <= 0) {
        this.torsoMesh.material = this.normalMaterial;
        this.headMesh.material = this.normalMaterial;
        this.leftArm.material = this.normalMaterial;
        this.rightArm.material = this.normalMaterial;
      }
    }

    // Update path to player periodically
    this.pathUpdateTime += delta;
    if (this.pathUpdateTime >= this.PATH_UPDATE_INTERVAL) {
      this.updatePathToPlayer(playerPos);
      this.pathUpdateTime = 0;
    }

    // Follow current path
    if (this.path.length > 0 && this.pathIndex < this.path.length) {
      const nextCell = this.path[this.pathIndex];
      const targetPos = new THREE.Vector3(
        nextCell.x + 0.5,
        0,
        nextCell.y + 0.5
      );
      
      const distToTarget = targetPos.distanceTo(this.group.position);
      
      if (distToTarget < 0.1) {
        this.pathIndex++;
      } else {
        // Move towards target
        const direction = targetPos.clone()
          .sub(this.group.position)
          .normalize();
        
        this.group.position.addScaledVector(direction, this.speed * delta);
        
        // Rotate to face movement direction
        const targetAngle = Math.atan2(direction.x, direction.z);
        const currentAngle = this.group.rotation.y;
        const angleDiff = targetAngle - currentAngle;
        
        // Normalize angle difference
        const normalizedDiff = Math.atan2(Math.sin(angleDiff), Math.cos(angleDiff));
        this.group.rotation.y += normalizedDiff * 5 * delta;
        
        // Animate arms while moving
        const armSwing = Math.sin(Date.now() * 0.01) * 0.2;
        this.leftArm.rotation.x = -armSwing;
        this.rightArm.rotation.x = armSwing;
      }
    }

    // Idle head movement
    this.headMesh.rotation.y = Math.sin(Date.now() * 0.002) * 0.2;
  }

  updatePathToPlayer(playerPos) {
    const startX = Math.floor(this.group.position.x);
    const startY = Math.floor(this.group.position.z);
    const endX = Math.floor(playerPos.x);
    const endY = Math.floor(playerPos.z);

    this.path = bfsPathfinding(
      this.level.grid,
      { x: startX, y: startY },
      { x: endX, y: endY }
    );
    this.pathIndex = 0;
  }
} 