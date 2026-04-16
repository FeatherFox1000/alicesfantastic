// Warrior Cats - The Forest — Main game entry point
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { FXAAShader } from 'three/addons/shaders/FXAAShader.js';
import { createCatModel, preloadCatModel } from './cat-model.js';
import { CatAnimator } from './cat-animations.js';
import { Sky } from './sky.js';
import { World } from './world.js';
import { Grass } from './grass.js';
import { Weather } from './weather.js';
import { PlayerController } from './player-controller.js';
import { NPCManager } from './npc.js';
import { saveCharacter, loadCharacter, hasSave } from './save.js';

// === STATE ===
let state = 'loading'; // loading, menu, creator, playing
let scene, camera, renderer, clock, composer;
let sky, world, grass, weather, player, npcManager;
let playerCat = null;
let characterData = {};
let previewCat = null;
let previewScene, previewCamera, previewRenderer;

// === CLAN DESCRIPTIONS ===
const CLAN_INFO = {
  ThunderClan: 'ThunderClan — Brave and loyal cats of the forest. Known for their courage in battle and fierce devotion to the warrior code.',
  RiverClan: 'RiverClan — Sleek, well-fed cats who love water. Skilled swimmers and fishers who live by the river.',
  WindClan: 'WindClan — Swift and loyal cats of the open moor. The fastest cats in the forest, proud and independent.',
  ShadowClan: 'ShadowClan — Fierce cats of the shadows. Cunning and ambitious, they thrive in the dark pine forests.',
  SkyClan: 'SkyClan — Cats who can leap great heights. Once driven from the forest, they are resilient survivors.',
  loner: 'Loner — A cat who lives alone, outside clan territory. Free but without the protection of clanmates.',
  kittypet: 'Kittypet — A house cat, soft and well-fed. Some leave the comfort of Twoleg homes to join the clans.',
  rogue: 'Rogue — A cat with no clan, often distrusted. Some rogues are dangerous, others just misunderstood.'
};

// === CLAN SPAWN POINTS ===
const CLAN_SPAWNS = {
  ThunderClan: { x: 60, z: -60 },
  RiverClan: { x: -100, z: 30 },
  WindClan: { x: 80, z: 60 },
  ShadowClan: { x: -40, z: -90 },
  SkyClan: { x: 0, z: 0 },
  loner: { x: 0, z: 150 },
  kittypet: { x: 30, z: 160 },
  rogue: { x: -100, z: 160 }
};

// === LOADING ===
function updateLoading(pct, text) {
  document.getElementById('loading-bar').style.width = pct + '%';
  document.getElementById('loading-text').textContent = text;
}

// === INIT ===
async function init() {
  updateLoading(10, 'Creating scene...');

  // Main scene
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 800);
  camera.position.set(0, 10, 20);

  renderer = new THREE.WebGLRenderer({
    canvas: document.getElementById('game-canvas'),
    antialias: true
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;

  clock = new THREE.Clock();

  // Post-processing — bloom + FXAA for polished look
  composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));

  const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    0.3,   // bloom strength (subtle)
    0.4,   // radius
    0.85   // threshold
  );
  composer.addPass(bloomPass);

  const fxaaPass = new ShaderPass(FXAAShader);
  fxaaPass.uniforms['resolution'].value.set(1 / window.innerWidth, 1 / window.innerHeight);
  composer.addPass(fxaaPass);

  // Handle resize
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);
    fxaaPass.uniforms['resolution'].value.set(1 / window.innerWidth, 1 / window.innerHeight);
  });

  updateLoading(15, 'Loading cat model...');
  await preloadCatModel();

  updateLoading(25, 'Creating sky...');
  sky = new Sky(scene);

  updateLoading(35, 'Building world...');
  world = new World(scene);

  updateLoading(55, 'Growing grass...');
  grass = new Grass(scene, world);

  updateLoading(70, 'Setting weather...');
  weather = new Weather(scene);

  updateLoading(80, 'Spawning clan cats...');
  npcManager = new NPCManager(scene, world);
  npcManager.spawnClanCats('ThunderClan', 60, -60, 6);
  npcManager.spawnClanCats('RiverClan', -100, 30, 5);
  npcManager.spawnClanCats('WindClan', 80, 60, 5);
  npcManager.spawnClanCats('ShadowClan', -40, -90, 6);

  updateLoading(90, 'Setting up character creator...');
  setupCreatorPreview();
  setupCreatorUI();

  updateLoading(100, 'Ready!');

  // Transition to menu
  setTimeout(() => {
    document.getElementById('loading-screen').style.display = 'none';
    showMenu();
  }, 500);

  // Start game loop
  animate();
}

