// src/engine/Input.js

export class Input {
  constructor() {
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
    this.mouseLocked = false;
    this.mouseDeltaX = 0;
    this.mouseDeltaY = 0;
    this.sensitivity = 1.5;

    this.setupKeyboard();
    this.setupMouse();
  }

  setupKeyboard() {
    window.addEventListener('keydown', (e) => {
      switch (e.code) {
        case 'KeyW': this.keys.forward = true; break;
        case 'KeyS': this.keys.backward = true; break;
        case 'KeyA': this.keys.left = true; break;
        case 'KeyD': this.keys.right = true; break;
        case 'Space': this.keys.jump = true; break;
        case 'ShiftLeft': this.keys.sprint = true; break;
      }
    });

    window.addEventListener('keyup', (e) => {
      switch (e.code) {
        case 'KeyW': this.keys.forward = false; break;
        case 'KeyS': this.keys.backward = false; break;
        case 'KeyA': this.keys.left = false; break;
        case 'KeyD': this.keys.right = false; break;
        case 'Space': this.keys.jump = false; break;
        case 'ShiftLeft': this.keys.sprint = false; break;
      }
    });
  }

  setupMouse() {
    const canvas = document.getElementById('gameCanvas');
    
    // Prevent context menu on right click
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    
    canvas.addEventListener('click', () => {
      if (!this.mouseLocked) {
        canvas.requestPointerLock();
      }
    });

    document.addEventListener('pointerlockchange', () => {
      this.mouseLocked = document.pointerLockElement === canvas;
    });

    document.addEventListener('mousemove', (e) => {
      if (this.mouseLocked) {
        // Apply sensitivity and clamp extreme values
        this.mouseDeltaX = Math.min(Math.max(e.movementX, -50), 50) * this.sensitivity;
        this.mouseDeltaY = Math.min(Math.max(e.movementY, -50), 50) * this.sensitivity;
      }
    });

    document.addEventListener('mousedown', (e) => {
      if (!this.mouseLocked) return;
      if (e.button === 0) this.keys.shoot = true;
      if (e.button === 2) this.keys.altShoot = true;
    });

    document.addEventListener('mouseup', (e) => {
      if (e.button === 0) this.keys.shoot = false;
      if (e.button === 2) this.keys.altShoot = false;
    });

    // Handle pointer lock errors
    document.addEventListener('pointerlockerror', () => {
      console.warn('Pointer lock failed');
    });
  }

  resetMouseDelta() {
    this.mouseDeltaX = 0;
    this.mouseDeltaY = 0;
  }

  setSensitivity(value) {
    this.sensitivity = value;
  }

  // Helper method to check if any movement keys are pressed
  isMoving() {
    return this.keys.forward || this.keys.backward || 
           this.keys.left || this.keys.right;
  }
} 