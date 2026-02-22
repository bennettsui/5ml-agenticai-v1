'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';

// ─── Toon gradient map ────────────────────────────────────────────────────────
function makeToonGradient(steps: number): THREE.DataTexture {
  const data = new Uint8Array(steps * 4);
  for (let i = 0; i < steps; i++) {
    const v = Math.round((i / (steps - 1)) * 255);
    data[i * 4] = v; data[i * 4 + 1] = v; data[i * 4 + 2] = v; data[i * 4 + 3] = 255;
  }
  const tex = new THREE.DataTexture(data, steps, 1);
  tex.needsUpdate = true;
  return tex;
}

function toon(hex: number, gmap: THREE.DataTexture): THREE.MeshToonMaterial {
  return new THREE.MeshToonMaterial({ color: hex, gradientMap: gmap });
}

// ─── Cloud ────────────────────────────────────────────────────────────────────
function buildCloud(): THREE.Group {
  const g = new THREE.Group();
  const m = new THREE.MeshToonMaterial({ color: 0xffffff });
  ([
    [0, 0, 0, 1.1], [1.1, 0.25, 0, 0.85], [-1.0, 0.2, 0, 0.8],
    [0.4, 0.65, 0, 0.65], [-0.3, 0.55, 0.35, 0.6], [0.2, 0, 0.75, 0.7],
  ] as number[][]).forEach(([x, y, z, r]) => {
    const s = new THREE.Mesh(new THREE.SphereGeometry(r, 8, 6), m);
    s.position.set(x, y, z);
    g.add(s);
  });
  return g;
}

// ─── Tree ─────────────────────────────────────────────────────────────────────
function buildTree(gmap: THREE.DataTexture): THREE.Group {
  const g = new THREE.Group();
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.22, 1.3, 8), toon(0x8B5E3C, gmap));
  trunk.position.y = 0.65;
  g.add(trunk);
  [[1.8, 1.2], [2.5, 0.95], [3.1, 0.65]].forEach(([y, r]) => {
    const leaf = new THREE.Mesh(new THREE.SphereGeometry(r, 8, 6), toon(0x4CAF50, gmap));
    leaf.position.y = y;
    g.add(leaf);
  });
  return g;
}

// ─── Flower ───────────────────────────────────────────────────────────────────
function buildFlower(petalColor: number, gmap: THREE.DataTexture): THREE.Group {
  const g = new THREE.Group();
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.5, 6), toon(0x66BB6A, gmap));
  stem.position.y = 0.25;
  g.add(stem);
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    const p = new THREE.Mesh(new THREE.SphereGeometry(0.1, 6, 4), toon(petalColor, gmap));
    p.position.set(Math.cos(a) * 0.16, 0.56, Math.sin(a) * 0.16);
    g.add(p);
  }
  const c = new THREE.Mesh(new THREE.SphereGeometry(0.1, 6, 4), toon(0xFFEB3B, gmap));
  c.position.y = 0.56;
  g.add(c);
  return g;
}

// ─── Mushroom ─────────────────────────────────────────────────────────────────
function buildMushroom(gmap: THREE.DataTexture): THREE.Group {
  const g = new THREE.Group();
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 0.4, 8), toon(0xF5DEB3, gmap));
  stem.position.y = 0.2;
  g.add(stem);
  const cap = new THREE.Mesh(new THREE.SphereGeometry(0.28, 8, 6), toon(0xE53935, gmap));
  cap.scale.y = 0.65; cap.position.y = 0.5;
  g.add(cap);
  for (let i = 0; i < 4; i++) {
    const dot = new THREE.Mesh(new THREE.SphereGeometry(0.05, 5, 4), toon(0xffffff, gmap));
    const a = (i / 4) * Math.PI * 2;
    dot.position.set(Math.cos(a) * 0.16, 0.56, Math.sin(a) * 0.16);
    g.add(dot);
  }
  return g;
}

// ─── Bounce ball ──────────────────────────────────────────────────────────────
function buildBounceBall(color: number, gmap: THREE.DataTexture): THREE.Mesh {
  return new THREE.Mesh(new THREE.SphereGeometry(0.35, 12, 8), toon(color, gmap));
}

// ─── Darken hex color ─────────────────────────────────────────────────────────
function darken(hex: number, f: number): number {
  const r = Math.floor(((hex >> 16) & 0xff) * f);
  const g2 = Math.floor(((hex >> 8) & 0xff) * f);
  const b = Math.floor((hex & 0xff) * f);
  return (r << 16) | (g2 << 8) | b;
}

// ─── Booth ────────────────────────────────────────────────────────────────────
function buildBooth(
  color: number,
  labelZh: string,
  labelEn: string,
  gmap: THREE.DataTexture,
): THREE.Group {
  const g = new THREE.Group();
  const darker = darken(color, 0.62);

  const plat = new THREE.Mesh(new THREE.CylinderGeometry(2.0, 2.0, 0.18, 16), toon(darker, gmap));
  plat.position.y = 0.09;
  g.add(plat);

  const body = new THREE.Mesh(new THREE.BoxGeometry(2.4, 2.4, 1.6), toon(color, gmap));
  body.position.y = 1.38;
  g.add(body);

  const roof = new THREE.Mesh(new THREE.ConeGeometry(2.0, 1.1, 6), toon(darker, gmap));
  roof.position.y = 3.05;
  g.add(roof);

  const ring = new THREE.Mesh(new THREE.TorusGeometry(1.9, 0.08, 6, 20), toon(0xFFD700, gmap));
  ring.rotation.x = Math.PI / 2; ring.position.y = 2.5;
  g.add(ring);

  // Sign canvas
  const can = document.createElement('canvas');
  can.width = 512; can.height = 160;
  const ctx = can.getContext('2d')!;
  const hex6 = '#' + color.toString(16).padStart(6, '0');
  const grad = ctx.createLinearGradient(0, 0, 512, 0);
  grad.addColorStop(0, hex6);
  grad.addColorStop(1, '#' + darken(color, 0.55).toString(16).padStart(6, '0'));
  ctx.fillStyle = grad; ctx.fillRect(0, 0, 512, 160);
  ctx.strokeStyle = 'rgba(255,255,255,0.45)'; ctx.lineWidth = 5;
  ctx.strokeRect(6, 6, 500, 148);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 54px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
  ctx.fillText(labelZh, 256, 90);
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  ctx.font = '26px Arial';
  ctx.fillText(labelEn, 256, 136);
  const tex = new THREE.CanvasTexture(can);
  const sign = new THREE.Mesh(
    new THREE.PlaneGeometry(2.2, 0.7),
    new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide }),
  );
  sign.position.set(0, 2.1, 0.82);
  g.add(sign);

  // Windows
  const winMat = new THREE.MeshBasicMaterial({ color: 0xADD8E6 });
  ([-0.55, 0.55] as number[]).forEach(x => {
    const win = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.45), winMat);
    win.position.set(x, 1.15, 0.82);
    g.add(win);
  });

  return g;
}

