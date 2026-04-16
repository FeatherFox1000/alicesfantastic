// NPC clan cats with simple wander AI
import * as THREE from 'three';
import { createCatModel } from './cat-model.js';
import { CatAnimator } from './cat-animations.js';

const NPC_NAMES = {
  ThunderClan: ['Brambleclaw', 'Squirrelflight', 'Leafpool', 'Cinderpelt', 'Graystripe', 'Sandstorm', 'Dustpelt', 'Mousefur'],
  RiverClan: ['Mistyfoot', 'Stonefur', 'Silverstream', 'Feathertail', 'Stormfur', 'Hawkfrost'],
  WindClan: ['Crowfeather', 'Onestar', 'Ashfoot', 'Breezepelt', 'Heathertail'],
  ShadowClan: ['Tawnypelt', 'Rowanclaw', 'Blackstar', 'Littlecloud', 'Tigerstar', 'Flametail']
};

const PELT_OPTIONS = [
  { baseColor: '#d4751c', pattern: 'tabby', secondaryColor: '#2c1a0a' },
  { baseColor: '#4a4a4a', pattern: 'solid', secondaryColor: '#2a2a2a' },
  { baseColor: '#a0a0a0', pattern: 'tabby', secondaryColor: '#5a5a5a' },
  { baseColor: '#2c2c2c', pattern: 'solid', secondaryColor: '#1a1a1a' },
  { baseColor: '#f5e6d3', pattern: 'pointed', secondaryColor: '#4a3a2a' },
  { baseColor: '#8B4513', pattern: 'tabby', secondaryColor: '#3a1a0a' },
  { baseColor: '#D2B48C', pattern: 'bicolor', secondaryColor: '#8B6914' },
  { baseColor: '#F5F5DC', pattern: 'solid', secondaryColor: '#e0e0d0' },
  { baseColor: '#c44e28', pattern: 'spotted', secondaryColor: '#5a2a10' },
  { baseColor: '#8B6914', pattern: 'tabby', secondaryColor: '#4a3a0a' }
];

const EYE_COLORS = ['#2d8a4e', '#d4a017', '#4169E1', '#8B7355', '#DAA520', '#40E0D0'];

export class NPCManager {
  constructor(scene, world) {
    this.scene = scene;
    this.world = world;
    this.npcs = [];
  }

  spawnClanCats(clan, centerX, centerZ, count = 6) {
    const names = NPC_NAMES[clan] || ['Unknown'];

    for (let i = 0; i < count; i++) {
      const pelt = PELT_OPTIONS[Math.floor(Math.random() * PELT_OPTIONS.length)];
      const eyeColor = EYE_COLORS[Math.floor(Math.random() * EYE_COLORS.length)];
      const name = names[i % names.length];

      const cat = createCatModel({
        ...pelt,
        eyeColor,
        bodySize: Math.random() > 0.7 ? 'large' : 'medium',
        markings: {
          whitechest: Math.random() > 0.6,
          whitepaws: Math.random() > 0.5
        }
      });

      const x = centerX + (Math.random() - 0.5) * 15;
      const z = centerZ + (Math.random() - 0.5) * 15;
      const h = this.world.getHeightAt(x, z);
      cat.position.set(x, h, z);
      cat.rotation.y = Math.random() * Math.PI * 2;

      this.scene.add(cat);

      // Name label
      const label = this.createNameLabel(name);
      cat.add(label);

      const animator = new CatAnimator(cat);
      this.npcs.push({
        model: cat,
        animator,
        name,
        clan,
        state: 'idle',
        stateTimer: Math.random() * 5,
        targetX: x,
        targetZ: z,
        homeX: centerX,
        homeZ: centerZ
      });
    }
  }

  createNameLabel(name) {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#000';
    ctx.fillText(name, 66, 18);
    ctx.fillStyle = '#fff';
    ctx.fillText(name, 64, 16);

    const tex = new THREE.CanvasTexture(canvas);
    const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false });
    const sprite = new THREE.Sprite(mat);
    sprite.position.y = 1.5;
    sprite.scale.set(2, 0.5, 1);
    return sprite;
  }

  update(dt) {
    for (const npc of this.npcs) {
      npc.stateTimer -= dt;

      if (npc.stateTimer <= 0) {
        // Switch state
        if (npc.state === 'idle') {
          npc.state = Math.random() > 0.3 ? 'wander' : 'sit';
          npc.stateTimer = 3 + Math.random() * 5;
          // Pick random point near home
          npc.targetX = npc.homeX + (Math.random() - 0.5) * 16;
          npc.targetZ = npc.homeZ + (Math.random() - 0.5) * 16;
        } else {
          npc.state = 'idle';
          npc.stateTimer = 2 + Math.random() * 6;
        }
      }

      if (npc.state === 'wander') {
        const dx = npc.targetX - npc.model.position.x;
        const dz = npc.targetZ - npc.model.position.z;
        const dist = Math.sqrt(dx * dx + dz * dz);

        if (dist > 0.5) {
          const speed = 2;
          npc.model.position.x += (dx / dist) * speed * dt;
          npc.model.position.z += (dz / dist) * speed * dt;
          npc.model.position.y = this.world.getHeightAt(npc.model.position.x, npc.model.position.z);

          // Face direction
          npc.model.rotation.y = Math.atan2(dx, dz);
          npc.animator.setState('walk');
        } else {
          npc.state = 'idle';
          npc.stateTimer = 2 + Math.random() * 4;
        }
      } else if (npc.state === 'sit') {
        npc.animator.setState('sit');
      } else {
        npc.animator.setState('idle');
      }

      npc.animator.update(dt);
    }
  }
}