// === MENU ===
function showMenu() {
  state = 'menu';
  document.getElementById('main-menu').style.display = 'flex';
  document.getElementById('character-creator').style.display = 'none';
  document.getElementById('game-hud').style.display = 'none';

  // Show continue button if save exists
  document.getElementById('continue-btn').style.display = hasSave() ? 'block' : 'none';

  // Cinematic camera for menu
  camera.position.set(30, 8, 50);
  camera.lookAt(30, 2, 30);
}

document.getElementById('new-game-btn').addEventListener('click', () => {
  document.getElementById('main-menu').style.display = 'none';
  showCreator();
});

document.getElementById('continue-btn').addEventListener('click', () => {
  const saved = loadCharacter();
  if (saved) {
    characterData = saved;
    document.getElementById('main-menu').style.display = 'none';
    startPlaying();
  }
});

// === CHARACTER CREATOR ===
function setupCreatorPreview() {
  // Separate scene/camera for the cat preview
  previewScene = new THREE.Scene();
  previewScene.background = new THREE.Color('#12131f');
  previewCamera = new THREE.PerspectiveCamera(45, 1, 0.1, 50);
  previewCamera.position.set(0, 1.2, 4.0);
  previewCamera.lookAt(0, 0.75, 0);

  // Lights for preview
  const prevLight = new THREE.DirectionalLight('#ffffff', 1.5);
  prevLight.position.set(3, 5, 3);
  previewScene.add(prevLight);
  const prevLight2 = new THREE.DirectionalLight('#8090c0', 0.4);
  prevLight2.position.set(-3, 2, -2);
  previewScene.add(prevLight2);
  previewScene.add(new THREE.AmbientLight('#606080', 0.6));

  // Floor
  const floorGeo = new THREE.CircleGeometry(2, 32);
  floorGeo.rotateX(-Math.PI / 2);
  const floorMat = new THREE.MeshStandardMaterial({ color: '#1e2038' });
  previewScene.add(new THREE.Mesh(floorGeo, floorMat));


  previewRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  previewRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
}

function updatePreviewCat() {
  if (previewCat) previewScene.remove(previewCat);

  previewCat = createCatModel(getCreatorOptions());
  previewScene.add(previewCat);

  // Set up idle animation on preview cat
  if (previewCat.userData.clips && previewCat.userData.clips.length > 0) {
    previewCat.userData.previewAnimator = new CatAnimator(previewCat);
  }
}

function getCreatorOptions() {
  return {
    pattern: document.getElementById('pelt-pattern').value,
    baseColor: document.getElementById('base-color').value,
    secondaryColor: document.getElementById('secondary-color').value,
    eyeColor: document.getElementById('eye-color').value,
    noseColor: document.getElementById('nose-color').value,
    earSize: parseFloat(document.getElementById('ear-size').value),
    bodySize: document.getElementById('body-size').value,
    furLength: document.getElementById('fur-length').value,
    tailLength: parseFloat(document.getElementById('tail-length').value),
    legLength: parseFloat(document.getElementById('leg-length').value),
    markings: {
      whitechest: document.getElementById('marking-whitechest').checked,
      whitepaws: document.getElementById('marking-whitepaws').checked,
      tailtip: document.getElementById('marking-tailtip').checked,
      eartufts: document.getElementById('marking-eartufts').checked,
      underbelly: document.getElementById('marking-underbelly').checked
    }
  };
}

