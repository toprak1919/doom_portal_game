import * as THREE from 'three';

export class Renderer {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.renderer = new THREE.WebGLRenderer({ 
      canvas: this.canvas, 
      antialias: true,
      powerPreference: "high-performance"
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio || 1);

    // Create main scene
    this.scene = new THREE.Scene();
    
    // Add sky dome before any other scene elements
    this.scene.add(this.createGradientSkyDome());

    // Camera rig setup
    this.cameraRig = new THREE.Group();
    this.cameraHolder = new THREE.Group();
    this.cameraRig.add(this.cameraHolder);
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.cameraHolder.add(this.camera);
    this.scene.add(this.cameraRig);

    // Natural Lighting Setup
    const hemiLight = new THREE.HemisphereLight(0x87CEEB, 0x444444, 1.0);
    hemiLight.position.set(0, 200, 0);
    this.scene.add(hemiLight);

    // Bright Ambient Light for overall illumination
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambientLight);

    // Enhanced sun lighting
    const sunLight = new THREE.DirectionalLight(0xffffff, 1.0);
    sunLight.position.set(100, 200, 100);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 500;
    sunLight.shadow.camera.left = -50;
    sunLight.shadow.camera.right = 50;
    sunLight.shadow.camera.top = 50;
    sunLight.shadow.camera.bottom = -50;
    this.scene.add(sunLight);

    // Add visible sun sprite
    this.scene.add(this.createSun());

    // Create damage overlay
    this.setupDamageOverlay();

    // Post-processing setup
    this.setupPostProcessing();

    this.portalManager = null;

    window.addEventListener('resize', () => this.handleResize());
  }

  setupDamageOverlay() {
    const overlayGeo = new THREE.PlaneGeometry(2, 2);
    this.damageOverlayMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uOpacity: { value: 0.0 }
      },
      vertexShader: `
        void main() {
          gl_Position = vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uOpacity;
        void main() {
          gl_FragColor = vec4(0.8, 0.0, 0.0, uOpacity);
        }
      `,
      transparent: true,
      depthTest: false
    });

    this.damageOverlay = new THREE.Mesh(overlayGeo, this.damageOverlayMaterial);
    this.damageOverlay.renderOrder = 999;
    this.scene.add(this.damageOverlay);
  }

  setupPostProcessing() {
    // Create render targets
    this.renderTarget = new THREE.WebGLRenderTarget(
      window.innerWidth * this.renderer.getPixelRatio(),
      window.innerHeight * this.renderer.getPixelRatio()
    );

    // Post-processing material
    this.postProcessMaterial = new THREE.ShaderMaterial({
      uniforms: {
        tDiffuse: { value: null },
        vignetteIntensity: { value: 0.8 }
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D tDiffuse;
        uniform float vignetteIntensity;
        varying vec2 vUv;
        
        void main() {
          vec4 color = texture2D(tDiffuse, vUv);
          
          // Add vignette
          vec2 center = vec2(0.5);
          float dist = length(vUv - center);
          float vignette = 1.0 - dist * vignetteIntensity;
          color.rgb *= vignette;
          
          gl_FragColor = color;
        }
      `
    });

    // Post-processing quad
    const plane = new THREE.PlaneGeometry(2, 2);
    this.postProcessQuad = new THREE.Mesh(plane, this.postProcessMaterial);
  }

  handleResize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.renderer.setSize(w, h);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    
    // Update render target size
    this.renderTarget.setSize(
      w * this.renderer.getPixelRatio(),
      h * this.renderer.getPixelRatio()
    );
  }

  showDamageEffect() {
    this.damageOverlayMaterial.uniforms.uOpacity.value = 0.4;
    setTimeout(() => {
      this.damageOverlayMaterial.uniforms.uOpacity.value = 0;
    }, 150);
  }

  setPortalManager(portalManager) {
    this.portalManager = portalManager;
  }

  render() {
    // Update portal views first (if any)
    if (this.portalManager) {
      this.portalManager.update(this.camera);
    }
    
    // Clear the main render target
    this.renderer.setRenderTarget(null);
    this.renderer.clear();
    
    // Render the main scene
    this.renderer.render(this.scene, this.camera);
    
    // Apply post-processing if enabled
    if (this.postProcessingEnabled) {
      this.renderer.setRenderTarget(this.postProcessTarget);
      this.renderer.clear();
      this.postProcessMaterial.uniforms.tDiffuse.value = this.renderTarget.texture;
      this.renderer.render(this.postProcessQuad, this.postProcessCamera);
      
      // Final render to screen
      this.renderer.setRenderTarget(null);
      this.renderer.render(this.postProcessScene, this.postProcessCamera);
    }
  }

  createGradientSkyDome() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const context = canvas.getContext('2d');

    // Create a vertical gradient: deep blue at the top, lighter near the horizon.
    const gradient = context.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#1E90FF'); // Dodger blue (deep blue at the top)
    gradient.addColorStop(1, '#87CEEB'); // Light sky blue at the horizon
    context.fillStyle = gradient;
    context.fillRect(0, 0, canvas.width, canvas.height);

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;

    const skyGeo = new THREE.SphereGeometry(500, 32, 15);
    const skyMat = new THREE.MeshBasicMaterial({
      map: texture,
      side: THREE.BackSide,
      fog: false // Ensure the sky isn't affected by fog if you add it later
    });
    return new THREE.Mesh(skyGeo, skyMat);
  }

  createSun() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const context = canvas.getContext('2d');

    // Create a radial gradient for the sun
    const gradient = context.createRadialGradient(128, 128, 0, 128, 128, 128);
    gradient.addColorStop(0, 'rgba(255, 255, 200, 1)');
    gradient.addColorStop(0.5, 'rgba(255, 255, 100, 0.8)');
    gradient.addColorStop(1, 'rgba(255, 255, 50, 0)');
    context.fillStyle = gradient;
    context.fillRect(0, 0, 256, 256);

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;

    const material = new THREE.SpriteMaterial({ 
      map: texture, 
      transparent: true,
      blending: THREE.AdditiveBlending
    });
    const sunSprite = new THREE.Sprite(material);
    
    // Scale and position the sun
    sunSprite.scale.set(20, 20, 1);
    sunSprite.position.set(100, 200, 100);
    return sunSprite;
  }
}