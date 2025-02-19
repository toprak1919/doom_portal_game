import * as THREE from 'three';

export class ParticleSystem {
  constructor(renderer) {
    this.renderer = renderer;
    this.particleGroups = new Map();
    
    // Default particle material
    this.material = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 }
      },
      vertexShader: `
        attribute float size;
        attribute float life;
        attribute vec3 velocity;
        uniform float time;
        varying float vAlpha;
        
        void main() {
          float age = mod(time - life, 1.0);
          vec3 pos = position + velocity * age;
          vAlpha = 1.0 - age;
          
          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          gl_PointSize = size * (1.0 - age) * (300.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying float vAlpha;
        void main() {
          vec2 center = gl_PointCoord - 0.5;
          float dist = length(center);
          if (dist > 0.5) discard;
          gl_FragColor = vec4(1.0, 0.6, 0.3, vAlpha * (1.0 - dist * 2.0));
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
  }

  createParticleGroup(name, count) {
    const geometry = new THREE.BufferGeometry();
    
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const lifetimes = new Float32Array(count);
    const velocities = new Float32Array(count * 3);
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute('life', new THREE.BufferAttribute(lifetimes, 1));
    geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
    
    const points = new THREE.Points(geometry, this.material);
    this.renderer.scene.add(points);
    
    this.particleGroups.set(name, {
      mesh: points,
      nextIndex: 0,
      count
    });
  }

  emitParticles(name, position, options = {}) {
    const group = this.particleGroups.get(name);
    if (!group) return;

    const count = options.count || 10;
    const speed = options.speed || 2;
    const size = options.size || 10;
    
    const positions = group.mesh.geometry.attributes.position;
    const sizes = group.mesh.geometry.attributes.size;
    const lifetimes = group.mesh.geometry.attributes.life;
    const velocities = group.mesh.geometry.attributes.velocity;
    
    for (let i = 0; i < count; i++) {
      const index = (group.nextIndex + i) % group.count;
      
      // Position
      positions.array[index * 3] = position.x;
      positions.array[index * 3 + 1] = position.y;
      positions.array[index * 3 + 2] = position.z;
      
      // Random velocity
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      velocities.array[index * 3] = Math.sin(phi) * Math.cos(theta) * speed;
      velocities.array[index * 3 + 1] = Math.cos(phi) * speed;
      velocities.array[index * 3 + 2] = Math.sin(phi) * Math.sin(theta) * speed;
      
      // Size and lifetime
      sizes.array[index] = size * (0.5 + Math.random() * 0.5);
      lifetimes.array[index] = performance.now() * 0.001;
    }
    
    group.nextIndex = (group.nextIndex + count) % group.count;
    
    positions.needsUpdate = true;
    sizes.needsUpdate = true;
    lifetimes.needsUpdate = true;
    velocities.needsUpdate = true;
  }

  update() {
    this.material.uniforms.time.value = performance.now() * 0.001;
  }
}