import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

// Wait for DOM to be ready before initializing game
function initGame() {
// Seeded random number generator for consistent map generation
let seed = 12345; // Fixed seed for consistent map
function seededRandom() {
  const x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
}

// Collision storage (must be declared before createGround)
const treePositions = [];
const strongholdPositions = [];

// Audio System
const audioContext = new (window.AudioContext || window.webkitAudioContext)();
let musicGainNode = audioContext.createGain();
musicGainNode.connect(audioContext.destination);
musicGainNode.gain.value = 0.3;

let sfxGainNode = audioContext.createGain();
sfxGainNode.connect(audioContext.destination);
sfxGainNode.gain.value = 0.5;

// Background music loop (ethereal magical theme)
let musicOscillators = [];
let isMusicPlaying = false;

function startBackgroundMusic() {
  if (isMusicPlaying) return;
  isMusicPlaying = true;

  // Magical chord progression
  const melodyNotes = [
    [523.25, 659.25, 783.99], // C5, E5, G5
    [587.33, 739.99, 880.00], // D5, F#5, A5
    [493.88, 659.25, 783.99], // B4, E5, G5
    [523.25, 698.46, 830.61]  // C5, F5, G#5
  ];

  let noteIndex = 0;

  function playChord() {
    if (!isMusicPlaying) return;

    // Stop previous oscillators
    musicOscillators.forEach(osc => {
      try { osc.stop(); } catch (e) {}
    });
    musicOscillators = [];

    const notes = melodyNotes[noteIndex % melodyNotes.length];
    const now = audioContext.currentTime;

    notes.forEach((freq, i) => {
      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.03, now + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 2.5);

      osc.connect(gain);
      gain.connect(musicGainNode);

      osc.start(now);
      osc.stop(now + 2.5);
      musicOscillators.push(osc);
    });

    noteIndex++;
    setTimeout(playChord, 2000);
  }

  playChord();
}

function stopBackgroundMusic() {
  isMusicPlaying = false;
  musicOscillators.forEach(osc => {
    try { osc.stop(); } catch (e) {}
  });
  musicOscillators = [];
}

// Sound effects
function playSpellSound() {
  const now = audioContext.currentTime;
  const osc = audioContext.createOscillator();
  const gain = audioContext.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(800, now);
  osc.frequency.exponentialRampToValueAtTime(1200, now + 0.1);

  gain.gain.setValueAtTime(0.3, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

  osc.connect(gain);
  gain.connect(sfxGainNode);

  osc.start(now);
  osc.stop(now + 0.2);
}

function playShieldSound() {
  const now = audioContext.currentTime;
  const osc = audioContext.createOscillator();
  const gain = audioContext.createGain();

  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(200, now);
  osc.frequency.exponentialRampToValueAtTime(400, now + 0.3);

  gain.gain.setValueAtTime(0.2, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

  osc.connect(gain);
  gain.connect(sfxGainNode);

  osc.start(now);
  osc.stop(now + 0.3);
}

function playUnicornSaveSound() {
  const now = audioContext.currentTime;

  // Ascending magical chime
  [0, 0.1, 0.2].forEach((offset, i) => {
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();

    osc.type = 'sine';
    const freq = 800 + (i * 200);
    osc.frequency.setValueAtTime(freq, now + offset);

    gain.gain.setValueAtTime(0.2, now + offset);
    gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.5);

    osc.connect(gain);
    gain.connect(sfxGainNode);

    osc.start(now + offset);
    osc.stop(now + offset + 0.5);
  });
}

function playDragonFireSound() {
  const now = audioContext.currentTime;
  const osc = audioContext.createOscillator();
  const gain = audioContext.createGain();
  const filter = audioContext.createBiquadFilter();

  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(100, now);
  osc.frequency.exponentialRampToValueAtTime(150, now + 0.3);

  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(500, now);

  gain.gain.setValueAtTime(0.3, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

  osc.connect(filter);
  filter.connect(gain);
  gain.connect(sfxGainNode);

  osc.start(now);
  osc.stop(now + 0.4);
}

function playDragonDefeatedSound() {
  const now = audioContext.currentTime;

  // Descending dramatic sound
  [0, 0.15, 0.3].forEach((offset, i) => {
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();

    osc.type = 'triangle';
    const freq = 600 - (i * 150);
    osc.frequency.setValueAtTime(freq, now + offset);

    gain.gain.setValueAtTime(0.25, now + offset);
    gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.6);

    osc.connect(gain);
    gain.connect(sfxGainNode);

    osc.start(now + offset);
    osc.stop(now + offset + 0.6);
  });
}

function playEggCollectSound() {
  const now = audioContext.currentTime;

  // Sparkly collection sound
  [0, 0.05, 0.1, 0.15].forEach((offset, i) => {
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();

    osc.type = 'sine';
    const freq = 1000 + (i * 300);
    osc.frequency.setValueAtTime(freq, now + offset);

    gain.gain.setValueAtTime(0.15, now + offset);
    gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.3);

    osc.connect(gain);
    gain.connect(sfxGainNode);

    osc.start(now + offset);
    osc.stop(now + offset + 0.3);
  });
}

function playVictorySound() {
  const now = audioContext.currentTime;

  // Triumphant fanfare
  const victoryNotes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6

  victoryNotes.forEach((freq, i) => {
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(freq, now + i * 0.15);

    gain.gain.setValueAtTime(0.2, now + i * 0.15);
    gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.15 + 0.8);

    osc.connect(gain);
    gain.connect(sfxGainNode);

    osc.start(now + i * 0.15);
    osc.stop(now + i * 0.15 + 0.8);
  });
}

// Customization unlocks system
const customizationUnlocks = {
  colors: ['rainbow', 'galaxy', 'fire', 'ice', 'shadow', 'golden', 'crystal', 'nature'],
  horns: ['spiral', 'crystal', 'golden', 'dual', 'crown'],
  manes: ['flowing', 'starry', 'flames', 'wavy'],
  effects: ['sparkles', 'aura', 'trail']
};

// Load saved unlocks from localStorage
let unlockedCustomizations = JSON.parse(localStorage.getItem('unicornUnlocks') || '[]');
let completionCount = parseInt(localStorage.getItem('unicornCompletions') || '0');

// Game state
const gameState = {
  unicornsSaved: 0,
  totalUnicorns: 25, // Increased from 10 to 25
  magicPower: 100,
  canCastSpell: true,
  canUseShield: true,
  hasShield: false,
  bossesDefeated: 0,
  basesDestroyed: 0
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
sunLight.shadow.mapSize.width = 2048;
sunLight.shadow.mapSize.height = 2048;
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

  for (let i = 0; i < 10; i++) {
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

// Biome definitions - 5 distinct biomes arranged in a circle meeting at the center
const biomes = {
  forest: {
    center: { x: -75, z: -75 },
    radius: 120,
    color: 0x3a7a3a,
    name: 'Emerald Forest',
    groundColor: 0x4a9a4a,
    strongholdPos: { x: -75, z: -75 }
  },
  desert: {
    center: { x: 75, z: -75 },
    radius: 120,
    color: 0xddc777,
    name: 'Golden Desert',
    groundColor: 0xf4d693,
    strongholdPos: { x: 75, z: -75 }
  },
  snow: {
    center: { x: 0, z: 105 },
    radius: 120,
    color: 0xe8f4ff,
    name: 'Frozen Tundra',
    groundColor: 0xf0f8ff,
    strongholdPos: { x: 0, z: 105 }
  },
  volcanic: {
    center: { x: 75, z: 75 },
    radius: 120,
    color: 0x4a2020,
    name: 'Volcanic Wastes',
    groundColor: 0x2a1010,
    strongholdPos: { x: 75, z: 75 }
  },
  swamp: {
    center: { x: -75, z: 75 },
    radius: 120,
    color: 0x5a6a4a,
    name: 'Mystic Swamp',
    groundColor: 0x4a5a3a,
    strongholdPos: { x: -75, z: 75 }
  }
};

// Helper to determine which biome a position is in
function getBiome(x, z) {
  let closestBiome = null;
  let closestDist = Infinity;

  for (const [key, biome] of Object.entries(biomes)) {
    const dx = x - biome.center.x;
    const dz = z - biome.center.z;
    const dist = Math.sqrt(dx * dx + dz * dz);

    if (dist < closestDist) {
      closestDist = dist;
      closestBiome = { ...biome, type: key, distance: dist };
    }
  }

  return closestBiome;
}

// Create detailed ground with biomes
function createGround() {
  const groundSize = 300;
  const groundGeometry = new THREE.PlaneGeometry(groundSize, groundSize, 50, 50);

  // Add terrain variation and vertex colors based on biomes
  const vertices = groundGeometry.attributes.position;
  const colors = new Float32Array(vertices.count * 3);

  for (let i = 0; i < vertices.count; i++) {
    const x = vertices.getX(i);
    const z = vertices.getZ(i);

    // Get biome for this position
    const biome = getBiome(x, z);

    // Biome-specific terrain height
    let height = 0;
    if (biome.type === 'snow') {
      // Snow biome: higher and hillier
      height = Math.sin(x * 0.02) * Math.cos(z * 0.02) * 3.0 +
               Math.sin(x * 0.08) * Math.cos(z * 0.08) * 1.5;
    } else if (biome.type === 'volcanic') {
      // Volcanic biome: rugged and jagged
      height = Math.sin(x * 0.05) * Math.cos(z * 0.05) * 2.5 +
               Math.sin(x * 0.15) * Math.cos(z * 0.15) * 1.0;
    } else if (biome.type === 'swamp') {
      // Swamp biome: very flat with small bumps
      height = Math.sin(x * 0.1) * Math.cos(z * 0.1) * 0.3;
    } else if (biome.type === 'desert') {
      // Desert biome: rolling dunes
      height = Math.sin(x * 0.025) * Math.cos(z * 0.025) * 2.0 +
               Math.sin(x * 0.06) * Math.cos(z * 0.06) * 0.8;
    } else {
      // Forest biome: gentle hills
      height = Math.sin(x * 0.03) * Math.cos(z * 0.03) * 1.5 +
               Math.sin(x * 0.1) * Math.cos(z * 0.1) * 0.5;
    }

    vertices.setZ(i, Math.max(0, height + 0.5));

    // Set vertex color based on biome
    const color = new THREE.Color(biome.color);
    colors[i * 3] = color.r;
    colors[i * 3 + 1] = color.g;
    colors[i * 3 + 2] = color.b;
  }

  groundGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  groundGeometry.computeVertexNormals();

  const groundMaterial = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.85,
    metalness: 0.0,
    flatShading: false
  });

  const ground = new THREE.Mesh(groundGeometry, groundMaterial);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  // Add biome-specific vegetation
  addBiomeVegetation();
}

