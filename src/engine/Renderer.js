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
    this.scene.background = new THREE.Color(0x000000);

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

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
    this.scene.add(ambientLight);
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.6);
    dirLight.position.set(10, 20, 10);
    this.scene.add(dirLight);

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
}