// Warrior Cats — load pre-made GLB cat model with skeleton + animations
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { clone as cloneSkinned } from 'three/addons/utils/SkeletonUtils.js';

const BODY_SIZES = { small: 0.6, medium: 1.0, large: 1.15, stocky: 1.1 };

let cachedGLTF = null;
let loadPromise = null;

export function preloadCatModel() {
  if (loadPromise) return loadPromise;
  loadPromise = new Promise((resolve, reject) => {
    const loader = new GLTFLoader();
    loader.load(
      'models/cat1.glb',
      (gltf) => { cachedGLTF = gltf; resolve(gltf); },
      undefined,
      reject
    );
  });
  return loadPromise;
}

function hexOf(color) {
  return '#' + new THREE.Color(color).getHexString();
}

// --- Seeded random ---
function makeRand(seed) {
  let s = seed | 0;
  return function() {
    s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = t + Math.imul(t ^ (t >>> 7), 61 | t) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Build a ShaderMaterial that generates patterns from 3D object-space position
// so the pattern wraps naturally around the cat regardless of UV layout.
function buildPatternMaterial(baseColor, secondaryColor, pattern, roughness) {
  const b = new THREE.Color(baseColor);
  const s = new THREE.Color(secondaryColor || '#ffffff');
  // dark stripe colour = darken base
  const d = new THREE.Color(b.r * 0.32, b.g * 0.32, b.b * 0.32);

  // Voronoi cell seeds for calico/tortie (packed as flat array)
  const r2 = makeRand(pattern === 'calico' ? 123 : pattern === 'dilute_calico' ? 321 : 456);
  const seeds = Array.from({length: 20}, () => [r2() * 2 - 1, r2() * 2 - 1, r2() * 2 - 1]);
  const seedsFlat = seeds.flat();

  // Choose which GLSL snippet to use for the pattern
  const patternGLSL = {
    solid: `vec3 col = uBase;`,

    tabby: `
      float wave = sin(vPos.z * 12.0) * 0.18 + sin(vPos.z * 5.0) * 0.08;
      float t = (sin((vPos.y + wave) * 22.0) + 1.0) * 0.5;
      t = pow(t, 1.8);
      vec3 col = mix(uDark, uBase, t);`,

    mackerel: `
      float wave = sin(vPos.y * 8.0) * 0.12;
      float t = (sin((vPos.x + wave) * 40.0) + 1.0) * 0.5;
      t = pow(t, 2.0);
      vec3 col = mix(uDark, uBase, t);`,

    classic: `
      float swirl = sin(vPos.x * 9.0 + sin(vPos.z * 7.0) * 1.5)
                  + cos(vPos.z * 9.0 + sin(vPos.x * 7.0) * 1.5);
      float t = smoothstep(-0.3, 0.3, swirl);
      vec3 col = mix(uDark, uBase, t);`,

    ticked: `
      float n = sin(vPos.x * 38.0) * cos(vPos.y * 45.0) + cos(vPos.x * 28.0 + vPos.z * 33.0);
      float t = smoothstep(0.4, 0.7, n);
      vec3 col = mix(uBase, uDark, t * 0.4);`,

    spotted: `
      float n = sin(vPos.x * 14.0 + 0.5) * sin(vPos.z * 11.0) + sin(vPos.y * 13.0 + 1.0) * sin(vPos.x * 9.0);
      float t = smoothstep(0.3, 0.6, n);
      vec3 col = mix(uBase, uDark, t);`,

    rosette: `
      float n = sin(vPos.x * 14.0) * sin(vPos.z * 11.0) + sin(vPos.y * 13.0) * sin(vPos.x * 9.0);
      float ring = abs(n - 0.45);
      float t = smoothstep(0.1, 0.0, ring);
      vec3 col = mix(uBase, uDark, t);`,

    tortoiseshell: `
      // 2-color Voronoi (orange vs black)
      vec3 c0 = uBase; vec3 c1 = vec3(0.07, 0.02, 0.0);
      float best = 99.0; int bi = 0;
      for (int i = 0; i < 20; i++) {
        vec3 sp = vec3(uSeeds[i*3], uSeeds[i*3+1], uSeeds[i*3+2]);
        float d = length(vPos - sp * 0.6);
        if (d < best) { best = d; bi = i; }
      }
      vec3 col = (mod(float(bi), 2.0) < 1.0) ? c0 : c1;`,

    calico: `
      // 3-color Voronoi: white / orange / black
      vec3 c0 = vec3(0.95, 0.93, 0.90);
      vec3 c1 = uBase;
      vec3 c2 = vec3(0.07, 0.02, 0.0);
      float best = 99.0; int bi = 0;
      for (int i = 0; i < 20; i++) {
        vec3 sp = vec3(uSeeds[i*3], uSeeds[i*3+1], uSeeds[i*3+2]);
        float d = length(vPos - sp * 0.6);
        if (d < best) { best = d; bi = i; }
      }
      int m = int(mod(float(bi * 7 + 3), 5.0));
      vec3 col = m < 2 ? c0 : m < 4 ? c1 : c2;`,

    dilute_calico: `
      vec3 c0 = vec3(0.95, 0.93, 0.90);
      vec3 c1 = vec3(0.90, 0.76, 0.58);
      vec3 c2 = vec3(0.52, 0.52, 0.55);
      float best = 99.0; int bi = 0;
      for (int i = 0; i < 20; i++) {
        vec3 sp = vec3(uSeeds[i*3], uSeeds[i*3+1], uSeeds[i*3+2]);
        float d = length(vPos - sp * 0.6);
        if (d < best) { best = d; bi = i; }
      }
      int m = int(mod(float(bi * 7 + 3), 5.0));
      vec3 col = m < 2 ? c0 : m < 4 ? c1 : c2;`,

    tuxedo: `
      float belly = smoothstep(0.04, 0.0, abs(vPos.x) - 0.02) * smoothstep(-0.05, 0.05, -vPos.z + 0.05);
      float paw = smoothstep(0.015, 0.0, length(vPos.xz) - 0.09);
      vec3 col = mix(vec3(0.08, 0.08, 0.08), vec3(0.95, 0.95, 0.95), clamp(belly + paw, 0.0, 1.0));`,

    bicolor: `
      float t = smoothstep(-0.02, 0.02, vPos.x);
      vec3 col = mix(uBase, uSec, t);`,

    van: `
      float topHead = smoothstep(0.07, 0.0, length(vPos - vec3(0.0, 0.14, -0.05)) - 0.04);
      float tail = smoothstep(0.05, 0.0, length(vPos - vec3(0.0, 0.05, 0.18)) - 0.05);
      vec3 col = mix(vec3(0.95, 0.93, 0.90), uBase, clamp(topHead + tail, 0.0, 1.0));`,

    pointed: `
      float d = length(vPos);
      float t = smoothstep(0.05, 0.18, d);
      vec3 col = mix(uDark, vec3(0.94, 0.88, 0.76), t);`,

    smoke: `
      float t = smoothstep(0.0, 0.22, vPos.y + 0.05);
      vec3 col = mix(vec3(0.08, 0.08, 0.10), mix(uBase, vec3(0.85, 0.90, 0.94), t), 1.0);`,

    silver: `
      float wave = sin(vPos.z * 12.0) * 0.18 + sin(vPos.z * 5.0) * 0.08;
      float t = pow((sin((vPos.y + wave) * 22.0) + 1.0) * 0.5, 1.8);
      vec3 col = mix(vec3(0.27, 0.30, 0.34), vec3(0.78, 0.80, 0.84), t);`,

    golden: `
      float wave = sin(vPos.z * 12.0) * 0.18 + sin(vPos.z * 5.0) * 0.08;
      float t = pow((sin((vPos.y + wave) * 22.0) + 1.0) * 0.5, 1.8);
      vec3 col = mix(vec3(0.35, 0.22, 0.0), vec3(0.82, 0.60, 0.05), t);`,
  };

  const colorCode = patternGLSL[pattern] || patternGLSL.solid;

  // Use MeshStandardMaterial + onBeforeCompile so Three.js handles
  // skinning, lighting and shadows — we just inject the pattern color.
  const mat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness,
    metalness: 0.0,
  });

  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uBase  = { value: b };
    shader.uniforms.uSec   = { value: s };
    shader.uniforms.uDark  = { value: d };
    shader.uniforms.uSeeds = { value: seedsFlat };

    // Pass object-space position to fragment shader
    shader.vertexShader = shader.vertexShader.replace(
      '#include <common>',
      '#include <common>\nvarying vec3 vObjPos;'
    );
    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      '#include <begin_vertex>\nvObjPos = position;'
    );

    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <common>',
      `#include <common>
      uniform vec3 uBase, uSec, uDark;
      uniform float uSeeds[60];
      varying vec3 vObjPos;`
    );

    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <color_fragment>',
      `#include <color_fragment>
      {
        vec3 vPos = vObjPos;
        ${colorCode}
        diffuseColor.rgb = col;
      }`
    );
  };

  return mat;
}

