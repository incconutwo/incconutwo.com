/**
 * ============================================
 * LIQUID GRADIENT BACKGROUND
 * WebGL Effect using Three.js
 * ============================================
 */

// TouchTexture class - Handles the water ripple effect
class TouchTexture {
  constructor() {
    this.size = 64;
    this.width = this.height = this.size;
    this.maxAge = 64;
    this.radius = 0.25 * this.size; // Much larger touch radius for more obvious effect
    this.speed = 1 / this.maxAge;
    this.trail = [];
    this.last = null;
    this.initTexture();
  }

  initTexture() {
    this.canvas = document.createElement("canvas");
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    this.ctx = this.canvas.getContext("2d");
    this.ctx.fillStyle = "black";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.texture = new THREE.Texture(this.canvas);
  }

  update() {
    this.clear();
    let speed = this.speed;
    // Use reverse iteration to safely remove items
    for (let i = this.trail.length - 1; i >= 0; i--) {
      const point = this.trail[i];
      let f = point.force * speed * (1 - point.age / this.maxAge);
      point.x += point.vx * f;
      point.y += point.vy * f;
      point.age++;
      if (point.age > this.maxAge) {
        this.trail.splice(i, 1);
      } else {
        this.drawPoint(point);
      }
    }
    this.texture.needsUpdate = true;
  }

  clear() {
    this.ctx.fillStyle = "black";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  addTouch(point) {
    let force = 0;
    let vx = 0;
    let vy = 0;
    const last = this.last;
    if (last) {
      const dx = point.x - last.x;
      const dy = point.y - last.y;
      if (dx === 0 && dy === 0) return;
      const dd = dx * dx + dy * dy;
      let d = Math.sqrt(dd);
      vx = dx / d;
      vy = dy / d;
      force = Math.min(dd * 20000, 2.0); // Much stronger force for very noticeable effect
    }
    this.last = { x: point.x, y: point.y };
    this.trail.push({ x: point.x, y: point.y, age: 0, force, vx, vy });
  }

  drawPoint(point) {
    const pos = {
      x: point.x * this.width,
      y: (1 - point.y) * this.height
    };

    let intensity = 1;
    if (point.age < this.maxAge * 0.3) {
      intensity = Math.sin((point.age / (this.maxAge * 0.3)) * (Math.PI / 2));
    } else {
      const t = 1 - (point.age - this.maxAge * 0.3) / (this.maxAge * 0.7);
      intensity = -t * (t - 2);
    }
    intensity *= point.force;

    const radius = this.radius;
    let color = `${((point.vx + 1) / 2) * 255}, ${
      ((point.vy + 1) / 2) * 255
    }, ${intensity * 255}`;
    let offset = this.size * 5;
    this.ctx.shadowOffsetX = offset;
    this.ctx.shadowOffsetY = offset;
    this.ctx.shadowBlur = radius * 1;
    this.ctx.shadowColor = `rgba(${color},${0.2 * intensity})`;

    this.ctx.beginPath();
    this.ctx.fillStyle = "rgba(255,0,0,1)";
    this.ctx.arc(pos.x - offset, pos.y - offset, radius, 0, Math.PI * 2);
    this.ctx.fill();
  }
}

// GradientBackground class - The shader implementation
class GradientBackground {
  constructor(sceneManager) {
    this.sceneManager = sceneManager;
    this.mesh = null;
    this.uniforms = {
      uTime: { value: 0 },
      uResolution: {
        value: new THREE.Vector2(window.innerWidth, window.innerHeight)
      },
      uColor1: { value: new THREE.Vector3(0.945, 0.353, 0.133) }, // F15A22 - Orange
      uColor2: { value: new THREE.Vector3(0.039, 0.055, 0.153) }, // 0a0e27 - Navy Blue
      uColor3: { value: new THREE.Vector3(0.945, 0.353, 0.133) }, // F15A22 - Orange
      uColor4: { value: new THREE.Vector3(0.039, 0.055, 0.153) }, // 0a0e27 - Navy Blue
      uColor5: { value: new THREE.Vector3(0.945, 0.353, 0.133) }, // F15A22 - Orange
      uColor6: { value: new THREE.Vector3(0.039, 0.055, 0.153) }, // 0a0e27 - Navy Blue
      uSpeed: { value: 1.2 }, // Faster animation
      uIntensity: { value: 1.8 },
      uTouchTexture: { value: null },
      uGrainIntensity: { value: 0.08 },
      uZoom: { value: 1.0 }, // Zoom/scale control - lower = less zoomed (more visible)
      uDarkNavy: { value: new THREE.Vector3(0.039, 0.055, 0.153) }, // #0a0e27 - Dark navy base color
      uGradientSize: { value: 1.0 }, // Control gradient size (smaller = more gradients)
      uGradientCount: { value: 6.0 }, // Number of gradient centers
      uColor1Weight: { value: 1.0 }, // Weight for color1 (orange) - reduce for more navy
      uColor2Weight: { value: 1.0 } // Weight for color2 (navy) - increase for more navy
    };
  }

