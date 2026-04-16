// Dynamic sky dome with day/night cycle, sun, moon, and stars
import * as THREE from 'three';

export class Sky {
  constructor(scene) {
    this.scene = scene;
    this.timeOfDay = 0.4; // Start at midday (0=midnight, 0.5=noon, 1=midnight)
    this.timeSpeed = 0.003; // How fast time passes (per second)

    // Sky dome
    const skyGeo = new THREE.SphereGeometry(500, 32, 16);
    this.skyCanvas = document.createElement('canvas');
    this.skyCanvas.width = 512;
    this.skyCanvas.height = 256;
    this.skyCtx = this.skyCanvas.getContext('2d');
    this.skyTexture = new THREE.CanvasTexture(this.skyCanvas);

    const skyMat = new THREE.MeshBasicMaterial({
      map: this.skyTexture,
      side: THREE.BackSide,
      depthWrite: false
    });
    this.skyDome = new THREE.Mesh(skyGeo, skyMat);
    scene.add(this.skyDome);

    // Sun
    const sunGeo = new THREE.SphereGeometry(8, 16, 16);
    const sunMat = new THREE.MeshBasicMaterial({ color: '#FFD700' });
    this.sun = new THREE.Mesh(sunGeo, sunMat);
    scene.add(this.sun);

    // Moon (Moonstone glow reference)
    const moonGeo = new THREE.SphereGeometry(5, 16, 16);
    const moonMat = new THREE.MeshBasicMaterial({ color: '#e8e8ff' });
    this.moon = new THREE.Mesh(moonGeo, moonMat);
    scene.add(this.moon);

    // Stars
    this.createStars(scene);

    // Directional light (sun light)
    this.sunLight = new THREE.DirectionalLight('#ffffff', 1);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.set(2048, 2048);
    this.sunLight.shadow.camera.left = -50;
    this.sunLight.shadow.camera.right = 50;
    this.sunLight.shadow.camera.top = 50;
    this.sunLight.shadow.camera.bottom = -50;
    this.sunLight.shadow.camera.near = 0.5;
    this.sunLight.shadow.camera.far = 200;
    scene.add(this.sunLight);

    // Ambient light
    this.ambientLight = new THREE.AmbientLight('#404060', 0.3);
    scene.add(this.ambientLight);

    this.updateSky();
  }

  createStars(scene) {
    const starCount = 1000;
    const positions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI * 0.5; // Upper hemisphere only
      const r = 450;
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.cos(phi);
      positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    }
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const starMat = new THREE.PointsMaterial({ color: '#ffffff', size: 1.5, sizeAttenuation: false });
    this.stars = new THREE.Points(starGeo, starMat);
    scene.add(this.stars);
  }

  getTimeLabel() {
    const t = this.timeOfDay;
    if (t < 0.15 || t > 0.85) return 'Moonhigh';
    if (t < 0.25) return 'Dawn';
    if (t < 0.35) return 'Sunrise';
    if (t < 0.45) return 'Sunhigh';
    if (t < 0.55) return 'Afternoon';
    if (t < 0.65) return 'Sundown';
    if (t < 0.75) return 'Dusk';
    return 'Moonrise';
  }

  isNight() {
    return this.timeOfDay < 0.2 || this.timeOfDay > 0.8;
  }

  updateSky() {
    const t = this.timeOfDay;
    const ctx = this.skyCtx;
    const w = this.skyCanvas.width;
    const h = this.skyCanvas.height;

    // Sky gradient based on time
    let topColor, bottomColor;
    if (t < 0.15 || t > 0.85) {
      // Night
      topColor = '#0a0a2a';
      bottomColor = '#1a1a3a';
    } else if (t < 0.25) {
      // Dawn
      const f = (t - 0.15) / 0.1;
      topColor = lerpHex('#0a0a2a', '#2a1a3a', f);
      bottomColor = lerpHex('#1a1a3a', '#c4616a', f);
    } else if (t < 0.35) {
      // Sunrise
      const f = (t - 0.25) / 0.1;
      topColor = lerpHex('#2a1a3a', '#4a8ae0', f);
      bottomColor = lerpHex('#c4616a', '#e8c060', f);
    } else if (t < 0.65) {
      // Day
      topColor = '#3a7ad0';
      bottomColor = '#87CEEB';
    } else if (t < 0.75) {
      // Sunset
      const f = (t - 0.65) / 0.1;
      topColor = lerpHex('#3a7ad0', '#4a2040', f);
      bottomColor = lerpHex('#87CEEB', '#d06040', f);
    } else {
      // Dusk
      const f = (t - 0.75) / 0.1;
      topColor = lerpHex('#4a2040', '#0a0a2a', f);
      bottomColor = lerpHex('#d06040', '#1a1a3a', f);
    }

    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, topColor);
    grad.addColorStop(1, bottomColor);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    this.skyTexture.needsUpdate = true;

    // Sun position (arcs across sky)
    const sunAngle = (t - 0.25) * Math.PI; // rises at 0.25, sets at 0.75
    this.sun.position.set(
      Math.cos(sunAngle) * 300,
      Math.sin(sunAngle) * 200,
      100
    );
    this.sun.visible = t > 0.2 && t < 0.8;

    // Moon position (opposite of sun)
    const moonAngle = sunAngle + Math.PI;
    this.moon.position.set(
      Math.cos(moonAngle) * 300,
      Math.sin(moonAngle) * 200,
      -100
    );
    this.moon.visible = t < 0.3 || t > 0.7;

    // Stars visibility
    const nightness = t < 0.25 ? 1 - t / 0.25 : t > 0.75 ? (t - 0.75) / 0.25 : 0;
    this.stars.material.opacity = nightness;
    this.stars.material.transparent = true;

    // Sun light
    const dayIntensity = Math.max(0, Math.sin((t - 0.2) * Math.PI / 0.6));
    this.sunLight.intensity = dayIntensity * 1.5;
    this.sunLight.position.copy(this.sun.position).normalize().multiplyScalar(100);

    // Sun color shifts warmer at dawn/dusk
    if (t < 0.35 || t > 0.65) {
      this.sunLight.color.setHex(0xffaa60);
    } else {
      this.sunLight.color.setHex(0xffffff);
    }

    // Ambient light
    this.ambientLight.intensity = 0.15 + dayIntensity * 0.35;
    if (this.isNight()) {
      this.ambientLight.color.setHex(0x2020a0);
    } else {
      this.ambientLight.color.setHex(0x606080);
    }
  }

  update(dt) {
    this.timeOfDay += this.timeSpeed * dt;
    if (this.timeOfDay > 1) this.timeOfDay -= 1;
    this.updateSky();
  }
}

function lerpHex(a, b, t) {
  const ar = parseInt(a.slice(1, 3), 16), ag = parseInt(a.slice(3, 5), 16), ab = parseInt(a.slice(5, 7), 16);
  const br = parseInt(b.slice(1, 3), 16), bg = parseInt(b.slice(3, 5), 16), bb = parseInt(b.slice(5, 7), 16);
  const r = Math.round(ar + (br - ar) * t).toString(16).padStart(2, '0');
  const g = Math.round(ag + (bg - ag) * t).toString(16).padStart(2, '0');
  const bl = Math.round(ab + (bb - ab) * t).toString(16).padStart(2, '0');
  return `#${r}${g}${bl}`;
}
