// Animated instanced grass using vertex shaders
import * as THREE from 'three';

export class Grass {
  constructor(scene, terrain) {
    this.scene = scene;
    this.terrain = terrain;
    this.time = 0;

    const bladeCount = 120000;
    const spread = 500;

    // Blade geometry - a quad (two triangles)
    const bladeWidth = 0.06;
    const bladeHeight = 0.35;
    const geo = new THREE.BufferGeometry();

    const vertices = new Float32Array([
      -bladeWidth / 2, 0, 0,
       bladeWidth / 2, 0, 0,
      -bladeWidth / 4, bladeHeight, 0,
       bladeWidth / 4, bladeHeight, 0,
    ]);
    const indices = [0, 1, 2, 1, 3, 2];
    const uvs = new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]);

    geo.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
    geo.setIndex(indices);

    // Instance attributes
    const instancePositions = new Float32Array(bladeCount * 3);
    const instanceRotations = new Float32Array(bladeCount);
    const instanceScales = new Float32Array(bladeCount);
    const instanceColors = new Float32Array(bladeCount * 3);

    for (let i = 0; i < bladeCount; i++) {
      const x = (Math.random() - 0.5) * spread;
      const z = (Math.random() - 0.5) * spread;
      const y = terrain ? terrain.getHeightAt(x, z) : 0;

      instancePositions[i * 3] = x;
      instancePositions[i * 3 + 1] = y;
      instancePositions[i * 3 + 2] = z;

      instanceRotations[i] = Math.random() * Math.PI;
      instanceScales[i] = 0.6 + Math.random() * 0.8;

      // Color variation: greens and yellowy-greens
      const greenVar = 0.3 + Math.random() * 0.4;
      const yellowVar = Math.random() * 0.15;
      instanceColors[i * 3] = 0.15 + yellowVar;
      instanceColors[i * 3 + 1] = greenVar + 0.1;
      instanceColors[i * 3 + 2] = 0.05 + Math.random() * 0.05;
    }

    const instanceGeo = new THREE.InstancedBufferGeometry();
    instanceGeo.index = geo.index;
    instanceGeo.attributes.position = geo.attributes.position;
    instanceGeo.attributes.uv = geo.attributes.uv;

    instanceGeo.setAttribute('instancePosition', new THREE.InstancedBufferAttribute(instancePositions, 3));
    instanceGeo.setAttribute('instanceRotation', new THREE.InstancedBufferAttribute(instanceRotations, 1));
    instanceGeo.setAttribute('instanceScale', new THREE.InstancedBufferAttribute(instanceScales, 1));
    instanceGeo.setAttribute('instanceColor', new THREE.InstancedBufferAttribute(instanceColors, 3));

    // Custom shader material
    const grassMat = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        playerPos: { value: new THREE.Vector3() },
        windStrength: { value: 0.15 },
        windSpeed: { value: 1.5 }
      },
      vertexShader: `
        attribute vec3 instancePosition;
        attribute float instanceRotation;
        attribute float instanceScale;
        attribute vec3 instanceColor;

        uniform float time;
        uniform vec3 playerPos;
        uniform float windStrength;
        uniform float windSpeed;

        varying vec3 vColor;
        varying float vHeight;
        varying float vDist;

        void main() {
          vColor = instanceColor;
          vHeight = uv.y;

          // Scale blade
          vec3 pos = position * instanceScale;

          // Rotate blade around Y
          float c = cos(instanceRotation);
          float s = sin(instanceRotation);
          vec3 rotated = vec3(
            pos.x * c - pos.z * s,
            pos.y,
            pos.x * s + pos.z * c
          );

          // Wind sway - only affects top of blade (uv.y)
          float windPhase = instancePosition.x * 0.3 + instancePosition.z * 0.2;
          float sway = sin(time * windSpeed + windPhase) * windStrength * uv.y * uv.y;
          float sway2 = sin(time * windSpeed * 0.7 + windPhase * 1.3) * windStrength * 0.5 * uv.y;
          rotated.x += sway + sway2;
          rotated.z += sway * 0.3;

          // Player push-away effect
          vec2 toPlayer = instancePosition.xz - playerPos.xz;
          float playerDist = length(toPlayer);
          if (playerDist < 1.5) {
            float push = (1.0 - playerDist / 1.5) * 0.3 * uv.y;
            vec2 pushDir = normalize(toPlayer);
            rotated.x += pushDir.x * push;
            rotated.z += pushDir.y * push;
          }

          // World position
          vec3 worldPos = rotated + instancePosition;

          // Distance fade (for performance culling visual)
          vDist = length(worldPos.xz - playerPos.xz);

          gl_Position = projectionMatrix * modelViewMatrix * vec4(worldPos, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vHeight;
        varying float vDist;

        void main() {
          // Fade out distant grass
          if (vDist > 80.0) discard;
          float fade = 1.0 - smoothstep(50.0, 80.0, vDist);

          // Darker at base, lighter at tip
          vec3 color = vColor * (0.4 + vHeight * 0.6);

          // Slight tip highlight
          color += vec3(0.05, 0.08, 0.02) * vHeight * vHeight;

          gl_FragColor = vec4(color, fade);
        }
      `,
      side: THREE.DoubleSide,
      transparent: true,
      depthWrite: true
    });

    this.mesh = new THREE.Mesh(instanceGeo, grassMat);
    this.mesh.frustumCulled = false;
    scene.add(this.mesh);
  }

  update(dt, playerPos, windStrength) {
    this.time += dt;
    const uniforms = this.mesh.material.uniforms;
    uniforms.time.value = this.time;
    uniforms.playerPos.value.copy(playerPos);
    if (windStrength !== undefined) {
      uniforms.windStrength.value = windStrength;
    }
  }
}
