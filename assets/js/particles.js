import * as THREE from '../../vendor/three/three.module.js';

export const PARTICLE_COUNT = 6000;
export const BOUNDS = { bottom: -35, top: 35, width: 100, depth: 90 };
export const PALETTE = [
  { name: 'Ice blue', color: 0xa9d8ff },
  { name: 'Rose', color: 0xffa8cc },
  { name: 'Mint', color: 0xa5f3d5 },
  { name: 'Gold', color: 0xffd48a }
];

// Update individual BufferGeometry positions, not the cloud's world position.
// Modulo wraps any overshoot, so a fixed pool can fall indefinitely.
export function advanceRain(positions, speeds, deltaSeconds) {
  const height = BOUNDS.top - BOUNDS.bottom;
  for (let i = 0; i < speeds.length; i++) {
    const offset = i * 3 + 1;
    const nextY = positions[offset] - speeds[i] * deltaSeconds;
    positions[offset] = BOUNDS.bottom + ((nextY - BOUNDS.bottom) % height + height) % height;
  }
}

export function paletteIndex(elapsedSeconds) {
  return Math.floor((elapsedSeconds + 1e-9) / 3) % PALETTE.length;
}

export function createRain() {
  const positions = new Float32Array(PARTICLE_COUNT * 3);
  const speeds = new Float32Array(PARTICLE_COUNT);
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    positions[i * 3] = (Math.random() - 0.5) * BOUNDS.width;
    positions[i * 3 + 1] = BOUNDS.bottom + Math.random() * (BOUNDS.top - BOUNDS.bottom);
    positions[i * 3 + 2] = -55 + Math.random() * BOUNDS.depth;
    speeds[i] = 8 + Math.random() * 10;
  }
  const geometry = new THREE.BufferGeometry();
  const attribute = new THREE.BufferAttribute(positions, 3);
  attribute.setUsage(THREE.DynamicDrawUsage);
  geometry.setAttribute('position', attribute);
  const spriteCanvas = document.createElement('canvas');
  spriteCanvas.width = spriteCanvas.height = 32;
  const ctx = spriteCanvas.getContext('2d');
  const gradient = ctx.createRadialGradient(16,16,0,16,16,16);
  gradient.addColorStop(0,'rgba(255,255,255,1)');
  gradient.addColorStop(0.22,'rgba(255,255,255,.95)');
  gradient.addColorStop(1,'rgba(255,255,255,0)');
  ctx.fillStyle = gradient;ctx.fillRect(0,0,32,32);
  const material = new THREE.PointsMaterial({color:PALETTE[0].color,size:0.23,map:new THREE.CanvasTexture(spriteCanvas),transparent:true,depthWrite:false,blending:THREE.AdditiveBlending});
  const points = new THREE.Points(geometry, material);
  points.name = 'Continuous falling rain';
  points.frustumCulled = false;
  return { points, positions, speeds, attribute, material };
}