// ─── TED-style billboard ──────────────────────────────────────────────────────
function buildBillboard(mainText: string, subText: string, color: number): THREE.Group {
  const g = new THREE.Group();
  const postMat = new THREE.MeshToonMaterial({ color: 0x888888 });
  ([-0.95, 0.95] as number[]).forEach(x => {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, 4.2, 8), postMat);
    post.position.set(x, 2.1, 0);
    g.add(post);
  });

  const can = document.createElement('canvas');
  can.width = 768; can.height = 320;
  const ctx = can.getContext('2d')!;
  const hex6 = '#' + color.toString(16).padStart(6, '0');
  const bg = ctx.createLinearGradient(0, 0, 768, 320);
  bg.addColorStop(0, hex6); bg.addColorStop(1, '#111111');
  ctx.fillStyle = bg; ctx.fillRect(0, 0, 768, 320);
  ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 6;
  ctx.strokeRect(8, 8, 752, 304);
  // Main text — auto-size to fit
  ctx.fillStyle = '#ffffff'; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
  let fontSize = 88;
  ctx.font = `bold ${fontSize}px Arial`;
  while (ctx.measureText(mainText).width > 720 && fontSize > 48) {
    fontSize -= 4; ctx.font = `bold ${fontSize}px Arial`;
  }
  ctx.fillText(mainText, 384, 195);
  ctx.fillStyle = 'rgba(255,255,255,0.80)';
  let subSize = 42;
  ctx.font = `bold ${subSize}px Arial`;
  while (ctx.measureText(subText).width > 720 && subSize > 26) {
    subSize -= 2; ctx.font = `bold ${subSize}px Arial`;
  }
  ctx.fillText(subText, 384, 272);
  const tex = new THREE.CanvasTexture(can);
  const board = new THREE.Mesh(
    new THREE.PlaneGeometry(5.2, 2.2),
    new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide }),
  );
  board.position.y = 4.8;
  g.add(board);
  return g;
}

// ─── RAIBOT (player) ──────────────────────────────────────────────────────────
function buildRAIBOT(gmap: THREE.DataTexture): THREE.Group {
  const g = new THREE.Group();
  const blue = toon(0x2563EB, gmap);
  const dark = toon(0x1E40AF, gmap);
  const cyan = toon(0x00FFFF, gmap);
  const green = toon(0x10B981, gmap);
  const white = toon(0xffffff, gmap);

  // Legs
  ([-0.2, 0.2] as number[]).forEach(x => {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 0.5, 8), blue);
    leg.position.set(x, 0.25, 0); g.add(leg);
    const foot = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.12, 0.36), dark);
    foot.position.set(x, -0.02, 0.05); g.add(foot);
  });
  // Body
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.78, 0.9, 0.56), blue);
  body.position.y = 0.78; g.add(body);
  // Chest
  const chest = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.36, 0.06), dark);
  chest.position.set(0, 0.82, 0.3); g.add(chest);
  const chestLight = new THREE.Mesh(new THREE.SphereGeometry(0.07, 6, 4), green);
  chestLight.position.set(0, 0.88, 0.33); g.add(chestLight);
  // Arms
  ([-0.55, 0.55] as number[]).forEach(x => {
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.62, 8), blue);
    arm.position.set(x, 0.72, 0); arm.rotation.z = x > 0 ? 0.35 : -0.35; g.add(arm);
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.13, 8, 6), dark);
    hand.position.set(x * 1.28, 0.42, 0); g.add(hand);
  });
  // Neck
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.14, 0.18, 8), dark);
  neck.position.y = 1.28; g.add(neck);
  // Head
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.68, 0.62), blue);
  head.position.y = 1.66; g.add(head);
  // Visor
  const visor = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.3, 0.06), dark);
  visor.position.set(0, 1.68, 0.32); g.add(visor);
  // Eyes
  ([-0.14, 0.14] as number[]).forEach(x => {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 6), cyan);
    eye.position.set(x, 1.7, 0.34); g.add(eye);
    const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.04, 6, 4), white);
    pupil.position.set(x + 0.02, 1.72, 0.4); g.add(pupil);
  });
  // Antenna
  const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.38, 6), dark);
  stick.position.set(0, 2.09, 0); g.add(stick);
  const ball = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 6), green);
  ball.position.set(0, 2.35, 0); g.add(ball);
  // Ear panels
  ([-0.4, 0.4] as number[]).forEach(x => {
    const ear = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.28, 0.28), dark);
    ear.position.set(x, 1.66, 0); g.add(ear);
  });
  return g;
}

// ─── Teddy Bear ───────────────────────────────────────────────────────────────
function buildBear(gmap: THREE.DataTexture): THREE.Group {
  const g = new THREE.Group();
  const brown = toon(0xC68642, gmap);
  const dark = toon(0x8B5E3C, gmap);
  const pink = toon(0xFFB6C1, gmap);
  const black = toon(0x111111, gmap);

  const body = new THREE.Mesh(new THREE.SphereGeometry(0.44, 10, 8), brown);
  body.scale.y = 1.2; body.position.y = 0.52; g.add(body);
  const belly = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 6), toon(0xD4956A, gmap));
  belly.scale.set(0.9, 1.05, 0.55); belly.position.set(0, 0.52, 0.26); g.add(belly);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.36, 10, 8), brown);
  head.position.y = 1.14; g.add(head);
  ([-0.22, 0.22] as number[]).forEach(x => {
    const ear = new THREE.Mesh(new THREE.SphereGeometry(0.13, 8, 6), brown);
    ear.position.set(x, 1.42, 0); g.add(ear);
    const inner = new THREE.Mesh(new THREE.SphereGeometry(0.07, 6, 4), pink);
    inner.position.set(x, 1.42, 0.06); g.add(inner);
  });
  const muzzle = new THREE.Mesh(new THREE.SphereGeometry(0.19, 8, 6), toon(0xD4956A, gmap));
  muzzle.scale.set(1, 0.75, 0.7); muzzle.position.set(0, 1.09, 0.28); g.add(muzzle);
  ([-0.1, 0.1] as number[]).forEach(x => {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.055, 6, 4), black);
    eye.position.set(x, 1.17, 0.33); g.add(eye);
  });
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.065, 6, 4), dark);
  nose.position.set(0, 1.1, 0.36); g.add(nose);
  ([-0.58, 0.58] as number[]).forEach(x => {
    const arm = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 6), brown);
    arm.scale.y = 1.4; arm.position.set(x, 0.62, 0); g.add(arm);
  });
  ([-0.2, 0.2] as number[]).forEach(x => {
    const leg = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 6), brown);
    leg.scale.y = 1.3; leg.position.set(x, 0.16, 0.05); g.add(leg);
  });
  return g;
}

// ─── Bunny ────────────────────────────────────────────────────────────────────
function buildBunny(gmap: THREE.DataTexture): THREE.Group {
  const g = new THREE.Group();
  const white = toon(0xEEEEEE, gmap);
  const pink = toon(0xFFB6C1, gmap);
  const black = toon(0x111111, gmap);

  const body = new THREE.Mesh(new THREE.SphereGeometry(0.38, 10, 8), white);
  body.scale.y = 1.25; body.position.y = 0.47; g.add(body);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.3, 10, 8), white);
  head.position.y = 1.04; g.add(head);
  ([-0.11, 0.11] as number[]).forEach(x => {
    const ear = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.06, 0.55, 8), white);
    ear.position.set(x, 1.45, 0); g.add(ear);
    const innerEar = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.035, 0.45, 6), pink);
    innerEar.position.set(x, 1.45, 0.03); g.add(innerEar);
  });
  ([-0.09, 0.09] as number[]).forEach(x => {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.055, 6, 4), toon(0xFF69B4, gmap));
    eye.position.set(x, 1.07, 0.28); g.add(eye);
  });
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.045, 5, 4), pink);
  nose.position.set(0, 1.01, 0.3); g.add(nose);
  const tail = new THREE.Mesh(new THREE.SphereGeometry(0.12, 6, 4), white);
  tail.position.set(0, 0.52, -0.38); g.add(tail);
  ([-0.45, 0.45] as number[]).forEach(x => {
    const arm = new THREE.Mesh(new THREE.SphereGeometry(0.15, 8, 6), white);
    arm.scale.y = 1.3; arm.position.set(x, 0.56, 0); g.add(arm);
  });
  ([-0.18, 0.18] as number[]).forEach(x => {
    const leg = new THREE.Mesh(new THREE.SphereGeometry(0.17, 8, 6), white);
    leg.scale.set(1, 0.8, 1.5); leg.position.set(x, 0.12, 0.1); g.add(leg);
  });
  return g;
}

