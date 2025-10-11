import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

// Game state
const gameState = {
  unicornsSaved: 0,
  totalUnicorns: 5,
  magicPower: 100,
  canCastSpell: true,
  canUseShield: true,
  hasShield: false
};

// Setup scene
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0xe6f0ff, 0.002);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 500);
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.body.appendChild(renderer.domElement);

// Post-processing for bloom and effects
const composer = new EffectComposer(renderer);
const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);

const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  0.8,  // strength (reduced for cleaner look)
  0.3,  // radius
  0.9   // threshold (higher = less bloom)
);
composer.addPass(bloomPass);

// Advanced Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
scene.add(ambientLight);

// Main directional light (sun)
const sunLight = new THREE.DirectionalLight(0xfffdf5, 2.5);
sunLight.position.set(100, 120, 50);
sunLight.castShadow = true;
sunLight.shadow.mapSize.width = 4096;
sunLight.shadow.mapSize.height = 4096;
sunLight.shadow.camera.left = -100;
sunLight.shadow.camera.right = 100;
sunLight.shadow.camera.top = 100;
sunLight.shadow.camera.bottom = -100;
sunLight.shadow.camera.near = 0.5;
sunLight.shadow.camera.far = 500;
sunLight.shadow.bias = -0.0001;
scene.add(sunLight);

// Rim light for clean highlights
const rimLight = new THREE.DirectionalLight(0xd4e6ff, 0.6);
rimLight.position.set(-50, 50, -50);
scene.add(rimLight);

// Hemisphere light for natural ambient
const hemiLight = new THREE.HemisphereLight(0xd4e9ff, 0xb8e6b8, 0.7);
scene.add(hemiLight);

// Create beautiful sky
function createSky() {
  const skyGeometry = new THREE.SphereGeometry(400, 32, 32);
  const skyMaterial = new THREE.ShaderMaterial({
    uniforms: {
      topColor: { value: new THREE.Color(0x0077ff) },
      bottomColor: { value: new THREE.Color(0xffffff) },
      offset: { value: 33 },
      exponent: { value: 0.6 }
    },
    vertexShader: `
      varying vec3 vWorldPosition;
      void main() {
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPosition.xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 topColor;
      uniform vec3 bottomColor;
      uniform float offset;
      uniform float exponent;
      varying vec3 vWorldPosition;
      void main() {
        float h = normalize(vWorldPosition + offset).y;
        gl_FragColor = vec4(mix(bottomColor, topColor, max(pow(max(h, 0.0), exponent), 0.0)), 1.0);
      }
    `,
    side: THREE.BackSide
  });
  const sky = new THREE.Mesh(skyGeometry, skyMaterial);
  scene.add(sky);
}
createSky();

// Add clouds
function createClouds() {
  const cloudGeometry = new THREE.SphereGeometry(8, 6, 6);
  const cloudMaterial = new THREE.MeshPhongMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.6,
    shininess: 10
  });

  for (let i = 0; i < 30; i++) {
    const cloud = new THREE.Group();

    for (let j = 0; j < 3; j++) {
      const cloudPart = new THREE.Mesh(cloudGeometry, cloudMaterial);
      cloudPart.position.x = Math.random() * 10 - 5;
      cloudPart.position.y = Math.random() * 3;
      cloudPart.position.z = Math.random() * 10 - 5;
      cloudPart.scale.set(
        1 + Math.random() * 0.5,
        0.6 + Math.random() * 0.3,
        1 + Math.random() * 0.5
      );
      cloud.add(cloudPart);
    }

    cloud.position.set(
      (Math.random() - 0.5) * 400,
      40 + Math.random() * 20,
      (Math.random() - 0.5) * 400
    );

    cloud.userData.speed = 0.1 + Math.random() * 0.2;
    scene.add(cloud);
    clouds.push(cloud);
  }
}
const clouds = [];
createClouds();

// Create detailed ground with grass texture
function createGround() {
  const groundSize = 300;
  const groundGeometry = new THREE.PlaneGeometry(groundSize, groundSize, 100, 100);

  // Add terrain variation
  const vertices = groundGeometry.attributes.position;
  for (let i = 0; i < vertices.count; i++) {
    const x = vertices.getX(i);
    const z = vertices.getZ(i);
    const height = Math.sin(x * 0.03) * Math.cos(z * 0.03) * 2 +
                   Math.sin(x * 0.1) * Math.cos(z * 0.1) * 0.5;
    vertices.setZ(i, height);
  }
  groundGeometry.computeVertexNormals();

  const groundMaterial = new THREE.MeshStandardMaterial({
    color: 0x5fa85f,
    roughness: 0.85,
    metalness: 0.0,
    flatShading: false
  });

  const ground = new THREE.Mesh(groundGeometry, groundMaterial);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  // Add grass blades
  addGrass(groundSize);
}

function addGrass(groundSize) {
  const grassGeometry = new THREE.PlaneGeometry(0.3, 1.5);
  const grassMaterial = new THREE.MeshStandardMaterial({
    color: 0x4a9a4a,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.7
  });

  const grassCount = 2000;
  const grassField = new THREE.InstancedMesh(grassGeometry, grassMaterial, grassCount);

  const dummy = new THREE.Object3D();
  for (let i = 0; i < grassCount; i++) {
    const x = (Math.random() - 0.5) * groundSize * 0.9;
    const z = (Math.random() - 0.5) * groundSize * 0.9;
    const y = Math.sin(x * 0.03) * Math.cos(z * 0.03) * 2 +
              Math.sin(x * 0.1) * Math.cos(z * 0.1) * 0.5 + 0.75;

    dummy.position.set(x, y, z);
    dummy.rotation.y = Math.random() * Math.PI;
    dummy.rotation.z = (Math.random() - 0.5) * 0.3;
    dummy.scale.set(0.8 + Math.random() * 0.4, 0.8 + Math.random() * 0.6, 1);
    dummy.updateMatrix();
    grassField.setMatrixAt(i, dummy.matrix);
  }

  grassField.castShadow = true;
  grassField.receiveShadow = true;
  scene.add(grassField);
}

