import * as THREE from 'three';
import { NormalGun, PortalGun } from './Gun.js';
import { Projectile } from './Projectile.js';

export class Player {
  constructor(renderer, physics, input, audio, portalManager, particleSystem) {
    this.renderer = renderer;
    this.physics = physics;
    this.input = input;
    this.audio = audio;
    this.portalManager = portalManager;
    this.particleSystem = particleSystem;

    // Movement parameters
    this.baseSpeed = 3.0;
    this.sprintMultiplier = 1.5;
    this.velocity = new THREE.Vector3();
    this.acceleration = 20.0;
    this.deceleration = 10.0;
    this.gravity = 9.8;
    this.jumpSpeed = 5.0;
    this.onGround = true;

    // Camera control
    this.yaw = 0;
    this.pitch = 0;
    this.baseFOV = 75;
    this.sprintFOV = 85;

    // Weapon parameters
    this.shootCooldown = 0;
    this.SHOOT_COOLDOWN = 0.25; // Regular shot cooldown in seconds
    this.portalCooldown = 0;
    this.PORTAL_COOLDOWN = 1.0; // Portal shot cooldown in seconds

    // Set up gun holder
    this.gunHolder = new THREE.Group();
    this.gunHolder.position.set(0.5, -0.5, -1);
    this.renderer.camera.add(this.gunHolder);
    
    // Initialize weapons
    this.guns = {
      1: new NormalGun(this.audio),
      2: new PortalGun(this.audio)
    };
    this.currentGunIndex = 1;
    this.currentGun = this.guns[this.currentGunIndex];
    this.gunHolder.add(this.currentGun.model);

    // Add weapon switch listeners
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Digit1') this.switchGun(1);
      if (e.code === 'Digit2') this.switchGun(2);
    });
  }

  switchGun(index) {
    if (this.currentGunIndex === index) return;
    this.gunHolder.remove(this.currentGun.model);
    this.currentGunIndex = index;
    this.currentGun = this.guns[index];
    this.gunHolder.add(this.currentGun.model);
  }

  update(delta) {
    // Mouse look
    this.yaw -= this.input.mouseDeltaX * 0.002;
    this.yaw = ((this.yaw + Math.PI) % (Math.PI * 2)) - Math.PI; // Add angle wrapping
    
    this.pitch -= this.input.mouseDeltaY * 0.002;
    this.pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.pitch));
    this.input.resetMouseDelta();

    this.renderer.cameraRig.rotation.y = this.yaw;
    this.renderer.cameraHolder.rotation.x = this.pitch;

    // Calculate movement direction
    let moveDir = new THREE.Vector3();
    if (this.input.keys.forward) moveDir.z -= 1;
    if (this.input.keys.backward) moveDir.z += 1;
    if (this.input.keys.left) moveDir.x -= 1;
    if (this.input.keys.right) moveDir.x += 1;
    moveDir.normalize();

    // Apply sprint multiplier and FOV effect
    let targetSpeed = this.baseSpeed;
    let targetFOV = this.baseFOV;
    if (this.input.keys.sprint && moveDir.length() > 0) {
      targetSpeed *= this.sprintMultiplier;
      targetFOV = this.sprintFOV;
    }

    // Smoothly interpolate FOV
    this.renderer.camera.fov = THREE.MathUtils.lerp(
      this.renderer.camera.fov,
      targetFOV,
      delta * 5
    );
    this.renderer.camera.updateProjectionMatrix();

    // Convert to world space
    moveDir.applyQuaternion(this.renderer.cameraRig.quaternion);

    // Apply acceleration/deceleration
    const targetVel = moveDir.multiplyScalar(targetSpeed);
    this.velocity.x = THREE.MathUtils.lerp(
      this.velocity.x,
      targetVel.x,
      delta * (moveDir.length() > 0 ? this.acceleration : this.deceleration)
    );
    this.velocity.z = THREE.MathUtils.lerp(
      this.velocity.z,
      targetVel.z,
      delta * (moveDir.length() > 0 ? this.acceleration : this.deceleration)
    );

    // Handle jumping and gravity
    if (this.input.keys.jump && this.onGround) {
      this.velocity.y = this.jumpSpeed;
      this.onGround = false;
    }

    if (!this.onGround) {
      this.velocity.y -= this.gravity * delta;
    }

    // Update position
    const oldPos = this.renderer.cameraRig.position.clone();
    this.renderer.cameraRig.position.addScaledVector(this.velocity, delta);

    // Ground collision
    if (this.renderer.cameraRig.position.y <= 1) {
      this.renderer.cameraRig.position.y = 1;
      this.velocity.y = 0;
      this.onGround = true;
    }

    // Wall collisions
    this.physics.checkPlayerCollision(this.renderer.cameraRig.position);

    // Handle shooting
    if (this.input.keys.shoot) {
      this.handleShoot(false);
    }
    if (this.input.keys.altShoot) {
      this.handleShoot(true);
    }

    // Update cooldowns
    if (this.shootCooldown > 0) this.shootCooldown -= delta;
    if (this.portalCooldown > 0) this.portalCooldown -= delta;
  }

  handleShoot(isAlt) {
    if (this.currentGunIndex === 2) {
      // Portal gun logic
      if (this.portalCooldown > 0) return;
      this.portalCooldown = this.PORTAL_COOLDOWN;
      
      const portalType = this.currentGun.shootPortal(!isAlt);
      
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(new THREE.Vector2(), this.renderer.camera);
      
      const intersects = this.physics.raycast(raycaster.ray);
      
      if (intersects.length > 0) {
        const hit = intersects[0];
        const worldNormal = hit.face.normal.clone();
        hit.object.updateMatrixWorld();
        worldNormal.transformDirection(hit.object.matrixWorld);
        
        this.portalManager.placePortal(portalType, hit.point, worldNormal);
      }
    } else {
      // Normal gun logic
      if (this.shootCooldown > 0) return;
      this.shootCooldown = this.SHOOT_COOLDOWN;
      
      this.currentGun.shoot();
      this.audio.playGunshot();
      
      // Create projectile
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(new THREE.Vector2(), this.renderer.camera);
      const direction = raycaster.ray.direction.clone();
      
      // Offset the start position slightly forward from the camera
      const position = this.renderer.cameraRig.position.clone();
      position.add(direction.clone().multiplyScalar(0.5));
      
      const projectile = new Projectile(position, direction, 25);
      
      // Initialize projectiles array if it doesn't exist
      window.projectiles = window.projectiles || [];
      window.projectiles.push(projectile);
      
      // Add projectile to scene
      this.renderer.scene.add(projectile.mesh);
    }
  }
}