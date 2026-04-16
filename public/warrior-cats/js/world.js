// World generation — based on the Warrior Cats forest territory map
// Map is 600x600 units. North = +Z, South = -Z, East = +X, West = -X
// Layout (matching book maps):
//   NW: Highstones/Mothermouth/Moonstone
//   NE: WindClan moor (hilly, open grassland)
//   E:  Fourtrees (center gathering place)
//   SE: ThunderClan (dense oak forest, ravine camp)
//   SW: ShadowClan (dark pine forest, boggy)
//   W:  RiverClan (river, reeds, stepping stones)
//   Far N: Twolegplace, Barley's Farm
//   Far S: Beyond territories (mountains hint)
//   River runs roughly N-S through the western half
import * as THREE from 'three';

function noise(x, y) {
  const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
  return (n - Math.floor(n)) * 2 - 1;
}
function smoothNoise(x, y) {
  const ix = Math.floor(x), iy = Math.floor(y);
  const fx = x - ix, fy = y - iy;
  const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
  const a = noise(ix, iy), b = noise(ix + 1, iy), c = noise(ix, iy + 1), d = noise(ix + 1, iy + 1);
  return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
}
function fbm(x, y, octaves = 4) {
  let v = 0, a = 0.5, f = 1;
  for (let i = 0; i < octaves; i++) { v += a * smoothNoise(x * f, y * f); a *= 0.5; f *= 2; }
  return v;
}

// Territory zones (for coloring and height)
function getZone(x, z) {
  // River runs roughly along x = -40, curving
  const riverX = -40 + Math.sin(z * 0.015) * 25;

  if (z > 180) return 'twolegplace';
  if (z > 140 && x < -60) return 'barleysfarm';
  if (z > 140) return 'twolegplace';
  if (x < -120 && z > 40) return 'highstones';
  if (x > 40 && z > 0) return 'windclan';
  if (x > -30 && x < 30 && z > -20 && z < 30) return 'fourtrees';
  if (x > 20 && z < 0) return 'thunderclan';
  if (x < riverX - 10) return 'riverclan';
  if (x < 20 && z < -40) return 'shadowclan';
  return 'forest';
}

export class World {
  constructor(scene) {
    this.scene = scene;
    this.size = 600;
    this.segments = 200;
    this.heightData = [];
    this.colliders = [];

    this.createTerrain();
    this.createRiver();
    this.createTrees();
    this.createRocks();
    this.createCamps();
    this.createFourtrees();
    this.createMoonstone();
    this.createTwolegplace();
    this.createBarleysFarm();
    this.createThunderpath();
    this.createSnakerocks();
    this.createSunningrocks();
  }