// ─── Penguin ──────────────────────────────────────────────────────────────────
function buildPenguin(gmap: THREE.DataTexture): THREE.Group {
  const g = new THREE.Group();
  const black = toon(0x1a1a2e, gmap);
  const white = toon(0xF0F0F0, gmap);
  const orange = toon(0xFF8C00, gmap);

  const body = new THREE.Mesh(new THREE.SphereGeometry(0.38, 10, 8), black);
  body.scale.y = 1.35; body.position.y = 0.51; g.add(body);
  const belly = new THREE.Mesh(new THREE.SphereGeometry(0.28, 10, 8), white);
  belly.scale.set(0.88, 1.15, 0.6); belly.position.set(0, 0.51, 0.22); g.add(belly);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.29, 10, 8), black);
  head.position.y = 1.1; g.add(head);
  const face = new THREE.Mesh(new THREE.SphereGeometry(0.21, 10, 8), white);
  face.scale.set(0.9, 0.78, 0.55); face.position.set(0, 1.09, 0.18); g.add(face);
  ([-0.08, 0.08] as number[]).forEach(x => {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.055, 6, 4), toon(0x000000, gmap));
    eye.position.set(x, 1.14, 0.27); g.add(eye);
    const shine = new THREE.Mesh(new THREE.SphereGeometry(0.02, 4, 3), white);
    shine.position.set(x + 0.02, 1.16, 0.32); g.add(shine);
  });
  const beak = new THREE.Mesh(new THREE.ConeGeometry(0.065, 0.17, 6), orange);
  beak.rotation.x = Math.PI / 2; beak.position.set(0, 1.07, 0.34); g.add(beak);
  ([-0.44, 0.44] as number[]).forEach(x => {
    const wing = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 6), black);
    wing.scale.set(0.45, 1.25, 0.42); wing.position.set(x, 0.62, 0); g.add(wing);
  });
  ([-0.15, 0.15] as number[]).forEach(x => {
    const foot = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 6), orange);
    foot.scale.set(1.6, 0.38, 1.3); foot.position.set(x, 0.08, 0.12); g.add(foot);
  });
  return g;
}

// ─── Cat ──────────────────────────────────────────────────────────────────────
function buildCat(gmap: THREE.DataTexture): THREE.Group {
  const g = new THREE.Group();
  const orange = toon(0xFF8C42, gmap);
  const cream = toon(0xFFF0DC, gmap);
  const pink = toon(0xFFB6C1, gmap);
  const green = toon(0x44CC88, gmap);

  const body = new THREE.Mesh(new THREE.SphereGeometry(0.4, 10, 8), orange);
  body.scale.y = 1.18; body.position.y = 0.47; g.add(body);
  const belly = new THREE.Mesh(new THREE.SphereGeometry(0.28, 8, 6), cream);
  belly.scale.set(0.85, 1.0, 0.55); belly.position.set(0, 0.47, 0.24); g.add(belly);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.33, 10, 8), orange);
  head.position.y = 1.06; g.add(head);
  ([-0.22, 0.22] as number[]).forEach(x => {
    const ear = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.25, 6), orange);
    ear.position.set(x, 1.33, 0); ear.rotation.z = x > 0 ? -0.3 : 0.3; g.add(ear);
    const inner = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.18, 6), pink);
    inner.position.set(x * 1.02, 1.33, 0.02); inner.rotation.z = x > 0 ? -0.3 : 0.3; g.add(inner);
  });
  const muzzle = new THREE.Mesh(new THREE.SphereGeometry(0.17, 8, 6), cream);
  muzzle.scale.set(1.1, 0.7, 0.65); muzzle.position.set(0, 1.02, 0.26); g.add(muzzle);
  ([-0.09, 0.09] as number[]).forEach(x => {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 4), green);
    eye.position.set(x, 1.1, 0.3); g.add(eye);
  });
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.045, 5, 4), pink);
  nose.position.set(0, 1.04, 0.32); g.add(nose);
  const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.09, 0.7, 8), orange);
  tail.rotation.z = 1.1; tail.position.set(-0.65, 0.5, -0.1); g.add(tail);
  const tailTip = new THREE.Mesh(new THREE.SphereGeometry(0.1, 6, 4), toon(0xFF6622, gmap));
  tailTip.position.set(-1.0, 0.82, -0.1); g.add(tailTip);
  ([-0.47, 0.47] as number[]).forEach(x => {
    const arm = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 6), orange);
    arm.scale.y = 1.3; arm.position.set(x, 0.55, 0); g.add(arm);
  });
  ([-0.18, 0.18] as number[]).forEach(x => {
    const leg = new THREE.Mesh(new THREE.SphereGeometry(0.17, 8, 6), orange);
    leg.scale.y = 1.1; leg.position.set(x, 0.14, 0.06); g.add(leg);
  });
  return g;
}

// ─── HK: 叮叮電車 (Tram) ──────────────────────────────────────────────────────
function buildTram(gmap: THREE.DataTexture): THREE.Group {
  const g = new THREE.Group();
  const green = toon(0x006633, gmap);
  const cream = toon(0xFFF8DC, gmap);
  const red = toon(0xCC0000, gmap);
  const darkGray = toon(0x333333, gmap);

  // Chassis base
  const base = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.22, 0.9), darkGray);
  base.position.y = 0.11; g.add(base);
  // Wheels (4 wheels)
  ([[-0.55, -0.38], [0.55, -0.38], [-0.55, 0.38], [0.55, 0.38]] as number[][]).forEach(([x, z]) => {
    const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.1, 10), darkGray);
    wheel.rotation.x = Math.PI / 2; wheel.position.set(x, 0.14, z); g.add(wheel);
  });
  // Lower deck body (cream)
  const lower = new THREE.Mesh(new THREE.BoxGeometry(1.75, 0.62, 0.85), cream);
  lower.position.y = 0.53; g.add(lower);
  // Lower deck windows (dark strip)
  const lWin = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.3, 0.87), toon(0x88BBDD, gmap));
  lWin.position.y = 0.57; g.add(lWin);
  // Mid divider
  const mid = new THREE.Mesh(new THREE.BoxGeometry(1.75, 0.1, 0.85), green);
  mid.position.y = 0.87; g.add(mid);
  // Upper deck (green)
  const upper = new THREE.Mesh(new THREE.BoxGeometry(1.75, 0.58, 0.85), green);
  upper.position.y = 1.19; g.add(upper);
  // Upper deck windows
  const uWin = new THREE.Mesh(new THREE.BoxGeometry(1.45, 0.28, 0.87), toon(0xAADDFF, gmap));
  uWin.position.y = 1.19; g.add(uWin);
  // Roof
  const roof = new THREE.Mesh(new THREE.BoxGeometry(1.78, 0.1, 0.88), cream);
  roof.position.y = 1.52; g.add(roof);
  // Route number board on front
  const front = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.22, 0.06), red);
  front.position.set(0, 1.42, -0.46); g.add(front);
  // Pantograph (overhead connector)
  const panto = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.45, 0.06), toon(0x888888, gmap));
  panto.position.set(0, 1.8, 0); g.add(panto);

  return g;
}

