// Procedural pelt texture generation using Canvas2D
import * as THREE from 'three';

// Simple seeded random for deterministic patterns
function seededRandom(seed) {
  let s = seed;
  return function() {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

// Simplex-like noise for organic patterns
function noise2D(x, y) {
  const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
  return n - Math.floor(n);
}

function smoothNoise(x, y) {
  const ix = Math.floor(x), iy = Math.floor(y);
  const fx = x - ix, fy = y - iy;
  const a = noise2D(ix, iy);
  const b = noise2D(ix + 1, iy);
  const c = noise2D(ix, iy + 1);
  const d = noise2D(ix + 1, iy + 1);
  const ux = fx * fx * (3 - 2 * fx);
  const uy = fy * fy * (3 - 2 * fy);
  return a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy;
}

function fbm(x, y, octaves = 4) {
  let val = 0, amp = 0.5, freq = 1;
  for (let i = 0; i < octaves; i++) {
    val += amp * smoothNoise(x * freq, y * freq);
    amp *= 0.5; freq *= 2;
  }
  return val;
}

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return { r, g, b };
}

function lerpColor(c1, c2, t) {
  return {
    r: Math.round(c1.r + (c2.r - c1.r) * t),
    g: Math.round(c1.g + (c2.g - c1.g) * t),
    b: Math.round(c1.b + (c2.b - c1.b) * t)
  };
}

export function generatePeltTexture(options = {}) {
  const {
    pattern = 'tabby',
    baseColor = '#d4751c',
    secondaryColor = '#2c1a0a',
    markings = {},
    size = 256
  } = options;

  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  const base = hexToRgb(baseColor);
  const secondary = hexToRgb(secondaryColor);

  // Fill base color
  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, size, size);

  const imageData = ctx.getImageData(0, 0, size, size);
  const data = imageData.data;

  switch (pattern) {
    case 'solid':
      // Already filled with base color
      break;

    case 'tabby': {
      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          const nx = x / size * 8;
          const ny = y / size * 8;
          // Classic tabby: wavy vertical stripes
          const stripe = Math.sin(nx * 3 + Math.sin(ny * 2) * 1.5 + fbm(nx * 0.5, ny * 0.5) * 3);
          if (stripe > 0.2) {
            const t = Math.min(1, (stripe - 0.2) * 2);
            const mixed = lerpColor(base, secondary, t * 0.8);
            const idx = (y * size + x) * 4;
            data[idx] = mixed.r;
            data[idx + 1] = mixed.g;
            data[idx + 2] = mixed.b;
          }
        }
      }
      break;
    }

    case 'spotted': {
      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          const nx = x / size * 12;
          const ny = y / size * 12;
          const spot = fbm(nx, ny, 3);
          if (spot > 0.55) {
            const t = Math.min(1, (spot - 0.55) * 5);
            const mixed = lerpColor(base, secondary, t * 0.85);
            const idx = (y * size + x) * 4;
            data[idx] = mixed.r;
            data[idx + 1] = mixed.g;
            data[idx + 2] = mixed.b;
          }
        }
      }
      break;
    }

    case 'tortoiseshell': {
      const orange = hexToRgb('#d4751c');
      const black = hexToRgb('#1a1a1a');
      const cream = hexToRgb('#f5d6a8');
      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          const nx = x / size * 6;
          const ny = y / size * 6;
          const n1 = fbm(nx, ny, 4);
          const n2 = fbm(nx + 50, ny + 50, 4);
          let color;
          if (n1 > 0.55) color = black;
          else if (n2 > 0.5) color = cream;
          else color = orange;
          const idx = (y * size + x) * 4;
          data[idx] = color.r;
          data[idx + 1] = color.g;
          data[idx + 2] = color.b;
        }
      }
      break;
    }

    case 'calico': {
      const orange = hexToRgb('#d4751c');
      const black = hexToRgb('#1a1a1a');
      const white = hexToRgb('#f5f5f0');
      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          const nx = x / size * 5;
          const ny = y / size * 5;
          const n1 = fbm(nx, ny, 3);
          const n2 = fbm(nx + 30, ny + 30, 3);
          let color;
          if (n1 > 0.58) color = black;
          else if (n2 > 0.52) color = orange;
          else color = white;
          const idx = (y * size + x) * 4;
          data[idx] = color.r;
          data[idx + 1] = color.g;
          data[idx + 2] = color.b;
        }
      }
      break;
    }

    case 'bicolor': {
      const white = hexToRgb('#f5f5f0');
      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          // Bottom half-ish is white (belly)
          const t = y / size;
          const nx = x / size * 4;
          const wobble = fbm(nx, t * 4, 2) * 0.15;
          if (t > 0.55 + wobble) {
            const idx = (y * size + x) * 4;
            data[idx] = white.r;
            data[idx + 1] = white.g;
            data[idx + 2] = white.b;
          }
        }
      }
      break;
    }

    case 'pointed': {
      // Siamese: light body, dark extremities
      const light = hexToRgb('#f5e6d3');
      const dark = hexToRgb(secondaryColor);
      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          const cx = x / size - 0.5;
          const cy = y / size - 0.5;
          const dist = Math.sqrt(cx * cx + cy * cy) * 2;
          const t = Math.min(1, Math.max(0, dist - 0.3) * 2);
          const color = lerpColor(light, dark, t);
          const idx = (y * size + x) * 4;
          data[idx] = color.r;
          data[idx + 1] = color.g;
          data[idx + 2] = color.b;
        }
      }
      break;
    }

    case 'tuxedo': {
      const black = hexToRgb('#1a1a1a');
      const white = hexToRgb('#f5f5f0');
      // Mostly black with white chest area
      ctx.fillStyle = '#1a1a1a';
      ctx.fillRect(0, 0, size, size);
      const imgD = ctx.getImageData(0, 0, size, size);
      const d = imgD.data;
      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          const cx = (x / size - 0.5);
          const cy = (y / size - 0.6);
          const dist = Math.sqrt(cx * cx * 2 + cy * cy);
          const n = fbm(x / size * 4, y / size * 4, 2) * 0.1;
          if (dist + n < 0.25) {
            const idx = (y * size + x) * 4;
            d[idx] = white.r;
            d[idx + 1] = white.g;
            d[idx + 2] = white.b;
          }
        }
      }
      ctx.putImageData(imgD, 0, 0);
      const tex = new THREE.CanvasTexture(canvas);
      tex.needsUpdate = true;
      return tex;
    }
  }

  // Apply markings
  if (markings.whitechest) {
    const white = { r: 245, g: 245, b: 240 };
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const cx = (x / size - 0.5);
        const cy = (y / size - 0.6);
        const dist = Math.sqrt(cx * cx * 3 + cy * cy);
        if (dist < 0.2 + fbm(x / size * 6, y / size * 6, 2) * 0.08) {
          const idx = (y * size + x) * 4;
          const t = Math.max(0, 1 - dist * 5);
          data[idx] = Math.round(data[idx] + (white.r - data[idx]) * t);
          data[idx + 1] = Math.round(data[idx + 1] + (white.g - data[idx + 1]) * t);
          data[idx + 2] = Math.round(data[idx + 2] + (white.b - data[idx + 2]) * t);
        }
      }
    }
  }

  if (markings.whitepaws) {
    const white = { r: 245, g: 245, b: 240 };
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        // Bottom corners = paws
        const t = y / size;
        if (t > 0.85) {
          const blend = (t - 0.85) / 0.15;
          const idx = (y * size + x) * 4;
          data[idx] = Math.round(data[idx] + (white.r - data[idx]) * blend);
          data[idx + 1] = Math.round(data[idx + 1] + (white.g - data[idx + 1]) * blend);
          data[idx + 2] = Math.round(data[idx + 2] + (white.b - data[idx + 2]) * blend);
        }
      }
    }
  }

  if (markings.underbelly) {
    const light = { r: 240, g: 230, b: 210 };
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const t = y / size;
        const cx = Math.abs(x / size - 0.5);
        if (t > 0.6 && cx < 0.3) {
          const blend = ((t - 0.6) / 0.4) * (1 - cx / 0.3) * 0.5;
          const idx = (y * size + x) * 4;
          data[idx] = Math.round(data[idx] + (light.r - data[idx]) * blend);
          data[idx + 1] = Math.round(data[idx + 1] + (light.g - data[idx + 1]) * blend);
          data[idx + 2] = Math.round(data[idx + 2] + (light.b - data[idx + 2]) * blend);
        }
      }
    }
  }

  ctx.putImageData(imageData, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}