createGround();

// Helper function to get terrain height at position
function getTerrainHeight(x, z) {
  return Math.sin(x * 0.03) * Math.cos(z * 0.03) * 2 +
         Math.sin(x * 0.1) * Math.cos(z * 0.1) * 0.5;
}

// Create detailed trees
function createTree(x, z) {
  const tree = new THREE.Group();

  // Trunk with texture
  const trunkGeometry = new THREE.CylinderGeometry(0.4, 0.6, 5, 12);
  const trunkMaterial = new THREE.MeshStandardMaterial({
    color: 0x4a3728,
    roughness: 0.95,
    metalness: 0.0
  });
  const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
  trunk.position.y = 2.5;
  trunk.castShadow = true;
  trunk.receiveShadow = true;
  tree.add(trunk);

  // Layered foliage
  const foliageColors = [0x2d5016, 0x3a6b1f, 0x478228];
  for (let i = 0; i < 3; i++) {
    const foliage = new THREE.Mesh(
      new THREE.SphereGeometry(2.5 - i * 0.4, 8, 8),
      new THREE.MeshStandardMaterial({
        color: foliageColors[i],
        roughness: 0.85
      })
    );
    foliage.position.y = 5 + i * 1.2;
    foliage.castShadow = true;
    foliage.receiveShadow = true;
    tree.add(foliage);
  }

  tree.position.set(x, 0, z);
  scene.add(tree);
}

// Add forest
for (let i = 0; i < 50; i++) {
  const x = (Math.random() - 0.5) * 280;
  const z = (Math.random() - 0.5) * 280;
  const distFromCenter = Math.sqrt(x * x + z * z);
  if (distFromCenter > 20) {
    createTree(x, z);
  }
}

// Add magical flowers
function createFlowers() {
  for (let i = 0; i < 60; i++) {
    const x = (Math.random() - 0.5) * 260;
    const z = (Math.random() - 0.5) * 260;
    const y = Math.sin(x * 0.03) * Math.cos(z * 0.03) * 2 +
              Math.sin(x * 0.1) * Math.cos(z * 0.1) * 0.5;

    const flower = new THREE.Group();

    // Stem
    const stem = new THREE.Mesh(
      new THREE.CylinderGeometry(0.02, 0.02, 0.5),
      new THREE.MeshStandardMaterial({ color: 0x2d5016 })
    );
    stem.position.y = 0.25;
    flower.add(stem);

    // Petals
    const petalColors = [0xff69b4, 0xff1493, 0xffd700, 0x9370db];
    const petalColor = petalColors[Math.floor(Math.random() * petalColors.length)];

    for (let j = 0; j < 6; j++) {
      const petal = new THREE.Mesh(
        new THREE.SphereGeometry(0.1, 8, 8),
        new THREE.MeshStandardMaterial({
          color: petalColor,
          emissive: petalColor,
          emissiveIntensity: 0.2
        })
      );
      const angle = (j / 6) * Math.PI * 2;
      petal.position.set(
        Math.cos(angle) * 0.12,
        0.5,
        Math.sin(angle) * 0.12
      );
      petal.scale.set(0.8, 1.2, 0.5);
      flower.add(petal);
    }

    // Center
    const center = new THREE.Mesh(
      new THREE.SphereGeometry(0.08, 8, 8),
      new THREE.MeshStandardMaterial({
        color: 0xffd700,
        emissive: 0xffd700,
        emissiveIntensity: 0.5
      })
    );
    center.position.y = 0.5;
    flower.add(center);

    flower.position.set(x, y, z);
    scene.add(flower);
  }
}
createFlowers();