function setupCreatorUI() {
  // === COLOR PALETTE GENERATION ===
  const PELT_COLORS = [
    '#ffffff','#f5f5dc','#f5e6d3','#ffe4b5','#deb887','#d2b48c','#c4a882','#b8a070',
    '#ffd700','#daa520','#d4a017','#c49a1a','#b8860b','#8b6914','#9b7824','#a08030',
    '#d4751c','#c44e28','#b85c38','#a0522d','#8b4513','#704020','#5c3317','#3c1a0a',
    '#a0a0a0','#909090','#808080','#6a6a6a','#555555','#4a4a4a','#333333','#2c2c2c',
    '#1a1a1a','#0a0a0a','#e8c8a0','#d4b896','#c8a878','#b09070','#987860','#806050',
    '#e8d0c0','#d8c0b0','#c8b0a0','#b8a090','#a89080','#988070','#887060','#786050',
  ];

  const EYE_COLORS = [
    '#2d8a4e','#3ca05e','#50b870','#228b22','#006400',
    '#d4a017','#daa520','#ffd700','#f0c040','#e6b000',
    '#4169e1','#4682b4','#5090d0','#40e0d0','#6ec8e8',
    '#8b7355','#9e8868','#a08060',
    '#9370db','#7b68ee','#b060d0',
  ];

  function buildColorGrid(containerId, colors, inputId) {
    const grid = document.getElementById(containerId);
    const input = document.getElementById(inputId);
    colors.forEach(c => {
      const swatch = document.createElement('button');
      swatch.className = 'cc-color-swatch';
      swatch.style.background = c;
      swatch.dataset.color = c;
      if (c === '#ffffff' || c === '#f5f5dc') swatch.style.border = '2px solid #3a3d5c';
      swatch.addEventListener('click', () => {
        grid.querySelectorAll('.cc-color-swatch').forEach(s => s.classList.remove('active'));
        swatch.classList.add('active');
        input.value = c;
        input.dispatchEvent(new Event('input'));
      });
      grid.appendChild(swatch);
    });
  }

  buildColorGrid('primary-grid', PELT_COLORS, 'base-color');
  buildColorGrid('secondary-grid', PELT_COLORS, 'secondary-color');
  buildColorGrid('eye-grid', EYE_COLORS, 'eye-color');

  // === COLOR TABS (Simple | Paintbrush | Advanced) ===
  document.querySelectorAll('.cc-color-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.cc-color-tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.cc-color-content').forEach(c => c.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById('ctab-' + tab.dataset.ctab).classList.add('active');
    });
  });

  // === PATTERN BUTTONS ===
  document.querySelectorAll('.cc-pattern-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.cc-pattern-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById('pelt-pattern').value = btn.dataset.pattern;
      updatePreviewCat();
    });
  });

  // === MARKING TOGGLE BUTTONS ===
  document.querySelectorAll('.cc-marking-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      btn.classList.toggle('active');
      const checkbox = document.getElementById('marking-' + btn.dataset.marking);
      if (checkbox) checkbox.checked = btn.classList.contains('active');
      updatePreviewCat();
    });
  });

  // === FUR BUTTONS ===
  document.querySelectorAll('.cc-fur-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.cc-fur-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById('fur-length').value = btn.dataset.fur;
      updatePreviewCat();
    });
  });

  // === SIZE BUTTONS ===
  document.querySelectorAll('.cc-size-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.cc-size-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById('body-size').value = btn.dataset.size;
      updatePreviewCat();
    });
  });

  // === ACCESSORY BUTTONS ===
  document.querySelectorAll('.cc-acc-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      btn.classList.toggle('active');
      updatePreviewCat();
    });
  });

  // Accessory search filter
  document.getElementById('accessory-search').addEventListener('input', e => {
    const q = e.target.value.toLowerCase();
    document.querySelectorAll('.cc-acc-btn').forEach(btn => {
      btn.style.display = btn.textContent.toLowerCase().includes(q) ? '' : 'none';
    });
  });

  // === ALL INPUTS TRIGGER PREVIEW UPDATE ===
  const inputs = ['pelt-pattern', 'base-color', 'secondary-color', 'eye-color', 'nose-color',
    'ear-size', 'body-size', 'fur-length', 'tail-length', 'leg-length',
    'marking-whitechest', 'marking-whitepaws', 'marking-tailtip', 'marking-eartufts', 'marking-underbelly'];

  inputs.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('input', updatePreviewCat);
      el.addEventListener('change', updatePreviewCat);
    }
  });

  // === NAME PREVIEW ===
  const updateName = () => {
    const prefix = document.getElementById('name-prefix').value;
    const role = document.getElementById('cat-role').value;
    let suffix;
    if (role === 'kit') suffix = 'kit';
    else if (role === 'apprentice' || role === 'medicine-apprentice') suffix = 'paw';
    else if (role === 'leader') suffix = 'star';
    else suffix = document.getElementById('name-suffix').value;

    document.getElementById('name-preview').textContent = prefix + suffix;
  };

  document.getElementById('name-prefix').addEventListener('change', updateName);
  document.getElementById('name-suffix').addEventListener('change', updateName);
  document.getElementById('cat-role').addEventListener('change', () => {
    updateName();
    // Auto-adjust body size + highlight correct button
    const role = document.getElementById('cat-role').value;
    let size = 'medium';
    if (role === 'kit') size = 'small';
    else if (role === 'apprentice' || role === 'medicine-apprentice') size = 'small';
    document.getElementById('body-size').value = size;
    document.querySelectorAll('.cc-size-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.size === size);
    });
    updatePreviewCat();
  });

  // Clan description
  document.getElementById('cat-clan').addEventListener('change', () => {
    const clan = document.getElementById('cat-clan').value;
    document.getElementById('clan-description').textContent = CLAN_INFO[clan] || '';
  });

  // === RESET CAT ===
  document.getElementById('cc-reset-btn').addEventListener('click', () => {
    document.getElementById('base-color').value = '#d4751c';
    document.getElementById('secondary-color').value = '#2c1a0a';
    document.getElementById('eye-color').value = '#2d8a4e';
    document.getElementById('nose-color').value = '#e8a0a0';
    document.getElementById('pelt-pattern').value = 'tabby';
    document.getElementById('body-size').value = 'medium';
    document.getElementById('fur-length').value = 'medium';
    document.getElementById('ear-size').value = '1.0';
    document.getElementById('tail-length').value = '1.0';
    document.getElementById('leg-length').value = '1.0';
    ['whitechest','whitepaws','tailtip','eartufts','underbelly'].forEach(m => {
      document.getElementById('marking-' + m).checked = false;
    });
    // Reset all UI buttons
    document.querySelectorAll('.cc-pattern-btn').forEach(b => b.classList.toggle('active', b.dataset.pattern === 'tabby'));
    document.querySelectorAll('.cc-marking-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.cc-fur-btn').forEach(b => b.classList.toggle('active', b.dataset.fur === 'medium'));
    document.querySelectorAll('.cc-size-btn').forEach(b => b.classList.toggle('active', b.dataset.size === 'medium'));
    document.querySelectorAll('.cc-acc-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.cc-color-swatch').forEach(s => s.classList.remove('active'));
    updatePreviewCat();
  });

  // Back button
  document.getElementById('creator-back-btn').addEventListener('click', () => {
    document.getElementById('character-creator').style.display = 'none';
    showMenu();
  });

  // Done button — Enter the Forest
  document.getElementById('creator-done-btn').addEventListener('click', () => {
    const prefix = document.getElementById('name-prefix').value;
    const role = document.getElementById('cat-role').value;
    let suffix;
    if (role === 'kit') suffix = 'kit';
    else if (role === 'apprentice' || role === 'medicine-apprentice') suffix = 'paw';
    else if (role === 'leader') suffix = 'star';
    else suffix = document.getElementById('name-suffix').value;

    characterData = {
      name: prefix + suffix,
      role,
      clan: document.getElementById('cat-clan').value,
      ...getCreatorOptions()
    };

    saveCharacter(characterData);
    document.getElementById('character-creator').style.display = 'none';
    startPlaying();
  });
}