function addGrass(groundSize) {
  const grassGeometry = new THREE.PlaneGeometry(0.3, 1.5);
  const grassMaterial = new THREE.MeshStandardMaterial({
    color: 0x4a9a4a,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.7
  });

  const grassCount = 500;
  const grassField = new THREE.InstancedMesh(grassGeometry, grassMaterial, grassCount);

  const dummy = new THREE.Object3D();
  for (let i = 0; i < grassCount; i++) {
    const x = (seededRandom() - 0.5) * groundSize * 0.9;
    const z = (seededRandom() - 0.5) * groundSize * 0.9;
    const height = Math.sin(x * 0.03) * Math.cos(z * 0.03) * 1.5 +
                   Math.sin(x * 0.1) * Math.cos(z * 0.1) * 0.3;
    const y = Math.max(0, height + 0.5) + 0.75;

    dummy.position.set(x, y, z);
    dummy.rotation.y = seededRandom() * Math.PI;
    dummy.rotation.z = (seededRandom() - 0.5) * 0.3;
    dummy.scale.set(0.8 + seededRandom() * 0.4, 0.8 + seededRandom() * 0.6, 1);
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
  // Get biome for this position
  const biome = getBiome(x, z);

  // Biome-specific terrain height (must match createGround logic)
  let height = 0;
  if (biome.type === 'snow') {
    // Snow biome: higher and hillier
    height = Math.sin(x * 0.02) * Math.cos(z * 0.02) * 3.0 +
             Math.sin(x * 0.08) * Math.cos(z * 0.08) * 1.5;
  } else if (biome.type === 'volcanic') {
    // Volcanic biome: rugged and jagged
    height = Math.sin(x * 0.05) * Math.cos(z * 0.05) * 2.5 +
             Math.sin(x * 0.15) * Math.cos(z * 0.15) * 1.0;
  } else if (biome.type === 'swamp') {
    // Swamp biome: very flat with small bumps
    height = Math.sin(x * 0.1) * Math.cos(z * 0.1) * 0.3;
  } else if (biome.type === 'desert') {
    // Desert biome: rolling dunes
    height = Math.sin(x * 0.025) * Math.cos(z * 0.025) * 2.0 +
             Math.sin(x * 0.06) * Math.cos(z * 0.06) * 0.8;
  } else {
    // Forest biome: gentle hills
    height = Math.sin(x * 0.03) * Math.cos(z * 0.03) * 1.5 +
             Math.sin(x * 0.1) * Math.cos(z * 0.1) * 0.5;
  }

  return Math.max(0, height + 0.5); // Ensure minimum height of 0.5
}

// Create detailed trees with variants
function createTree(x, z, variant = 'oak') {
  const tree = new THREE.Group();

  if (variant === 'oak') {
    // Classic oak tree - thick trunk, round canopy
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
  } else if (variant === 'pine') {
    // Pine tree - tall, narrow, conical shape
    const trunkGeometry = new THREE.CylinderGeometry(0.3, 0.4, 7, 8);
    const trunkMaterial = new THREE.MeshStandardMaterial({
      color: 0x3d2f1f,
      roughness: 0.95,
      metalness: 0.0
    });
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.position.y = 3.5;
    trunk.castShadow = true;
    trunk.receiveShadow = true;
    tree.add(trunk);

    // Conical foliage layers
    const pineColors = [0x1a4d2e, 0x235a36, 0x2d6a3e];
    for (let i = 0; i < 4; i++) {
      const foliage = new THREE.Mesh(
        new THREE.ConeGeometry(1.8 - i * 0.3, 2.5, 8),
        new THREE.MeshStandardMaterial({
          color: pineColors[i % 3],
          roughness: 0.9
        })
      );
      foliage.position.y = 4 + i * 1.5;
      foliage.castShadow = true;
      foliage.receiveShadow = true;
      tree.add(foliage);
    }
  } else if (variant === 'birch') {
    // Birch tree - white trunk, delicate foliage
    const trunkGeometry = new THREE.CylinderGeometry(0.25, 0.35, 6, 8);
    const trunkMaterial = new THREE.MeshStandardMaterial({
      color: 0xe8e8e8,
      roughness: 0.8,
      metalness: 0.1
    });
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.position.y = 3;
    trunk.castShadow = true;
    trunk.receiveShadow = true;
    tree.add(trunk);

    // Add dark bark stripes
    for (let i = 0; i < 5; i++) {
      const stripe = new THREE.Mesh(
        new THREE.CylinderGeometry(0.26, 0.36, 0.4, 8),
        new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.9 })
      );
      stripe.position.y = 1 + i * 1.2;
      tree.add(stripe);
    }

    // Light, airy foliage
    const birchColors = [0x8fbc8f, 0xa8d5a8, 0xc1e8c1];
    for (let i = 0; i < 3; i++) {
      const foliage = new THREE.Mesh(
        new THREE.SphereGeometry(1.8 - i * 0.3, 8, 8),
        new THREE.MeshStandardMaterial({
          color: birchColors[i],
          roughness: 0.8,
          transparent: true,
          opacity: 0.9
        })
      );
      foliage.position.y = 5.5 + i * 0.8;
      foliage.position.x = (i - 1) * 0.3;
      foliage.castShadow = true;
      foliage.receiveShadow = true;
      tree.add(foliage);
    }
  } else if (variant === 'willow') {
    // Willow tree - drooping branches
    const trunkGeometry = new THREE.CylinderGeometry(0.5, 0.7, 4, 12);
    const trunkMaterial = new THREE.MeshStandardMaterial({
      color: 0x5c4a38,
      roughness: 0.95,
      metalness: 0.0
    });
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.position.y = 2;
    trunk.castShadow = true;
    trunk.receiveShadow = true;
    tree.add(trunk);

    // Wide, drooping canopy
    const willowColors = [0x9acd32, 0xaddb47, 0xc0e85c];
    const canopy = new THREE.Mesh(
      new THREE.SphereGeometry(3, 8, 8),
      new THREE.MeshStandardMaterial({
        color: willowColors[0],
        roughness: 0.85
      })
    );
    canopy.position.y = 4.5;
    canopy.scale.set(1, 0.7, 1);
    canopy.castShadow = true;
    canopy.receiveShadow = true;
    tree.add(canopy);

    // Drooping branch strands
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const strand = new THREE.Mesh(
        new THREE.CylinderGeometry(0.05, 0.05, 3, 4),
        new THREE.MeshStandardMaterial({
          color: willowColors[1],
          roughness: 0.9
        })
      );
      strand.position.set(
        Math.cos(angle) * 2,
        3,
        Math.sin(angle) * 2
      );
      strand.rotation.z = (Math.random() - 0.5) * 0.3;
      tree.add(strand);
    }
  } else if (variant === 'magical') {
    // Magical tree - glowing, mystical appearance
    const trunkGeometry = new THREE.CylinderGeometry(0.4, 0.5, 5.5, 12);
    const trunkMaterial = new THREE.MeshStandardMaterial({
      color: 0x6a4c93,
      emissive: 0x3a1c63,
      emissiveIntensity: 0.2,
      roughness: 0.7,
      metalness: 0.3
    });
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.position.y = 2.75;
    trunk.castShadow = true;
    trunk.receiveShadow = true;
    tree.add(trunk);

    // Glowing crystalline foliage
    const magicColors = [0x9d4edd, 0xc77dff, 0xe0aaff];
    for (let i = 0; i < 3; i++) {
      const foliage = new THREE.Mesh(
        new THREE.IcosahedronGeometry(2 - i * 0.3, 0),
        new THREE.MeshStandardMaterial({
          color: magicColors[i],
          emissive: magicColors[i],
          emissiveIntensity: 0.3,
          roughness: 0.5,
          metalness: 0.4,
          transparent: true,
          opacity: 0.8
        })
      );
      foliage.position.y = 5.5 + i * 1;
      foliage.castShadow = true;
      tree.add(foliage);
    }

    // Add magical glow
    const treeLight = new THREE.PointLight(0xc77dff, 1, 8);
    treeLight.position.y = 6;
    tree.add(treeLight);
  }

  tree.position.set(x, 0, z);
  scene.add(tree);

  // Store tree position for collision detection
  treePositions.push({ x, z, radius: 1.5 });
}

// Add forest with variety across larger map
const treeVariants = ['oak', 'pine', 'birch', 'willow', 'magical'];

// Add biome-specific vegetation
function addBiomeVegetation() {
  // Forest biome: Dense trees (oak, birch, magical)
  for (let i = 0; i < 30; i++) {
    const angle = seededRandom() * Math.PI * 2;
    const radius = seededRandom() * 75;
    const x = biomes.forest.center.x + Math.cos(angle) * radius;
    const z = biomes.forest.center.z + Math.sin(angle) * radius;
    const variants = ['oak', 'birch', 'magical'];
    const variant = variants[Math.floor(seededRandom() * variants.length)];
    createTree(x, z, variant);
  }

  // Desert biome: Sparse cacti and dead trees
  for (let i = 0; i < 10; i++) {
    const angle = seededRandom() * Math.PI * 2;
    const radius = seededRandom() * 75;
    const x = biomes.desert.center.x + Math.cos(angle) * radius;
    const z = biomes.desert.center.z + Math.sin(angle) * radius;

    // Create cactus or dead tree
    if (seededRandom() > 0.5) {
      createCactus(x, z);
    } else {
      createDeadTree(x, z);
    }
  }

  // Snow biome: Pine trees
  for (let i = 0; i < 20; i++) {
    const angle = seededRandom() * Math.PI * 2;
    const radius = seededRandom() * 75;
    const x = biomes.snow.center.x + Math.cos(angle) * radius;
    const z = biomes.snow.center.z + Math.sin(angle) * radius;
    createTree(x, z, 'pine');
  }

  // Volcanic biome: Obsidian spikes and dead trees
  for (let i = 0; i < 15; i++) {
    const angle = seededRandom() * Math.PI * 2;
    const radius = seededRandom() * 75;
    const x = biomes.volcanic.center.x + Math.cos(angle) * radius;
    const z = biomes.volcanic.center.z + Math.sin(angle) * radius;

    if (seededRandom() > 0.6) {
      createObsidianSpike(x, z);
    } else {
      createDeadTree(x, z);
    }
  }

  // Swamp biome: Willow trees and mushrooms
  for (let i = 0; i < 25; i++) {
    const angle = seededRandom() * Math.PI * 2;
    const radius = seededRandom() * 75;
    const x = biomes.swamp.center.x + Math.cos(angle) * radius;
    const z = biomes.swamp.center.z + Math.sin(angle) * radius;

    if (seededRandom() > 0.3) {
      createTree(x, z, 'willow');
    } else {
      createMushroom(x, z);
    }
  }
}

// Create cactus for desert biome
function createCactus(x, z) {
  const cactus = new THREE.Group();

  const cactusGreen = 0x6b8e23;
  const cactusMaterial = new THREE.MeshStandardMaterial({
    color: cactusGreen,
    roughness: 0.9
  });

  // Main trunk
  const trunkGeometry = new THREE.CylinderGeometry(0.4, 0.5, 4, 8);
  const trunk = new THREE.Mesh(trunkGeometry, cactusMaterial);
  trunk.position.y = 2;
  trunk.castShadow = true;
  cactus.add(trunk);

  // Arms
  const armGeometry = new THREE.CylinderGeometry(0.3, 0.3, 2, 8);
  const leftArm = new THREE.Mesh(armGeometry, cactusMaterial);
  leftArm.position.set(-0.6, 2.5, 0);
  leftArm.rotation.z = Math.PI / 3;
  leftArm.castShadow = true;
  cactus.add(leftArm);

  const rightArm = new THREE.Mesh(armGeometry, cactusMaterial);
  rightArm.position.set(0.6, 2, 0);
  rightArm.rotation.z = -Math.PI / 4;
  rightArm.castShadow = true;
  cactus.add(rightArm);

  const groundHeight = getTerrainHeight(x, z);
  cactus.position.set(x, groundHeight, z);
  scene.add(cactus);
  treePositions.push({ x, z, radius: 0.8 });
}