// Create realistic horse/unicorn model
function createUnicorn(color, isPlayer = false) {
  const unicorn = new THREE.Group();

  // Body - main torso (reasonable segment count)
  const bodyGeometry = new THREE.CapsuleGeometry(0.75, 2.0, 8, 16);
  const bodyMaterial = new THREE.MeshStandardMaterial({
    color: color,
    roughness: 0.5,
    metalness: 0.15,
    flatShading: false
  });
  const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
  body.rotation.z = Math.PI / 2;
  body.position.y = 0;
  body.castShadow = true;
  body.receiveShadow = true;
  unicorn.add(body);

  // Chest - broader front
  const chest = new THREE.Mesh(
    new THREE.SphereGeometry(0.7, 16, 16),
    bodyMaterial
  );
  chest.scale.set(1.0, 0.95, 0.8);
  chest.position.set(0.9, -0.05, 0);
  chest.castShadow = true;
  unicorn.add(chest);

  // Hindquarters
  const hindquarters = new THREE.Mesh(
    new THREE.SphereGeometry(0.65, 16, 16),
    bodyMaterial
  );
  hindquarters.scale.set(0.85, 0.95, 0.95);
  hindquarters.position.set(-0.95, 0.05, 0);
  hindquarters.castShadow = true;
  unicorn.add(hindquarters);

  // Neck - simple cylinder (rotated upward)
  const neckGeometry = new THREE.CylinderGeometry(0.24, 0.32, 1.3, 12);
  const neck = new THREE.Mesh(neckGeometry, bodyMaterial);
  neck.position.set(1.4, 0.45, 0);
  neck.rotation.z = Math.PI / 2 + Math.PI / 4; // 90 + 45 = 135 degrees upward
  neck.castShadow = true;
  neck.receiveShadow = true;
  unicorn.add(neck);

  // Head - horse-shaped (rounded box)
  const headGeometry = new THREE.BoxGeometry(0.9, 0.7, 0.55, 4, 4, 4);
  const head = new THREE.Mesh(headGeometry, bodyMaterial);
  head.position.set(2.2, 1.1, 0);
  head.rotation.z = 0.15;
  head.castShadow = true;
  unicorn.add(head);

  // Snout/muzzle (rounded)
  const snoutGeometry = new THREE.BoxGeometry(0.45, 0.45, 0.45, 3, 3, 3);
  const snoutMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color(color).lerp(new THREE.Color(0xffffff), 0.3),
    roughness: 0.6
  });
  const snout = new THREE.Mesh(snoutGeometry, snoutMaterial);
  snout.position.set(2.7, 0.95, 0);
  snout.castShadow = true;
  unicorn.add(snout);

  // Nostrils
  [-0.11, 0.11].forEach(zOffset => {
    const nostril = new THREE.Mesh(
      new THREE.SphereGeometry(0.05, 8, 8),
      new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.9 })
    );
    nostril.position.set(2.85, 0.95, zOffset);
    unicorn.add(nostril);
  });

  // Eyes - large and expressive
  const eyeWhite = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 });
  const eyePupil = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.1, metalness: 0.3 });

  [-0.3, 0.3].forEach(zOffset => {
    // Eye white
    const eye = new THREE.Mesh(
      new THREE.SphereGeometry(0.15, 12, 12),
      eyeWhite
    );
    eye.position.set(2.35, 1.2, zOffset);
    eye.scale.set(0.8, 1, 1);
    unicorn.add(eye);

    // Pupil
    const pupil = new THREE.Mesh(
      new THREE.SphereGeometry(0.08, 12, 12),
      eyePupil
    );
    pupil.position.set(2.43, 1.2, zOffset);
    unicorn.add(pupil);

    // Highlight sparkle
    const sparkle = new THREE.Mesh(
      new THREE.SphereGeometry(0.03, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0xffffff })
    );
    sparkle.position.set(2.47, 1.25, zOffset);
    unicorn.add(sparkle);

    // Eyelid detail
    const eyelid = new THREE.Mesh(
      new THREE.SphereGeometry(0.16, 12, 12, 0, Math.PI * 2, 0, Math.PI / 2),
      bodyMaterial
    );
    eyelid.position.set(2.35, 1.32, zOffset);
    eyelid.rotation.x = Math.PI;
    eyelid.scale.set(0.8, 0.5, 1);
    unicorn.add(eyelid);
  });

  // Ears - alert and pointed
  [-0.21, 0.21].forEach(zOffset => {
    const ear = new THREE.Mesh(
      new THREE.ConeGeometry(0.11, 0.45, 8),
      bodyMaterial
    );
    ear.position.set(2.05, 1.6, zOffset);
    ear.rotation.z = -Math.PI / 6;
    ear.rotation.x = zOffset < 0 ? Math.PI / 10 : -Math.PI / 10;
    ear.castShadow = true;
    unicorn.add(ear);

    // Inner ear
    const innerEar = new THREE.Mesh(
      new THREE.ConeGeometry(0.06, 0.28, 8),
      new THREE.MeshStandardMaterial({
        color: new THREE.Color(color).lerp(new THREE.Color(0xffaaaa), 0.5),
        roughness: 0.8
      })
    );
    innerEar.position.copy(ear.position);
    innerEar.rotation.copy(ear.rotation);
    unicorn.add(innerEar);
  });

  // Horn - smooth and elegant
  const hornGeometry = new THREE.CylinderGeometry(0, 0.13, 1.6, 16);
  const hornMaterial = new THREE.MeshStandardMaterial({
    color: isPlayer ? 0xffd700 : 0xf0e6ff,
    emissive: isPlayer ? 0xffaa00 : 0xccbbff,
    emissiveIntensity: isPlayer ? 0.6 : 0.4,
    metalness: 0.9,
    roughness: 0.1
  });
  const horn = new THREE.Mesh(hornGeometry, hornMaterial);
  horn.position.set(2.15, 1.8, 0);
  horn.rotation.z = -Math.PI / 10;
  horn.castShadow = true;
  unicorn.add(horn);

  // Mane - flowing and layered
  const maneColors = isPlayer
    ? [0xff1493, 0xff69b4, 0xffb6c1, 0xff1493, 0xff69b4, 0xffb6c1]
    : [0x8b00ff, 0x9932cc, 0xba55d3, 0x8b00ff, 0x9932cc, 0xba55d3];

  const maneSegments = [];
  for (let i = 0; i < 12; i++) {
    const maneSegment = new THREE.Mesh(
      new THREE.SphereGeometry(0.24 - i * 0.015, 12, 12),
      new THREE.MeshStandardMaterial({
        color: maneColors[i % maneColors.length],
        roughness: 0.7,
        emissive: maneColors[i % maneColors.length],
        emissiveIntensity: 0.1
      })
    );
    const t = i / 11;
    // Position mane from neck top down along the body back
    const baseX = 1.7 - t * 1.9; // From neck area back
    const baseY = 0.85 - t * 0.85; // Start high on neck, go down to body level

    maneSegment.position.set(baseX, baseY, 0);
    maneSegment.scale.set(0.7, 1.3, 0.5);
    maneSegment.rotation.z = t * 0.2;
    maneSegment.castShadow = true;
    maneSegment.userData.baseX = baseX;
    maneSegment.userData.baseY = baseY;
    maneSegment.userData.baseRotZ = t * 0.2;
    maneSegment.userData.index = i;
    unicorn.add(maneSegment);
    maneSegments.push(maneSegment);
  }

  // Store mane for animation
  unicorn.userData.mane = maneSegments;

  // Forelock (hair between ears)
  for (let i = 0; i < 3; i++) {
    const forelock = new THREE.Mesh(
      new THREE.SphereGeometry(0.14, 12, 12),
      new THREE.MeshStandardMaterial({
        color: maneColors[i % maneColors.length],
        roughness: 0.7
      })
    );
    forelock.position.set(2.2, 1.4 - i * 0.18, 0);
    forelock.scale.set(0.6, 1.2, 0.5);
    forelock.castShadow = true;
    unicorn.add(forelock);
  }

  // Tail - long and flowing
  const tailBase = new THREE.Mesh(
    new THREE.SphereGeometry(0.23, 12, 12),
    bodyMaterial
  );
  tailBase.position.set(-1.2, 0.25, 0);
  unicorn.add(tailBase);

  for (let i = 0; i < 10; i++) {
    const tailSegment = new THREE.Mesh(
      new THREE.SphereGeometry(0.21 - i * 0.017, 12, 12),
      new THREE.MeshStandardMaterial({
        color: maneColors[i % maneColors.length],
        roughness: 0.75
      })
    );
    const t = i / 9;
    tailSegment.position.set(
      -1.3 - t * 1.1,
      0.2 - t * 0.75 - Math.sin(t * Math.PI) * 0.28,
      Math.sin(t * Math.PI * 2) * 0.14
    );
    tailSegment.scale.set(0.7, 1.5, 0.7);
    tailSegment.castShadow = true;
    unicorn.add(tailSegment);
  }

  // Legs - realistic horse legs with joints (stored for animation)
  const legPositions = [
    { x: 1.0, z: 0.6, name: 'frontLeft', phase: 0 },
    { x: 1.0, z: -0.6, name: 'frontRight', phase: Math.PI },
    { x: -0.8, z: 0.6, name: 'backLeft', phase: Math.PI },
    { x: -0.8, z: -0.6, name: 'backRight', phase: 0 }
  ];

  const legs = [];

  legPositions.forEach(pos => {
    const legGroup = new THREE.Group();
    legGroup.position.set(pos.x, 0, pos.z);

    // Upper leg (thigh/shoulder)
    const upperLeg = new THREE.Mesh(
      new THREE.CylinderGeometry(0.2, 0.17, 0.85, 12),
      bodyMaterial
    );
    upperLeg.position.set(0, -0.425, 0);
    upperLeg.castShadow = true;
    upperLeg.receiveShadow = true;
    legGroup.add(upperLeg);

    // Knee/hock joint
    const joint = new THREE.Mesh(
      new THREE.SphereGeometry(0.17, 12, 12),
      bodyMaterial
    );
    joint.position.set(0, -0.85, 0);
    joint.castShadow = true;
    legGroup.add(joint);

    // Lower leg (cannon bone)
    const lowerLeg = new THREE.Mesh(
      new THREE.CylinderGeometry(0.14, 0.12, 0.85, 12),
      bodyMaterial
    );
    lowerLeg.position.set(0, -1.275, 0);
    lowerLeg.castShadow = true;
    lowerLeg.receiveShadow = true;
    legGroup.add(lowerLeg);

    // Fetlock (ankle)
    const fetlock = new THREE.Mesh(
      new THREE.SphereGeometry(0.12, 12, 12),
      bodyMaterial
    );
    fetlock.position.set(0, -1.7, 0);
    fetlock.castShadow = true;
    legGroup.add(fetlock);

    // Pastern (lower ankle)
    const pastern = new THREE.Mesh(
      new THREE.CylinderGeometry(0.11, 0.13, 0.23, 12),
      bodyMaterial
    );
    pastern.position.set(0, -1.84, 0);
    pastern.castShadow = true;
    legGroup.add(pastern);

    // Hoof
    const hoof = new THREE.Mesh(
      new THREE.CylinderGeometry(0.13, 0.15, 0.18, 12),
      new THREE.MeshStandardMaterial({
        color: 0x0a0a0a,
        metalness: 0.4,
        roughness: 0.6
      })
    );
    hoof.position.set(0, -2.0, 0);
    hoof.castShadow = true;
    legGroup.add(hoof);

    unicorn.add(legGroup);
    legs.push({ group: legGroup, phase: pos.phase, baseY: 0 });
  });

  // Store legs for animation
  unicorn.userData.legs = legs;

  // Add glow for player
  if (isPlayer) {
    const glowLight = new THREE.PointLight(0xffb6c1, 1, 5);
    glowLight.position.set(0, 1, 0);
    unicorn.add(glowLight);
  }

  return unicorn;
}

