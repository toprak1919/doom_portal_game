// src/game/Level.js
import * as THREE from 'three';
import { mergeBufferGeometries } from 'BufferGeometryUtils';

export class Level {
  constructor(renderer, physics) {
    this.renderer = renderer;
    this.physics = physics;
    this.grid = [];
    this.width = 50;
    this.height = 50;
    this.seed = 'default';
    
    // Create materials once
    this.floorMaterial = new THREE.MeshLambertMaterial({ color: 0x444444 });
    this.wallMaterial = new THREE.MeshLambertMaterial({ color: 0x222222 });
    this.levelGroup = new THREE.Group();
    this.renderer.scene.add(this.levelGroup);
  }

  generateLevel(width, height, seed) {
    this.width = width;
    this.height = height;
    this.seed = seed;
    
    // Clear existing level
    while(this.levelGroup.children.length > 0) {
      const child = this.levelGroup.children[0];
      child.geometry.dispose();
      child.material.dispose();
      this.levelGroup.remove(child);
    }
    this.physics.wallColliders = [];

    // Generate initial random grid
    this.grid = this.createRandomGrid();
    
    // Apply cellular automata rules
    this.smoothGrid(5);
    
    // Ensure borders are walls
    this.addBorders();
    
    // Ensure player starting area is clear
    this.createStartingArea();
    
    // Build geometry
    this.buildGeometry();
  }

  createRandomGrid() {
    const grid = [];
    const random = this.createSeededRandom(this.seed);
    
    for (let y = 0; y < this.height; y++) {
      const row = [];
      for (let x = 0; x < this.width; x++) {
        row.push(random() < 0.4 ? 1 : 0);
      }
      grid.push(row);
    }
    return grid;
  }

  createSeededRandom(seed) {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = ((hash << 5) - hash) + seed.charCodeAt(i);
      hash = hash & hash;
    }
    
    return function() {
      hash = (hash * 16807) % 2147483647;
      return (hash - 1) / 2147483646;
    };
  }

  smoothGrid(passes) {
    for (let i = 0; i < passes; i++) {
      const newGrid = [];
      for (let y = 0; y < this.height; y++) {
        newGrid[y] = [];
        for (let x = 0; x < this.width; x++) {
          const neighbors = this.countWallNeighbors(x, y);
          newGrid[y][x] = neighbors >= 5 ? 1 : 0;
        }
      }
      this.grid = newGrid;
    }
  }

  countWallNeighbors(x, y) {
    let count = 0;
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx < 0 || nx >= this.width || ny < 0 || ny >= this.height) {
          count++; // Count out of bounds as walls
        } else if (this.grid[ny][nx] === 1) {
          count++;
        }
      }
    }
    return count;
  }

  addBorders() {
    for (let x = 0; x < this.width; x++) {
      this.grid[0][x] = 1;
      this.grid[this.height - 1][x] = 1;
    }
    for (let y = 0; y < this.height; y++) {
      this.grid[y][0] = 1;
      this.grid[y][this.width - 1] = 1;
    }
  }

  createStartingArea() {
    // Clear 3x3 area in center for player start
    const centerX = Math.floor(this.width / 2);
    const centerY = Math.floor(this.height / 2);
    for (let y = -1; y <= 1; y++) {
      for (let x = -1; x <= 1; x++) {
        this.grid[centerY + y][centerX + x] = 0;
      }
    }
  }

  buildGeometry() {
    const floorGeometries = [];
    const wallGeometries = [];
    
    // Base geometries
    const floorGeo = new THREE.PlaneGeometry(1, 1);
    floorGeo.rotateX(-Math.PI / 2);
    const wallGeo = new THREE.BoxGeometry(1, 2, 1);
    
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        if (this.grid[y][x] === 0) {
          // Add floor
          const floorMesh = new THREE.Mesh(floorGeo);
          floorMesh.position.set(x + 0.5, 0, y + 0.5);
          floorMesh.updateMatrix();
          floorGeometries.push(floorMesh.geometry.clone().applyMatrix4(floorMesh.matrix));
        } else {
          // Add wall if it's visible (adjacent to floor)
          if (this.hasFloorNeighbor(x, y)) {
            const wallMesh = new THREE.Mesh(wallGeo);
            wallMesh.position.set(x + 0.5, 1, y + 0.5);
            wallMesh.updateMatrix();
            wallGeometries.push(wallMesh.geometry.clone().applyMatrix4(wallMesh.matrix));
            
            // Add physics collider
            this.physics.addWallCollider(
              new THREE.Vector3(x, 0, y),
              new THREE.Vector3(x + 1, 2, y + 1)
            );
          }
        }
      }
    }
    
    // Merge geometries using the correct import name
    if (floorGeometries.length > 0) {
      const mergedFloors = mergeBufferGeometries(floorGeometries);
      this.levelGroup.add(new THREE.Mesh(mergedFloors, this.floorMaterial));
    }
    
    if (wallGeometries.length > 0) {
      const mergedWalls = mergeBufferGeometries(wallGeometries);
      mergedWalls.computeVertexNormals();
      mergedWalls.computeBoundingSphere();
      
      const wallMesh = new THREE.Mesh(mergedWalls, this.wallMaterial);
      wallMesh.name = 'walls';
      this.levelGroup.add(wallMesh);
      this.mergedWallMesh = wallMesh;
      
      // Assign level globally for debugging and access
      window.level = this;
      
      console.log('Wall mesh created with geometry:', this.mergedWallMesh.geometry);
    } else {
      console.warn('No wall geometries to merge!');
    }
  }

  hasFloorNeighbor(x, y) {
    for (const [dx, dy] of [[1,0], [-1,0], [0,1], [0,-1]]) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx >= 0 && nx < this.width && ny >= 0 && ny < this.height) {
        if (this.grid[ny][nx] === 0) return true;
      }
    }
    return false;
  }
} 