// Create dead tree
function createDeadTree(x, z) {
  const tree = new THREE.Group();

  const deadBrown = 0x4a3020;
  const deadMaterial = new THREE.MeshStandardMaterial({
    color: deadBrown,
    roughness: 1.0
  });

  const trunkGeometry = new THREE.CylinderGeometry(0.3, 0.5, 5, 8);
  const trunk = new THREE.Mesh(trunkGeometry, deadMaterial);
  trunk.position.y = 2.5;
  trunk.castShadow = true;
  tree.add(trunk);

  // A few bare branches
  for (let i = 0; i < 3; i++) {
    const branchGeometry = new THREE.CylinderGeometry(0.1, 0.15, 2, 6);
    const branch = new THREE.Mesh(branchGeometry, deadMaterial);
    branch.position.set(
      (seededRandom() - 0.5) * 0.8,
      3 + seededRandom() * 1.5,
      (seededRandom() - 0.5) * 0.8
    );
    branch.rotation.z = (seededRandom() - 0.5) * Math.PI / 2;
    branch.castShadow = true;
    tree.add(branch);
  }

  const groundHeight = getTerrainHeight(x, z);
  tree.position.set(x, groundHeight, z);
  scene.add(tree);
  treePositions.push({ x, z, radius: 0.8 });
}

// Create obsidian spike for volcanic biome
function createObsidianSpike(x, z) {
  const spike = new THREE.Group();

  const obsidianMaterial = new THREE.MeshStandardMaterial({
    color: 0x1a1a2e,
    roughness: 0.3,
    metalness: 0.7,
    emissive: 0x331111,
    emissiveIntensity: 0.2
  });

  const spikeGeometry = new THREE.ConeGeometry(0.8, 6, 6);
  const spikeMesh = new THREE.Mesh(spikeGeometry, obsidianMaterial);
  spikeMesh.position.y = 3;
  spikeMesh.castShadow = true;
  spike.add(spikeMesh);

  // Add glow at base
  const glowGeometry = new THREE.CylinderGeometry(0.5, 0.8, 0.2, 16);
  const glowMaterial = new THREE.MeshBasicMaterial({
    color: 0xff3300,
    transparent: true,
    opacity: 0.5
  });
  const glow = new THREE.Mesh(glowGeometry, glowMaterial);
  glow.position.y = 0.1;
  spike.add(glow);

  const groundHeight = getTerrainHeight(x, z);
  spike.position.set(x, groundHeight, z);
  scene.add(spike);
  treePositions.push({ x, z, radius: 1.0 });
}

// Create mushroom for swamp biome
function createMushroom(x, z) {
  const mushroom = new THREE.Group();

  // Stem
  const stemMaterial = new THREE.MeshStandardMaterial({
    color: 0xf5f5dc,
    roughness: 0.8
  });
  const stemGeometry = new THREE.CylinderGeometry(0.3, 0.4, 2, 12);
  const stem = new THREE.Mesh(stemGeometry, stemMaterial);
  stem.position.y = 1;
  stem.castShadow = true;
  mushroom.add(stem);

  // Cap
  const capMaterial = new THREE.MeshStandardMaterial({
    color: seededRandom() > 0.5 ? 0x8b0000 : 0x9370db,
    roughness: 0.6
  });
  const capGeometry = new THREE.SphereGeometry(1.2, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2);
  const cap = new THREE.Mesh(capGeometry, capMaterial);
  cap.position.y = 2;
  cap.castShadow = true;
  mushroom.add(cap);

  // Spots
  for (let i = 0; i < 5; i++) {
    const spotGeometry = new THREE.SphereGeometry(0.2, 8, 8);
    const spotMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.8
    });
    const spot = new THREE.Mesh(spotGeometry, spotMaterial);
    spot.position.set(
      (seededRandom() - 0.5) * 1.5,
      2 + seededRandom() * 0.3,
      (seededRandom() - 0.5) * 1.5
    );
    mushroom.add(spot);
  }

  const groundHeight = getTerrainHeight(x, z);
  mushroom.position.set(x, groundHeight, z);
  scene.add(mushroom);
  treePositions.push({ x, z, radius: 1.0 });
}

// Check collision with trees
function checkTreeCollision(x, z, radius = 2) {
  for (const tree of treePositions) {
    const dx = x - tree.x;
    const dz = z - tree.z;
    const distance = Math.sqrt(dx * dx + dz * dz);
    if (distance < tree.radius + radius) {
      return true;
    }
  }
  return false;
}

// Check collision with stronghold walls (box collision)
function checkStrongholdCollision(x, z, radius = 2) {
  for (const stronghold of strongholdPositions) {
    // Calculate distance from point to the stronghold walls
    const halfSize = stronghold.size / 2;

    // Check if point is inside the stronghold's outer boundary
    if (x + radius > stronghold.x - halfSize && x - radius < stronghold.x + halfSize &&
        z + radius > stronghold.z - halfSize && z - radius < stronghold.z + halfSize) {

      // Check if point is NOT inside the inner courtyard (allow movement inside)
      const innerSize = stronghold.size - 2; // Account for wall thickness
      const innerHalfSize = innerSize / 2;

      if (x + radius > stronghold.x - innerHalfSize && x - radius < stronghold.x + innerHalfSize &&
          z + radius > stronghold.z - innerHalfSize && z - radius < stronghold.z + innerHalfSize) {
        // Inside courtyard - check if at the gate entrance (front wall)
        const gateZ = stronghold.z + halfSize;
        const gateWidth = 4;

        // Allow passage through gate
        if (z < gateZ + 1 && z > gateZ - 1 &&
            x > stronghold.x - gateWidth / 2 && x < stronghold.x + gateWidth / 2) {
          continue; // At gate, no collision
        }

        continue; // Inside courtyard, no collision
      }

      // Collision with walls
      return true;
    }
  }
  return false;
}

// Create dragon boss enemy
function createBoss(x, z, isStronghold = false) {
  const boss = new THREE.Group();

  // Dragon scale material (dark for stronghold, red for regular)
  const scaleMaterial = new THREE.MeshStandardMaterial({
    color: isStronghold ? 0x1a0033 : 0x8b0000,
    emissive: isStronghold ? 0x330066 : 0x330000,
    emissiveIntensity: isStronghold ? 0.5 : 0.3,
    roughness: 0.4,
    metalness: 0.6
  });

  // Dragon body (elongated)
  const bodyGeometry = new THREE.CylinderGeometry(1.2, 1.5, 4, 12);
  const body = new THREE.Mesh(bodyGeometry, scaleMaterial);
  body.rotation.z = Math.PI / 2;
  body.position.x = 1;
  body.castShadow = true;
  boss.add(body);

  // Dragon head
  const headGeometry = new THREE.SphereGeometry(1.5, 12, 12);
  const head = new THREE.Mesh(headGeometry, scaleMaterial);
  head.position.set(3.5, 0.5, 0);
  head.scale.set(1, 0.8, 1.2);
  head.castShadow = true;
  boss.add(head);

  // Dragon snout
  const snoutGeometry = new THREE.ConeGeometry(0.6, 1.5, 8);
  const snout = new THREE.Mesh(snoutGeometry, scaleMaterial);
  snout.position.set(4.5, 0.3, 0);
  snout.rotation.z = -Math.PI / 2;
  snout.castShadow = true;
  boss.add(snout);

  // Dragon eyes (glowing - purple for stronghold, orange for regular)
  const eyeMaterial = new THREE.MeshBasicMaterial({
    color: isStronghold ? 0x9900ff : 0xffaa00,
    emissive: isStronghold ? 0x9900ff : 0xffaa00,
    emissiveIntensity: 2
  });
  const eyeGeometry = new THREE.SphereGeometry(0.2, 8, 8);

  const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
  leftEye.position.set(4, 0.8, 0.5);
  boss.add(leftEye);

  const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
  rightEye.position.set(4, 0.8, -0.5);
  boss.add(rightEye);

  // Dragon horns (2 horns on head)
  const hornMaterial = new THREE.MeshStandardMaterial({
    color: 0x2a2a2a,
    metalness: 0.8,
    roughness: 0.3
  });

  const leftHorn = new THREE.Mesh(
    new THREE.ConeGeometry(0.3, 1.5, 8),
    hornMaterial
  );
  leftHorn.position.set(3.5, 1.5, 0.6);
  leftHorn.rotation.z = -0.3;
  leftHorn.castShadow = true;
  boss.add(leftHorn);

  const rightHorn = new THREE.Mesh(
    new THREE.ConeGeometry(0.3, 1.5, 8),
    hornMaterial
  );
  rightHorn.position.set(3.5, 1.5, -0.6);
  rightHorn.rotation.z = -0.3;
  rightHorn.castShadow = true;
  boss.add(rightHorn);

  // Dragon wings (2 wings - dark for stronghold, red for regular)
  const wingMaterial = new THREE.MeshStandardMaterial({
    color: isStronghold ? 0x0a001a : 0x4a0000,
    emissive: isStronghold ? 0x220044 : 0x220000,
    emissiveIntensity: isStronghold ? 0.4 : 0.2,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.9
  });

  // Left wing
  const leftWingGeometry = new THREE.ConeGeometry(2, 3, 3);
  const leftWing = new THREE.Mesh(leftWingGeometry, wingMaterial);
  leftWing.position.set(1, 1.5, 2);
  leftWing.rotation.set(Math.PI / 2, 0, Math.PI / 4);
  leftWing.castShadow = true;
  boss.add(leftWing);
  boss.userData.leftWing = leftWing;

  // Right wing
  const rightWingGeometry = new THREE.ConeGeometry(2, 3, 3);
  const rightWing = new THREE.Mesh(rightWingGeometry, wingMaterial);
  rightWing.position.set(1, 1.5, -2);
  rightWing.rotation.set(Math.PI / 2, 0, -Math.PI / 4);
  rightWing.castShadow = true;
  boss.add(rightWing);
  boss.userData.rightWing = rightWing;

  // Dragon tail
  const tailSegments = 4;
  for (let i = 0; i < tailSegments; i++) {
    const segmentSize = 0.6 - (i * 0.1);
    const tailSegment = new THREE.Mesh(
      new THREE.SphereGeometry(segmentSize, 8, 8),
      scaleMaterial
    );
    tailSegment.position.set(-1.5 - (i * 0.8), 0, 0);
    tailSegment.castShadow = true;
    boss.add(tailSegment);
  }

  // Tail spikes
  for (let i = 0; i < 3; i++) {
    const spike = new THREE.Mesh(
      new THREE.ConeGeometry(0.2, 0.8, 6),
      hornMaterial
    );
    spike.position.set(-1.5 - (i * 0.8), 0.6, 0);
    spike.castShadow = true;
    boss.add(spike);
  }

  // Dragon legs (4 legs with claws)
  const legMaterial = new THREE.MeshStandardMaterial({
    color: isStronghold ? 0x0d0020 : 0x660000,
    metalness: 0.4,
    roughness: 0.6
  });

  // Front legs
  for (let side = 0; side < 2; side++) {
    const legZ = side === 0 ? 1 : -1;
    const leg = new THREE.Mesh(
      new THREE.CylinderGeometry(0.25, 0.2, 1.5, 8),
      legMaterial
    );
    leg.position.set(1.5, -1, legZ);
    leg.castShadow = true;
    boss.add(leg);

    // Claws
    for (let claw = 0; claw < 3; claw++) {
      const clawMesh = new THREE.Mesh(
        new THREE.ConeGeometry(0.08, 0.3, 6),
        hornMaterial
      );
      clawMesh.position.set(1.5 + (claw - 1) * 0.15, -1.8, legZ);
      clawMesh.rotation.z = Math.PI;
      clawMesh.castShadow = true;
      boss.add(clawMesh);
    }
  }

  // Back legs
  for (let side = 0; side < 2; side++) {
    const legZ = side === 0 ? 1 : -1;
    const leg = new THREE.Mesh(
      new THREE.CylinderGeometry(0.25, 0.2, 1.5, 8),
      legMaterial
    );
    leg.position.set(-0.5, -1, legZ);
    leg.castShadow = true;
    boss.add(leg);

    // Claws
    for (let claw = 0; claw < 3; claw++) {
      const clawMesh = new THREE.Mesh(
        new THREE.ConeGeometry(0.08, 0.3, 6),
        hornMaterial
      );
      clawMesh.position.set(-0.5 + (claw - 1) * 0.15, -1.8, legZ);
      clawMesh.rotation.z = Math.PI;
      clawMesh.castShadow = true;
      boss.add(clawMesh);
    }
  }

  // Body scales (decorative ridges along spine)
  for (let i = 0; i < 6; i++) {
    const scale = new THREE.Mesh(
      new THREE.ConeGeometry(0.15, 0.4, 6),
      new THREE.MeshStandardMaterial({
        color: isStronghold ? 0x4400aa : 0xaa0000,
        metalness: 0.7,
        roughness: 0.3
      })
    );
    scale.position.set(0.5 - (i * 0.4), 1.8, 0);
    scale.castShadow = true;
    boss.add(scale);
  }

  // Nostrils (glowing)
  const nostrilMaterial = new THREE.MeshBasicMaterial({
    color: isStronghold ? 0x6600cc : 0xff4400,
    emissive: isStronghold ? 0x6600cc : 0xff4400,
    emissiveIntensity: 1.5
  });

  const nostrilGeometry = new THREE.SphereGeometry(0.1, 8, 8);
  const leftNostril = new THREE.Mesh(nostrilGeometry, nostrilMaterial);
  leftNostril.position.set(5, 0.1, 0.3);
  boss.add(leftNostril);

  const rightNostril = new THREE.Mesh(nostrilGeometry, nostrilMaterial);
  rightNostril.position.set(5, 0.1, -0.3);
  boss.add(rightNostril);

  // Teeth (visible from snout)
  for (let i = 0; i < 6; i++) {
    const tooth = new THREE.Mesh(
      new THREE.ConeGeometry(0.06, 0.3, 6),
      new THREE.MeshStandardMaterial({
        color: 0xeeeeee,
        metalness: 0.2,
        roughness: 0.8
      })
    );
    tooth.position.set(4.3 + (i * 0.1), 0 - (i % 2) * 0.15, (i % 2 === 0 ? 0.4 : -0.4));
    tooth.rotation.z = Math.PI;
    tooth.castShadow = true;
    boss.add(tooth);
  }

  // Fire/Force glow light (purple for stronghold, orange for regular)
  const bossLight = new THREE.PointLight(isStronghold ? 0x9900ff : 0xff4400, 3, 20);
  bossLight.position.set(4.5, 0.3, 0);
  boss.add(bossLight);

  // Position boss
  const groundHeight = getTerrainHeight(x, z);
  boss.position.set(x, groundHeight + 4, z);

  boss.userData = {
    health: 3,
    maxHealth: 3,
    patrolAngle: Math.random() * Math.PI * 2,
    patrolRadius: 8,
    centerX: x,
    centerZ: z,
    defeated: false,
    attackCooldown: 0,
    rotationSpeed: 0.02
  };

  scene.add(boss);
  return boss;
}

