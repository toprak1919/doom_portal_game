// src/game/UI.js

export class UI {
  constructor(level, player, input, audioEngine) {
    this.level = level;
    this.player = player;
    this.input = input;
    this.audioEngine = audioEngine;

    this.startScreen = document.getElementById('startScreen');
    this.mapMakerPanel = document.getElementById('mapMakerPanel');
    this.settingsPanel = document.getElementById('settingsPanel');
    this.mainMenu = document.getElementById('mainMenu');
    this.minimapCanvas = document.getElementById('minimap');
    this.minimapCtx = this.minimapCanvas.getContext('2d');

    this.mapWidthInput = document.getElementById('mapWidth');
    this.mapHeightInput = document.getElementById('mapHeight');
    this.mapSeedInput = document.getElementById('mapSeed');

    this.volumeControl = document.getElementById('volumeControl');
    this.sensitivityControl = document.getElementById('sensitivityControl');

    this.createMessageOverlay();
    
    this.bindEvents();
    this.hideSubPanels();
    this.setupMinimap();
  }

  createMessageOverlay() {
    this.messageOverlay = document.createElement('div');
    this.messageOverlay.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(0, 0, 0, 0.7);
      color: white;
      padding: 10px 20px;
      border-radius: 5px;
      font-family: sans-serif;
      pointer-events: none;
      opacity: 0;
      transition: opacity 0.3s;
      z-index: 1000;
    `;
    document.body.appendChild(this.messageOverlay);
  }

  showMessage(text, duration = 2000) {
    this.messageOverlay.textContent = text;
    this.messageOverlay.style.opacity = '1';
    clearTimeout(this.messageTimeout);
    this.messageTimeout = setTimeout(() => {
      this.messageOverlay.style.opacity = '0';
    }, duration);
  }

  setupMinimap() {
    this.minimapCanvas.width = 200;
    this.minimapCanvas.height = 200;
    this.minimapCanvas.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      background: rgba(0, 0, 0, 0.5);
      border: 1px solid #444;
      z-index: 900;
    `;
  }

  bindEvents() {
    // Main menu
    document.getElementById('newGameBtn').addEventListener('click', () => {
      this.startGame();
      this.showMessage('Game Started! WASD to move, Mouse to look');
    });
    document.getElementById('mapMakerBtn').addEventListener('click', () => {
      this.showPanel(this.mapMakerPanel);
    });
    document.getElementById('settingsBtn').addEventListener('click', () => {
      this.showPanel(this.settingsPanel);
    });

    // Map Maker
    document.getElementById('generateMapBtn').addEventListener('click', () => {
      const width = parseInt(this.mapWidthInput.value);
      const height = parseInt(this.mapHeightInput.value);
      const seed = this.mapSeedInput.value;
      
      if (width < 10 || height < 10) {
        this.showMessage('Map size must be at least 10x10', 3000);
        return;
      }
      
      this.level.generateLevel(width, height, seed);
      this.showMessage('New map generated!');
    });

    // Settings
    this.volumeControl.addEventListener('input', (e) => {
      const volume = parseFloat(e.target.value);
      this.audioEngine.setVolume(volume);
      this.showMessage(`Volume: ${Math.round(volume * 100)}%`);
    });
    this.sensitivityControl.addEventListener('input', (e) => {
      const sensitivity = parseFloat(e.target.value);
      this.input.setSensitivity(sensitivity);
      this.showMessage(`Mouse Sensitivity: ${sensitivity.toFixed(1)}x`);
    });

    // Back buttons
    document.querySelectorAll('.backBtn').forEach(btn => {
      btn.addEventListener('click', () => this.showPanel(this.mainMenu));
    });
  }

  hideSubPanels() {
    this.mapMakerPanel.style.display = 'none';
    this.settingsPanel.style.display = 'none';
    this.mainMenu.style.display = 'flex';
  }

  showPanel(panel) {
    this.hideSubPanels();
    if (panel === this.mainMenu) {
      this.mainMenu.style.display = 'flex';
    } else {
      this.mainMenu.style.display = 'none';
      panel.style.display = 'block';
    }
  }

  startGame() {
    this.startScreen.style.display = 'none';
    this.input.lockMouse();
  }

  updateMinimap() {
    const ctx = this.minimapCtx;
    const cellSize = this.minimapCanvas.width / this.level.width;
    
    // Clear canvas
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, this.minimapCanvas.width, this.minimapCanvas.height);
    
    // Draw grid
    for (let y = 0; y < this.level.height; y++) {
      for (let x = 0; x < this.level.width; x++) {
        if (this.level.grid[y][x] === 0) {
          ctx.fillStyle = '#444';
          ctx.fillRect(
            x * cellSize,
            y * cellSize,
            cellSize,
            cellSize
          );
        }
      }
    }
    
    // Draw player
    const playerX = this.player.renderer.cameraRig.position.x * cellSize;
    const playerY = this.player.renderer.cameraRig.position.z * cellSize;
    
    ctx.fillStyle = '#0f0';
    ctx.beginPath();
    ctx.arc(playerX, playerY, cellSize / 2, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw player direction
    const angle = this.player.renderer.cameraRig.rotation.y;
    ctx.strokeStyle = '#0f0';
    ctx.beginPath();
    ctx.moveTo(playerX, playerY);
    ctx.lineTo(
      playerX + Math.sin(angle) * cellSize,
      playerY + Math.cos(angle) * cellSize
    );
    ctx.stroke();
  }
} 