  init() {
    const viewSize = this.sceneManager.getViewSize();
    const geometry = new THREE.PlaneGeometry(
      viewSize.width,
      viewSize.height,
      1,
      1
    );

    const material = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      vertexShader: `
            varying vec2 vUv;
            void main() {
              vec3 pos = position.xyz;
              gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.);
              vUv = uv;
            }
          `,
      fragmentShader: `
            uniform float uTime;
            uniform vec2 uResolution;
            uniform vec3 uColor1;
            uniform vec3 uColor2;
            uniform vec3 uColor3;
            uniform vec3 uColor4;
            uniform vec3 uColor5;
            uniform vec3 uColor6;
            uniform float uSpeed;
            uniform float uIntensity;
            uniform sampler2D uTouchTexture;
            uniform float uGrainIntensity;
            uniform float uZoom;
            uniform vec3 uDarkNavy;
            uniform float uGradientSize;
            uniform float uGradientCount;
            uniform float uColor1Weight;
            uniform float uColor2Weight;
            
            varying vec2 vUv;
            
            #define PI 3.14159265359
            
            // Grain function for film grain effect
            float grain(vec2 uv, float time) {
              vec2 grainUv = uv * uResolution * 0.5;
              float grainValue = fract(sin(dot(grainUv + time, vec2(12.9898, 78.233))) * 43758.5453);
              return grainValue * 2.0 - 1.0;
            }
            
            vec3 getGradientColor(vec2 uv, float time) {
              // Dynamic gradient size based on uniform
              float gradientRadius = uGradientSize;
              
              // Multiple animated centers with different speeds and patterns
              // Support up to 12 centers for more gradient action
              vec2 center1 = vec2(
                0.5 + sin(time * uSpeed * 0.4) * 0.4,
                0.5 + cos(time * uSpeed * 0.5) * 0.4
              );
              vec2 center2 = vec2(
                0.5 + cos(time * uSpeed * 0.6) * 0.5,
                0.5 + sin(time * uSpeed * 0.45) * 0.5
              );
              vec2 center3 = vec2(
                0.5 + sin(time * uSpeed * 0.35) * 0.45,
                0.5 + cos(time * uSpeed * 0.55) * 0.45
              );
              vec2 center4 = vec2(
                0.5 + cos(time * uSpeed * 0.5) * 0.4,
                0.5 + sin(time * uSpeed * 0.4) * 0.4
              );
              vec2 center5 = vec2(
                0.5 + sin(time * uSpeed * 0.7) * 0.35,
                0.5 + cos(time * uSpeed * 0.6) * 0.35
              );
              vec2 center6 = vec2(
                0.5 + cos(time * uSpeed * 0.45) * 0.5,
                0.5 + sin(time * uSpeed * 0.65) * 0.5
              );
              
              // Additional centers for more gradient action (7-12)
              vec2 center7 = vec2(
                0.5 + sin(time * uSpeed * 0.55) * 0.38,
                0.5 + cos(time * uSpeed * 0.48) * 0.42
              );
              vec2 center8 = vec2(
                0.5 + cos(time * uSpeed * 0.65) * 0.36,
                0.5 + sin(time * uSpeed * 0.52) * 0.44
              );
              vec2 center9 = vec2(
                0.5 + sin(time * uSpeed * 0.42) * 0.41,
                0.5 + cos(time * uSpeed * 0.58) * 0.39
              );
              vec2 center10 = vec2(
                0.5 + cos(time * uSpeed * 0.48) * 0.37,
                0.5 + sin(time * uSpeed * 0.62) * 0.43
              );
              vec2 center11 = vec2(
                0.5 + sin(time * uSpeed * 0.68) * 0.33,
                0.5 + cos(time * uSpeed * 0.44) * 0.46
              );
              vec2 center12 = vec2(
                0.5 + cos(time * uSpeed * 0.38) * 0.39,
                0.5 + sin(time * uSpeed * 0.56) * 0.41
              );
              
              float dist1 = length(uv - center1);
              float dist2 = length(uv - center2);
              float dist3 = length(uv - center3);
              float dist4 = length(uv - center4);
              float dist5 = length(uv - center5);
              float dist6 = length(uv - center6);
              float dist7 = length(uv - center7);
              float dist8 = length(uv - center8);
              float dist9 = length(uv - center9);
              float dist10 = length(uv - center10);
              float dist11 = length(uv - center11);
              float dist12 = length(uv - center12);
              
              // Smaller, tighter influence areas based on uGradientSize
              float influence1 = 1.0 - smoothstep(0.0, gradientRadius, dist1);
              float influence2 = 1.0 - smoothstep(0.0, gradientRadius, dist2);
              float influence3 = 1.0 - smoothstep(0.0, gradientRadius, dist3);
              float influence4 = 1.0 - smoothstep(0.0, gradientRadius, dist4);
              float influence5 = 1.0 - smoothstep(0.0, gradientRadius, dist5);
              float influence6 = 1.0 - smoothstep(0.0, gradientRadius, dist6);
              float influence7 = 1.0 - smoothstep(0.0, gradientRadius, dist7);
              float influence8 = 1.0 - smoothstep(0.0, gradientRadius, dist8);
              float influence9 = 1.0 - smoothstep(0.0, gradientRadius, dist9);
              float influence10 = 1.0 - smoothstep(0.0, gradientRadius, dist10);
              float influence11 = 1.0 - smoothstep(0.0, gradientRadius, dist11);
              float influence12 = 1.0 - smoothstep(0.0, gradientRadius, dist12);
              
              // Multiple rotation layers for depth
              vec2 rotatedUv1 = uv - 0.5;
              float angle1 = time * uSpeed * 0.15;
              rotatedUv1 = vec2(
                rotatedUv1.x * cos(angle1) - rotatedUv1.y * sin(angle1),
                rotatedUv1.x * sin(angle1) + rotatedUv1.y * cos(angle1)
              );
              rotatedUv1 += 0.5;
              
              vec2 rotatedUv2 = uv - 0.5;
              float angle2 = -time * uSpeed * 0.12;
              rotatedUv2 = vec2(
                rotatedUv2.x * cos(angle2) - rotatedUv2.y * sin(angle2),
                rotatedUv2.x * sin(angle2) + rotatedUv2.y * cos(angle2)
              );
              rotatedUv2 += 0.5;
              
              float radialGradient1 = length(rotatedUv1 - 0.5);
              float radialGradient2 = length(rotatedUv2 - 0.5);
              float radialInfluence1 = 1.0 - smoothstep(0.0, 0.8, radialGradient1);
              float radialInfluence2 = 1.0 - smoothstep(0.0, 0.8, radialGradient2);
              
              // Blend all colors with dynamic intensities - increased for more contrast
              vec3 color = vec3(0.0);
              color += uColor1 * influence1 * (0.55 + 0.45 * sin(time * uSpeed)) * uColor1Weight;
              color += uColor2 * influence2 * (0.55 + 0.45 * cos(time * uSpeed * 1.2)) * uColor2Weight;
              color += uColor3 * influence3 * (0.55 + 0.45 * sin(time * uSpeed * 0.8)) * uColor1Weight;
              color += uColor4 * influence4 * (0.55 + 0.45 * cos(time * uSpeed * 1.3)) * uColor2Weight;
              color += uColor5 * influence5 * (0.55 + 0.45 * sin(time * uSpeed * 1.1)) * uColor1Weight;
              color += uColor6 * influence6 * (0.55 + 0.45 * cos(time * uSpeed * 0.9)) * uColor2Weight;
              
              // Add extra centers if uGradientCount > 6
              if (uGradientCount > 6.0) {
                color += uColor1 * influence7 * (0.55 + 0.45 * sin(time * uSpeed * 1.4)) * uColor1Weight;
                color += uColor2 * influence8 * (0.55 + 0.45 * cos(time * uSpeed * 1.5)) * uColor2Weight;
                color += uColor3 * influence9 * (0.55 + 0.45 * sin(time * uSpeed * 1.6)) * uColor1Weight;
                color += uColor4 * influence10 * (0.55 + 0.45 * cos(time * uSpeed * 1.7)) * uColor2Weight;
              }
              if (uGradientCount > 10.0) {
                color += uColor5 * influence11 * (0.55 + 0.45 * sin(time * uSpeed * 1.8)) * uColor1Weight;
                color += uColor6 * influence12 * (0.55 + 0.45 * cos(time * uSpeed * 1.9)) * uColor2Weight;
              }
              
              // Add radial overlays - increased for more contrast, with color weighting
              color += mix(uColor1, uColor3, radialInfluence1) * 0.45 * uColor1Weight;
              color += mix(uColor2, uColor4, radialInfluence2) * 0.4 * uColor2Weight;
              
              // Clamp and apply intensity
              color = clamp(color, vec3(0.0), vec3(1.0)) * uIntensity;
              
              // Enhanced color saturation for more vibrant look
              float luminance = dot(color, vec3(0.299, 0.587, 0.114));
              color = mix(vec3(luminance), color, 1.35);
              
              color = pow(color, vec3(0.92)); // Slight gamma adjustment for better contrast
              
              // Ensure minimum brightness (navy blue base instead of grey/black)
              // Use higher threshold to ensure navy blue shows through in low-intensity areas
              float brightness1 = length(color);
              float mixFactor1 = max(brightness1 * 1.2, 0.15); // Higher threshold for navy blue base
              color = mix(uDarkNavy, color, mixFactor1);
              
              // Cap maximum brightness - increased for more contrast
              float maxBrightness = 1.0;
              float brightness = length(color);
              if (brightness > maxBrightness) {
                color = color * (maxBrightness / brightness);
              }
              
              return color;
            }
            
            void main() {
              vec2 uv = vUv;
              
              // Apply water distortion from touch texture - very strong
              vec4 touchTex = texture2D(uTouchTexture, uv);
              float vx = -(touchTex.r * 2.0 - 1.0);
              float vy = -(touchTex.g * 2.0 - 1.0);
              float intensity = touchTex.b;
              // Much increased distortion strength for very obvious effect
              uv.x += vx * 0.8 * intensity;
              uv.y += vy * 0.8 * intensity;
              
              // Combined ripple and wave effect for better performance
              vec2 center = vec2(0.5);
              float dist = length(uv - center);
              float ripple = sin(dist * 20.0 - uTime * 3.0) * 0.04 * intensity;
              float wave = sin(dist * 15.0 - uTime * 2.0) * 0.03 * intensity;
              uv += vec2(ripple + wave);
              
              vec3 color = getGradientColor(uv, uTime);
              
              // Apply grain effect
              float grainValue = grain(uv, uTime);
              color += grainValue * uGrainIntensity;
              
              // Subtle color shifting - optimized with single calculation
              float timeShift = uTime * 0.5;
              color.r += sin(timeShift) * 0.02;
              color.g += cos(timeShift * 1.4) * 0.02;
              color.b += sin(timeShift * 1.2) * 0.02;
              
              // Ensure minimum brightness (navy blue base instead of grey/black)
              // Use higher threshold to ensure navy blue shows through in low-intensity areas
              float brightness2 = length(color);
              float mixFactor2 = max(brightness2 * 1.2, 0.15); // Higher threshold for navy blue base
              color = mix(uDarkNavy, color, mixFactor2);
              
              // Clamp to valid color range
              color = clamp(color, vec3(0.0), vec3(1.0));
              
              // Cap maximum brightness - increased for more contrast
              float maxBrightness = 1.0;
              float brightness = length(color);
              if (brightness > maxBrightness) {
                color = color * (maxBrightness / brightness);
              }
              
              gl_FragColor = vec4(color, 1.0);
            }
          `
    });

    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.z = 0;
    this.sceneManager.scene.add(this.mesh);
  }

  update(delta) {
    if (this.uniforms.uTime) {
      this.uniforms.uTime.value += delta;
    }
  }

  onResize(width, height) {
    const viewSize = this.sceneManager.getViewSize();
    if (this.mesh) {
      this.mesh.geometry.dispose();
      this.mesh.geometry = new THREE.PlaneGeometry(
        viewSize.width,
        viewSize.height,
        1,
        1
      );
    }
    if (this.uniforms.uResolution) {
      this.uniforms.uResolution.value.set(width, height);
    }
  }
}