// Create stronghold fortress base
function createBase(x, z) {
  const base = new THREE.Group();

  // Stone material for fortress
  const stoneMaterial = new THREE.MeshStandardMaterial({
    color: 0x4a4a4a,
    metalness: 0.1,
    roughness: 0.9
  });

  // Main fortress walls (4 walls forming a square)
  const wallHeight = 10;
  const wallThickness = 1;
  const wallLength = 12;

  // Front wall (with gate opening)
  const frontWallLeft = new THREE.Mesh(
    new THREE.BoxGeometry(wallLength / 2 - 2, wallHeight, wallThickness),
    stoneMaterial
  );
  frontWallLeft.position.set(-wallLength / 4 - 1, wallHeight / 2, wallLength / 2);
  frontWallLeft.castShadow = true;
  frontWallLeft.receiveShadow = true;
  base.add(frontWallLeft);

  const frontWallRight = new THREE.Mesh(
    new THREE.BoxGeometry(wallLength / 2 - 2, wallHeight, wallThickness),
    stoneMaterial
  );
  frontWallRight.position.set(wallLength / 4 + 1, wallHeight / 2, wallLength / 2);
  frontWallRight.castShadow = true;
  frontWallRight.receiveShadow = true;
  base.add(frontWallRight);

  // Back, left, right walls
  const backWall = new THREE.Mesh(
    new THREE.BoxGeometry(wallLength, wallHeight, wallThickness),
    stoneMaterial
  );
  backWall.position.set(0, wallHeight / 2, -wallLength / 2);
  backWall.castShadow = true;
  backWall.receiveShadow = true;
  base.add(backWall);

  const leftWall = new THREE.Mesh(
    new THREE.BoxGeometry(wallThickness, wallHeight, wallLength),
    stoneMaterial
  );
  leftWall.position.set(-wallLength / 2, wallHeight / 2, 0);
  leftWall.castShadow = true;
  leftWall.receiveShadow = true;
  base.add(leftWall);

  const rightWall = new THREE.Mesh(
    new THREE.BoxGeometry(wallThickness, wallHeight, wallLength),
    stoneMaterial
  );
  rightWall.position.set(wallLength / 2, wallHeight / 2, 0);
  rightWall.castShadow = true;
  rightWall.receiveShadow = true;
  base.add(rightWall);

  // Corner towers (4 towers)
  const towerMaterial = new THREE.MeshStandardMaterial({
    color: 0x3a3a3a,
    metalness: 0.2,
    roughness: 0.8
  });

  for (let i = 0; i < 4; i++) {
    const angle = (i / 4) * Math.PI * 2;
    const towerX = Math.cos(angle) * (wallLength / 2 + 0.5);
    const towerZ = Math.sin(angle) * (wallLength / 2 + 0.5);

    // Tower base
    const tower = new THREE.Mesh(
      new THREE.CylinderGeometry(1.5, 1.8, 12, 8),
      towerMaterial
    );
    tower.position.set(towerX, 6, towerZ);
    tower.castShadow = true;
    tower.receiveShadow = true;
    base.add(tower);

    // Tower top (cone roof)
    const towerTop = new THREE.Mesh(
      new THREE.ConeGeometry(2, 3, 8),
      new THREE.MeshStandardMaterial({
        color: 0x8b0000,
        metalness: 0.3,
        roughness: 0.7
      })
    );
    towerTop.position.set(towerX, 13.5, towerZ);
    towerTop.castShadow = true;
    base.add(towerTop);

    // Tower windows (glowing red)
    const window1 = new THREE.Mesh(
      new THREE.BoxGeometry(0.6, 0.8, 0.2),
      new THREE.MeshStandardMaterial({
        color: 0xff0000,
        emissive: 0xff0000,
        emissiveIntensity: 1
      })
    );
    window1.position.set(towerX, 8, towerZ);
    base.add(window1);
  }

  // Battlements on top of walls
  for (let i = 0; i < 20; i++) {
    const battlementX = (i % 5) * 3 - 6;
    const battlementZ = i < 5 ? 6 : i < 10 ? -6 : i < 15 ? battlementX : battlementX;
    const actualX = i < 10 ? battlementX : i < 15 ? -6 : 6;
    const actualZ = i < 5 ? 6 : i < 10 ? -6 : battlementZ;

    const battlement = new THREE.Mesh(
      new THREE.BoxGeometry(0.8, 1.5, 0.8),
      stoneMaterial
    );
    battlement.position.set(actualX, wallHeight + 0.75, actualZ);
    battlement.castShadow = true;
    base.add(battlement);
  }

  // Force field barrier at gate
  const domeGeometry = new THREE.BoxGeometry(4, 8, 0.5);
  const domeMaterial = new THREE.MeshStandardMaterial({
    color: 0xff0000,
    emissive: 0xff0000,
    emissiveIntensity: 0.8,
    transparent: true,
    opacity: 0.3,
    side: THREE.DoubleSide
  });
  const dome = new THREE.Mesh(domeGeometry, domeMaterial);
  dome.position.set(0, 4, wallLength / 2);
  dome.castShadow = true;
  base.add(dome);

  // Energy grid at gate
  const gridGeometry = new THREE.BoxGeometry(4.2, 8.2, 0.3);
  const gridMaterial = new THREE.MeshBasicMaterial({
    color: 0xff0000,
    wireframe: true,
    transparent: true,
    opacity: 0.6
  });
  const grid = new THREE.Mesh(gridGeometry, gridMaterial);
  grid.position.set(0, 4, wallLength / 2);
  base.add(grid);

  // Floor/platform
  const platform = new THREE.Mesh(
    new THREE.BoxGeometry(wallLength + 2, 0.5, wallLength + 2),
    new THREE.MeshStandardMaterial({
      color: 0x2a2a2a,
      metalness: 0.3,
      roughness: 0.8
    })
  );
  platform.position.y = 0.25;
  platform.castShadow = true;
  platform.receiveShadow = true;
  base.add(platform);

  // Energy core in center
  const core = new THREE.Mesh(
    new THREE.SphereGeometry(0.8, 16, 16),
    new THREE.MeshStandardMaterial({
      color: 0xff0000,
      emissive: 0xff0000,
      emissiveIntensity: 2,
      transparent: true,
      opacity: 0.9
    })
  );
  core.position.y = 1;
  base.add(core);

  // Stronghold light
  const baseLight = new THREE.PointLight(0xff0000, 5, 30);
  baseLight.position.set(0, 6, 0);
  base.add(baseLight);

  // Position base
  const groundHeight = getTerrainHeight(x, z);
  base.position.set(x, groundHeight, z);

  base.userData = {
    health: 8,  // Increased health for stronghold
    maxHealth: 8,
    destroyed: false,
    dome: dome,
    grid: grid,
    core: core,
    rotationSpeed: 0,
    wallLength: wallLength
  };

  scene.add(base);

  // Store stronghold position for collision detection
  strongholdPositions.push({ x, z, size: wallLength });

  return base;
}

