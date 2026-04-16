// Dynamic weather system with rain, snow, and fog
import * as THREE from 'three';

const WEATHER_TYPES = ['sunny', 'cloudy', 'rain', 'storm', 'snow', 'fog'];

export class Weather {
  constructor(scene) {
    this.scene = scene;
    this.current = 'sunny';
    this.target = 'sunny';
    this.transition = 1;
    this.timer = 0;
    this.changeInterval = 180; // seconds between weather changes
    this.intensity = 0;

    // Rain particles
    this.rainCount = 3000;
    this.rainGeo = new THREE.BufferGeometry();
    const rainPositions = new Float32Array(this.rainCount * 3);
    const rainVelocities = new Float32Array(this.rainCount);
    for (let i = 0; i < this.rainCount; i++) {
      rainPositions[i * 3] = (Math.random() - 0.5) * 80;
      rainPositions[i * 3 + 1] = Math.random() * 30 + 5;
      rainPositions[i * 3 + 2] = (Math.random() - 0.5) * 80;
      rainVelocities[i] = 15 + Math.random() * 10;
    }
    this.rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPositions, 3));
    this.rainVelocities = rainVelocities;
    const rainMat = new THREE.PointsMaterial({
      color: '#aaccee',
      size: 0.08,
      transparent: true,
      opacity: 0,
      sizeAttenuation: true
    });
    this.rain = new THREE.Points(this.rainGeo, rainMat);
    scene.add(this.rain);

    // Snow particles
    this.snowCount = 1500;
    this.snowGeo = new THREE.BufferGeometry();
    const snowPositions = new Float32Array(this.snowCount * 3);
    const snowVelocities = new Float32Array(this.snowCount * 2); // fall speed + drift
    for (let i = 0; i < this.snowCount; i++) {
      snowPositions[i * 3] = (Math.random() - 0.5) * 80;
      snowPositions[i * 3 + 1] = Math.random() * 25 + 5;
      snowPositions[i * 3 + 2] = (Math.random() - 0.5) * 80;
      snowVelocities[i * 2] = 1 + Math.random() * 1.5;
      snowVelocities[i * 2 + 1] = (Math.random() - 0.5) * 2;
    }
    this.snowGeo.setAttribute('position', new THREE.BufferAttribute(snowPositions, 3));
    this.snowVelocities = snowVelocities;
    const snowMat = new THREE.PointsMaterial({
      color: '#ffffff',
      size: 0.15,
      transparent: true,
      opacity: 0,
      sizeAttenuation: true
    });
    this.snow = new THREE.Points(this.snowGeo, snowMat);
    scene.add(this.snow);

    // Fog
    this.fog = new THREE.FogExp2('#8a9a8a', 0);
    scene.fog = this.fog;
  }

  setWeather(type) {
    if (WEATHER_TYPES.includes(type)) {
      this.target = type;
      this.transition = 0;
    }
  }

  getLabel() {
    const labels = {
      sunny: 'Sunny',
      cloudy: 'Cloudy',
      rain: 'Raining',
      storm: 'Storming',
      snow: 'Snowing',
      fog: 'Foggy'
    };
    return labels[this.current] || 'Clear';
  }

  update(dt, playerPos) {
    // Auto-change weather
    this.timer += dt;
    if (this.timer > this.changeInterval) {
      this.timer = 0;
      const types = WEATHER_TYPES.filter(t => t !== this.current);
      // Weight sunny more heavily
      const weighted = ['sunny', 'sunny', 'sunny', ...types];
      this.setWeather(weighted[Math.floor(Math.random() * weighted.length)]);
    }

    // Transition
    if (this.transition < 1) {
      this.transition = Math.min(1, this.transition + dt * 0.1);
      if (this.transition >= 1) {
        this.current = this.target;
      }
    }

    // Calculate target intensities
    const isRaining = this.target === 'rain' || this.target === 'storm';
    const isSnowing = this.target === 'snow';
    const isFoggy = this.target === 'fog';
    const isStormy = this.target === 'storm';

    // Rain
    const rainTarget = isRaining ? (isStormy ? 0.9 : 0.6) : 0;
    const rainOpacity = this.rain.material.opacity;
    this.rain.material.opacity += (rainTarget - rainOpacity) * dt * 2;

    if (this.rain.material.opacity > 0.01) {
      const positions = this.rainGeo.attributes.position.array;
      for (let i = 0; i < this.rainCount; i++) {
        positions[i * 3 + 1] -= this.rainVelocities[i] * dt;
        // Wind during storm
        if (isStormy) {
          positions[i * 3] += 3 * dt;
        }
        // Recycle
        if (positions[i * 3 + 1] < 0) {
          positions[i * 3] = playerPos.x + (Math.random() - 0.5) * 60;
          positions[i * 3 + 1] = 25 + Math.random() * 10;
          positions[i * 3 + 2] = playerPos.z + (Math.random() - 0.5) * 60;
        }
      }
      this.rainGeo.attributes.position.needsUpdate = true;
    }

    // Snow
    const snowTarget = isSnowing ? 0.7 : 0;
    this.snow.material.opacity += (snowTarget - this.snow.material.opacity) * dt * 2;

    if (this.snow.material.opacity > 0.01) {
      const positions = this.snowGeo.attributes.position.array;
      for (let i = 0; i < this.snowCount; i++) {
        positions[i * 3 + 1] -= this.snowVelocities[i * 2] * dt;
        positions[i * 3] += this.snowVelocities[i * 2 + 1] * dt;
        positions[i * 3] += Math.sin(positions[i * 3 + 1] * 0.5) * 0.3 * dt;
        // Recycle
        if (positions[i * 3 + 1] < 0) {
          positions[i * 3] = playerPos.x + (Math.random() - 0.5) * 60;
          positions[i * 3 + 1] = 20 + Math.random() * 10;
          positions[i * 3 + 2] = playerPos.z + (Math.random() - 0.5) * 60;
        }
      }
      this.snowGeo.attributes.position.needsUpdate = true;
    }

    // Fog
    const fogTarget = isFoggy ? 0.02 : (isRaining ? 0.005 : 0.001);
    this.fog.density += (fogTarget - this.fog.density) * dt * 0.5;

    // Fog color based on weather
    if (isFoggy) {
      this.fog.color.lerp(new THREE.Color('#8a9a8a'), dt);
    } else if (isRaining) {
      this.fog.color.lerp(new THREE.Color('#4a5a6a'), dt);
    } else {
      this.fog.color.lerp(new THREE.Color('#aabbcc'), dt);
    }
  }

  // Get wind strength for grass animation
  getWindStrength() {
    if (this.current === 'storm') return 0.4;
    if (this.current === 'rain') return 0.25;
    if (this.current === 'snow') return 0.1;
    return 0.15;
  }
}