const player = createUnicorn(0xfff0f5, true);
const playerGroundHeight = getTerrainHeight(0, 0);
player.position.set(0, playerGroundHeight + 2.2, 0);
scene.add(player);

// Create unicorns in danger
const unicornsInDanger = [];
const dangerPositions = [
  { x: 40, z: 40 },
  { x: -50, z: 30 },
  { x: 45, z: -45 },
  { x: -35, z: -50 },
  { x: 10, z: 60 }
];

dangerPositions.forEach((pos, index) => {
  const colors = [0xe6e6fa, 0xdda0dd, 0xffb6c1, 0xf0e6ff, 0xffd7ff];
  const unicornInDanger = createUnicorn(colors[index], false);
  const groundHeight = getTerrainHeight(pos.x, pos.z);
  unicornInDanger.position.set(pos.x, groundHeight + 2.2, pos.z);

  // Danger indicator (cleaner look)
  const dangerRing = new THREE.Mesh(
    new THREE.RingGeometry(2.5, 2.8, 64),
    new THREE.MeshBasicMaterial({
      color: 0xff3333,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.5
    })
  );
  dangerRing.rotation.x = -Math.PI / 2;
  dangerRing.position.y = 0.1;
  unicornInDanger.add(dangerRing);

  // Danger particles (reduced for cleaner look)
  const particleGeometry = new THREE.BufferGeometry();
  const particleCount = 30;
  const positions = new Float32Array(particleCount * 3);

  for (let i = 0; i < particleCount; i++) {
    const angle = (i / particleCount) * Math.PI * 2;
    positions[i * 3] = Math.cos(angle) * 2.5;
    positions[i * 3 + 1] = Math.random() * 4;
    positions[i * 3 + 2] = Math.sin(angle) * 2.5;
  }

  particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const particleMaterial = new THREE.PointsMaterial({
    color: 0xff6666,
    size: 0.15,
    transparent: true,
    opacity: 0.6,
    blending: THREE.AdditiveBlending
  });

  const particles = new THREE.Points(particleGeometry, particleMaterial);
  unicornInDanger.add(particles);

  unicornInDanger.userData = {
    dangerRing,
    particles,
    saved: false,
    pulseTime: Math.random() * Math.PI * 2,
    followOffset: new THREE.Vector3(
      (Math.random() - 0.5) * 8,
      0,
      (Math.random() - 0.5) * 8 - 5
    ),
    originalPosition: new THREE.Vector3(pos.x, groundHeight + 2.2, pos.z)
  };

  scene.add(unicornInDanger);
  unicornsInDanger.push(unicornInDanger);
});