let previewDragging = false;
let previewRotY = 0;
let previewAttached = false;

function showCreator() {
  state = 'creator';
  document.getElementById('character-creator').style.display = 'flex';

  // Use double-rAF to ensure layout has settled before measuring
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      const container = document.getElementById('creator-preview');
      const w = container.clientWidth || window.innerWidth - 600;
      const h = container.clientHeight || window.innerHeight;
      previewRenderer.setSize(w, h);
      previewCamera.aspect = w / h;

      // Adjust FOV so cat fits both horizontally and vertically
      // Cat is ~1.6 units tall, ~2 units long. Target frame height ~2.4 units.
      const targetHeight = 2.4;
      const camDist = 4.0;
      let vfov = 2 * Math.atan(targetHeight / 2 / camDist) * 180 / Math.PI;
      // If portrait aspect, widen vfov so horizontal still fits
      if (previewCamera.aspect < 1) {
        vfov = vfov / previewCamera.aspect;
      }
      previewCamera.fov = vfov;
      previewCamera.updateProjectionMatrix();

      if (!previewAttached) {
        container.appendChild(previewRenderer.domElement);
        previewAttached = true;

        // Drag to rotate
        previewRenderer.domElement.addEventListener('mousedown', () => { previewDragging = true; });
        window.addEventListener('mouseup', () => { previewDragging = false; });
        previewRenderer.domElement.addEventListener('mousemove', e => {
          if (previewDragging) previewRotY += e.movementX * 0.01;
        });
      }

      updatePreviewCat();
    });
  });
}

