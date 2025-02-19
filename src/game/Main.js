// src/game/Main.js
import * as THREE from 'three';
import { Renderer } from '../engine/Renderer.js';
import { Physics } from '../engine/Physics.js';
import { Input } from '../engine/Input.js';
import { AudioEngine } from '../engine/Audio.js';
import { Level } from './Level.js';
import { Player } from './Player.js';
import { Enemy } from './Enemy.js';
import { UI } from './UI.js';
import { PortalManager } from './Portal.js';
import { ParticleSystem } from '../engine/ParticleSystem.js';

let lastTime = 0;
const enemies = [];

let renderer, physics, input, audioEngine, level, player, ui;
let portalManager;
let particleSystem;

function loop(timestamp) {
  const delta = (timestamp - lastTime) / 1000;
  lastTime = timestamp;

  if (document.getElementById('startScreen').style.display === 'none') {
    player.update(delta);
    enemies.forEach(e => e.update(delta, renderer.cameraRig.position));
    portalManager.update(renderer.camera);
    
    // Update projectiles
    if (window.projectiles) {
      window.projectiles.forEach((proj, index) => {
        proj.update(delta);
        if (proj.isExpired()) {
          renderer.scene.remove(proj.mesh);
          window.projectiles.splice(index, 1);
        }
      });
    }
  }

  ui.updateMinimap();
  particleSystem.update();
  renderer.render();
  requestAnimationFrame(loop);
}

// Export the initialization function
export function init() {
  renderer = new Renderer();
  physics = new Physics(renderer);
  input = new Input();
  audioEngine = new AudioEngine();

  particleSystem = new ParticleSystem(renderer);
  particleSystem.createParticleGroup('bulletImpacts', 1000);
  particleSystem.createParticleGroup('portalEffects', 500);

  level = new Level(renderer, physics);
  level.generateLevel(50, 50, 'default');

  portalManager = new PortalManager(renderer, particleSystem);
  renderer.setPortalManager(portalManager);

  // Create player after portalManager is initialized
  player = new Player(renderer, physics, input, audioEngine, portalManager, particleSystem);
  renderer.cameraRig.position.set(25, 1, 25);

  const enemy = new Enemy(renderer, physics, level, 30, 30);
  enemies.push(enemy);

  ui = new UI(level, player, input, audioEngine);

  // Initial portal placements
  portalManager.placePortal('A', 
    new THREE.Vector3(20, 1, 20), 
    new THREE.Vector3(0, 0, 1)
  );
  portalManager.placePortal('B',
    new THREE.Vector3(30, 1, 30),
    new THREE.Vector3(0, 0, -1)
  );

  requestAnimationFrame(loop);
}

window.addEventListener('load', () => {
  init();
}); 