export function createCatModel(options = {}) {
  const {
    baseColor = '#d4751c',
    secondaryColor = '#ffffff',
    pattern = 'tabby',
    eyeColor = '#2d8a4e',
    bodySize = 'medium',
    furLength = 'medium',
  } = options;

  if (!cachedGLTF) {
    const g = new THREE.Group();
    g.userData = { legs: [], tail: new THREE.Group(), tailParts: [], head: new THREE.Group(), body: new THREE.Group() };
    return g;
  }

  const group = new THREE.Group();
  const model = cloneSkinned(cachedGLTF.scene);

  const sc = BODY_SIZES[bodySize] || 1.0;
  const finalScale = sc * (1.0 / 54);
  model.scale.setScalar(finalScale);
  model.position.y = 0.18;

  // Build 3D shader material — patterns use object-space position so no UV seams
  const rough = furLength === 'long' ? 0.88 : 0.65;
  const patternMat = buildPatternMaterial(baseColor, secondaryColor, pattern, rough);

  model.traverse((child) => {
    if (child.isMesh || child.isSkinnedMesh) {
      child.material = patternMat;
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });

  group.add(model);

  // Add eyes attached to the head bone
  // head_05 bone local space: Y+ goes toward skull top, Z+ points BACKWARD (toward tail).
  // So face-forward direction = -Z. Eyes sit slightly up (+Y) and forward (-Z) from bone.
  const eyeC = new THREE.Color(eyeColor);
  const eyeMat = new THREE.MeshStandardMaterial({ color: eyeC, roughness: 0.15, metalness: 0.0, emissive: eyeC, emissiveIntensity: 0.15 });
  const pupilMat = new THREE.MeshStandardMaterial({ color: 0x050505, roughness: 0.1 });
  // Sizes in head-bone local units. Bone is ~0.053 units long; eyes ~30% of that.
  const eyeGeo = new THREE.SphereGeometry(0.014, 8, 8);
  const pupilGeo = new THREE.SphereGeometry(0.008, 8, 8);

  let headBone = null;
  model.traverse((child) => {
    if (child.name === 'head_05') headBone = child;
  });

  if (headBone) {
    // ±X = left/right, +Y = up toward skull top, -Z = forward toward nose
    [[-0.022, 0.028, -0.03], [0.022, 0.028, -0.03]].forEach(([ox, oy, oz]) => {
      const eye = new THREE.Mesh(eyeGeo, eyeMat.clone());
      eye.position.set(ox, oy, oz);
      const pupil = new THREE.Mesh(pupilGeo, pupilMat);
      pupil.position.set(0, 0, -0.008); // pupil on front of eye sphere
      eye.add(pupil);
      headBone.add(eye);
    });
  }

  group.userData.clips = cachedGLTF.animations;
  group.userData.model = model;

  let head = null, body = null;
  model.traverse((child) => {
    const name = (child.name || '').toLowerCase();
    if (name.includes('head') && !head) head = child;
    if ((name.includes('spine') || name.includes('body')) && !body) body = child;
  });

  group.userData.head = head || model;
  group.userData.body = body || model;
  group.userData.legs = [];
  group.userData.lowerLegs = [];
  group.userData.paws = [];
  group.userData.tail = new THREE.Group();
  group.userData.tailParts = [];

  return group;
}