// Camera setup
camera.position.set(0, 8, 15);
camera.lookAt(player.position);

// Input handling
const keys = {};
const mouse = { x: 0, y: 0 };
let mouseMovement = false;

window.addEventListener('keydown', (e) => {
  keys[e.key.toLowerCase()] = true;

  if (e.code === 'Space' && gameState.canCastSpell && gameState.magicPower >= 20) {
    castSpell();
    e.preventDefault();
  }

  if (e.key === 'Shift' && gameState.canUseShield && gameState.magicPower >= 30) {
    activateShield();
    e.preventDefault();
  }
});

window.addEventListener('keyup', (e) => {
  keys[e.key.toLowerCase()] = false;
});

window.addEventListener('mousemove', (e) => {
  if (mouseMovement) {
    mouse.x = (e.movementX || 0) * 0.002;
    mouse.y = (e.movementY || 0) * 0.002;
  }
});

// Start game on button click
let gameStarted = false;

function startGame() {
  if (!gameStarted) {
    gameStarted = true;
    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) {
      loadingScreen.style.display = 'none';
    }
    // Auto-enable pointer lock when game starts
    renderer.domElement.requestPointerLock();
  }
}

// Add click listener to start button
document.getElementById('start-button').addEventListener('click', startGame);

// Exit game button
document.getElementById('exit-button').addEventListener('click', () => {
  // Exit pointer lock
  if (document.pointerLockElement) {
    document.exitPointerLock();
  }

  // Reset game state
  gameStarted = false;
  mouseMovement = false;
  gameState.unicornsSaved = 0;
  gameState.magicPower = 100;
  gameState.canCastSpell = true;
  gameState.canUseShield = true;
  gameState.hasShield = false;

  // Reset player position
  player.position.set(0, playerGroundHeight + 2.2, 0);
  player.rotation.y = 0;

  // Reset camera
  cameraAngle = 0;
  cameraHeight = 0;

  // Reset unicorns in danger
  unicornsInDanger.forEach((unicorn, index) => {
    if (unicorn.userData.saved) {
      // Re-add danger effects if they were removed
      if (!unicorn.userData.dangerRing.parent) {
        unicorn.add(unicorn.userData.dangerRing);
      }
      if (!unicorn.userData.particles.parent) {
        unicorn.add(unicorn.userData.particles);
      }
      unicorn.userData.saved = false;

      // Reset position
      unicorn.position.copy(unicorn.userData.originalPosition);
      unicorn.rotation.set(0, 0, 0);
    }
  });

  // Clear all spells
  spells.forEach(spell => scene.remove(spell));
  spells.length = 0;

  // Remove shield if active
  if (shieldMesh) {
    player.remove(shieldMesh);
    shieldMesh = null;
  }

  // Reset ability cooldowns
  document.getElementById('spell-ability').classList.remove('cooldown');
  document.getElementById('shield-ability').classList.remove('cooldown');

  // Show loading screen again
  const loadingScreen = document.getElementById('loading-screen');
  if (loadingScreen) {
    loadingScreen.style.display = 'flex';
  }

  updateUI();
});

// Click to enable pointer lock during game
renderer.domElement.addEventListener('click', () => {
  if (gameStarted) {
    mouseMovement = true;
    renderer.domElement.requestPointerLock();
  }
});

document.addEventListener('pointerlockchange', () => {
  mouseMovement = document.pointerLockElement === renderer.domElement;
});

// Advanced magic spell system
const spells = [];