// ─── HK: 霓虹招牌 (Neon sign board) ──────────────────────────────────────────
function buildNeonSign(text: string, color: number, gmap: THREE.DataTexture): THREE.Group {
  const g = new THREE.Group();
  // Frame bracket arm
  const arm = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 1.2), toon(0x555555, gmap));
  arm.position.set(0, 0, 0.6); g.add(arm);
  // Sign canvas
  const can = document.createElement('canvas');
  can.width = 128; can.height = 512;
  const ctx = can.getContext('2d')!;
  const hex6 = '#' + color.toString(16).padStart(6, '0');
  ctx.fillStyle = '#111'; ctx.fillRect(0, 0, 128, 512);
  ctx.fillStyle = hex6;
  ctx.fillRect(6, 6, 116, 500);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 58px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  // Render each char vertically
  const chars = text.split('');
  chars.forEach((ch, i) => {
    ctx.fillText(ch, 64, 20 + i * 68);
  });
  const tex = new THREE.CanvasTexture(can);
  const board = new THREE.Mesh(
    new THREE.PlaneGeometry(0.55, 2.2),
    new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide }),
  );
  board.position.set(0, -1.1, 1.2);
  g.add(board);
  return g;
}

// ─── HK: 竹棚 (Bamboo scaffolding) ────────────────────────────────────────────
function buildBambooScaffolding(gmap: THREE.DataTexture): THREE.Group {
  const g = new THREE.Group();
  const bamboo = toon(0xB8860B, gmap);
  // Vertical poles
  ([[0, 0], [1.8, 0], [0, 1.8], [1.8, 1.8]] as number[][]).forEach(([x, z]) => {
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 4.5, 6), bamboo);
    pole.position.set(x, 2.25, z); g.add(pole);
  });
  // Horizontal bars (3 levels)
  [1.0, 2.2, 3.5].forEach(y => {
    const hBar = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.9, 6), bamboo);
    hBar.rotation.z = Math.PI / 2; hBar.position.set(0.9, y, 0); g.add(hBar);
    const hBar2 = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.9, 6), bamboo);
    hBar2.rotation.z = Math.PI / 2; hBar2.position.set(0.9, y, 1.8); g.add(hBar2);
    const dBar = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.9, 6), bamboo);
    dBar.rotation.x = Math.PI / 2; dBar.position.set(0, y, 0.9); g.add(dBar);
    const dBar2 = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.9, 6), bamboo);
    dBar2.rotation.x = Math.PI / 2; dBar2.position.set(1.8, y, 0.9); g.add(dBar2);
  });
  return g;
}

// ─── HK: 獅子頭 (Lion dance head) ─────────────────────────────────────────────
function buildLionHead(gmap: THREE.DataTexture): THREE.Group {
  const g = new THREE.Group();
  const red = toon(0xDD1111, gmap);
  const yellow = toon(0xFFCC00, gmap);
  const white = toon(0xffffff, gmap);
  const gold = toon(0xFFAA00, gmap);
  // Head
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.52, 10, 8), red);
  head.scale.set(1.2, 1.0, 1.0); g.add(head);
  // Snout
  const snout = new THREE.Mesh(new THREE.SphereGeometry(0.28, 8, 6), yellow);
  snout.scale.set(1.0, 0.7, 0.8); snout.position.set(0, -0.12, 0.45); g.add(snout);
  // Nostrils
  ([[-0.1, 0.1]] as number[][]).forEach(([x]) => {
    const n = new THREE.Mesh(new THREE.SphereGeometry(0.06, 5, 4), toon(0x881100, gmap));
    n.position.set(x, -0.1, 0.7); g.add(n);
  });
  // Eyes (large)
  ([-0.22, 0.22] as number[]).forEach(x => {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 6), white);
    eye.position.set(x, 0.18, 0.44); g.add(eye);
    const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.07, 6, 4), toon(0x111111, gmap));
    pupil.position.set(x + 0.02, 0.18, 0.56); g.add(pupil);
  });
  // Forehead ornament
  const orn = new THREE.Mesh(new THREE.SphereGeometry(0.12, 6, 4), gold);
  orn.position.set(0, 0.45, 0.45); g.add(orn);
  // Ears
  ([-0.5, 0.5] as number[]).forEach(x => {
    const ear = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.32, 5), yellow);
    ear.position.set(x, 0.55, 0.1); ear.rotation.z = x > 0 ? -0.4 : 0.4; g.add(ear);
  });
  // Beard/mane frills
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const frill = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.35, 5), i % 2 === 0 ? red : yellow);
    frill.position.set(Math.cos(a) * 0.65, Math.sin(a) * 0.5 - 0.1, -0.1);
    frill.rotation.z = Math.atan2(Math.sin(a), Math.cos(a)) - Math.PI / 2 + Math.PI;
    g.add(frill);
  }
  return g;
}

// ─── Particle type ────────────────────────────────────────────────────────────
interface Particle { mesh: THREE.Mesh; vel: THREE.Vector3; life: number; }

// ─── Booth data ───────────────────────────────────────────────────────────────
const BOOTH_DEFS = [
  {
    nameZh: '發票忍者', nameEn: 'Invoice Ninja', color: 0x2563EB,
    pos: [-7.5, 0, -5] as [number, number, number], rot: 0.5,
    msg: '🧾 AI 自動處理發票！\n識別率 99.2%，節省 80% 人工作業時間。\n3 天內無縫整合您的會計系統。\n每月處理 10,000+ 張發票毫無壓力！',
  },
  {
    nameZh: '客服咖啡館', nameEn: 'ChatBot Café', color: 0x10B981,
    pos: [7.5, 0, -5] as [number, number, number], rot: -0.5,
    msg: '💬 24/7 AI 客服代理！\n回應時間 <3 秒，同時處理 1,000+ 對話。\n客戶滿意度提升 40%，\n讓 AI 全天候為您服務客戶！',
  },
  {
    nameZh: 'BI 水晶球', nameEn: 'Business Intelligence', color: 0x8B5CF6,
    pos: [0, 0, -14] as [number, number, number], rot: 0,
    msg: '📊 商業智能實時預測！\n銷售預測準確率 92%，庫存最優化。\n節省 30% 運營成本，\n一鍵看見您的業務未來！',
  },
  {
    nameZh: '3天上線', nameEn: '3-Day Launch', color: 0xF59E0B,
    pos: [-7.5, 0, 6] as [number, number, number], rot: 2.7,
    msg: '🚀 3 天啟動 AI 自動化方案！\n無需技術團隊，零代碼配置。\n專業顧問全程 1 對 1 支援，\n今天就開始您的 AI 轉型旅程！',
  },
  {
    nameZh: 'ROI 財富輪', nameEn: 'ROI Fortune', color: 0xEF4444,
    pos: [7.5, 0, 6] as [number, number, number], rot: -2.7,
    msg: '💰 6 個月內完整 ROI！\n平均每年節省 HK$25 萬運營成本。\n月費低至 HK$8,000 起，\n立即計算您的 AI 投資回報！',
  },
];