// LiquidGradientApp class - Main Controller (Renamed from App for export)
class LiquidGradientApp {
  constructor(domElement = document.body) {
    this.domElement = domElement;
    
    // Create canvas container if targeting body, or use element directly if it's a div
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: "high-performance",
      alpha: false,
      stencil: false,
      depth: false
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setAnimationLoop(null);
    
    // Append rendering canvas
    this.renderer.domElement.id = "webGLApp";
    // Check if domElement is body or a container
    if (this.domElement === document.body) {
      this.renderer.domElement.style.position = 'fixed';
      this.renderer.domElement.style.top = '0';
      this.renderer.domElement.style.left = '0';
      this.renderer.domElement.style.zIndex = '-1'; // Background
    } else {
      this.renderer.domElement.style.position = 'absolute';
      this.renderer.domElement.style.width = '100%';
      this.renderer.domElement.style.height = '100%';
    }
    
    this.domElement.appendChild(this.renderer.domElement);

    this.camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      10000
    );
    this.camera.position.z = 50;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0e27); // Dark navy
    this.clock = new THREE.Clock();

    this.touchTexture = new TouchTexture();
    this.gradientBackground = new GradientBackground(this);
    this.gradientBackground.uniforms.uTouchTexture.value = this.touchTexture.texture;

    // Color schemes
    this.colorSchemes = {
      1: {
        color1: new THREE.Vector3(0.945, 0.353, 0.133), // F15A22
        color2: new THREE.Vector3(0.039, 0.055, 0.153)  // 0a0e27
      },
      2: {
        color1: new THREE.Vector3(1.0, 0.424, 0.314), // FF6C50
        color2: new THREE.Vector3(0.251, 0.878, 0.816) // 40E0D0
      },
      3: {
        color1: new THREE.Vector3(0.945, 0.353, 0.133),
        color2: new THREE.Vector3(0.039, 0.055, 0.153),
        color3: new THREE.Vector3(0.251, 0.878, 0.816)
      },
      4: {
        color1: new THREE.Vector3(0.949, 0.4, 0.2), // F26633
        color2: new THREE.Vector3(0.176, 0.42, 0.427), // 2D6B6D
        color3: new THREE.Vector3(0.82, 0.686, 0.612) // D1AF9C
      },
      5: {
        color1: new THREE.Vector3(0.945, 0.353, 0.133),
        color2: new THREE.Vector3(0.0, 0.259, 0.22),
        color3: new THREE.Vector3(0.945, 0.353, 0.133),
        color4: new THREE.Vector3(0.0, 0.0, 0.0),
        color5: new THREE.Vector3(0.945, 0.353, 0.133),
        color6: new THREE.Vector3(0.0, 0.0, 0.0)
      }
    };
    this.currentScheme = 1;

    // Event binding
    this.onResize = this.onResize.bind(this);
    this.onMouseMove = this.onMouseMove.bind(this);
    this.onTouchMove = this.onTouchMove.bind(this);
    
    this.init();
  }

  init() {
    this.gradientBackground.init();
    this.setColorScheme(1);
    this.render();
    this.tick();

    window.addEventListener("resize", this.onResize);
    window.addEventListener("mousemove", this.onMouseMove);
    window.addEventListener("touchmove", this.onTouchMove);

    // Initial wake up
    if (document.hidden) {
      document.addEventListener("visibilitychange", () => {
         if (!document.hidden) this.render();
      }, { once: true });
    }
  }

  setColorScheme(scheme) {
    if (!this.colorSchemes[scheme] && scheme !== 6 && scheme !== 7 && scheme !== 8) return;
    this.currentScheme = scheme;
    
    // For simplicity, reusing the existing logic logic, but normally would optimize lookup
    const uniforms = this.gradientBackground.uniforms;
    const colors = this.colorSchemes[scheme] || this.colorSchemes[1]; // Fallback

    // ... (Color setting logic as in original, simplified for export)
    // IMPORTANT: Copied logic from original file to maintain exact appearance
    
    if (scheme === 3) {
      uniforms.uColor1.value.copy(colors.color1);
      uniforms.uColor2.value.copy(colors.color2);
      uniforms.uColor3.value.copy(colors.color3);
      uniforms.uColor4.value.copy(colors.color1);
      uniforms.uColor5.value.copy(colors.color2);
      uniforms.uColor6.value.copy(colors.color3);
    } else if (scheme === 4) {
      uniforms.uColor1.value.copy(colors.color1);
      uniforms.uColor2.value.copy(colors.color2);
      uniforms.uColor3.value.copy(colors.color3);
      uniforms.uColor4.value.copy(colors.color1);
      uniforms.uColor5.value.copy(colors.color2);
      uniforms.uColor6.value.copy(colors.color3);
    } else if (scheme === 5) {
      uniforms.uColor1.value.copy(colors.color1);
      uniforms.uColor2.value.copy(colors.color2);
      uniforms.uColor3.value.copy(colors.color3);
      uniforms.uColor4.value.copy(colors.color4);
      uniforms.uColor5.value.copy(colors.color5);
      uniforms.uColor6.value.copy(colors.color6);
    } else {
       // Scheme 1, 2, 6, 7, 8 etc map to basic or specific overrides
       if (this.colorSchemes[scheme]) {
           uniforms.uColor1.value.copy(colors.color1);
           uniforms.uColor2.value.copy(colors.color2);
           uniforms.uColor3.value.copy(colors.color1);
           uniforms.uColor4.value.copy(colors.color2);
           uniforms.uColor5.value.copy(colors.color1);
           uniforms.uColor6.value.copy(colors.color2);
       }
    }

    // Background and base settings (simplified for export)
    if (scheme === 1 || scheme === 5 || scheme === 6 || scheme === 7 || scheme === 8) {
      this.scene.background = new THREE.Color(0x0a0e27);
      uniforms.uDarkNavy.value.set(0.039, 0.055, 0.153);
      uniforms.uGradientSize.value = 0.45;
      uniforms.uGradientCount.value = 12.0;
      uniforms.uSpeed.value = 1.5;
      uniforms.uColor1Weight.value = 0.5;
      uniforms.uColor2Weight.value = 1.8;
    } else if (scheme === 4) {
      this.scene.background = new THREE.Color(0xffffff);
      uniforms.uDarkNavy.value.set(0, 0, 0);
    } else {
      // Defaults
      this.scene.background = new THREE.Color(0x0a0e27);
      uniforms.uDarkNavy.value.set(0.039, 0.055, 0.153);
      uniforms.uGradientSize.value = 1.0;
      uniforms.uGradientCount.value = 6.0;
      uniforms.uSpeed.value = 1.2;
      uniforms.uColor1Weight.value = 1.0;
      uniforms.uColor2Weight.value = 1.0;
    }
  }

  onTouchMove(ev) {
    const touch = ev.touches[0];
    this.onMouseMove({ clientX: touch.clientX, clientY: touch.clientY });
  }

  onMouseMove(ev) {
    this.mouse = {
      x: ev.clientX / window.innerWidth,
      y: 1 - ev.clientY / window.innerHeight
    };
    this.touchTexture.addTouch(this.mouse);
  }

  getViewSize() {
    const fovInRadians = (this.camera.fov * Math.PI) / 180;
    const height = Math.abs(
      this.camera.position.z * Math.tan(fovInRadians / 2) * 2
    );
    return { width: height * this.camera.aspect, height };
  }

  update(delta) {
    this.touchTexture.update();
    this.gradientBackground.update(delta);
  }

  render() {
    // Optimization: Don't render if canvas is fully transparent or off-screen
    // You can control this via a class on the canvas
    if (this.renderer.domElement.classList.contains('fade-out') && 
        getComputedStyle(this.renderer.domElement).opacity === "0") {
      // Still request frame to check for changes, but skip heavy draw
      requestAnimationFrame(() => this.tick());
      return; 
    }

    const delta = this.clock.getDelta();
    const clampedDelta = Math.min(delta, 0.1);
    this.renderer.render(this.scene, this.camera);
    this.update(clampedDelta);
  }

  tick() {
    this.render();
    requestAnimationFrame(() => this.tick());
  }

  onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.gradientBackground.onResize(window.innerWidth, window.innerHeight);
  }
}