function castSpell() {
  gameState.canCastSpell = false;
  gameState.magicPower -= 20;
  updateUI();

  document.getElementById('spell-ability').classList.add('cooldown');

  // Create magical spell
  const spell = new THREE.Group();

  // Core
  const spellCore = new THREE.Mesh(
    new THREE.SphereGeometry(0.4, 32, 32),
    new THREE.MeshStandardMaterial({
      color: 0xff1493,
      emissive: 0xff1493,
      emissiveIntensity: 2,
      transparent: true,
      opacity: 0.9
    })
  );
  spell.add(spellCore);

  // Outer glow
  const outerGlow = new THREE.Mesh(
    new THREE.SphereGeometry(0.6, 32, 32),
    new THREE.MeshBasicMaterial({
      color: 0xff69b4,
      transparent: true,
      opacity: 0.3
    })
  );
  spell.add(outerGlow);

  // Particle trail
  const particleGeometry = new THREE.BufferGeometry();
  const particleCount = 30;
  const positions = new Float32Array(particleCount * 3);

  for (let i = 0; i < particleCount; i++) {
    const angle = (i / particleCount) * Math.PI * 2;
    const radius = 0.8;
    positions[i * 3] = Math.cos(angle) * radius;
    positions[i * 3 + 1] = Math.sin(angle) * radius;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 0.4;
  }

  particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const particleMaterial = new THREE.PointsMaterial({
    color: 0xffd700,
    size: 0.15,
    transparent: true,
    opacity: 0.9,
    blending: THREE.AdditiveBlending
  });

  const particles = new THREE.Points(particleGeometry, particleMaterial);
  spell.add(particles);

  // Light
  const spellLight = new THREE.PointLight(0xff1493, 3, 10);
  spell.add(spellLight);

  spell.position.copy(player.position);
  spell.position.y += 1;

  const direction = new THREE.Vector3();
  camera.getWorldDirection(direction);
  spell.userData = {
    velocity: direction.clone().multiplyScalar(0.6),
    lifetime: 0,
    particles
  };

  scene.add(spell);
  spells.push(spell);

  setTimeout(() => {
    gameState.canCastSpell = true;
    document.getElementById('spell-ability').classList.remove('cooldown');
  }, 1000);
}

// Shield system
let shieldMesh = null;

function activateShield() {
  if (gameState.hasShield) return;

  gameState.canUseShield = false;
  gameState.hasShield = true;
  gameState.magicPower -= 30;
  updateUI();

  document.getElementById('shield-ability').classList.add('cooldown');

  // Create shield
  shieldMesh = new THREE.Mesh(
    new THREE.IcosahedronGeometry(3, 1),
    new THREE.MeshStandardMaterial({
      color: 0x00ffff,
      transparent: true,
      opacity: 0.25,
      emissive: 0x00ffff,
      emissiveIntensity: 0.8,
      side: THREE.DoubleSide,
      wireframe: true
    })
  );
  player.add(shieldMesh);

  // Shield light
  const shieldLight = new THREE.PointLight(0x00ffff, 2, 8);
  shieldMesh.add(shieldLight);

  setTimeout(() => {
    if (shieldMesh) {
      player.remove(shieldMesh);
      shieldMesh = null;
    }
    gameState.hasShield = false;

    setTimeout(() => {
      gameState.canUseShield = true;
      document.getElementById('shield-ability').classList.remove('cooldown');
    }, 2000);
  }, 3000);
}

// UI updates
function updateUI() {
  document.getElementById('unicorns-saved').textContent = `${gameState.unicornsSaved}/${gameState.totalUnicorns}`;
  document.getElementById('magic-power').textContent = `${Math.max(0, Math.round(gameState.magicPower))}%`;

  // Update progress bar
  const progressBar = document.getElementById('magic-progress');
  if (progressBar) {
    progressBar.style.width = `${Math.max(0, gameState.magicPower)}%`;
  }
}

function showMessage(text) {
  const messageEl = document.getElementById('message');
  messageEl.textContent = text;
  messageEl.style.display = 'block';

  setTimeout(() => {
    messageEl.style.display = 'none';
  }, 2500);
}

// Game loop
const clock = new THREE.Clock();
let cameraAngle = 0;
let cameraHeight = 0;