  // ============================================================
  //  TERRAIN
  // ============================================================
  createTerrain() {
    const geo = new THREE.PlaneGeometry(this.size, this.size, this.segments, this.segments);
    geo.rotateX(-Math.PI / 2);
    const positions = geo.attributes.position.array;

    for (let i = 0; i < positions.length; i += 3) {
      const x = positions[i], z = positions[i + 2];
      let h = fbm(x * 0.008, z * 0.008, 5) * 8;
      h += fbm(x * 0.025, z * 0.025, 3) * 3;

      const zone = getZone(x, z);

      // WindClan — rolling hills, higher elevation
      if (zone === 'windclan') {
        h += 4 + fbm(x * 0.015, z * 0.015, 3) * 6;
        h += Math.sin(x * 0.04) * Math.cos(z * 0.03) * 3; // rolling hills
      }

      // Highstones — tall rocky hill
      if (zone === 'highstones') {
        const cx = x + 140, cz = z - 80;
        const dist = Math.sqrt(cx * cx + cz * cz);
        if (dist < 50) h += (1 - dist / 50) * 18;
      }

      // ThunderClan — moderate forest floor, slight ravine
      if (zone === 'thunderclan') {
        const ravineX = 60, ravineZ = -60;
        const rd = Math.abs(x - ravineX) + Math.abs(z - ravineZ) * 0.3;
        if (rd < 15) h -= (1 - rd / 15) * 4; // ravine dip
      }

      // ShadowClan — low, boggy
      if (zone === 'shadowclan') {
        h *= 0.5;
        h -= 1;
      }

      // RiverClan — low, flat near river
      if (zone === 'riverclan') {
        h *= 0.4;
      }

      // River valley depression
      const riverX = -40 + Math.sin(z * 0.015) * 25;
      const riverDist = Math.abs(x - riverX);
      if (riverDist < 20) {
        h -= (1 - riverDist / 20) * 5;
      }

      // Twolegplace — flat
      if (zone === 'twolegplace' || zone === 'barleysfarm') {
        h = h * 0.2 + 1;
      }

      // Fourtrees — bowl shape depression
      if (zone === 'fourtrees') {
        const fd = Math.sqrt(x * x + (z - 5) * (z - 5));
        if (fd < 25) h -= (1 - fd / 25) * 3;
      }

      // Camp areas — flatten
      const camps = [
        { x: 60, z: -60, r: 18 },   // ThunderClan
        { x: -100, z: 30, r: 15 },   // RiverClan
        { x: 80, z: 60, r: 20 },     // WindClan
        { x: -40, z: -90, r: 16 },   // ShadowClan
      ];
      for (const c of camps) {
        const d = Math.sqrt((x - c.x) ** 2 + (z - c.z) ** 2);
        if (d < c.r) h *= d / c.r;
      }

      positions[i + 1] = h;
    }
    geo.computeVertexNormals();

    // Terrain texture
    const canvas = document.createElement('canvas');
    canvas.width = 1024; canvas.height = 1024;
    const ctx = canvas.getContext('2d');
    const half = this.size / 2;

    for (let py = 0; py < 1024; py++) {
      for (let px = 0; px < 1024; px++) {
        const wx = (px / 1024 - 0.5) * this.size;
        const wz = (py / 1024 - 0.5) * this.size;
        const n = fbm(wx * 0.04, wz * 0.04, 3);
        const zone = getZone(wx, wz);

        let r = 55 + n * 25, g = 95 + n * 35, b = 38 + n * 15;

        if (zone === 'windclan') {
          // Yellow-green moorland
          r = 120 + n * 30; g = 130 + n * 25; b = 50 + n * 15;
        } else if (zone === 'shadowclan') {
          // Dark, muddy
          r = 35 + n * 15; g = 50 + n * 20; b = 30 + n * 10;
        } else if (zone === 'riverclan') {
          // Lush green, reedy
          r = 40 + n * 20; g = 85 + n * 30; b = 45 + n * 15;
        } else if (zone === 'thunderclan') {
          // Rich forest floor, brown-green
          r = 50 + n * 20; g = 75 + n * 30; b = 35 + n * 10;
        } else if (zone === 'highstones') {
          // Rocky gray
          r = 100 + n * 20; g = 100 + n * 18; b = 95 + n * 15;
        } else if (zone === 'twolegplace') {
          // Lighter, trimmed grass
          r = 80 + n * 20; g = 120 + n * 25; b = 60 + n * 10;
        } else if (zone === 'barleysfarm') {
          // Golden farmland
          r = 140 + n * 20; g = 130 + n * 15; b = 70 + n * 10;
        } else if (zone === 'fourtrees') {
          // Dark forest floor with leaves
          r = 45 + n * 15; g = 65 + n * 25; b = 30 + n * 10;
        }

        // River mud near water
        const riverX = -40 + Math.sin(wz * 0.015) * 25;
        const rd = Math.abs(wx - riverX);
        if (rd < 12) {
          const blend = rd / 12;
          r = r * blend + 50 * (1 - blend);
          g = g * blend + 65 * (1 - blend);
          b = b * blend + 55 * (1 - blend);
        }

        // Thunderpath (road)
        const tpZ = -20;
        const tpDist = Math.abs(wz - tpZ);
        if (tpDist < 4 && wx > -120 && wx < 120) {
          r = 55; g = 55; b = 55;
        }

        ctx.fillStyle = `rgb(${Math.round(Math.max(0, Math.min(255, r)))},${Math.round(Math.max(0, Math.min(255, g)))},${Math.round(Math.max(0, Math.min(255, b)))})`;
        ctx.fillRect(px, py, 1, 1);
      }
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    const mat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9, metalness: 0 });