const BILLBOARD_DEFS = [
  { main: '節省 70%', sub: '時間成本', color: 0x2563EB, pos: [-22, 0, 0] as [number, number, number], ry: Math.PI / 2 },
  { main: '3 天上線', sub: 'AI 自動化', color: 0x10B981, pos: [22, 0, 0] as [number, number, number], ry: -Math.PI / 2 },
  { main: '50+ 企業', sub: '信任我們', color: 0xF59E0B, pos: [0, 0, -26] as [number, number, number], ry: 0 },
  { main: 'ROI 6個月', sub: '快速回報', color: 0xEF4444, pos: [0, 0, 20] as [number, number, number], ry: Math.PI },
];

// ─── Main component ───────────────────────────────────────────────────────────
interface BoothState {
  pos: THREE.Vector3; nameZh: string; msg: string; visited: boolean; index: number;
}

export default function RecruitAICarnival() {
  const mountRef = useRef<HTMLDivElement>(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [visitedCount, setVisitedCount] = useState(0);
  const [showEKey, setShowEKey] = useState(false);
  const [nearBoothName, setNearBoothName] = useState('');
  const [popupMsg, setPopupMsg] = useState('');
  const [showPopup, setShowPopup] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const keysRef = useRef<Record<string, boolean>>({});
  const joyRef = useRef({ x: 0, y: 0 });
  const boothsRef = useRef<BoothState[]>([]);
  const visitedRef = useRef(new Set<number>());
  const showEKeyRef = useRef(false);
  const nearNameRef = useRef('');

  const startGame = useCallback(() => setGameStarted(true), []);
  const closePopup = useCallback(() => setShowPopup(false), []);
  const closeCelebration = useCallback(() => setShowCelebration(false), []);

  useEffect(() => {
    setIsMobile(/Mobi|Android|iPhone|iPad/i.test(navigator.userAgent));
  }, []);

  useEffect(() => {
    if (!gameStarted) return;
    const el = mountRef.current;
    if (!el) return;

    const gmap = makeToonGradient(4);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(el.clientWidth, el.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    el.appendChild(renderer.domElement);

    // Scene & camera
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x87CEEB, 0.011);
    const camera = new THREE.PerspectiveCamera(58, el.clientWidth / el.clientHeight, 0.1, 200);
    camera.position.set(0, 4, 20);

    // Sky sphere
    const skyCanvas = document.createElement('canvas');
    skyCanvas.width = 4; skyCanvas.height = 512;
    const skyCtx = skyCanvas.getContext('2d')!;
    const skyG = skyCtx.createLinearGradient(0, 0, 0, 512);
    skyG.addColorStop(0, '#0a4fa8'); skyG.addColorStop(0.45, '#3b96e8');
    skyG.addColorStop(0.78, '#87CEEB'); skyG.addColorStop(0.92, '#FFD580');
    skyG.addColorStop(1, '#FFA07A');
    skyCtx.fillStyle = skyG; skyCtx.fillRect(0, 0, 4, 512);
    const skyTex = new THREE.CanvasTexture(skyCanvas);
    scene.add(new THREE.Mesh(
      new THREE.SphereGeometry(120, 32, 16),
      new THREE.MeshBasicMaterial({ map: skyTex, side: THREE.BackSide }),
    ));

    // Ground
    const ground = new THREE.Mesh(new THREE.CircleGeometry(55, 48), toon(0x6BBF5E, gmap));
    ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true;
    scene.add(ground);
    const plaza = new THREE.Mesh(new THREE.CircleGeometry(6, 32), toon(0xE4C98A, gmap));
    plaza.rotation.x = -Math.PI / 2; plaza.position.y = 0.01; scene.add(plaza);
    const pathRing = new THREE.Mesh(new THREE.RingGeometry(6.5, 10, 40), toon(0xD4A96A, gmap));
    pathRing.rotation.x = -Math.PI / 2; pathRing.position.y = 0.01; scene.add(pathRing);

    // Lighting
    scene.add(new THREE.HemisphereLight(0x87CEEB, 0x4a7c3f, 0.7));
    const sun = new THREE.DirectionalLight(0xFFF5E0, 1.5);
    sun.position.set(18, 28, 12); sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.near = 0.5; sun.shadow.camera.far = 90;
    sun.shadow.camera.left = -35; sun.shadow.camera.right = 35;
    sun.shadow.camera.top = 35; sun.shadow.camera.bottom = -35;
    scene.add(sun);
    const fill = new THREE.DirectionalLight(0xB0D4FF, 0.55);
    fill.position.set(-15, 10, -8); scene.add(fill);
    scene.add(new THREE.AmbientLight(0xffffff, 0.28));

    // Clouds
    ([
      [-20, 22, -18, 2.2], [12, 24, -22, 1.8], [-6, 20, -28, 2.5],
      [24, 21, 6, 1.9], [-26, 23, 12, 2.0], [10, 25, 18, 1.6],
      [-12, 19, 20, 1.4], [28, 20, -10, 2.1],
    ] as number[][]).forEach(([x, y, z, s]) => {
      const c = buildCloud(); c.position.set(x, y, z); c.scale.setScalar(s); scene.add(c);
    });

    // Trees
    ([
      [-14, 0, -10], [14, 0, -10], [-14, 0, 10], [14, 0, 10],
      [-20, 0, 0], [20, 0, 0], [-10, 0, -20], [10, 0, -20],
      [-18, 0, -18], [18, 0, -18], [-18, 0, 18], [18, 0, 18],
      [-6, 0, 22], [6, 0, 22],
    ] as number[][]).forEach(([x, y, z]) => {
      const t = buildTree(gmap);
      t.position.set(x, y, z); t.scale.setScalar(0.75 + Math.random() * 0.45);
      scene.add(t);
    });

    // Flowers & mushrooms
    const flowerColors = [0xFF69B4, 0xFF8C00, 0xFFD700, 0xFF4444, 0x9B59B6, 0x00BFFF];
    for (let i = 0; i < 55; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = 10 + Math.random() * 18;
      if (Math.random() > 0.2) {
        const fl = buildFlower(flowerColors[Math.floor(Math.random() * flowerColors.length)], gmap);
        fl.position.set(Math.cos(a) * r, 0, Math.sin(a) * r);
        fl.scale.setScalar(0.8 + Math.random() * 0.5); scene.add(fl);
      } else {
        const mu = buildMushroom(gmap);
        mu.position.set(Math.cos(a) * r, 0, Math.sin(a) * r); scene.add(mu);
      }
    }

    // Bounce balls
    const ballColors = [0xFF6B6B, 0x4ECDC4, 0xFFE66D, 0xA8E6CF, 0xFF8B94];
    const balls: { mesh: THREE.Mesh; phase: number; baseY: number }[] = [];
    ballColors.forEach((col, i) => {
      const a = (i / ballColors.length) * Math.PI * 2;
      const ball = buildBounceBall(col, gmap);
      ball.position.set(Math.cos(a) * 8.5, 0.35, Math.sin(a) * 8.5);
      scene.add(ball);
      balls.push({ mesh: ball, phase: i * 1.2, baseY: 0.35 });
    });

    // Welcome arch
    const archMat = toon(0xF59E0B, gmap);
    ([-3.2, 3.2] as number[]).forEach(x => {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.28, 5.5, 10), archMat);
      post.position.set(x, 2.75, 12); scene.add(post);
    });
    const archBar = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 7.0, 10), archMat);
    archBar.rotation.z = Math.PI / 2; archBar.position.set(0, 5.5, 12); scene.add(archBar);

    const archCan = document.createElement('canvas');
    archCan.width = 640; archCan.height = 160;
    const archCtx = archCan.getContext('2d')!;
    const archBg = archCtx.createLinearGradient(0, 0, 640, 0);
    archBg.addColorStop(0, '#2563EB'); archBg.addColorStop(1, '#1E40AF');
    archCtx.fillStyle = archBg; archCtx.fillRect(0, 0, 640, 160);
    archCtx.strokeStyle = '#FFD700'; archCtx.lineWidth = 5;
    archCtx.strokeRect(6, 6, 628, 148);
    archCtx.fillStyle = '#ffffff';
    archCtx.font = 'bold 54px Arial'; archCtx.textAlign = 'center'; archCtx.textBaseline = 'alphabetic';
    archCtx.fillText('RecruitAI AI嘉年華', 320, 92);
    archCtx.fillStyle = 'rgba(255,255,255,0.72)'; archCtx.font = '28px Arial';
    archCtx.fillText('探索 AI 自動化的未來', 320, 138);
    const archTex = new THREE.CanvasTexture(archCan);
    const archSign = new THREE.Mesh(
      new THREE.PlaneGeometry(6.4, 1.6),
      new THREE.MeshBasicMaterial({ map: archTex, side: THREE.DoubleSide }),
    );
    archSign.position.set(0, 6.2, 12); scene.add(archSign);

    // TED Billboards
    BILLBOARD_DEFS.forEach(({ main, sub, color, pos, ry }) => {
      const board = buildBillboard(main, sub, color);
      board.position.set(...pos); board.rotation.y = ry; scene.add(board);
    });

    // Booths
    const boothStates: BoothState[] = BOOTH_DEFS.map((def, i) => {
      const grp = buildBooth(def.color, def.nameZh, def.nameEn, gmap);
      grp.position.set(...def.pos); grp.rotation.y = def.rot; scene.add(grp);

      // Floating balloon above booth
      const balloon = new THREE.Mesh(new THREE.SphereGeometry(0.4, 10, 8), toon(def.color, gmap));
      balloon.position.set(def.pos[0], def.pos[1] + 5.5, def.pos[2]); scene.add(balloon);
      const string = new THREE.Mesh(
        new THREE.CylinderGeometry(0.015, 0.015, 1.5, 4),
        toon(0x888888, gmap),
      );
      string.position.set(def.pos[0], def.pos[1] + 4.3, def.pos[2]); scene.add(string);

      return { pos: new THREE.Vector3(...def.pos), nameZh: def.nameZh, msg: def.msg, visited: false, index: i };
    });
    boothsRef.current = boothStates;

    // Walking animals
    const walkerDefs = [
      { builder: buildBear,    radius: 11.5, speed: 0.28, startA: 0.0 },
      { builder: buildBunny,   radius: 8.5,  speed: 0.50, startA: 1.6 },
      { builder: buildPenguin, radius: 14.5, speed: 0.22, startA: 3.2 },
      { builder: buildCat,     radius: 6.5,  speed: 0.60, startA: 4.7 },
      { builder: buildBunny,   radius: 12.0, speed: 0.35, startA: 2.4 },
    ];
    const walkers: { group: THREE.Group; radius: number; speed: number; angle: number; bobOff: number }[] = [];
    walkerDefs.forEach(def => {
      const gr = def.builder(gmap);
      gr.scale.setScalar(0.72); scene.add(gr);
      walkers.push({ group: gr, radius: def.radius, speed: def.speed, angle: def.startA, bobOff: Math.random() * Math.PI * 2 });
    });

    // Player RAIBOT
    const player = buildRAIBOT(gmap);
    player.position.set(0, 0, 10); player.castShadow = true; scene.add(player);

    // Floating stars
    const starMat = new THREE.MeshBasicMaterial({ color: 0xFFD700 });
    const stars: { mesh: THREE.Mesh; phase: number }[] = [];
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2;
      const star = new THREE.Mesh(new THREE.OctahedronGeometry(0.14, 0), starMat);
      star.position.set(Math.cos(a) * 5.8, 3.5, Math.sin(a) * 5.8);
      scene.add(star); stars.push({ mesh: star, phase: i * 0.62 });
    }

    // ── HK Elements ──────────────────────────────────────────────────────────

    // 叮叮電車 × 2 — ride along perimeter paths
    const trams: { group: THREE.Group; angle: number; speed: number; radius: number }[] = [];
    ([
      { angle: 0.0, speed: 0.18, radius: 20 },
      { angle: Math.PI, speed: -0.14, radius: 18 },
    ]).forEach(def => {
      const tram = buildTram(gmap);
      tram.scale.setScalar(0.85);
      scene.add(tram);
      trams.push({ group: tram, ...def });
    });

    // 霓虹招牌 — vertical neon signs on lamp posts
    const neonDefs = [
      { text: 'AI', color: 0xFF0066, pos: [-11, 3.5, -8] as [number, number, number] },
      { text: '自動', color: 0x00FFCC, pos: [11, 3.5, -8] as [number, number, number] },
      { text: '智能', color: 0xFFAA00, pos: [-11, 3.5, 8] as [number, number, number] },
      { text: '科技', color: 0x4488FF, pos: [11, 3.5, 8] as [number, number, number] },
    ];
    neonDefs.forEach(({ text, color, pos }) => {
      // Lamp post
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.1, 4.5, 8), toon(0x444444, gmap));
      post.position.set(pos[0], 2.25, pos[2]); scene.add(post);
      const sign = buildNeonSign(text, color, gmap);
      sign.position.set(pos[0], pos[1], pos[2]);
      sign.rotation.y = Math.atan2(pos[0], pos[2]);
      scene.add(sign);
    });

    // 竹棚 — bamboo scaffolding structures at corners
    ([
      [-18, 0, -15, -0.3],
      [16, 0, -17, 0.4],
    ] as number[][]).forEach(([x, y, z, ry]) => {
      const scaff = buildBambooScaffolding(gmap);
      scaff.position.set(x, y, z); scaff.rotation.y = ry; scene.add(scaff);
    });

    // 獅子頭 × 3 — bobbing around the perimeter
    const lions: { group: THREE.Group; angle: number; speed: number; radius: number; bobOff: number }[] = [];
    [0, 2.1, 4.2].forEach((startA, i) => {
      const lion = buildLionHead(gmap);
      lion.scale.setScalar(0.62);
      scene.add(lion);
      lions.push({ group: lion, angle: startA, speed: 0.3 + i * 0.1, radius: 9 + i * 1.5, bobOff: i * 1.1 });
    });

    // Particles
    const particles: Particle[] = [];
    const pGeo = new THREE.SphereGeometry(0.1, 4, 3);
    const pColors = [0xFF6B6B, 0xFFD700, 0x4ECDC4, 0xFF8B94, 0xA8E6CF];

    function spawnParticles(pos: THREE.Vector3) {
      for (let i = 0; i < 22; i++) {
        const mat = new THREE.MeshBasicMaterial({ color: pColors[i % pColors.length] });
        const mesh = new THREE.Mesh(pGeo, mat);
        mesh.position.copy(pos).add(new THREE.Vector3(0, 1.5, 0));
        const vel = new THREE.Vector3(
          (Math.random() - 0.5) * 8, 3 + Math.random() * 5, (Math.random() - 0.5) * 8,
        );
        scene.add(mesh); particles.push({ mesh, vel, life: 1.0 });
      }
    }

    // Key controls
    const onKeyDown = (e: KeyboardEvent) => {
      keysRef.current[e.code] = true;
      if (['ArrowUp', 'ArrowDown', 'Space'].includes(e.code)) e.preventDefault();
      if (e.code === 'KeyE') {
        const near = boothsRef.current.find(b => {
          const dx = b.pos.x - player.position.x;
          const dz = b.pos.z - player.position.z;
          return Math.sqrt(dx * dx + dz * dz) < 4.8 && !b.visited;
        });
        if (near) {
          near.visited = true;
          visitedRef.current.add(near.index);
          const count = visitedRef.current.size;
          setVisitedCount(count);
          setPopupMsg(near.msg);
          setShowPopup(true);
          spawnParticles(near.pos);
          if (count === 5) setTimeout(() => setShowCelebration(true), 900);
        }
      }
    };
    const onKeyUp = (e: KeyboardEvent) => { keysRef.current[e.code] = false; };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    const onResize = () => {
      camera.aspect = el.clientWidth / el.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(el.clientWidth, el.clientHeight);
    };
    window.addEventListener('resize', onResize);

    // Animation loop
    const clock = new THREE.Clock();
    let animId = 0;
    const camTarget = new THREE.Vector3();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const dt = Math.min(clock.getDelta(), 0.05);
      const t = clock.getElapsedTime();

      // Player movement
      const dir = new THREE.Vector3();
      const k = keysRef.current; const j = joyRef.current;
      if (k['KeyW'] || k['ArrowUp']    || j.y < -0.3) dir.z -= 1;
      if (k['KeyS'] || k['ArrowDown']  || j.y >  0.3) dir.z += 1;
      if (k['KeyA'] || k['ArrowLeft']  || j.x < -0.3) dir.x -= 1;
      if (k['KeyD'] || k['ArrowRight'] || j.x >  0.3) dir.x += 1;
      if (dir.lengthSq() > 0) {
        dir.normalize();
        player.position.x = Math.max(-24, Math.min(24, player.position.x + dir.x * 5.5 * dt));
        player.position.z = Math.max(-24, Math.min(24, player.position.z + dir.z * 5.5 * dt));
        player.rotation.y = Math.atan2(dir.x, dir.z);
      }
      player.position.y = Math.sin(t * 3.5) * 0.07;

      // Camera follow — low 小人國 perspective
      camTarget.set(player.position.x, player.position.y + 3.8, player.position.z + 9.5);
      camera.position.lerp(camTarget, 0.07);
      camera.lookAt(player.position.x, player.position.y + 0.8, player.position.z);

      // HK Trams
      trams.forEach(tr => {
        tr.angle += tr.speed * dt;
        tr.group.position.set(
          Math.cos(tr.angle) * tr.radius,
          0,
          Math.sin(tr.angle) * tr.radius,
        );
        // Face direction of travel
        const nx = Math.cos(tr.angle + Math.sign(tr.speed) * 0.02) * tr.radius;
        const nz = Math.sin(tr.angle + Math.sign(tr.speed) * 0.02) * tr.radius;
        tr.group.lookAt(nx, 0, nz);
      });

      // 獅子頭 — bobbing with head wobble
      lions.forEach(li => {
        li.angle += li.speed * dt;
        li.group.position.set(
          Math.cos(li.angle) * li.radius,
          1.8 + Math.sin(t * 3.5 + li.bobOff) * 0.3,
          Math.sin(li.angle) * li.radius,
        );
        li.group.rotation.y = li.angle + Math.PI;
        li.group.rotation.z = Math.sin(t * 4 + li.bobOff) * 0.15;
      });

      // Animal walkers
      walkers.forEach(w => {
        w.angle += w.speed * dt;
        w.group.position.set(
          Math.cos(w.angle) * w.radius,
          Math.sin(t * 2 + w.bobOff) * 0.09,
          Math.sin(w.angle) * w.radius,
        );
        const nx = Math.cos(w.angle + 0.02) * w.radius;
        const nz = Math.sin(w.angle + 0.02) * w.radius;
        w.group.lookAt(nx, w.group.position.y, nz);
        w.group.rotation.z = Math.sin(t * 8 + w.bobOff) * 0.06;
      });

      // Bounce balls
      balls.forEach(b => {
        b.mesh.position.y = b.baseY + Math.abs(Math.sin(t * 2.5 + b.phase)) * 0.9;
        b.mesh.rotation.y += dt * 1.5;
      });

      // Orbiting stars
      stars.forEach((s, i) => {
        const a = (i / 10) * Math.PI * 2 + t * 0.4;
        s.mesh.position.set(Math.cos(a) * 5.8, 3.5 + Math.sin(t * 1.5 + s.phase) * 0.3, Math.sin(a) * 5.8);
        s.mesh.rotation.y += dt * 2;
      });

      // Particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life -= dt * 1.2;
        if (p.life <= 0) { scene.remove(p.mesh); particles.splice(i, 1); }
        else { p.vel.y -= 9.8 * dt; p.mesh.position.addScaledVector(p.vel, dt); p.mesh.scale.setScalar(p.life); }
      }

      // Proximity E-key detection
      let nearAny = false; let nearName = '';
      boothsRef.current.forEach(b => {
        const dx = b.pos.x - player.position.x;
        const dz = b.pos.z - player.position.z;
        if (Math.sqrt(dx * dx + dz * dz) < 4.8 && !b.visited) { nearAny = true; nearName = b.nameZh; }
      });
      if (nearAny !== showEKeyRef.current) { showEKeyRef.current = nearAny; setShowEKey(nearAny); }
      if (nearName !== nearNameRef.current) { nearNameRef.current = nearName; if (nearName) setNearBoothName(nearName); }

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('resize', onResize);
      renderer.dispose();
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
    };
  }, [gameStarted]);

  const dpadStart = useCallback((dx: number, dy: number) => { joyRef.current = { x: dx, y: dy }; }, []);
  const dpadEnd = useCallback(() => { joyRef.current = { x: 0, y: 0 }; }, []);
  const pressE = useCallback(() => { keysRef.current['KeyE'] = true; }, []);
  const releaseE = useCallback(() => { keysRef.current['KeyE'] = false; }, []);

  const visitedDots = Array.from({ length: 5 }, (_, i) => i < visitedCount);

  return (
    <div className="relative w-full h-full overflow-hidden bg-sky-900">
      {/* Three.js canvas */}
      <div ref={mountRef} className="absolute inset-0" />

      {/* ── Welcome overlay ────────────────────────────────────────────────── */}
      {!gameStarted && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-gradient-to-b from-blue-950/96 to-slate-900/96 backdrop-blur-sm">
          <div className="text-center max-w-md w-full px-6">
            <div className="text-7xl mb-3 select-none">🎪</div>
            <h2 className="text-4xl font-black text-white mb-1 tracking-tight">RecruitAI AI嘉年華</h2>
            <p className="text-blue-300 text-base mb-7">探索 5 個 AI 展位，發現業務自動化的無限可能</p>

            <div className="bg-white/10 border border-white/20 rounded-2xl p-5 mb-7 text-left space-y-4">
              <h3 className="text-white font-bold text-base text-center mb-2">🎮 操作指南</h3>
              <div className="flex items-center gap-3">
                <div className="flex gap-1 shrink-0">
                  {['W','A','S','D'].map(k => (
                    <kbd key={k} className="bg-white text-slate-900 font-black text-sm w-8 h-8 rounded-lg shadow-md flex items-center justify-center">{k}</kbd>
                  ))}
                </div>
                <span className="text-blue-200 text-sm">或方向鍵 — 移動 RAIBOT</span>
              </div>
              <div className="flex items-center gap-3">
                <kbd className="bg-yellow-400 text-slate-900 font-black text-3xl w-16 h-16 rounded-xl shadow-lg flex items-center justify-center animate-bounce shrink-0">E</kbd>
                <div>
                  <p className="text-white font-semibold text-base">靠近展位後按 E</p>
                  <p className="text-blue-300 text-sm">解鎖 AI 功能介紹！</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-2xl shrink-0">🎯</span>
                <span className="text-blue-200 text-sm">探索全部 5 個展位，解鎖最終驚喜！</span>
              </div>
            </div>

            <button
              onClick={startGame}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-400 hover:to-blue-600 text-white font-black text-xl py-4 rounded-2xl shadow-2xl transform hover:scale-105 transition-all duration-200 border-2 border-blue-400/60"
            >
              🚀 開始探索！
            </button>
            <p className="text-blue-500 text-xs mt-3">手機用戶：使用螢幕方向鍵控制</p>
          </div>
        </div>
      )}

      {/* ── Progress tracker ──────────────────────────────────────────────── */}
      {gameStarted && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 bg-black/65 rounded-full px-4 py-2 border border-white/20 backdrop-blur-sm">
          <span className="text-white/80 text-xs font-semibold mr-1">展位</span>
          {visitedDots.map((v, i) => (
            <div key={i} className={`w-3 h-3 rounded-full transition-all duration-500 ${v ? 'bg-yellow-400 shadow-lg shadow-yellow-400/60 scale-125' : 'bg-white/25'}`} />
          ))}
          <span className="text-yellow-400 text-xs font-black ml-1">{visitedCount}/5</span>
        </div>
      )}

      {/* ── E-key prompt ──────────────────────────────────────────────────── */}
      {gameStarted && showEKey && (
        <div className="absolute bottom-40 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2 pointer-events-none">
          <div className="animate-bounce flex flex-col items-center gap-2">
            <kbd className="bg-yellow-400 text-slate-900 font-black text-5xl w-24 h-24 rounded-2xl flex items-center justify-center shadow-2xl border-4 border-yellow-300 ring-4 ring-yellow-400/40">
              E
            </kbd>
            <div className="bg-black/80 text-white font-bold text-sm px-5 py-2 rounded-full border border-yellow-400/50">
              按 <span className="text-yellow-400">E</span> 探索「{nearBoothName}」
            </div>
          </div>
        </div>
      )}

      {/* ── Booth popup ───────────────────────────────────────────────────── */}
      {gameStarted && showPopup && (
        <div className="absolute inset-0 z-25 flex items-center justify-center p-6 bg-black/40">
          <div className="bg-slate-900/95 border border-blue-500/40 rounded-2xl p-6 max-w-sm w-full shadow-2xl backdrop-blur-md">
            <div className="text-white text-base leading-relaxed whitespace-pre-line">{popupMsg}</div>
            <div className="mt-5 flex gap-3">
              <button onClick={closePopup} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 rounded-xl transition-colors">
                繼續探索 →
              </button>
              <a href="/vibe-demo/recruitai/consultation" className="flex-1 text-center bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2.5 rounded-xl transition-colors">
                免費諮詢
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ── Celebration ───────────────────────────────────────────────────── */}
      {showCelebration && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/85 backdrop-blur-sm">
          <div className="text-center px-6">
            <div className="text-8xl mb-4 animate-bounce select-none">🎉</div>
            <h2 className="text-4xl font-black text-yellow-400 mb-2">恭喜！全部探索完成！</h2>
            <p className="text-white text-lg mb-2">您已全面了解 RecruitAI 的 AI 解決方案</p>
            <p className="text-blue-300 text-sm mb-8">立即預約免費諮詢，讓您的業務自動化起飛！</p>
            <a
              href="/vibe-demo/recruitai/consultation"
              className="inline-block bg-gradient-to-r from-yellow-400 to-orange-500 text-slate-900 font-black text-xl px-12 py-4 rounded-2xl shadow-2xl hover:scale-105 transition-all duration-200 mb-4"
            >
              🚀 立即免費諮詢
            </a>
            <br />
            <button onClick={closeCelebration} className="text-white/50 text-sm hover:text-white transition-colors mt-2">
              繼續探索世界
            </button>
          </div>
        </div>
      )}

      {/* ── Mobile D-pad ──────────────────────────────────────────────────── */}
      {gameStarted && isMobile && (
        <div className="absolute bottom-28 right-6 z-20 select-none">
          <div className="relative w-36 h-36">
            <button className="absolute top-0 left-1/2 -translate-x-1/2 w-11 h-11 bg-white/20 active:bg-white/50 rounded-xl border border-white/30 flex items-center justify-center text-white text-lg"
              onPointerDown={() => dpadStart(0,-1)} onPointerUp={dpadEnd} onPointerLeave={dpadEnd}>▲</button>
            <button className="absolute bottom-0 left-1/2 -translate-x-1/2 w-11 h-11 bg-white/20 active:bg-white/50 rounded-xl border border-white/30 flex items-center justify-center text-white text-lg"
              onPointerDown={() => dpadStart(0,1)} onPointerUp={dpadEnd} onPointerLeave={dpadEnd}>▼</button>
            <button className="absolute top-1/2 -translate-y-1/2 left-0 w-11 h-11 bg-white/20 active:bg-white/50 rounded-xl border border-white/30 flex items-center justify-center text-white text-lg"
              onPointerDown={() => dpadStart(-1,0)} onPointerUp={dpadEnd} onPointerLeave={dpadEnd}>◄</button>
            <button className="absolute top-1/2 -translate-y-1/2 right-0 w-11 h-11 bg-white/20 active:bg-white/50 rounded-xl border border-white/30 flex items-center justify-center text-white text-lg"
              onPointerDown={() => dpadStart(1,0)} onPointerUp={dpadEnd} onPointerLeave={dpadEnd}>►</button>
            <button className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-11 h-11 bg-yellow-400 active:bg-yellow-300 rounded-xl border border-yellow-300 flex items-center justify-center text-slate-900 font-black text-lg shadow-lg"
              onPointerDown={pressE} onPointerUp={releaseE} onPointerLeave={releaseE}>E</button>
          </div>
        </div>
      )}

      {/* ── Desktop hint ──────────────────────────────────────────────────── */}
      {gameStarted && !isMobile && (
        <div className="absolute bottom-4 left-4 z-20 space-y-1 pointer-events-none">
          <div className="text-white/45 text-xs">WASD / 方向鍵 移動</div>
          <div className="text-white/45 text-xs">靠近展位後按 <kbd className="bg-white/20 px-1.5 py-0.5 rounded text-white/70">E</kbd> 互動</div>
        </div>
      )}
    </div>
  );
}