function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();
  const time = clock.getElapsedTime();

  // Player movement
  const moveSpeed = 8 * delta;
  const direction = new THREE.Vector3();

  if (keys['w'] || keys['arrowup']) direction.z -= 1;
  if (keys['s'] || keys['arrowdown']) direction.z += 1;
  if (keys['a'] || keys['arrowleft']) direction.x -= 1;
  if (keys['d'] || keys['arrowright']) direction.x += 1;

  if (direction.length() > 0) {
    direction.normalize();

    const angle = Math.atan2(camera.position.x - player.position.x,
                             camera.position.z - player.position.z);
    const rotatedDir = new THREE.Vector3(
      direction.x * Math.cos(angle) - direction.z * Math.sin(angle),
      0,
      direction.x * Math.sin(angle) + direction.z * Math.cos(angle)
    );

    // Store direction before modifying for position
    const moveDir = rotatedDir.clone();
    player.position.add(rotatedDir.multiplyScalar(moveSpeed));

    // Face the direction of movement
    // Calculate angle and add 90 degrees (PI/2) to align unicorn head with movement
    player.rotation.y = Math.atan2(moveDir.x, moveDir.z) - Math.PI / 2;

    // Get terrain height at player position
    const terrainHeight = getTerrainHeight(player.position.x, player.position.z);

    // Realistic gallop cycle - horses have a 4-beat gait
    const gallopSpeed = 6; // Slower for more realism
    const gallopCycle = time * gallopSpeed;

    // Two-phase bounce pattern (suspension phase in real galloping)
    const bouncePhase1 = Math.sin(gallopCycle * 2);
    const bouncePhase2 = Math.sin(gallopCycle * 2 + Math.PI * 0.5);
    const verticalBounce = (Math.abs(bouncePhase1) * 0.4 + Math.abs(bouncePhase2) * 0.2) * 0.7;
    player.position.y = terrainHeight + 2.2 + verticalBounce;

    // Dynamic body tilt based on movement
    const forwardTilt = Math.sin(gallopCycle * 2) * 0.12; // More forward lean during gallop
    const sideSway = Math.sin(gallopCycle) * 0.04; // Subtle side-to-side
    player.rotation.x = forwardTilt;
    player.rotation.z = sideSway;

    // Animate legs - realistic four-beat gallop
    if (player.userData.legs) {
      player.userData.legs.forEach((leg, index) => {
        // Each leg has a slightly different timing for realistic gait
        const legOffset = leg.phase;
        const legCycle = gallopCycle * 2 + legOffset;

        // Realistic leg lift with proper stride
        const stride = Math.sin(legCycle);
        const lift = Math.max(0, stride) * 0.5; // Reduced lift
        const reach = stride * 0.2; // Reduced forward reach

        leg.group.position.y = -lift;
        leg.group.rotation.x = reach; // Leg reaches forward and back (reduced)

        // Keep legs straight
        leg.group.rotation.z = 0;
        leg.group.rotation.y = 0;
      });
    }

    // Animate mane - wave more when moving
    if (player.userData.mane) {
      player.userData.mane.forEach(segment => {
        const i = segment.userData.index;
        const phase = time * 5 + i * 0.4;
        const waveAmount = 0.25; // Strong wave when moving
        segment.rotation.z = segment.userData.baseRotZ + Math.sin(phase) * waveAmount;
        segment.position.y = segment.userData.baseY + Math.sin(phase * 0.8) * 0.12;
        segment.position.x = segment.userData.baseX + Math.sin(phase) * 0.05;
      });
    }
  } else {
    // Idle animation - subtle breathing and weight shifting
    const idleTime = time * 2;
    player.rotation.x += (Math.sin(idleTime * 0.5) * 0.02 - player.rotation.x) * 0.1;
    player.rotation.z += (Math.sin(idleTime * 0.3) * 0.015 - player.rotation.z) * 0.1;

    // Update terrain height even when idle
    const terrainHeight = getTerrainHeight(player.position.x, player.position.z);
    player.position.y = terrainHeight + 2.2 + Math.sin(idleTime * 0.5) * 0.05;

    // Animate mane slowly when idle
    if (player.userData.mane) {
      player.userData.mane.forEach(segment => {
        const i = segment.userData.index;
        const phase = idleTime * 0.8 + i * 0.3;
        const waveAmount = 0.08; // Gentle wave when idle
        segment.rotation.z = segment.userData.baseRotZ + Math.sin(phase) * waveAmount;
        segment.position.y = segment.userData.baseY + Math.sin(phase * 0.6) * 0.04;
        segment.position.x = segment.userData.baseX + Math.sin(phase) * 0.02;
      });
    }

    // Reset legs to idle position when not moving
    if (player.userData.legs) {
      player.userData.legs.forEach(leg => {
        leg.group.position.y += (leg.baseY - leg.group.position.y) * 0.1;
        leg.group.rotation.x *= 0.9;
        leg.group.rotation.y = 0;
        leg.group.rotation.z = 0;
      });
    }
  }

  // Camera controls
  cameraAngle += mouse.x;
  cameraHeight = Math.max(-0.5, Math.min(1.5, cameraHeight - mouse.y));
  mouse.x *= 0.9;
  mouse.y *= 0.9;

  const cameraDistance = 15;
  const targetCameraPos = new THREE.Vector3(
    player.position.x + Math.sin(cameraAngle) * cameraDistance,
    player.position.y + 8 + cameraHeight * 5,
    player.position.z + Math.cos(cameraAngle) * cameraDistance
  );

  camera.position.lerp(targetCameraPos, 0.1);
  camera.lookAt(player.position);

  // Animate clouds
  clouds.forEach(cloud => {
    cloud.position.x += cloud.userData.speed * delta;
    if (cloud.position.x > 200) cloud.position.x = -200;
  });

  // Update spells
  spells.forEach((spell, index) => {
    spell.position.add(spell.userData.velocity);
    spell.rotation.y += 0.2;
    spell.userData.lifetime += delta;

    // Animate spell particles
    if (spell.userData.particles) {
      spell.userData.particles.rotation.y += delta * 2;
    }

    // Check collision with unicorns
    unicornsInDanger.forEach(unicorn => {
      if (!unicorn.userData.saved) {
        const distance = spell.position.distanceTo(unicorn.position);
        if (distance < 3) {
          unicorn.userData.saved = true;
          gameState.unicornsSaved++;
          updateUI();
          showMessage('✨ Unicorn Saved! ✨');

          // Remove danger effects
          unicorn.remove(unicorn.userData.dangerRing);
          unicorn.remove(unicorn.userData.particles);

          // Add celebration effects
          const celebrationLight = new THREE.PointLight(0xffd700, 3, 15);
          unicorn.add(celebrationLight);

          // Victory sparkles
          for (let i = 0; i < 20; i++) {
            setTimeout(() => {
              const sparkle = new THREE.Mesh(
                new THREE.SphereGeometry(0.2, 8, 8),
                new THREE.MeshBasicMaterial({ color: 0xffd700 })
              );
              sparkle.position.copy(unicorn.position);
              sparkle.position.y += Math.random() * 4;
              sparkle.position.x += (Math.random() - 0.5) * 4;
              sparkle.position.z += (Math.random() - 0.5) * 4;
              scene.add(sparkle);

              setTimeout(() => scene.remove(sparkle), 1000);
            }, i * 50);
          }

          if (gameState.unicornsSaved === gameState.totalUnicorns) {
            setTimeout(() => {
              showMessage('🎉 YOU WIN! All Unicorns United! 🎉');
            }, 500);
          }
        }
      }
    });

    if (spell.userData.lifetime > 8) {
      scene.remove(spell);
      spells.splice(index, 1);
    }
  });

  // Animate unicorns in danger
  unicornsInDanger.forEach(unicorn => {
    if (!unicorn.userData.saved) {
      unicorn.userData.pulseTime += delta * 2;

      // Pulse danger ring
      const scale = 1 + Math.sin(unicorn.userData.pulseTime) * 0.3;
      unicorn.userData.dangerRing.scale.set(scale, scale, 1);

      // Rotate danger particles
      if (unicorn.userData.particles) {
        unicorn.userData.particles.rotation.y += delta;
      }

      // Gentle bobbing on terrain
      const unicornTerrainHeight = getTerrainHeight(unicorn.position.x, unicorn.position.z);
      unicorn.position.y = unicornTerrainHeight + 2.2 + Math.sin(unicorn.userData.pulseTime * 0.5) * 0.15;
    } else {
      // Follow player when saved
      const targetPos = new THREE.Vector3()
        .copy(player.position)
        .add(unicorn.userData.followOffset);

      // Smooth following with some distance
      const distanceToTarget = unicorn.position.distanceTo(targetPos);

      if (distanceToTarget > 3) {
        // Move towards target
        const moveDirection = new THREE.Vector3()
          .subVectors(targetPos, unicorn.position)
          .normalize();

        const followSpeed = 6 * delta;
        unicorn.position.add(moveDirection.clone().multiplyScalar(followSpeed));

        // Face movement direction
        unicorn.rotation.y = Math.atan2(moveDirection.x, moveDirection.z) - Math.PI / 2;

        // Add walking animation - more natural pace
        const walkSpeed = 5;
        const walkCycle = time * walkSpeed;

        // Natural walking bounce (less than gallop)
        const walkBounce = Math.abs(Math.sin(walkCycle * 2)) * 0.25;

        // Keep on terrain
        const followTerrainHeight = getTerrainHeight(unicorn.position.x, unicorn.position.z);
        unicorn.position.y = followTerrainHeight + 2.2 + walkBounce;

        // Body movement during walk
        unicorn.rotation.x = Math.sin(walkCycle * 2) * 0.08;
        unicorn.rotation.z = Math.sin(walkCycle) * 0.04;

        // Animate legs with walking gait
        if (unicorn.userData.legs) {
          unicorn.userData.legs.forEach((leg, index) => {
            const legCycle = walkCycle * 2 + leg.phase;
            const stride = Math.sin(legCycle);

            // Walking has lower lift than galloping
            const lift = Math.max(0, stride) * 0.3; // Reduced lift
            const reach = stride * 0.15; // Reduced reach

            leg.group.position.y = -lift;
            leg.group.rotation.x = reach;

            // Keep legs straight
            leg.group.rotation.z = 0;
            leg.group.rotation.y = 0;
          });
        }

        // Animate mane when following
        if (unicorn.userData.mane) {
          unicorn.userData.mane.forEach(segment => {
            const i = segment.userData.index;
            const phase = time * 5 + i * 0.4;
            const waveAmount = 0.2;
            segment.rotation.z = segment.userData.baseRotZ + Math.sin(phase) * waveAmount;
            segment.position.y = segment.userData.baseY + Math.sin(phase * 0.8) * 0.1;
            segment.position.x = segment.userData.baseX + Math.sin(phase) * 0.04;
          });
        }
      } else {
        // Idle at position
        const idleTime = time * 2;
        const followIdleHeight = getTerrainHeight(unicorn.position.x, unicorn.position.z);
        unicorn.position.y = followIdleHeight + 2.2 + Math.sin(idleTime * 0.5) * 0.1;

        // Subtle idle rotation
        unicorn.rotation.x += (Math.sin(idleTime * 0.5) * 0.02 - unicorn.rotation.x) * 0.1;
        unicorn.rotation.z += (Math.sin(idleTime * 0.3) * 0.015 - unicorn.rotation.z) * 0.1;

        // Animate mane slowly when idle
        if (unicorn.userData.mane) {
          unicorn.userData.mane.forEach(segment => {
            const i = segment.userData.index;
            const phase = idleTime * 0.8 + i * 0.3;
            const waveAmount = 0.08;
            segment.rotation.z = segment.userData.baseRotZ + Math.sin(phase) * waveAmount;
            segment.position.y = segment.userData.baseY + Math.sin(phase * 0.6) * 0.04;
            segment.position.x = segment.userData.baseX + Math.sin(phase) * 0.02;
          });
        }

        // Reset legs
        if (unicorn.userData.legs) {
          unicorn.userData.legs.forEach(leg => {
            leg.group.position.y += (0 - leg.group.position.y) * 0.1;
            leg.group.rotation.x *= 0.9;
            leg.group.rotation.y = 0;
            leg.group.rotation.z = 0;
          });
        }
      }
    }
  });

  // Regenerate magic
  if (gameState.magicPower < 100) {
    gameState.magicPower = Math.min(100, gameState.magicPower + delta * 15);
    updateUI();
  }

  // Animate shield
  if (shieldMesh) {
    shieldMesh.rotation.y += delta * 2;
    shieldMesh.rotation.x += delta;
  }

  composer.render();
}

// Handle resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
});

// Start game
updateUI();
animate();

console.log('🦄 Unicorns Unite - Professional Edition');
console.log('Use WASD to move, mouse to look around');
console.log('Press Space to cast magic spells');
console.log('Press Shift for shield protection');