    this.terrainMesh = new THREE.Mesh(geo, mat);
    this.terrainMesh.receiveShadow = true;
    this.scene.add(this.terrainMesh);
  }

  getHeightAt(x, z) {
    const geo = this.terrainMesh.geometry;
    const positions = geo.attributes.position.array;
    const s = this.segments;
    const half = this.size / 2;
    const gx = ((x + half) / this.size) * s;
    const gz = ((z + half) / this.size) * s;
    const ix = Math.floor(gx), iz = Math.floor(gz);
    const fx = gx - ix, fz = gz - iz;
    if (ix < 0 || ix >= s || iz < 0 || iz >= s) return 0;
    const getH = (gx, gz) => positions[(gz * (s + 1) + gx) * 3 + 1] || 0;
    const h00 = getH(ix, iz), h10 = getH(ix + 1, iz);
    const h01 = getH(ix, iz + 1), h11 = getH(ix + 1, iz + 1);
    return h00 + (h10 - h00) * fx + (h01 - h00) * fz + (h00 - h10 - h01 + h11) * fx * fz;
  }

  // ============================================================
  //  RIVER — runs N-S through western portion
  // ============================================================
  createRiver() {
    const waterMat = new THREE.MeshStandardMaterial({
      color: '#2a6a9a', transparent: true, opacity: 0.65,
      roughness: 0.1, metalness: 0.3, side: THREE.DoubleSide
    });

    // Main river
    for (let z = -250; z < 250; z += 6) {
      const x1 = -40 + Math.sin(z * 0.015) * 25;
      const x2 = -40 + Math.sin((z + 6) * 0.015) * 25;
      const mid = new THREE.Vector3((x1 + x2) / 2, -1.5, z + 3);
      const len = Math.sqrt((x2 - x1) ** 2 + 36);
      const wGeo = new THREE.PlaneGeometry(len, 10);
      wGeo.rotateX(-Math.PI / 2);
      const w = new THREE.Mesh(wGeo, waterMat);
      w.position.copy(mid);
      w.rotation.y = Math.atan2(x2 - x1, 6);
      this.scene.add(w);
    }

    // Gorge (narrow deep section near ShadowClan)
    for (let z = -120; z < -80; z += 4) {
      const x = -40 + Math.sin(z * 0.015) * 25;
      const g = new THREE.Mesh(
        new THREE.PlaneGeometry(5, 5),
        waterMat
      );
      g.geometry.rotateX(-Math.PI / 2);
      g.position.set(x, -3, z);
      this.scene.add(g);
    }

    // Stepping stones (between ThunderClan and RiverClan)
    const stoneZ = 0;
    const stoneX = -40 + Math.sin(stoneZ * 0.015) * 25;
    const stoneMat = new THREE.MeshStandardMaterial({ color: '#808080', roughness: 0.9 });
    for (let i = 0; i < 6; i++) {
      const sg = new THREE.Mesh(
        new THREE.CylinderGeometry(0.6, 0.8, 0.4, 8),
        stoneMat
      );
      sg.position.set(stoneX - 4 + i * 2, -0.8, stoneZ + (Math.random() - 0.5) * 2);
      sg.castShadow = true;
      this.scene.add(sg);
    }

    // Sunning rocks pool
    const poolGeo = new THREE.CircleGeometry(8, 32);
    poolGeo.rotateX(-Math.PI / 2);
    const pool = new THREE.Mesh(poolGeo, waterMat.clone());
    pool.position.set(-60, -1, 50);
    this.scene.add(pool);
  }

  // ============================================================
  //  TREES
  // ============================================================
  createOakTree(x, z) {
    const group = new THREE.Group();
    const h = this.getHeightAt(x, z);
    const trunkH = 3.5 + Math.random() * 2.5;
    const trunkGeo = new THREE.CylinderGeometry(0.2, 0.4, trunkH, 8);
    const trunkMat = new THREE.MeshStandardMaterial({ color: '#5a3a1a', roughness: 0.9 });
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.y = trunkH / 2;
    trunk.castShadow = true;
    group.add(trunk);

    const canopyMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#2a5a1a').lerp(new THREE.Color('#4a7a2a'), Math.random()),
      roughness: 0.9
    });
    for (let i = 0; i < 4; i++) {
      const s = 1.8 + Math.random() * 1.2;
      const leaf = new THREE.Mesh(new THREE.SphereGeometry(s, 8, 6), canopyMat);
      leaf.position.set((Math.random() - 0.5) * 2, trunkH + Math.random() * 1.5, (Math.random() - 0.5) * 2);
      leaf.castShadow = true;
      group.add(leaf);
    }
    group.position.set(x, h, z);
    this.scene.add(group);
    this.colliders.push({ x, z, radius: 0.5 });
  }

  createPineTree(x, z) {
    const group = new THREE.Group();
    const h = this.getHeightAt(x, z);
    const trunkH = 5 + Math.random() * 3;
    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.15, 0.35, trunkH, 6),
      new THREE.MeshStandardMaterial({ color: '#4a2a0a', roughness: 0.9 })
    );
    trunk.position.y = trunkH / 2;
    trunk.castShadow = true;
    group.add(trunk);

    const pineMat = new THREE.MeshStandardMaterial({ color: '#1a3a1a', roughness: 0.85 });
    for (let i = 0; i < 4; i++) {
      const s = 2.2 - i * 0.4;
      const cone = new THREE.Mesh(new THREE.ConeGeometry(s, 2.8, 8), pineMat);
      cone.position.y = trunkH * 0.4 + i * 1.8 + 1;
      cone.castShadow = true;
      group.add(cone);
    }
    group.position.set(x, h, z);
    this.scene.add(group);
    this.colliders.push({ x, z, radius: 0.4 });
  }

  createBush(x, z, color = '#3a6a2a') {
    const h = this.getHeightAt(x, z);
    const geo = new THREE.SphereGeometry(0.5 + Math.random() * 0.5, 8, 6);
    geo.scale(1.3, 0.8, 1.3);
    const bush = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color, roughness: 0.9 }));
    bush.position.set(x, h + 0.3, z);
    bush.castShadow = true;
    this.scene.add(bush);
  }

  createBoulder(x, z, size = 1) {
    const h = this.getHeightAt(x, z);
    const geo = new THREE.DodecahedronGeometry(size, 1);
    const pos = geo.attributes.position.array;
    for (let i = 0; i < pos.length; i += 3) {
      pos[i] += (Math.random() - 0.5) * size * 0.3;
      pos[i + 1] += (Math.random() - 0.5) * size * 0.2;
      pos[i + 2] += (Math.random() - 0.5) * size * 0.3;
    }
    geo.computeVertexNormals();
    const rock = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: '#6a6a6a', roughness: 0.95 }));
    rock.position.set(x, h + size * 0.3, z);
    rock.rotation.set(Math.random(), Math.random(), Math.random());
    rock.castShadow = true;
    this.scene.add(rock);
    this.colliders.push({ x, z, radius: size * 0.8 });
  }

  createTrees() {
    // ThunderClan — DENSE oak forest (50+ trees)
    for (let i = 0; i < 70; i++) {
      const x = 20 + Math.random() * 80;
      const z = -100 + Math.random() * 80;
      const dx = x - 60, dz = z + 60;
      if (Math.sqrt(dx * dx + dz * dz) > 15) this.createOakTree(x, z);
    }

    // ShadowClan — dark pines, dense
    for (let i = 0; i < 60; i++) {
      const x = -80 + Math.random() * 60;
      const z = -130 + Math.random() * 70;
      const dx = x + 40, dz = z + 90;
      if (Math.sqrt(dx * dx + dz * dz) > 14) this.createPineTree(x, z);
    }

    // RiverClan — sparse willowy trees
    for (let i = 0; i < 30; i++) {
      const x = -130 + Math.random() * 70;
      const z = 0 + Math.random() * 80;
      const dx = x + 100, dz = z - 30;
      if (Math.sqrt(dx * dx + dz * dz) > 12) this.createOakTree(x, z);
    }

    // WindClan — very few trees, open moor
    for (let i = 0; i < 8; i++) {
      const x = 50 + Math.random() * 60;
      const z = 10 + Math.random() * 70;
      this.createOakTree(x, z);
    }

    // Fourtrees — 4 great oaks
    const ftPositions = [[-8, 8], [8, 8], [-8, -5], [8, -5]];
    ftPositions.forEach(([fx, fz]) => {
      this.createGreatOak(fx, fz + 5);
    });

    // Forest fill — scattered trees between territories
    for (let i = 0; i < 50; i++) {
      const x = (Math.random() - 0.5) * 300;
      const z = (Math.random() - 0.5) * 300;
      const zone = getZone(x, z);
      if (zone === 'forest') {
        Math.random() > 0.5 ? this.createOakTree(x, z) : this.createPineTree(x, z);
      }
    }

    // Twolegplace trees (garden trees)
    for (let i = 0; i < 15; i++) {
      const x = -60 + Math.random() * 180;
      const z = 150 + Math.random() * 60;
      this.createOakTree(x, z);
    }
  }

  createGreatOak(x, z) {
    const group = new THREE.Group();
    const h = this.getHeightAt(x, z);
    const trunkH = 8;
    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.4, 0.7, trunkH, 10),
      new THREE.MeshStandardMaterial({ color: '#4a2a0a', roughness: 0.9 })
    );
    trunk.position.y = trunkH / 2;
    trunk.castShadow = true;
    group.add(trunk);

    const canopyMat = new THREE.MeshStandardMaterial({ color: '#1a4a0a', roughness: 0.85 });
    for (let i = 0; i < 7; i++) {
      const s = 3 + Math.random() * 1.5;
      const leaf = new THREE.Mesh(new THREE.SphereGeometry(s, 10, 8), canopyMat);
      leaf.position.set((Math.random() - 0.5) * 4, trunkH + Math.random() * 3, (Math.random() - 0.5) * 4);
      leaf.castShadow = true;
      group.add(leaf);
    }
    group.position.set(x, h, z);
    this.scene.add(group);
    this.colliders.push({ x, z, radius: 1 });
  }

  createRocks() {
    // General boulders
    for (let i = 0; i < 50; i++) {
      const x = (Math.random() - 0.5) * 400;
      const z = (Math.random() - 0.5) * 400;
      this.createBoulder(x, z, 0.5 + Math.random() * 1.2);
    }
    // Bushes
    for (let i = 0; i < 80; i++) {
      const x = (Math.random() - 0.5) * 400;
      const z = (Math.random() - 0.5) * 400;
      this.createBush(x, z);
    }
    // Extra bushes in ThunderClan
    for (let i = 0; i < 30; i++) {
      const x = 25 + Math.random() * 70;
      const z = -95 + Math.random() * 70;
      this.createBush(x, z, '#2a4a1a');
    }
  }

  // ============================================================
  //  CAMPS
  // ============================================================
  createCampStructure(x, z, name, color) {
    const h = this.getHeightAt(x, z);
    const group = new THREE.Group();
    group.position.set(x, h, z);

    // Clearing
    const clearGeo = new THREE.CircleGeometry(10, 32);
    clearGeo.rotateX(-Math.PI / 2);
    group.add(new THREE.Mesh(clearGeo, new THREE.MeshStandardMaterial({
      color: '#6a5a3a', roughness: 1, transparent: true, opacity: 0.3
    })));

    // Highrock
    this.createBoulder(x + 4, z + 3, 2);

    // Dens
    [{ dx: 7, dz: 0 }, { dx: -6, dz: 4 }, { dx: -5, dz: -5 }, { dx: 0, dz: -7 }, { dx: 6, dz: -4 }]
      .forEach(d => {
        for (let i = 0; i < 3; i++) {
          this.createBush(x + d.dx + (Math.random() - 0.5) * 2, z + d.dz + (Math.random() - 0.5) * 2, '#2a4a1a');
        }
      });

    // Fresh-kill pile
    const pile = new THREE.Mesh(
      new THREE.SphereGeometry(0.4, 8, 6),
      new THREE.MeshStandardMaterial({ color: '#5a4a3a', roughness: 0.9 })
    );
    pile.geometry.scale(1.5, 0.5, 1.5);
    pile.position.set(1, 0.15, 1);
    group.add(pile);

    // Label
    const label = this.createTextSprite(name, color);
    label.position.set(0, 6, 0);
    label.scale.set(8, 2.5, 1);
    group.add(label);

    this.scene.add(group);
  }

  createCamps() {
    this.createCampStructure(60, -60, 'ThunderClan Camp', '#d4751c');
    this.createCampStructure(-100, 30, 'RiverClan Camp', '#4a8ae0');
    this.createCampStructure(80, 60, 'WindClan Camp', '#a0a060');
    this.createCampStructure(-40, -90, 'ShadowClan Camp', '#4a4a6a');
  }

  // ============================================================
  //  FOURTREES — the gathering place
  // ============================================================
  createFourtrees() {
    const h = this.getHeightAt(0, 5);
    // Great Rock in center
    this.createBoulder(0, 5, 2.5);

    const label = this.createTextSprite('Fourtrees', '#c0d0a0');
    label.position.set(0, h + 10, 5);
    label.scale.set(8, 2.5, 1);
    this.scene.add(label);
  }

  // ============================================================
  //  MOONSTONE — inside Mothermouth at Highstones
  // ============================================================
  createMoonstone() {
    const mx = -140, mz = 80;
    const h = this.getHeightAt(mx, mz);
    const group = new THREE.Group();
    group.position.set(mx, h, mz);

    // Cave entrance rocks
    const archMat = new THREE.MeshStandardMaterial({ color: '#3a3a4a', roughness: 0.85 });
    for (let i = 0; i < 10; i++) {
      const angle = (i / 10) * Math.PI;
      const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(1.5, 1), archMat);
      rock.position.set(Math.cos(angle) * 5, Math.sin(angle) * 5, 0);
      rock.rotation.set(Math.random(), Math.random(), 0);
      rock.castShadow = true;
      group.add(rock);
    }

    // Cave floor
    const floor = new THREE.Mesh(
      new THREE.CircleGeometry(6, 32),
      new THREE.MeshStandardMaterial({ color: '#2a2a3a', roughness: 0.95 })
    );
    floor.geometry.rotateX(-Math.PI / 2);
    floor.position.y = 0.02;
    group.add(floor);

    // THE MOONSTONE
    const moonGeo = new THREE.OctahedronGeometry(1.5, 2);
    const mpos = moonGeo.attributes.position.array;
    for (let i = 0; i < mpos.length; i += 3) { if (mpos[i + 1] > 0) mpos[i + 1] *= 2; }
    moonGeo.computeVertexNormals();

    this.moonstone = new THREE.Mesh(moonGeo, new THREE.MeshStandardMaterial({
      color: '#c0c8ff', emissive: '#4040a0', emissiveIntensity: 0.5,
      roughness: 0.1, metalness: 0.6, transparent: true, opacity: 0.85
    }));
    this.moonstone.position.set(0, 2, -3);
    this.moonstone.castShadow = true;
    group.add(this.moonstone);

    this.moonstoneLight = new THREE.PointLight('#6060ff', 2, 20);
    this.moonstoneLight.position.set(0, 3, -3);
    group.add(this.moonstoneLight);

    // Small crystals
    const crystalMat = new THREE.MeshStandardMaterial({
      color: '#a0a8e0', emissive: '#3030a0', emissiveIntensity: 0.3,
      roughness: 0.15, metalness: 0.5, transparent: true, opacity: 0.7
    });
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const d = 1.8 + Math.random() * 1.2;
      const c = new THREE.Mesh(new THREE.OctahedronGeometry(0.35, 1), crystalMat);
      c.position.set(Math.cos(a) * d, 0.3 + Math.random() * 0.5, -3 + Math.sin(a) * d);
      c.rotation.set(Math.random(), Math.random(), Math.random());
      group.add(c);
    }

    // Star particles
    const starCount = 60;
    const starPos = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      const a = Math.random() * Math.PI * 2;
      const d = Math.random() * 5;
      starPos[i * 3] = Math.cos(a) * d;
      starPos[i * 3 + 1] = 1 + Math.random() * 5;
      starPos[i * 3 + 2] = -3 + Math.sin(a) * d;
    }
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    this.moonstoneStars = new THREE.Points(starGeo, new THREE.PointsMaterial({
      color: '#aaaaff', size: 0.12, transparent: true, opacity: 0.6, sizeAttenuation: true
    }));
    group.add(this.moonstoneStars);

    // Labels
    const label1 = this.createTextSprite('Moonstone', '#a0a0ff');
    label1.position.set(0, 7, -3);
    label1.scale.set(6, 2, 1);
    group.add(label1);

    const label2 = this.createTextSprite('Highstones', '#c0c0c0');
    label2.position.set(0, 12, 0);
    label2.scale.set(8, 2.5, 1);
    group.add(label2);

    this.scene.add(group);
  }

  // ============================================================
  //  TWOLEGPLACE — houses at north edge
  // ============================================================
  createTwolegplace() {
    const houseMat = new THREE.MeshStandardMaterial({ color: '#c8a882', roughness: 0.8 });
    const roofMat = new THREE.MeshStandardMaterial({ color: '#8B4513', roughness: 0.7 });
    const wallMat = new THREE.MeshStandardMaterial({ color: '#e8d8c0', roughness: 0.8 });

    // Row of houses
    for (let i = 0; i < 8; i++) {
      const x = -50 + i * 30 + (Math.random() - 0.5) * 10;
      const z = 180 + (Math.random() - 0.5) * 20;
      const h = this.getHeightAt(x, z);
      const group = new THREE.Group();
      group.position.set(x, h, z);

      // House body
      const houseW = 5 + Math.random() * 3;
      const houseH = 3 + Math.random() * 2;
      const houseD = 4 + Math.random() * 2;
      const house = new THREE.Mesh(new THREE.BoxGeometry(houseW, houseH, houseD), wallMat);
      house.position.y = houseH / 2;
      house.castShadow = true;
      group.add(house);

      // Roof
      const roofGeo = new THREE.ConeGeometry(houseW * 0.75, 2.5, 4);
      roofGeo.rotateY(Math.PI / 4);
      const roof = new THREE.Mesh(roofGeo, roofMat);
      roof.position.y = houseH + 1.2;
      roof.castShadow = true;
      group.add(roof);

      // Fence sections
      const fenceMat = new THREE.MeshStandardMaterial({ color: '#a08060', roughness: 0.9 });
      for (let f = -3; f <= 3; f += 1.5) {
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 1.2, 5), fenceMat);
        post.position.set(houseW / 2 + 3, 0.6, f);
        group.add(post);
      }

      group.add(this.createTextSprite('Twoleg Nest', '#a08060'));
      group.children[group.children.length - 1].position.set(0, houseH + 4, 0);
      group.children[group.children.length - 1].scale.set(5, 1.5, 1);

      this.scene.add(group);
    }

    // Label
    const label = this.createTextSprite('Twolegplace', '#c0a080');
    label.position.set(40, 15, 185);
    label.scale.set(12, 3, 1);
    this.scene.add(label);
  }

  // ============================================================
  //  BARLEY'S FARM
  // ============================================================
  createBarleysFarm() {
    const x = -100, z = 160;
    const h = this.getHeightAt(x, z);
    const group = new THREE.Group();
    group.position.set(x, h, z);

    // Barn
    const barnMat = new THREE.MeshStandardMaterial({ color: '#8B3A3A', roughness: 0.85 });
    const barn = new THREE.Mesh(new THREE.BoxGeometry(10, 6, 8), barnMat);
    barn.position.y = 3;
    barn.castShadow = true;
    group.add(barn);

    // Barn roof
    const barnRoof = new THREE.Mesh(
      new THREE.ConeGeometry(7.5, 3, 4),
      new THREE.MeshStandardMaterial({ color: '#5a2a0a', roughness: 0.8 })
    );
    barnRoof.geometry.rotateY(Math.PI / 4);
    barnRoof.position.y = 7.5;
    barnRoof.castShadow = true;
    group.add(barnRoof);

    // Farmhouse
    const farmhouse = new THREE.Mesh(
      new THREE.BoxGeometry(6, 4, 5),
      new THREE.MeshStandardMaterial({ color: '#e0d0b0', roughness: 0.8 })
    );
    farmhouse.position.set(15, 2, 0);
    farmhouse.castShadow = true;
    group.add(farmhouse);

    // Fence around farm
    const fenceMat = new THREE.MeshStandardMaterial({ color: '#8a6a3a', roughness: 0.9 });
    for (let i = -25; i <= 25; i += 3) {
      for (const side of [-15, 15]) {
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 1.5, 5), fenceMat);
        post.position.set(i, 0.75, side);
        group.add(post);
      }
    }

    // Hay bales
    const hayMat = new THREE.MeshStandardMaterial({ color: '#d4b860', roughness: 0.95 });
    for (let i = 0; i < 5; i++) {
      const hay = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 1.5, 10), hayMat);
      hay.rotation.z = Math.PI / 2;
      hay.position.set(-5 + i * 2.5, 0.8, -8);
      hay.castShadow = true;
      group.add(hay);
    }

    // Label
    const label = this.createTextSprite("Barley's Farm", '#d4b860');
    label.position.set(0, 12, 0);
    label.scale.set(10, 3, 1);
    group.add(label);

    this.scene.add(group);
  }

  // ============================================================
  //  THUNDERPATH — dangerous road between territories
  // ============================================================
  createThunderpath() {
    const roadMat = new THREE.MeshStandardMaterial({ color: '#3a3a3a', roughness: 0.95 });
    const lineMat = new THREE.MeshStandardMaterial({ color: '#d4d440', roughness: 0.7 });

    // Road runs east-west at z = -20
    for (let x = -200; x < 200; x += 8) {
      const z = -20 + Math.sin(x * 0.01) * 5;
      const h = this.getHeightAt(x, z);
      const roadGeo = new THREE.PlaneGeometry(9, 7);
      roadGeo.rotateX(-Math.PI / 2);
      const road = new THREE.Mesh(roadGeo, roadMat);
      road.position.set(x, h + 0.05, z);
      road.rotation.y = Math.atan2(Math.cos(x * 0.01) * 5 * 0.01, 1);
      this.scene.add(road);

      // Center line dashes
      if (Math.floor(x / 8) % 2 === 0) {
        const line = new THREE.Mesh(new THREE.PlaneGeometry(4, 0.3), lineMat);
        line.geometry.rotateX(-Math.PI / 2);
        line.position.set(x, h + 0.06, z);
        this.scene.add(line);
      }
    }

    const label = this.createTextSprite('Thunderpath', '#ff4040');
    label.position.set(0, 8, -20);
    label.scale.set(10, 3, 1);
    this.scene.add(label);
  }

  // ============================================================
  //  SNAKEROCKS — rocky area in ThunderClan territory
  // ============================================================
  createSnakerocks() {
    const cx = 90, cz = -40;
    for (let i = 0; i < 12; i++) {
      this.createBoulder(
        cx + (Math.random() - 0.5) * 15,
        cz + (Math.random() - 0.5) * 15,
        1 + Math.random() * 1.5
      );
    }
    const label = this.createTextSprite('Snakerocks', '#8a6a3a');
    label.position.set(cx, this.getHeightAt(cx, cz) + 6, cz);
    label.scale.set(7, 2, 1);
    this.scene.add(label);
  }

  // ============================================================
  //  SUNNINGROCKS — disputed territory between Thunder/River
  // ============================================================
  createSunningrocks() {
    const cx = -20, cz = 20;
    for (let i = 0; i < 8; i++) {
      const bx = cx + (Math.random() - 0.5) * 12;
      const bz = cz + (Math.random() - 0.5) * 10;
      this.createBoulder(bx, bz, 1.5 + Math.random() * 1.5);
    }
    const label = this.createTextSprite('Sunningrocks', '#d4a017');
    label.position.set(cx, this.getHeightAt(cx, cz) + 8, cz);
    label.scale.set(8, 2.5, 1);
    this.scene.add(label);
  }

  // ============================================================
  //  UTILITY
  // ============================================================
  createTextSprite(text, color = '#ffffff') {
    const canvas = document.createElement('canvas');
    canvas.width = 256; canvas.height = 64;
    const ctx = canvas.getContext('2d');
    ctx.font = 'bold 28px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#000000';
    ctx.fillText(text, 130, 34);
    ctx.fillStyle = color;
    ctx.fillText(text, 128, 32);
    const tex = new THREE.CanvasTexture(canvas);
    return new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false }));
  }

  updateMoonstone(time, isNight) {
    if (!this.moonstone) return;
    const pulse = Math.sin(time * 2) * 0.3 + 0.7;
    const nightBoost = isNight ? 2 : 0.3;
    this.moonstone.material.emissiveIntensity = pulse * nightBoost;
    this.moonstoneLight.intensity = pulse * nightBoost * 3;
    this.moonstone.rotation.y += 0.003;
    if (this.moonstoneStars) {
      const p = this.moonstoneStars.geometry.attributes.position.array;
      for (let i = 0; i < p.length; i += 3) {
        p[i + 1] += Math.sin(time * 2 + i) * 0.003;
        if (p[i + 1] > 7) p[i + 1] = 1;
      }
      this.moonstoneStars.geometry.attributes.position.needsUpdate = true;
      this.moonstoneStars.material.opacity = isNight ? 0.8 : 0.2;
    }
  }
}
