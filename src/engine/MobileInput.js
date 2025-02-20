import * as THREE from 'three';

export class MobileInput {
  constructor() {
    // Common input values used by the game
    this.keys = {
      forward: false,
      backward: false,
      left: false,
      right: false,
      jump: false,
      shoot: false,
      altShoot: false,
      sprint: false
    };
    
    this.moveVector = new THREE.Vector2(0, 0);
    this.lookDelta = new THREE.Vector2(0, 0);
    this.mouseLocked = true; // Always true for mobile
    this.sensitivity = 1.5;
    
    // Create UI elements
    this.createUI();
  }

  createUI() {
    // Create left joystick for movement
    this.leftJoystick = document.createElement('div');
    this.leftJoystick.className = 'virtualJoystick left';
    document.body.appendChild(this.leftJoystick);

    // Create right joystick for camera look
    this.rightJoystick = document.createElement('div');
    this.rightJoystick.className = 'virtualJoystick right';
    document.body.appendChild(this.rightJoystick);

    // Create shoot button
    this.shootButton = document.createElement('button');
    this.shootButton.className = 'actionButton shoot';
    this.shootButton.textContent = 'Shoot';
    document.body.appendChild(this.shootButton);

    // Create jump button
    this.jumpButton = document.createElement('button');
    this.jumpButton.className = 'actionButton jump';
    this.jumpButton.textContent = 'Jump';
    document.body.appendChild(this.jumpButton);

    // Setup touch events
    this.setupJoystick(this.leftJoystick, 'move');
    this.setupJoystick(this.rightJoystick, 'look');
    this.setupActionButtons();
  }

  setupJoystick(container, type) {
    container.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const touch = e.changedTouches[0];
      container.dataset.startX = touch.clientX;
      container.dataset.startY = touch.clientY;
    });

    container.addEventListener('touchmove', (e) => {
      e.preventDefault();
      const touch = e.changedTouches[0];
      const startX = parseFloat(container.dataset.startX);
      const startY = parseFloat(container.dataset.startY);
      const deltaX = touch.clientX - startX;
      const deltaY = touch.clientY - startY;
      const maxDist = 50;

      const clampedX = Math.max(-maxDist, Math.min(deltaX, maxDist));
      const clampedY = Math.max(-maxDist, Math.min(deltaY, maxDist));

      if (type === 'move') {
        this.moveVector.set(clampedX / maxDist, -clampedY / maxDist);
        // Update WASD-style keys for compatibility
        this.keys.right = this.moveVector.x > 0.3;
        this.keys.left = this.moveVector.x < -0.3;
        this.keys.backward = this.moveVector.y < -0.3;
        this.keys.forward = this.moveVector.y > 0.3;
      } else if (type === 'look') {
        this.lookDelta.set(
          clampedX * this.sensitivity * 0.1,
          clampedY * this.sensitivity * 0.1
        );
      }
    });

    container.addEventListener('touchend', (e) => {
      e.preventDefault();
      if (type === 'move') {
        this.moveVector.set(0, 0);
        this.keys.forward = false;
        this.keys.backward = false;
        this.keys.left = false;
        this.keys.right = false;
      } else if (type === 'look') {
        this.lookDelta.set(0, 0);
      }
    });
  }

  setupActionButtons() {
    this.shootButton.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.keys.shoot = true;
    });
    this.shootButton.addEventListener('touchend', (e) => {
      e.preventDefault();
      this.keys.shoot = false;
    });

    this.jumpButton.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.keys.jump = true;
    });
    this.jumpButton.addEventListener('touchend', (e) => {
      e.preventDefault();
      this.keys.jump = false;
    });
  }

  resetMouseDelta() {
    this.lookDelta.set(0, 0);
  }

  isMoving() {
    return this.keys.forward || this.keys.backward || 
           this.keys.left || this.keys.right;
  }

  lockMouse() {
    // For mobile, we don't need to do anything since we're using touch controls
    this.mouseLocked = true;
  }
} 