// === PLAYING ===
function startPlaying() {
  state = 'playing';
  document.getElementById('game-hud').style.display = 'block';

  // Update HUD
  document.getElementById('hud-name').textContent = characterData.name;
  const roleLabels = {
    kit: 'Kit', apprentice: 'Apprentice', warrior: 'Warrior',
    'senior-warrior': 'Senior Warrior', queen: 'Queen', elder: 'Elder',
    'medicine-cat': 'Medicine Cat', 'medicine-apprentice': 'Medicine Cat Apprentice',
    deputy: 'Deputy', leader: 'Leader'
  };
  const clanLabel = characterData.clan === 'loner' ? 'Loner'
    : characterData.clan === 'kittypet' ? 'Kittypet'
    : characterData.clan === 'rogue' ? 'Rogue'
    : `of ${characterData.clan}`;
  document.getElementById('hud-info').textContent =
    `${roleLabels[characterData.role] || 'Warrior'} ${clanLabel}`;

  // Create player cat
  if (playerCat) scene.remove(playerCat);
  playerCat = createCatModel(characterData);

  // Spawn at clan location
  const spawn = CLAN_SPAWNS[characterData.clan] || { x: 0, z: 0 };
  const spawnH = world.getHeightAt(spawn.x, spawn.z);
  playerCat.position.set(spawn.x, spawnH, spawn.z);
  scene.add(playerCat);

  // Create player controller
  player = new PlayerController(playerCat, camera, world);

  // Show location
  showLocation(characterData.clan === 'loner' || characterData.clan === 'kittypet' || characterData.clan === 'rogue'
    ? 'The Forest' : characterData.clan + ' Camp');
}

function showLocation(name) {
  const el = document.getElementById('hud-location');
  el.textContent = name;
  el.classList.add('visible');
  setTimeout(() => el.classList.remove('visible'), 3000);
}

// Pause
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && state === 'playing') {
    if (document.pointerLockElement) {
      document.exitPointerLock();
    }
    document.getElementById('pause-menu').style.display = 'flex';
    state = 'paused';
  } else if (e.key === 'Escape' && state === 'paused') {
    document.getElementById('pause-menu').style.display = 'none';
    state = 'playing';
  }
});

document.getElementById('resume-btn').addEventListener('click', () => {
  document.getElementById('pause-menu').style.display = 'none';
  state = 'playing';
});

document.getElementById('save-quit-btn').addEventListener('click', () => {
  if (playerCat) {
    characterData.posX = playerCat.position.x;
    characterData.posY = playerCat.position.y;
    characterData.posZ = playerCat.position.z;
    saveCharacter(characterData);
  }
  document.getElementById('pause-menu').style.display = 'none';
  showMenu();
});

// === GAME LOOP ===
let menuCameraAngle = 0;

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05);

  if (state === 'menu') {
    // Cinematic camera orbit
    // Orbit around ThunderClan camp where cats are gathered
    menuCameraAngle += dt * 0.08;
    const camCX = 60, camCZ = -60;
    const camGroundY = world.getHeightAt(camCX, camCZ);
    camera.position.set(
      camCX + Math.cos(menuCameraAngle) * 18,
      camGroundY + 8 + Math.sin(menuCameraAngle * 0.5) * 2,
      camCZ + Math.sin(menuCameraAngle) * 18
    );
    camera.lookAt(camCX, camGroundY + 1.5, camCZ);

    sky.update(dt);
    weather.update(dt, camera.position);
    npcManager.update(dt);
    world.updateMoonstone(clock.elapsedTime, sky.isNight());
    grass.update(dt, camera.position, weather.getWindStrength());

    composer.render();
  }

  if (state === 'creator') {
    // Render preview — slow auto-rotate + drag override
    if (previewCat) {
      if (!previewDragging) previewRotY += dt * 0.3;
      previewCat.rotation.y = previewRotY;
      // Update animation mixer for idle anim
      if (previewCat.userData.previewAnimator) {
        previewCat.userData.previewAnimator.update(dt);
      }
    }
    previewRenderer.render(previewScene, previewCamera);

    // Also render main scene in background
    sky.update(dt * 0.3);
    composer.render();
  }

  if (state === 'playing') {
    // Update systems
    player.update(dt);
    sky.update(dt);
    weather.update(dt, playerCat.position);
    npcManager.update(dt);
    world.updateMoonstone(clock.elapsedTime, sky.isNight());
    grass.update(dt, playerCat.position, weather.getWindStrength());

    // Update HUD
    document.getElementById('hud-weather').textContent = weather.getLabel();
    document.getElementById('hud-time').textContent = sky.getTimeLabel();

    // Update sun light to follow player (shadow quality)
    sky.sunLight.target.position.copy(playerCat.position);
    sky.sunLight.target.updateMatrixWorld();

    composer.render();
  }

  if (state === 'paused') {
    // Still render but don't update
    composer.render();
  }
}

// === START ===
init().catch(err => {
  console.error('Failed to initialize:', err);
  updateLoading(0, 'Error: ' + err.message);
});