// Add magical flowers
function createFlowers() {
  for (let i = 0; i < 60; i++) { // More flowers for larger map
    const x = (seededRandom() - 0.5) * 280;
    const z = (seededRandom() - 0.5) * 280;
    const y = getTerrainHeight(x, z);

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
    // Position mane from top of head down along the neck and body
    const baseX = 2.0 - t * 2.2; // Start at head, go back along neck and body
    const baseY = 1.5 - t * 1.5; // Start higher at top of head, go down to body level

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

  // Tail - long and flowing (made bigger and more prominent)
  const tailBase = new THREE.Mesh(
    new THREE.SphereGeometry(0.35, 12, 12),
    bodyMaterial
  );
  tailBase.position.set(-1.2, 0.25, 0);
  unicorn.add(tailBase);

  for (let i = 0; i < 15; i++) {
    const tailSegment = new THREE.Mesh(
      new THREE.SphereGeometry(0.32 - i * 0.015, 12, 12),
      new THREE.MeshStandardMaterial({
        color: maneColors[i % maneColors.length],
        roughness: 0.75
      })
    );
    const t = i / 14;
    tailSegment.position.set(
      -1.3 - t * 1.8,
      0.2 - t * 1.2 - Math.sin(t * Math.PI) * 0.4,
      Math.sin(t * Math.PI * 2) * 0.25
    );
    tailSegment.scale.set(1.0, 2.0, 1.0);
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

    // Upper leg group (can rotate at hip)
    const upperLegGroup = new THREE.Group();

    // Upper leg (thigh/shoulder)
    const upperLeg = new THREE.Mesh(
      new THREE.CylinderGeometry(0.2, 0.17, 0.85, 12),
      bodyMaterial
    );
    upperLeg.position.set(0, -0.425, 0);
    upperLeg.castShadow = true;
    upperLeg.receiveShadow = true;
    upperLegGroup.add(upperLeg);

    // Knee/hock joint
    const joint = new THREE.Mesh(
      new THREE.SphereGeometry(0.17, 12, 12),
      bodyMaterial
    );
    joint.position.set(0, -0.85, 0);
    joint.castShadow = true;
    upperLegGroup.add(joint);

    // Lower leg group (rotates at knee)
    const lowerLegGroup = new THREE.Group();
    lowerLegGroup.position.set(0, -0.85, 0); // Position at knee

    // Lower leg (cannon bone)
    const lowerLeg = new THREE.Mesh(
      new THREE.CylinderGeometry(0.14, 0.12, 0.85, 12),
      bodyMaterial
    );
    lowerLeg.position.set(0, -0.425, 0);
    lowerLeg.castShadow = true;
    lowerLeg.receiveShadow = true;
    lowerLegGroup.add(lowerLeg);

    // Fetlock (ankle)
    const fetlock = new THREE.Mesh(
      new THREE.SphereGeometry(0.12, 12, 12),
      bodyMaterial
    );
    fetlock.position.set(0, -0.85, 0);
    fetlock.castShadow = true;
    lowerLegGroup.add(fetlock);

    // Pastern (lower ankle)
    const pastern = new THREE.Mesh(
      new THREE.CylinderGeometry(0.11, 0.13, 0.23, 12),
      bodyMaterial
    );
    pastern.position.set(0, -0.99, 0);
    pastern.castShadow = true;
    lowerLegGroup.add(pastern);

    // Hoof
    const hoof = new THREE.Mesh(
      new THREE.CylinderGeometry(0.13, 0.15, 0.18, 12),
      new THREE.MeshStandardMaterial({
        color: 0x0a0a0a,
        metalness: 0.4,
        roughness: 0.6
      })
    );
    hoof.position.set(0, -1.15, 0);
    hoof.castShadow = true;
    lowerLegGroup.add(hoof);

    upperLegGroup.add(lowerLegGroup);
    legGroup.add(upperLegGroup);
    unicorn.add(legGroup);

    legs.push({
      group: legGroup,
      upperLeg: upperLegGroup,
      lowerLeg: lowerLegGroup,
      phase: pos.phase,
      baseY: 0
    });
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
const playerSpawnX = -40;
const playerSpawnZ = -40;
const playerGroundHeight = getTerrainHeight(playerSpawnX, playerSpawnZ);
player.position.set(playerSpawnX, playerGroundHeight + 3.5, playerSpawnZ);
scene.add(player);

// Create unicorns in danger
const unicornsInDanger = [];
const bosses = [];
const bases = [];

// Dragon eggs collection system
const dragonEggs = [];
let collectedEggs = parseInt(localStorage.getItem('dragonEggsCollected') || '0');

// Create dragon egg
function createDragonEgg(x, z, type = 'fire') {
  const egg = new THREE.Group();

  // Egg types: fire (red/orange), ice (blue/cyan), shadow (purple/black), nature (green)
  const eggColors = {
    fire: { base: 0xff4400, spot: 0xff8800, glow: 0xff6600 },
    ice: { base: 0x00ccff, spot: 0x66ddff, glow: 0x00ffff },
    shadow: { base: 0x4400aa, spot: 0x6600cc, glow: 0x9900ff },
    nature: { base: 0x44aa00, spot: 0x88cc00, glow: 0x00ff44 }
  };

  const colors = eggColors[type];

  // Main egg body
  const eggGeometry = new THREE.SphereGeometry(0.8, 16, 16);
  eggGeometry.scale(1, 1.3, 1); // Make it egg-shaped
  const eggMaterial = new THREE.MeshStandardMaterial({
    color: colors.base,
    emissive: colors.glow,
    emissiveIntensity: 0.3,
    metalness: 0.4,
    roughness: 0.6
  });
  const eggMesh = new THREE.Mesh(eggGeometry, eggMaterial);
  eggMesh.castShadow = true;
  egg.add(eggMesh);

  // Egg spots/patterns
  for (let i = 0; i < 8; i++) {
    const spot = new THREE.Mesh(
      new THREE.SphereGeometry(0.15, 8, 8),
      new THREE.MeshStandardMaterial({
        color: colors.spot,
        emissive: colors.spot,
        emissiveIntensity: 0.2,
        metalness: 0.5,
        roughness: 0.5
      })
    );
    const angle = (i / 8) * Math.PI * 2;
    spot.position.set(
      Math.cos(angle) * 0.6,
      Math.sin(i) * 0.3,
      Math.sin(angle) * 0.6
    );
    egg.add(spot);
  }

  // Glowing ring around base
  const ringGeometry = new THREE.RingGeometry(0.8, 1, 32);
  const ringMaterial = new THREE.MeshBasicMaterial({
    color: colors.glow,
    transparent: true,
    opacity: 0.5,
    side: THREE.DoubleSide
  });
  const ring = new THREE.Mesh(ringGeometry, ringMaterial);
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = -0.5;
  egg.add(ring);

  // Glow light
  const eggLight = new THREE.PointLight(colors.glow, 2, 10);
  eggLight.position.set(0, 0, 0);
  egg.add(eggLight);

  // Position egg
  const groundHeight = getTerrainHeight(x, z);
  egg.position.set(x, groundHeight + 1, z);

  egg.userData = {
    type: type,
    collected: false,
    bobTime: Math.random() * Math.PI * 2,
    ring: ring
  };

  scene.add(egg);
  return egg;
}

// Spawn dragon eggs across the larger map
const eggTypes = ['fire', 'ice', 'shadow', 'nature'];
const eggPositions = [
  { x: 30, z: -22, type: 'fire' },
  { x: -27, z: 33, type: 'ice' },
  { x: 12, z: -42, type: 'shadow' },
  { x: -48, z: 7, type: 'nature' },
  { x: 37, z: 37, type: 'fire' },
  { x: -36, z: -36, type: 'ice' },
  { x: 45, z: 3, type: 'shadow' },
  { x: 3, z: 48, type: 'nature' }
];

eggPositions.forEach(pos => {
  const egg = createDragonEgg(pos.x, pos.z, pos.type);
  dragonEggs.push(egg);
});

const dangerPositions = [
  // FOREST BIOME (5 unicorns) - centered at (-75, -75)
  { x: -75, z: -75, protection: 'base', biome: 'forest' },      // Unicorn 0 - Forest stronghold
  { x: -63, z: -87, protection: 'boss', biome: 'forest' },      // Unicorn 1 - Forest boss
  { x: -87, z: -63, protection: 'boss', biome: 'forest' },      // Unicorn 2 - Forest boss
  { x: -67, z: -67, protection: 'none', biome: 'forest' },      // Unicorn 3 - Forest free
  { x: -82, z: -82, protection: 'none', biome: 'forest' },      // Unicorn 4 - Forest free

  // DESERT BIOME (5 unicorns) - centered at (75, -75)
  { x: 75, z: -75, protection: 'base', biome: 'desert' },       // Unicorn 5 - Desert stronghold
  { x: 87, z: -63, protection: 'boss', biome: 'desert' },       // Unicorn 6 - Desert boss
  { x: 63, z: -87, protection: 'boss', biome: 'desert' },       // Unicorn 7 - Desert boss
  { x: 82, z: -82, protection: 'none', biome: 'desert' },       // Unicorn 8 - Desert free
  { x: 67, z: -67, protection: 'none', biome: 'desert' },       // Unicorn 9 - Desert free

  // SNOW BIOME (5 unicorns) - centered at (0, 105)
  { x: 0, z: 105, protection: 'base', biome: 'snow' },             // Unicorn 10 - Snow stronghold
  { x: -12, z: 117, protection: 'boss', biome: 'snow' },          // Unicorn 11 - Snow boss
  { x: 12, z: 93, protection: 'boss', biome: 'snow' },           // Unicorn 12 - Snow boss
  { x: -7, z: 97, protection: 'none', biome: 'snow' },          // Unicorn 13 - Snow free
  { x: 7, z: 112, protection: 'none', biome: 'snow' },           // Unicorn 14 - Snow free

  // VOLCANIC BIOME (5 unicorns) - centered at (75, 75)
  { x: 75, z: 75, protection: 'base', biome: 'volcanic' },      // Unicorn 15 - Volcanic stronghold
  { x: 87, z: 87, protection: 'boss', biome: 'volcanic' },      // Unicorn 16 - Volcanic boss
  { x: 63, z: 63, protection: 'boss', biome: 'volcanic' },      // Unicorn 17 - Volcanic boss
  { x: 82, z: 67, protection: 'none', biome: 'volcanic' },      // Unicorn 18 - Volcanic free
  { x: 67, z: 82, protection: 'none', biome: 'volcanic' },      // Unicorn 19 - Volcanic free

  // SWAMP BIOME (5 unicorns) - centered at (-75, 75)
  { x: -75, z: 75, protection: 'base', biome: 'swamp' },        // Unicorn 20 - Swamp stronghold
  { x: -87, z: 87, protection: 'boss', biome: 'swamp' },        // Unicorn 21 - Swamp boss
  { x: -63, z: 63, protection: 'boss', biome: 'swamp' },        // Unicorn 22 - Swamp boss
  { x: -82, z: 67, protection: 'none', biome: 'swamp' },        // Unicorn 23 - Swamp free
  { x: -67, z: 82, protection: 'none', biome: 'swamp' }         // Unicorn 24 - Swamp free
];

dangerPositions.forEach((pos, index) => {
  const colors = [
    0xe6e6fa,  // Lavender
    0xdda0dd,  // Plum
    0xffb6c1,  // Light Pink
    0xf0e6ff,  // Light Purple
    0xffd7ff,  // Orchid
    0xb0e0e6,  // Powder Blue
    0xfffacd,  // Lemon Chiffon
    0xf5deb3,  // Wheat
    0xdaa520,  // Goldenrod
    0x98fb98   // Pale Green
  ];
  const unicornInDanger = createUnicorn(colors[index], false);
  const groundHeight = getTerrainHeight(pos.x, pos.z);
  unicornInDanger.position.set(pos.x, groundHeight + 3.5, pos.z);

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
  dangerRing.position.y = -3.4;  // Position ring at ground level relative to unicorn
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
    originalPosition: new THREE.Vector3(pos.x, groundHeight + 3.5, pos.z),
    protection: pos.protection,
    boss: null,
    base: null
  };

  // Create boss or base based on protection type
  if (pos.protection === 'boss') {
    const boss = createBoss(pos.x, pos.z);
    unicornInDanger.userData.boss = boss;
    boss.userData.unicornIndex = index;
    bosses.push(boss);
  } else if (pos.protection === 'base') {
    const base = createBase(pos.x, pos.z);
    unicornInDanger.userData.base = base;
    base.userData.unicornIndex = index;
    bases.push(base);

    // Add a stronghold boss to guard this base
    const strongholdBoss = createBoss(pos.x, pos.z, true);
    strongholdBoss.userData.health = 5;  // Stronghold bosses have 5 health instead of 3
    strongholdBoss.userData.maxHealth = 5;
    strongholdBoss.userData.isStrongholdBoss = true;
    strongholdBoss.userData.baseIndex = bases.length - 1;
    strongholdBoss.userData.flyHeight = 8; // Fly higher than regular dragons
    bosses.push(strongholdBoss);
  }

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

    startBackgroundMusic();

    // Try to load saved game
    loadSavedGame();

    // Auto-enable pointer lock when game starts
    renderer.domElement.requestPointerLock();
  }
}

// Load saved game function
function loadSavedGame() {
  const savedData = localStorage.getItem('unicornsUnite_save');
  if (savedData) {
    try {
      const save = JSON.parse(savedData);

      // Restore game state
      gameState.unicornsSaved = save.unicornsSaved || 0;
      gameState.magicPower = save.magicPower || 100;

      // Restore player position
      if (save.playerPosition) {
        player.position.set(
          save.playerPosition.x,
          save.playerPosition.y,
          save.playerPosition.z
        );
      }

      // Restore saved unicorns
      if (save.savedUnicorns && Array.isArray(save.savedUnicorns)) {
        save.savedUnicorns.forEach((isSaved, index) => {
          if (isSaved && unicornsInDanger[index]) {
            const unicorn = unicornsInDanger[index];
            unicorn.userData.saved = true;

            // Remove danger effects
            if (unicorn.userData.dangerRing.parent) {
              unicorn.remove(unicorn.userData.dangerRing);
            }
            if (unicorn.userData.particles.parent) {
              unicorn.remove(unicorn.userData.particles);
            }

            // Add celebration light
            const celebrationLight = new THREE.PointLight(0xffd700, 3, 15);
            unicorn.add(celebrationLight);
          }
        });
      }

      // Update UI with restored state
      updateUI();

      showMessage('✨ Game Loaded!');
    } catch (e) {
      console.error('Error loading saved game:', e);
    }
  }
}

// Add click listener to start button
document.getElementById('start-button').addEventListener('click', startGame);

// Pause game button
let gamePaused = false;
const pauseMenu = document.getElementById('pause-menu');

document.getElementById('pause-button').addEventListener('click', () => {
  gamePaused = true;

  // Exit pointer lock when paused
  if (document.pointerLockElement) {
    document.exitPointerLock();
  }

  // Update pause menu stats
  document.getElementById('pause-unicorns-saved').textContent = `${gameState.unicornsSaved}/${gameState.totalUnicorns}`;
  document.getElementById('pause-magic-power').textContent = `${Math.max(0, Math.round(gameState.magicPower))}%`;
  const pauseMagicProgress = document.getElementById('pause-magic-progress');
  if (pauseMagicProgress) {
    pauseMagicProgress.style.width = `${Math.max(0, gameState.magicPower)}%`;
  }

  // Update map if visible
  if (mapVisible) {
    renderMap();
  }

  // Show pause menu
  pauseMenu.classList.add('show');
});

// Resume button
document.getElementById('resume-button').addEventListener('click', () => {
  gamePaused = false;
  pauseMenu.classList.remove('show');

  // Hide map when resuming
  mapVisible = false;
  mapPanel.classList.remove('show');

  // Resume game - request pointer lock again
  renderer.domElement.requestPointerLock();
});

// Fullscreen button
document.getElementById('fullscreen-button').addEventListener('click', () => {
  if (!document.fullscreenElement) {
    // Enter fullscreen
    document.documentElement.requestFullscreen().then(() => {
      showMessage('🖥️ Fullscreen Mode Activated!');
    }).catch(err => {
      console.error('Error attempting to enable fullscreen:', err);
      showMessage('⚠️ Fullscreen not supported');
    });
  } else {
    // Exit fullscreen
    document.exitFullscreen().then(() => {
      showMessage('🖥️ Fullscreen Mode Deactivated!');
    });
  }
});

// Save button
document.getElementById('save-button').addEventListener('click', () => {
  // Save game state to localStorage
  const saveData = {
    unicornsSaved: gameState.unicornsSaved,
    magicPower: gameState.magicPower,
    playerPosition: {
      x: player.position.x,
      y: player.position.y,
      z: player.position.z
    },
    savedUnicorns: unicornsInDanger.map(u => u.userData.saved),
    timestamp: Date.now()
  };
  localStorage.setItem('unicornsUnite_save', JSON.stringify(saveData));
  showMessage('💾 Game Saved!');
});

// Restart button
document.getElementById('restart-button').addEventListener('click', () => {
  // Clear saved game
  localStorage.removeItem('unicornsUnite_save');

  // Reset and return to loading screen
  resetGame();

  showMessage('🔄 Game Restarted!');
});

// Map toggle button
let mapVisible = false;
const mapPanel = document.getElementById('map-panel');
const mapCanvas = document.getElementById('game-map');
const mapCtx = mapCanvas.getContext('2d');

document.getElementById('toggle-map-button').addEventListener('click', () => {
  mapVisible = !mapVisible;

  if (mapVisible) {
    mapPanel.classList.add('show');
    renderMap();
  } else {
    mapPanel.classList.remove('show');
  }
});

// Function to render the map
function renderMap() {
  const canvas = mapCanvas;
  const ctx = mapCtx;
  const width = canvas.width;
  const height = canvas.height;

  // Clear canvas
  ctx.clearRect(0, 0, width, height);

  // Draw background with gradient
  const gradient = ctx.createRadialGradient(width/2, height/2, 0, width/2, height/2, width/2);
  gradient.addColorStop(0, 'rgba(50, 80, 50, 0.8)');
  gradient.addColorStop(1, 'rgba(20, 40, 20, 0.8)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  // Draw grid
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.lineWidth = 1;
  const gridSize = 50;
  for (let x = 0; x < width; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = 0; y < height; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  // Map scale and offset (game world is roughly -150 to +150 in both X and Z)
  const worldSize = 300;
  const scale = width / worldSize;
  const offsetX = width / 2;
  const offsetY = height / 2;

  // Function to convert world coordinates to canvas coordinates
  function worldToCanvas(x, z) {
    return {
      x: offsetX + x * scale,
      y: offsetY + z * scale
    };
  }

  // Draw unicorns in danger
  unicornsInDanger.forEach(unicorn => {
    const pos = worldToCanvas(unicorn.position.x, unicorn.position.z);

    // Draw unicorn marker
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, 8, 0, Math.PI * 2);

    if (unicorn.userData.saved) {
      // Saved unicorn - green
      ctx.fillStyle = '#00ff00';
      ctx.shadowColor = '#00ff00';
    } else {
      // In danger - red
      ctx.fillStyle = '#ff3333';
      ctx.shadowColor = '#ff3333';
    }

    ctx.shadowBlur = 15;
    ctx.fill();
    ctx.shadowBlur = 0;

    // Draw border
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 2;
    ctx.stroke();
  });

  // Draw player position (on top)
  const playerPos = worldToCanvas(player.position.x, player.position.z);

  // Player marker - golden with pulse effect
  ctx.beginPath();
  ctx.arc(playerPos.x, playerPos.y, 10, 0, Math.PI * 2);
  ctx.fillStyle = '#ffd700';
  ctx.shadowColor = '#ffd700';
  ctx.shadowBlur = 20;
  ctx.fill();
  ctx.shadowBlur = 0;

  // Player border
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
  ctx.lineWidth = 3;
  ctx.stroke();

  // Draw player direction indicator
  ctx.beginPath();
  ctx.moveTo(playerPos.x, playerPos.y);
  const dirAngle = player.rotation.y + Math.PI / 2;
  const dirLength = 15;
  ctx.lineTo(
    playerPos.x + Math.cos(dirAngle) * dirLength,
    playerPos.y + Math.sin(dirAngle) * dirLength
  );
  ctx.strokeStyle = '#ffd700';
  ctx.lineWidth = 3;
  ctx.stroke();
}

// Save and end button
document.getElementById('save-and-end-button').addEventListener('click', () => {
  // Save game
  const saveData = {
    unicornsSaved: gameState.unicornsSaved,
    magicPower: gameState.magicPower,
    playerPosition: {
      x: player.position.x,
      y: player.position.y,
      z: player.position.z
    },
    savedUnicorns: unicornsInDanger.map(u => u.userData.saved),
    timestamp: Date.now()
  };
  localStorage.setItem('unicornsUnite_save', JSON.stringify(saveData));

  // Reset and return to loading screen
  resetGame();
});

// Reset game function
function resetGame() {
  // Reset game state
  gamePaused = false;
  gameStarted = false;
  mouseMovement = false;
  gameState.unicornsSaved = 0;
  gameState.magicPower = 100;
  gameState.canCastSpell = true;
  gameState.canUseShield = true;
  gameState.hasShield = false;

  // Reset player position
  player.position.set(playerSpawnX, playerGroundHeight + 3.5, playerSpawnZ);
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

  // Hide pause menu
  pauseMenu.classList.remove('show');

  // Show loading screen again
  const loadingScreen = document.getElementById('loading-screen');
  if (loadingScreen) {
    loadingScreen.style.display = 'flex';
  }

  updateUI();
}

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

// Toggle UI button functionality
let uiVisible = true;
document.getElementById('toggle-ui-button').addEventListener('click', () => {
  uiVisible = !uiVisible;

  const infoPanel = document.getElementById('info-panel');
  const controls = document.getElementById('controls');
  const abilityBar = document.getElementById('ability-bar');

  if (uiVisible) {
    infoPanel.classList.remove('ui-panel-hidden');
    controls.classList.remove('ui-panel-hidden');
    abilityBar.classList.remove('ui-panel-hidden');
  } else {
    infoPanel.classList.add('ui-panel-hidden');
    controls.classList.add('ui-panel-hidden');
    abilityBar.classList.add('ui-panel-hidden');
  }
});

// Unicorn customization system
const customization = {
  bodyColor: '#fff0f5',
  maneColor: 'pink',
  hornColor: '#ffd700'
};

// Mane color schemes
const maneColorSchemes = {
  pink: [0xff1493, 0xff69b4, 0xffb6c1, 0xff1493, 0xff69b4, 0xffb6c1],
  purple: [0x8b00ff, 0x9932cc, 0xba55d3, 0x8b00ff, 0x9932cc, 0xba55d3],
  rainbow: [0xff0000, 0xff7f00, 0xffff00, 0x00ff00, 0x0000ff, 0x4b0082],
  fire: [0xff0000, 0xff4500, 0xffa500, 0xff0000, 0xff4500, 0xffa500],
  ocean: [0x1e90ff, 0x00bfff, 0x87ceeb, 0x1e90ff, 0x00bfff, 0x87ceeb],
  galaxy: [0x191970, 0x9370db, 0xff1493, 0x191970, 0x9370db, 0xff1493]
};

// Track selected colors temporarily
let tempBodyColor = customization.bodyColor;
let tempManeColor = customization.maneColor;
let tempHornColor = customization.hornColor;

// Customization button handlers
document.querySelectorAll('[data-body-color]').forEach(button => {
  button.addEventListener('click', () => {
    document.querySelectorAll('[data-body-color]').forEach(btn => btn.classList.remove('selected'));
    button.classList.add('selected');
    tempBodyColor = button.getAttribute('data-body-color');
  });
});

document.querySelectorAll('[data-mane-color]').forEach(button => {
  button.addEventListener('click', () => {
    document.querySelectorAll('[data-mane-color]').forEach(btn => btn.classList.remove('selected'));
    button.classList.add('selected');
    tempManeColor = button.getAttribute('data-mane-color');
  });
});

document.querySelectorAll('[data-horn-color]').forEach(button => {
  button.addEventListener('click', () => {
    document.querySelectorAll('[data-horn-color]').forEach(btn => btn.classList.remove('selected'));
    button.classList.add('selected');
    tempHornColor = button.getAttribute('data-horn-color');
  });
});

// Apply customization button
document.getElementById('apply-customization').addEventListener('click', () => {
  customization.bodyColor = tempBodyColor;
  customization.maneColor = tempManeColor;
  customization.hornColor = tempHornColor;

  applyUnicornCustomization();
  showMessage('✨ Customization Applied! ✨');
});

// Function to apply customization to player unicorn
function applyUnicornCustomization() {
  const bodyColor = new THREE.Color(customization.bodyColor);
  const hornColor = new THREE.Color(customization.hornColor);
  const maneColors = maneColorSchemes[customization.maneColor];

  // Update body color
  player.children.forEach(child => {
    if (child.isMesh && child.material) {
      // Check if it's a body part (not mane, tail, horn, or hoof)
      const materialColor = child.material.color;
      if (materialColor &&
          !child.material.metalness || child.material.metalness < 0.5) {
        // Update body materials
        if (child.geometry.type === 'CapsuleGeometry' ||
            child.geometry.type === 'SphereGeometry' ||
            child.geometry.type === 'CylinderGeometry' ||
            child.geometry.type === 'BoxGeometry') {
          child.material.color.copy(bodyColor);
        }
      }
    }
  });

  // Update legs (body parts in groups)
  if (player.userData.legs) {
    player.userData.legs.forEach(leg => {
      leg.upperLeg.children.forEach(child => {
        if (child.isMesh && child.material && child.material.color) {
          child.material.color.copy(bodyColor);
        }
      });
      leg.lowerLeg.children.forEach(child => {
        if (child.isMesh && child.material && child.material.color) {
          // Don't change hoof color
          if (child.material.metalness < 0.5) {
            child.material.color.copy(bodyColor);
          }
        }
      });
    });
  }

  // Update mane colors
  if (player.userData.mane) {
    player.userData.mane.forEach((segment, index) => {
      const colorIndex = index % maneColors.length;
      segment.material.color.setHex(maneColors[colorIndex]);
      segment.material.emissive.setHex(maneColors[colorIndex]);
    });
  }

  // Update tail colors (search for tail segments)
  let tailSegmentCount = 0;
  player.children.forEach(child => {
    if (child.isMesh && child.geometry.type === 'SphereGeometry' &&
        child.position.x < -1) { // Tail is at negative X
      const colorIndex = tailSegmentCount % maneColors.length;
      if (child.material.roughness > 0.7) { // Identify tail material
        child.material.color.setHex(maneColors[colorIndex]);
        tailSegmentCount++;
      }
    }
  });

  // Update horn
  player.children.forEach(child => {
    if (child.isMesh && child.geometry.type === 'CylinderGeometry' &&
        child.position.y > 1.5) { // Horn is high up
      child.material.color.copy(hornColor);
      child.material.emissive.copy(hornColor);
    }
  });
}

// Advanced magic spell system
const spells = [];

function castSpell() {
  gameState.canCastSpell = false;
  gameState.magicPower -= 20;
  updateUI();

  playSpellSound();

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
    velocity: direction.clone().multiplyScalar(1.8),  // Increased speed from 1.2 to 1.8
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

  playShieldSound();

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
  }, 5000);  // Increased from 3000 to 5000 milliseconds (5 seconds)
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

// Unlock new customization
function unlockCustomization() {
  completionCount++;
  localStorage.setItem('unicornCompletions', completionCount.toString());

  // Get all possible unlocks
  const allUnlocks = [
    ...customizationUnlocks.colors.map(c => ({ type: 'color', value: c })),
    ...customizationUnlocks.horns.map(h => ({ type: 'horn', value: h })),
    ...customizationUnlocks.manes.map(m => ({ type: 'mane', value: m })),
    ...customizationUnlocks.effects.map(e => ({ type: 'effect', value: e }))
  ];

  // Filter out already unlocked
  const availableUnlocks = allUnlocks.filter(unlock =>
    !unlockedCustomizations.some(u => u.type === unlock.type && u.value === unlock.value)
  );

  if (availableUnlocks.length > 0) {
    // Unlock a random customization
    const newUnlock = availableUnlocks[Math.floor(Math.random() * availableUnlocks.length)];
    unlockedCustomizations.push(newUnlock);
    localStorage.setItem('unicornUnlocks', JSON.stringify(unlockedCustomizations));

    return newUnlock;
  }

  return null;
}

// Game loop
const clock = new THREE.Clock();
let cameraAngle = 0;
let cameraHeight = 0;

function animate() {
  requestAnimationFrame(animate);

  // Skip game logic if paused, but still render
  if (gamePaused) {
    composer.render();
    return;
  }

  const delta = clock.getDelta();
  const time = clock.getElapsedTime();

  // Player movement with sprint
  const isSprinting = keys['f'] && gameState.magicPower > 0;
  const baseSpeed = isSprinting ? 50 : 25; // Double speed when sprinting
  const moveSpeed = baseSpeed * delta;
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

    // Calculate new position
    const newX = player.position.x + rotatedDir.x * moveSpeed;
    const newZ = player.position.z + rotatedDir.z * moveSpeed;

    // Only move if not colliding with trees or strongholds
    if (!checkTreeCollision(newX, newZ) && !checkStrongholdCollision(newX, newZ)) {
      player.position.add(rotatedDir.multiplyScalar(moveSpeed));

      // Drain magic when sprinting
      if (isSprinting) {
        gameState.magicPower = Math.max(0, gameState.magicPower - delta * 25);
        updateUI();

        // Add sprint particle trail
        if (Math.random() < 0.3) {
          const sprintParticle = new THREE.Mesh(
            new THREE.SphereGeometry(0.2, 8, 8),
            new THREE.MeshBasicMaterial({
              color: 0x00ffff,
              transparent: true,
              opacity: 0.8
            })
          );
          sprintParticle.position.copy(player.position);
          sprintParticle.position.y -= 1;
          sprintParticle.position.x += (Math.random() - 0.5) * 2;
          sprintParticle.position.z += (Math.random() - 0.5) * 2;
          scene.add(sprintParticle);

          setTimeout(() => {
            scene.remove(sprintParticle);
          }, 500);
        }
      }
    }

    // Face the direction of movement
    // Calculate angle and add 90 degrees (PI/2) to align unicorn head with movement
    player.rotation.y = Math.atan2(moveDir.x, moveDir.z) - Math.PI / 2;

    // Get terrain height at player position
    const terrainHeight = getTerrainHeight(player.position.x, player.position.z);

    // Realistic gallop cycle - horses have a 4-beat gait
    const gallopSpeed = isSprinting ? 12 : 6; // Faster animation when sprinting
    const gallopCycle = time * gallopSpeed;

    // Two-phase bounce pattern (suspension phase in real galloping)
    const bouncePhase1 = Math.sin(gallopCycle * 2);
    const bouncePhase2 = Math.sin(gallopCycle * 2 + Math.PI * 0.5);
    const verticalBounce = (Math.abs(bouncePhase1) * 0.4 + Math.abs(bouncePhase2) * 0.2) * 0.7;
    player.position.y = terrainHeight + 3.5 + verticalBounce;

    // Dynamic body tilt based on movement
    const forwardTilt = Math.sin(gallopCycle * 2) * 0.12; // More forward lean during gallop
    const sideSway = Math.sin(gallopCycle) * 0.04; // Subtle side-to-side
    player.rotation.x = forwardTilt;
    player.rotation.z = sideSway;

    // Animate legs - realistic four-beat gallop with knee bending
    if (player.userData.legs) {
      player.userData.legs.forEach((leg, index) => {
        // Each leg has a slightly different timing for realistic gait
        const legOffset = leg.phase;
        const legCycle = gallopCycle * 2 + legOffset;

        // Realistic leg lift with proper stride
        const stride = Math.sin(legCycle);
        const lift = Math.max(0, stride) * 0.5; // Vertical lift
        const reach = stride * 0.3; // Hip rotation angle

        // Position adjustment for lift
        leg.group.position.y = -lift;

        // Hip rotation (upper leg swings forward and back)
        leg.upperLeg.rotation.x = reach;

        // Knee bending - bends backward when leg is lifted
        // More bend when stride is positive (leg lifting), straightens when negative (leg extending)
        const kneeBend = Math.max(0, stride) * 0.6;
        leg.lowerLeg.rotation.x = -kneeBend; // Negative for backward bend

        // Keep legs aligned
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
    player.position.y = terrainHeight + 3.5 + Math.sin(idleTime * 0.5) * 0.05;

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
        leg.upperLeg.rotation.x *= 0.9; // Reset hip rotation
        leg.lowerLeg.rotation.x *= 0.9; // Reset knee bend
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

    // Check collision with bosses
    bosses.forEach((boss, bossIndex) => {
      if (!boss.userData.defeated) {
        const distance = spell.position.distanceTo(boss.position);
        if (distance < 4) {
          boss.userData.health--;
          showMessage(`💥 Boss Hit! Health: ${boss.userData.health}/${boss.userData.maxHealth}`);

          // Remove spell after hit
          scene.remove(spell);
          spells.splice(index, 1);

          if (boss.userData.health <= 0) {
            boss.userData.defeated = true;
            gameState.bossesDefeated++;

            playDragonDefeatedSound();

            showMessage('⚔️ Boss Defeated! ⚔️');

            // Clear boss reference from unicorn
            const unicornIdx = boss.userData.unicornIndex;
            if (unicornsInDanger[unicornIdx]) {
              unicornsInDanger[unicornIdx].userData.boss = null;
            }

            // Boss death animation
            scene.remove(boss);
            bosses.splice(bossIndex, 1);
          }
          return;
        }
      }
    });

    // Check collision with bases
    bases.forEach((base, baseIndex) => {
      if (!base.userData.destroyed) {
        const distance = spell.position.distanceTo(base.position);
        if (distance < 6) {
          base.userData.health--;
          showMessage(`⚡ Base Hit! Integrity: ${base.userData.health}/${base.userData.maxHealth}`);

          // Visual damage effect - reduce opacity
          const damagePercent = base.userData.health / base.userData.maxHealth;
          base.userData.dome.material.opacity = 0.3 * damagePercent;
          base.userData.grid.material.opacity = 0.6 * damagePercent;

          // Remove spell after hit
          scene.remove(spell);
          spells.splice(index, 1);

          if (base.userData.health <= 0) {
            base.userData.destroyed = true;
            gameState.basesDestroyed++;
            showMessage('💥 Base Destroyed! 💥');

            // Clear base reference from unicorn
            const unicornIdx = base.userData.unicornIndex;
            if (unicornsInDanger[unicornIdx]) {
              unicornsInDanger[unicornIdx].userData.base = null;
            }

            // Remove from collision array
            const collisionIndex = strongholdPositions.findIndex(
              sh => sh.x === base.position.x && sh.z === base.position.z
            );
            if (collisionIndex !== -1) {
              strongholdPositions.splice(collisionIndex, 1);
            }

            // Base destruction animation
            scene.remove(base);
            bases.splice(baseIndex, 1);
          }
          return;
        }
      }
    });

    // Check collision with unicorns (only if boss is defeated or base is destroyed)
    unicornsInDanger.forEach((unicorn, unicornIndex) => {
      if (!unicorn.userData.saved) {
        // Check if unicorn is protected
        const canSave = (unicorn.userData.protection === 'boss' && !unicorn.userData.boss) ||
                        (unicorn.userData.protection === 'base' && !unicorn.userData.base) ||
                        (unicorn.userData.protection === 'none');

        if (canSave) {
          const distance = spell.position.distanceTo(unicorn.position);
          if (distance < 5) {
            unicorn.userData.saved = true;
            gameState.unicornsSaved++;
            updateUI();

            playUnicornSaveSound();

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
                playVictorySound();

                const unlock = unlockCustomization();
                if (unlock) {
                  showMessage(`🎉 YOU WIN! All Unicorns United! 🎉\n🔓 Unlocked: ${unlock.type} - ${unlock.value}!`);
                } else {
                  showMessage('🎉 YOU WIN! All Unicorns United! 🎉\n✨ All customizations unlocked!');
                }
              }, 500);
            }

            // Remove spell after saving unicorn
            scene.remove(spell);
            spells.splice(index, 1);
          }
        } else if (unicorn.userData.protection === 'boss' && unicorn.userData.boss) {
          // Show message that boss must be defeated first
          const distance = spell.position.distanceTo(unicorn.position);
          if (distance < 5) {
            showMessage('⚠️ Defeat the boss first!');
          }
        } else if (unicorn.userData.protection === 'base' && unicorn.userData.base) {
          // Show message that base must be destroyed first
          const distance = spell.position.distanceTo(unicorn.position);
          if (distance < 5) {
            showMessage('⚠️ Destroy the force field first!');
          }
        }
      }
    });

    if (spell.userData.lifetime > 15) {  // Increased from 12 to 15 seconds
      scene.remove(spell);
      spells.splice(index, 1);
    }
  });

  // Animate bosses (dragons)
  bosses.forEach(boss => {
    if (!boss.userData.defeated) {
      // Patrol around center point
      boss.userData.patrolAngle += boss.userData.rotationSpeed;
      const centerX = boss.userData.centerX;
      const centerZ = boss.userData.centerZ;
      const radius = boss.userData.patrolRadius;

      boss.position.x = centerX + Math.cos(boss.userData.patrolAngle) * radius;
      boss.position.z = centerZ + Math.sin(boss.userData.patrolAngle) * radius;

      // Bob up and down (dragon flight - stronghold dragons fly higher)
      const baseHeight = boss.userData.flyHeight || 4;
      boss.position.y = getTerrainHeight(boss.position.x, boss.position.z) + baseHeight + Math.sin(time * 2) * 0.5;

      // Face direction of patrol movement
      boss.rotation.y = boss.userData.patrolAngle + Math.PI / 2;

      // Animate dragon wings (flapping)
      if (boss.userData.leftWing && boss.userData.rightWing) {
        const wingFlap = Math.sin(time * 8) * 0.4;
        boss.userData.leftWing.rotation.z = Math.PI / 4 + wingFlap;
        boss.userData.rightWing.rotation.z = -Math.PI / 4 - wingFlap;
      }

      // Check if player is nearby and attack with fire breath
      const isStronghold = boss.userData.isStrongholdBoss;
      const attackRange = isStronghold ? 25 : 15; // Stronghold dragons have longer range
      const distToPlayer = boss.position.distanceTo(player.position);

      if (distToPlayer < attackRange) {
        boss.userData.attackCooldown -= delta;
        if (boss.userData.attackCooldown <= 0 && !gameState.hasShield) {
          // Dragon breathes fire/force at player
          const particleCount = isStronghold ? 30 : 20; // More particles for stronghold

          playDragonFireSound();

          // Create fire/force particles
          for (let i = 0; i < particleCount; i++) {
            const fireBall = new THREE.Mesh(
              new THREE.SphereGeometry(isStronghold ? 0.4 : 0.3, 8, 8),
              new THREE.MeshBasicMaterial({
                // Dark purple/blue force for stronghold, orange/yellow fire for regular
                color: isStronghold ?
                  (i % 2 === 0 ? 0x6600cc : 0x9900ff) :
                  (i % 2 === 0 ? 0xff4400 : 0xff8800),
                transparent: true,
                opacity: 0.8
              })
            );
            fireBall.position.copy(boss.position);
            fireBall.position.y -= 0.5;

            // Direction towards player with some spread
            const direction = new THREE.Vector3()
              .subVectors(player.position, boss.position)
              .normalize();
            direction.x += (Math.random() - 0.5) * 0.3;
            direction.z += (Math.random() - 0.5) * 0.3;

            // Stronghold dragons shoot faster projectiles
            const projectileSpeed = isStronghold ? 2.0 : 1.5;
            const projectileLifetime = isStronghold ? 2000 : 1500;

            fireBall.userData = {
              velocity: direction.multiplyScalar(projectileSpeed),
              lifetime: 0,
              maxLifetime: projectileLifetime / 1000
            };

            scene.add(fireBall);
            spells.push(fireBall); // Reuse spells array for fire particles

            setTimeout(() => {
              scene.remove(fireBall);
              const idx = spells.indexOf(fireBall);
              if (idx > -1) spells.splice(idx, 1);
            }, projectileLifetime);
          }

          // Drain player magic (more for stronghold)
          const magicDrain = isStronghold ? 8 : 5;
          gameState.magicPower = Math.max(0, gameState.magicPower - magicDrain);
          updateUI();
          boss.userData.attackCooldown = 3; // Attack every 3 seconds
          showMessage(isStronghold ? '⚡ Dragon unleashes dark force!' : '🔥 Dragon breathes fire!');
        }
      }

      // Allied unicorns attack stronghold bosses
      if (boss.userData.isStrongholdBoss) {
        unicornsInDanger.forEach(unicorn => {
          if (unicorn.userData.saved) {
            const distToUnicorn = boss.position.distanceTo(unicorn.position);
            if (distToUnicorn < 15) {
              // Initialize attack cooldown if not present
              if (!unicorn.userData.attackCooldown) {
                unicorn.userData.attackCooldown = 0;
              }

              unicorn.userData.attackCooldown -= delta;
              if (unicorn.userData.attackCooldown <= 0) {
                // Allied unicorn attacks boss
                boss.userData.health -= 1;
                unicorn.userData.attackCooldown = 3; // Attack every 3 seconds

                // Show attack message
                showMessage('⚡ Allied unicorn attacks boss! ' + boss.userData.health + '/' + boss.userData.maxHealth);

                // Create attack effect from unicorn to boss
                const attackSpell = new THREE.Group();
                const attackCore = new THREE.Mesh(
                  new THREE.SphereGeometry(0.3, 16, 16),
                  new THREE.MeshBasicMaterial({
                    color: 0x00ffff,
                    transparent: true,
                    opacity: 0.8
                  })
                );
                attackSpell.add(attackCore);
                attackSpell.position.copy(unicorn.position);
                attackSpell.position.y += 2;

                const direction = new THREE.Vector3()
                  .subVectors(boss.position, unicorn.position)
                  .normalize();

                attackSpell.userData = {
                  velocity: direction.multiplyScalar(2),
                  lifetime: 0,
                  fromAlly: true
                };

                scene.add(attackSpell);
                spells.push(attackSpell);

                // Check if boss is defeated
                if (boss.userData.health <= 0) {
                  boss.userData.defeated = true;
                  gameState.bossesDefeated++;

                  playDragonDefeatedSound();

                  showMessage('⚔️ Stronghold Boss Defeated by Allies! ⚔️');

                  // Clear boss reference from unicorn if it has one
                  const unicornIdx = boss.userData.unicornIndex;
                  if (unicornIdx !== undefined && unicornsInDanger[unicornIdx]) {
                    unicornsInDanger[unicornIdx].userData.boss = null;
                  }

                  // Boss death animation
                  scene.remove(boss);
                  const bossIndex = bosses.indexOf(boss);
                  if (bossIndex > -1) {
                    bosses.splice(bossIndex, 1);
                  }
                }
              }
            }
          }
        });
      }
    }
  });

  // Animate bases
  bases.forEach(base => {
    if (!base.userData.destroyed) {
      // Rotate base
      base.rotation.y += base.userData.rotationSpeed;
      base.userData.dome.rotation.y += delta * 0.5;
      base.userData.grid.rotation.y -= delta * 0.3;

      // Pulsing effect on dome
      const pulseScale = 1 + Math.sin(time * 2) * 0.05;
      base.userData.dome.scale.set(pulseScale, pulseScale, pulseScale);

      // Pulsing core
      if (base.userData.core) {
        const coreScale = 1 + Math.sin(time * 3) * 0.3;
        base.userData.core.scale.set(coreScale, coreScale, coreScale);
      }
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
      unicorn.position.y = unicornTerrainHeight + 3.5 + Math.sin(unicorn.userData.pulseTime * 0.5) * 0.15;
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
        unicorn.position.y = followTerrainHeight + 3.5 + walkBounce;

        // Body movement during walk
        unicorn.rotation.x = Math.sin(walkCycle * 2) * 0.08;
        unicorn.rotation.z = Math.sin(walkCycle) * 0.04;

        // Animate legs with walking gait and knee bending
        if (unicorn.userData.legs) {
          unicorn.userData.legs.forEach((leg, index) => {
            const legCycle = walkCycle * 2 + leg.phase;
            const stride = Math.sin(legCycle);

            // Walking has lower lift than galloping
            const lift = Math.max(0, stride) * 0.3; // Vertical lift
            const reach = stride * 0.2; // Hip rotation angle

            // Position adjustment for lift
            leg.group.position.y = -lift;

            // Hip rotation (upper leg swings forward and back)
            leg.upperLeg.rotation.x = reach;

            // Knee bending - less pronounced during walking
            const kneeBend = Math.max(0, stride) * 0.4;
            leg.lowerLeg.rotation.x = -kneeBend; // Negative for backward bend

            // Keep legs aligned
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
        unicorn.position.y = followIdleHeight + 3.5 + Math.sin(idleTime * 0.5) * 0.1;

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
            leg.upperLeg.rotation.x *= 0.9; // Reset hip rotation
            leg.lowerLeg.rotation.x *= 0.9; // Reset knee bend
            leg.group.rotation.y = 0;
            leg.group.rotation.z = 0;
          });
        }
      }
    }
  });

  // Animate dragon eggs
  dragonEggs.forEach((egg, index) => {
    if (!egg.userData.collected) {
      // Bob up and down
      egg.userData.bobTime += delta * 2;
      const originalY = getTerrainHeight(egg.position.x, egg.position.z) + 1;
      egg.position.y = originalY + Math.sin(egg.userData.bobTime) * 0.3;

      // Rotate
      egg.rotation.y += delta * 0.5;

      // Pulse ring
      const pulseScale = 1 + Math.sin(egg.userData.bobTime * 2) * 0.2;
      egg.userData.ring.scale.set(pulseScale, pulseScale, 1);

      // Check if player is near to collect
      const distToPlayer = egg.position.distanceTo(player.position);
      if (distToPlayer < 3) {
        egg.userData.collected = true;
        collectedEggs++;
        localStorage.setItem('dragonEggsCollected', collectedEggs.toString());

        playEggCollectSound();

        // Collection effect
        for (let i = 0; i < 20; i++) {
          setTimeout(() => {
            const sparkle = new THREE.Mesh(
              new THREE.SphereGeometry(0.2, 8, 8),
              new THREE.MeshBasicMaterial({
                color: egg.userData.type === 'fire' ? 0xff6600 :
                       egg.userData.type === 'ice' ? 0x00ffff :
                       egg.userData.type === 'shadow' ? 0x9900ff : 0x00ff44
              })
            );
            sparkle.position.copy(egg.position);
            sparkle.position.y += Math.random() * 2;
            sparkle.position.x += (Math.random() - 0.5) * 2;
            sparkle.position.z += (Math.random() - 0.5) * 2;
            scene.add(sparkle);

            setTimeout(() => scene.remove(sparkle), 500);
          }, i * 30);
        }

        showMessage(`🥚 Dragon Egg Collected! (${collectedEggs} total) - ${egg.userData.type} type`);
        scene.remove(egg);
        dragonEggs.splice(index, 1);
      }
    }
  });

  // Regenerate magic
  if (gameState.magicPower < 100) {
    gameState.magicPower = Math.min(100, gameState.magicPower + delta * 8);  // Reduced from 15 to 8
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
}

// Initialize game when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initGame);
} else {
  initGame();
}
