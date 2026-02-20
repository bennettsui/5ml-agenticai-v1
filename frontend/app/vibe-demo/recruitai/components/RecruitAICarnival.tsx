'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import Link from 'next/link';
import { X, Zap } from 'lucide-react';

// ─── Constants ────────────────────────────────────────────────────────────────
const MOVE_SPEED = 7;
const TURN_SPEED = 2.0;
const PLAYER_HEIGHT = 1.8;
const BOUNDARY_RADIUS = 26;
const INTERACT_DIST = 5;

// ─── Booth Data ───────────────────────────────────────────────────────────────
interface BoothConfig {
  id: string;
  x: number;
  z: number;
  title: string;
  subtitle: string;
  color: number;
  roofColor: number;
  messages: string[];
}

const BOOTHS: BoothConfig[] = [
  {
    id: 'invoice',
    x: -9, z: -13,
    title: '📄 Invoice Ninja',
    subtitle: '發票忍者道場',
    color: 0x3b82f6, roofColor: 0x1d4ed8,
    messages: [
      '💥 KABOOM! Papers everywhere!\n\n🤖 Invoice AI Agent:\n• Scans 500+ invoices/day\n• 80% less manual entry\n• Never calls in sick!\n• Reads your handwriting (unlike your staff)\n\nOld way: 10 hrs/week on invoices 😓\nAI way: 10 mins/week 😎\n\n🔧 Rebuilding the ninja dojo...',
      '🎆 SPLAT! Receipts in the sky!\n\nFun fact: Our AI has never once said\n"Can you rescan that? It was blurry."\n\nIt just... handles it. Like a ninja 🥷\n\n📊 Processes: Invoices, receipts, POs\n✅ Accuracy: 99.9%\n⚡ Speed: Instant\n\n📚 Re-stacking the papers...',
    ],
  },
  {
    id: 'customer',
    x: 9, z: -13,
    title: '💬 ChatBot Café',
    subtitle: '客服咖啡廳',
    color: 0x10b981, roofColor: 0x064e3b,
    messages: [
      '☕ CRASH! Espresso machine exploded!\n\n💬 Customer Service AI:\n• 15-min response (guaranteed!)\n• Works 24/7 — no coffee needed\n• Handles 200+ queries/day\n• Never says "Can I put you on hold?"\n\n3AM customer: "Is it open?"\nOld: 😴 zzz...\nAI: "Yes! Here\'s our menu! 😊"\n\n🏗️ Brewing the café back...',
      '💥 POW! Chat bubbles everywhere!\n\nOur AI once handled 47 customers\nsimultaneously during a lunch rush.\n\nNo one waited. No one rage-quit.\nOne customer said it was "suspiciously good." 👀\n\n⚡ Response time: 15 minutes\n❤️ Satisfaction rate: 94%\n📱 Channels: WhatsApp, web, email\n\n☕ Re-installing the espresso machine...',
    ],
  },
  {
    id: 'bi',
    x: 0, z: -20,
    title: '🔮 BI Crystal Ball',
    subtitle: '商業智能水晶球',
    color: 0xf59e0b, roofColor: 0x78350f,
    messages: [
      '✨ SHATTER! Crystal fragments everywhere!\n\n📊 Business Intelligence AI:\n• Real-time sales dashboard\n• Weekly auto-reports (no pivot tables!)\n• Predicts your top-selling products\n• 50% faster decisions\n\nBefore: "I think sales are okay..."\nAfter: "Sales up 34% vs last Tuesday!"\n\n🔮 Re-growing the crystal...',
      '💫 ZAP! The future exploded!\n\nThis crystal actually predicted:\n🔮 Monday meetings: still useless\n🔮 Your competitors: also watching data\n🔮 Best time to book a consultation: NOW\n\n📈 Data sources we connect:\nSales • Inventory • Customer • Social\n\n⚡ Recharging the mystic energies...',
    ],
  },
  {
    id: 'launch',
    x: -14, z: -5,
    title: '🚀 3-Day Launch Pad',
    subtitle: '快速發射台',
    color: 0x8b5cf6, roofColor: 0x4c1d95,
    messages: [
      '🚀 WHOOSH! Rocket went sideways!\n\n⚡ Deployment Timeline:\n• Day 1: Free consultation + needs analysis\n• Day 2: Custom AI workflow design\n• Day 3: AI goes LIVE! 🎉\n\nNo tech team needed.\nNo IT department required.\nNo PhD in AI necessary.\n\nJust... 3 days to transform your business!\n\n🛠️ Fixing the launch pad...',
      '💥 KA-BOOM! Even rockets make mistakes!\n\n(Our client deployments have a\n0% explosion rate though ✅)\n\nWe\'ve launched AI for:\n🛍️ Retail shops\n🍜 Restaurants & F&B\n💼 Finance & accounting firms\n📦 Logistics companies\n\nWhich one are you?\n\n🔥 Re-fueling for re-launch...',
    ],
  },
  {
    id: 'roi',
    x: 14, z: -5,
    title: '🏆 ROI Fortune Wheel',
    subtitle: '投資回報幸運輪',
    color: 0xef4444, roofColor: 0x7f1d1d,
    messages: [
      '🎡 CRASH! Wheel spun into space!\n\n💰 ROI Timeline:\n• Month 1: 30% time saved\n• Month 3: Investment fully recovered\n• Month 6: Pure profit mode activated 🤑\n• Month 12: "Why didn\'t I start earlier?!"\n\nMath check:\nBusiness Plan = HK$18,000/mo\n1 staff member = HK$25,000+/mo\nAI works 24/7 vs 8hrs/day\n\nWinner: obvious 🏆\n\n🎯 Spinning the wheel back to Earth...',
      '💥 BANG! Gold coins raining down!\n\n🪙 Each coin = 1 invoice auto-processed\n💰 Each coin = 1 query answered at 3AM\n🏆 Each coin = 1 insight auto-generated\n\nMultiply that by 365 days...\nMultiply by 3-5 years...\n\nThat\'s a lot of coins! 💰💰💰\n\n🏗️ Re-counting the gold...',
    ],
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function makeCanvasTexture(
  width: number, height: number,
  draw: (ctx: CanvasRenderingContext2D) => void
): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = width; c.height = height;
  const ctx = c.getContext('2d')!;
  draw(ctx);
  return new THREE.CanvasTexture(c);
}

function hex2css(hex: number): string {
  return '#' + hex.toString(16).padStart(6, '0');
}

function createBooth(booth: BoothConfig): THREE.Group {
  const group = new THREE.Group();

  const mainMat = new THREE.MeshLambertMaterial({ color: booth.color });
  const roofMat = new THREE.MeshLambertMaterial({ color: booth.roofColor });
  const lightMat = new THREE.MeshLambertMaterial({ color: 0xfafafa });
  const woodMat  = new THREE.MeshLambertMaterial({ color: 0xd4a45a });

  // Platform
  const platform = new THREE.Mesh(new THREE.BoxGeometry(4.5, 0.25, 3.5), lightMat);
  platform.position.y = 0.125;
  group.add(platform);

  // Back wall
  const backWall = new THREE.Mesh(new THREE.BoxGeometry(4.5, 2.8, 0.25), mainMat);
  backWall.position.set(0, 1.65, -1.6);
  group.add(backWall);

  // Side walls
  [-2.12, 2.12].forEach(x => {
    const sw = new THREE.Mesh(new THREE.BoxGeometry(0.25, 2.8, 3.5), mainMat);
    sw.position.set(x, 1.65, 0);
    group.add(sw);
  });

  // Counter top
  const counter = new THREE.Mesh(new THREE.BoxGeometry(4.0, 0.18, 0.9), lightMat);
  counter.position.set(0, 1.12, 0.95);
  group.add(counter);

  // Counter front
  const counterFront = new THREE.Mesh(new THREE.BoxGeometry(4.0, 0.9, 0.18), mainMat);
  counterFront.position.set(0, 0.67, 1.38);
  group.add(counterFront);

  // Roof (cone)
  const roof = new THREE.Mesh(new THREE.ConeGeometry(3.4, 1.8, 4), roofMat);
  roof.position.y = 3.7;
  roof.rotation.y = Math.PI / 4;
  group.add(roof);

  // Roof support
  const roofBase = new THREE.Mesh(new THREE.BoxGeometry(4.5, 0.2, 3.5), roofMat);
  roofBase.position.y = 2.9;
  group.add(roofBase);

  // Center pole
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 5.0, 8), woodMat);
  pole.position.set(0, 2.5, -1.6);
  group.add(pole);

  // Colorful bunting strips
  const buntingColors = [0xff6b6b, 0xfbbf24, 0x34d399, 0x60a5fa, 0xc084fc];
  for (let i = 0; i < 8; i++) {
    const strip = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 0.35, 0.04),
      new THREE.MeshLambertMaterial({ color: buntingColors[i % buntingColors.length] })
    );
    strip.position.set(-1.75 + i * 0.5, 2.65, 1.6);
    group.add(strip);
  }

  // Sign texture
  const signTex = makeCanvasTexture(512, 200, ctx => {
    const g = ctx.createLinearGradient(0, 0, 512, 0);
    g.addColorStop(0, hex2css(booth.color));
    g.addColorStop(1, hex2css(booth.roofColor));
    ctx.fillStyle = g;
    ctx.roundRect(6, 6, 500, 188, 18);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 38px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(booth.title, 256, 72);
    ctx.font = '24px Arial';
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.fillText(booth.subtitle, 256, 112);
    ctx.font = '18px Arial';
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.fillText('Press E to DESTROY & learn! 💥', 256, 152);
  });

  const sign = new THREE.Mesh(
    new THREE.PlaneGeometry(3.2, 1.25),
    new THREE.MeshLambertMaterial({ map: signTex, transparent: true })
  );
  sign.position.set(0, 2.15, -1.47);
  group.add(sign);

  // Booth-specific props
  addBoothProps(booth.id, group, mainMat);

  return group;
}

function addBoothProps(id: string, group: THREE.Group, mainMat: THREE.MeshLambertMaterial) {
  if (id === 'invoice') {
    // Stacked papers
    for (let i = 0; i < 4; i++) {
      const paper = new THREE.Mesh(
        new THREE.BoxGeometry(0.35, 0.03, 0.45),
        new THREE.MeshLambertMaterial({ color: 0xffffff })
      );
      paper.position.set(-0.8 + i * 0.45, 1.22 + i * 0.04, 0.8);
      paper.rotation.y = (Math.random() - 0.5) * 0.4;
      group.add(paper);
    }
    // Flying paper
    const flyPaper = new THREE.Mesh(
      new THREE.BoxGeometry(0.3, 0.4, 0.02),
      new THREE.MeshLambertMaterial({ color: 0xfef9c3 })
    );
    flyPaper.position.set(1.2, 2.1, 0.5);
    flyPaper.rotation.z = 0.4;
    group.add(flyPaper);
  }

  if (id === 'customer') {
    // Chat bubble sphere
    const bubble = new THREE.Mesh(
      new THREE.SphereGeometry(0.38, 14, 14),
      new THREE.MeshLambertMaterial({ color: 0x34d399 })
    );
    bubble.position.set(0.9, 1.9, 0.6);
    group.add(bubble);
    const bubble2 = new THREE.Mesh(
      new THREE.SphereGeometry(0.22, 10, 10),
      new THREE.MeshLambertMaterial({ color: 0x6ee7b7 })
    );
    bubble2.position.set(1.35, 1.55, 0.5);
    group.add(bubble2);
    // Clock
    const clock = new THREE.Mesh(
      new THREE.CylinderGeometry(0.3, 0.3, 0.08, 20),
      new THREE.MeshLambertMaterial({ color: 0xfafafa })
    );
    clock.position.set(-0.8, 1.65, 1.0);
    clock.rotation.x = Math.PI / 2;
    group.add(clock);
  }

  if (id === 'bi') {
    // Crystal ball pedestal + orb
    const ped = new THREE.Mesh(
      new THREE.CylinderGeometry(0.28, 0.35, 0.5, 14),
      new THREE.MeshLambertMaterial({ color: 0x7c5c3a })
    );
    ped.position.set(0, 1.38, 0.7);
    group.add(ped);
    const orb = new THREE.Mesh(
      new THREE.SphereGeometry(0.42, 18, 18),
      new THREE.MeshLambertMaterial({ color: 0xfbbf24, transparent: true, opacity: 0.8 })
    );
    orb.position.set(0, 1.95, 0.7);
    group.add(orb);
    // Mini bar chart
    [0.5, 0.7, 0.4, 0.9].forEach((h, i) => {
      const bar = new THREE.Mesh(
        new THREE.BoxGeometry(0.2, h, 0.2),
        new THREE.MeshLambertMaterial({ color: [0x3b82f6, 0x10b981, 0xf59e0b, 0xef4444][i] })
      );
      bar.position.set(-0.9 + i * 0.3, 1.15 + h / 2, 0.7);
      group.add(bar);
    });
  }

  if (id === 'launch') {
    // Rocket
    const body = new THREE.Mesh(
      new THREE.CylinderGeometry(0.18, 0.22, 0.9, 10),
      new THREE.MeshLambertMaterial({ color: 0xa78bfa })
    );
    body.position.set(0.6, 1.75, 0.7);
    group.add(body);
    const nose = new THREE.Mesh(
      new THREE.ConeGeometry(0.18, 0.45, 10),
      new THREE.MeshLambertMaterial({ color: 0x7c3aed })
    );
    nose.position.set(0.6, 2.42, 0.7);
    group.add(nose);
    const flame = new THREE.Mesh(
      new THREE.ConeGeometry(0.12, 0.35, 8),
      new THREE.MeshLambertMaterial({ color: 0xfbbf24 })
    );
    flame.rotation.z = Math.PI;
    flame.position.set(0.6, 1.12, 0.7);
    group.add(flame);
    // Launch pad
    const pad = new THREE.Mesh(
      new THREE.CylinderGeometry(0.5, 0.6, 0.15, 12),
      new THREE.MeshLambertMaterial({ color: 0x94a3b8 })
    );
    pad.position.set(0.6, 1.2, 0.7);
    group.add(pad);
  }

  if (id === 'roi') {
    // Trophy
    const base = new THREE.Mesh(
      new THREE.BoxGeometry(0.55, 0.12, 0.38),
      new THREE.MeshLambertMaterial({ color: 0xd4a017 })
    );
    base.position.set(0.6, 1.2, 0.7);
    group.add(base);
    const stem = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.08, 0.3, 8),
      new THREE.MeshLambertMaterial({ color: 0xfbbf24 })
    );
    stem.position.set(0.6, 1.41, 0.7);
    group.add(stem);
    const cup = new THREE.Mesh(
      new THREE.CylinderGeometry(0.22, 0.14, 0.5, 14),
      new THREE.MeshLambertMaterial({ color: 0xfbbf24 })
    );
    cup.position.set(0.6, 1.71, 0.7);
    group.add(cup);
    // Coins
    [0, 1, 2].forEach(i => {
      const coin = new THREE.Mesh(
        new THREE.CylinderGeometry(0.12, 0.12, 0.04, 12),
        new THREE.MeshLambertMaterial({ color: 0xfbbf24 })
      );
      coin.position.set(-0.6 + i * 0.3, 1.22, 0.8);
      coin.rotation.x = Math.random() * 0.8;
      group.add(coin);
    });
  }
}

function createRaibot(scene: THREE.Scene): THREE.Group {
  const group = new THREE.Group();
  const blueMat = new THREE.MeshLambertMaterial({ color: 0x2563eb });
  const dkBlueMat = new THREE.MeshLambertMaterial({ color: 0x1e40af });
  const whiteMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
  const blackMat = new THREE.MeshLambertMaterial({ color: 0x111827 });
  const goldMat = new THREE.MeshLambertMaterial({ color: 0xfbbf24 });
  const ltBlueMat = new THREE.MeshLambertMaterial({ color: 0x93c5fd });

  // Body
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.85, 1.1, 0.65), blueMat);
  body.position.y = 1.15;
  group.add(body);

  // Chest screen
  const screen = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.42, 0.06), dkBlueMat);
  screen.position.set(0, 1.15, 0.35);
  group.add(screen);

  // Screen indicator dots (like reference image)
  [-0.13, 0.13].forEach(x => {
    const dot = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 10), ltBlueMat);
    dot.position.set(x, 1.15, 0.38);
    group.add(dot);
  });

  // Head
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.7, 0.65), dkBlueMat);
  head.position.y = 1.95;
  group.add(head);

  // Eyes
  [-0.16, 0.16].forEach(x => {
    const eyeWhite = new THREE.Mesh(new THREE.SphereGeometry(0.11, 12, 12), whiteMat);
    eyeWhite.position.set(x, 1.97, 0.34);
    group.add(eyeWhite);
    const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.062, 10, 10), blackMat);
    pupil.position.set(x, 1.97, 0.44);
    group.add(pupil);
  });

  // Antenna
  const antennaStem = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.45, 8), ltBlueMat);
  antennaStem.position.set(0, 2.52, 0);
  group.add(antennaStem);
  const antennaBall = new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 10), goldMat);
  antennaBall.position.set(0, 2.77, 0);
  group.add(antennaBall);

  // Arms
  [-0.6, 0.6].forEach((x, i) => {
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.75, 0.22), blueMat);
    arm.position.set(x, 1.08, 0);
    arm.rotation.z = i === 0 ? 0.25 : -0.25;
    group.add(arm);
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.14, 10, 10), dkBlueMat);
    hand.position.set(x * 1.1, 0.72, 0);
    group.add(hand);
  });

  // Legs
  [-0.22, 0.22].forEach(x => {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.6, 0.28), dkBlueMat);
    leg.position.set(x, 0.3, 0);
    group.add(leg);
    const foot = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.18, 0.45), blackMat);
    foot.position.set(x, 0.0, 0.08);
    group.add(foot);
  });

  scene.add(group);
  return group;
}

function createDucky(scene: THREE.Scene, px: number, pz: number): THREE.Group {
  const group = new THREE.Group();
  const yellowMat = new THREE.MeshLambertMaterial({ color: 0xfbbf24 });
  const orangeMat = new THREE.MeshLambertMaterial({ color: 0xf97316 });
  const blackMat = new THREE.MeshLambertMaterial({ color: 0x111827 });
  const whiteMat = new THREE.MeshLambertMaterial({ color: 0xffffff });

  // Body
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.5, 14, 14), yellowMat);
  body.scale.y = 0.85;
  body.position.y = 0.55;
  group.add(body);

  // Head
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.35, 14, 14), yellowMat);
  head.position.set(0, 1.2, 0.15);
  group.add(head);

  // Beak
  const beak = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.25, 8), orangeMat);
  beak.rotation.x = Math.PI / 2;
  beak.position.set(0, 1.2, 0.5);
  group.add(beak);

  // Eyes
  [-0.12, 0.12].forEach(x => {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), whiteMat);
    eye.position.set(x, 1.28, 0.44);
    group.add(eye);
    const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.035, 6, 6), blackMat);
    pupil.position.set(x, 1.28, 0.49);
    group.add(pupil);
  });

  // Wings
  [-0.55, 0.55].forEach((x, i) => {
    const wing = new THREE.Mesh(new THREE.SphereGeometry(0.25, 10, 8), yellowMat);
    wing.scale.set(0.5, 0.7, 0.9);
    wing.position.set(x, 0.62, 0.05);
    wing.rotation.z = i === 0 ? -0.6 : 0.6;
    group.add(wing);
  });

  group.position.set(px, 0, pz);
  scene.add(group);
  return group;
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function RecruitAICarnival() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const animFrameRef = useRef<number>(0);

  // Player state (all refs to avoid game-loop state issues)
  const playerPos = useRef(new THREE.Vector3(0, PLAYER_HEIGHT, 9));
  const playerYaw = useRef(0);
  const keysHeld = useRef(new Set<string>());
  const nearestBoothIdRef = useRef<string | null>(null);
  const destroyingRef = useRef(false);
  const boothGroupsRef = useRef<Map<string, THREE.Group>>(new Map());
  const particlesRef = useRef<Array<{
    mesh: THREE.Mesh; vel: THREE.Vector3; life: number; maxLife: number;
  }>>([]);
  const raibotRef = useRef<THREE.Group | null>(null);
  const duckyRefs = useRef<THREE.Group[]>([]);
  const bounceBallsRef = useRef<Array<{ mesh: THREE.Mesh; baseY: number; phase: number }>>([]);
  const clockRef = useRef(new THREE.Clock());

  // UI state
  const [nearestBooth, setNearestBooth] = useState<string | null>(null);
  const [popup, setPopup] = useState<{ title: string; body: string } | null>(null);
  const [displayedText, setDisplayedText] = useState('');
  const [showHint, setShowHint] = useState(true);
  const typeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Typewriter ────────────────────────────────────────────────────────────
  const typewrite = useCallback((text: string) => {
    if (typeTimerRef.current) clearTimeout(typeTimerRef.current);
    setDisplayedText('');
    let i = 0;
    const tick = () => {
      i++;
      setDisplayedText(text.slice(0, i));
      if (i < text.length) {
        typeTimerRef.current = setTimeout(tick, 18);
      }
    };
    typeTimerRef.current = setTimeout(tick, 18);
  }, []);

  // ── Explode booth ─────────────────────────────────────────────────────────
  const explodeBooth = useCallback((boothId: string) => {
    if (destroyingRef.current) return;
    const scene = sceneRef.current;
    const group = boothGroupsRef.current.get(boothId);
    const boothData = BOOTHS.find(b => b.id === boothId);
    if (!scene || !group || !boothData) return;

    destroyingRef.current = true;
    group.visible = false;

    // Spawn particles
    const geos = [
      new THREE.BoxGeometry(0.2, 0.2, 0.2),
      new THREE.SphereGeometry(0.12, 6, 6),
    ];
    const particleColors = [
      boothData.color, boothData.roofColor, 0xfbbf24, 0xffffff, 0xff6b6b,
    ];
    for (let i = 0; i < 40; i++) {
      const geo = geos[Math.floor(Math.random() * geos.length)];
      const col = particleColors[Math.floor(Math.random() * particleColors.length)];
      const mesh = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ color: col }));
      mesh.position.set(
        boothData.x + (Math.random() - 0.5) * 3,
        1 + Math.random() * 3,
        boothData.z + (Math.random() - 0.5) * 3
      );
      const spd = 4 + Math.random() * 5;
      const angle = Math.random() * Math.PI * 2;
      const vel = new THREE.Vector3(
        Math.cos(angle) * spd,
        3 + Math.random() * 5,
        Math.sin(angle) * spd
      );
      scene.add(mesh);
      particlesRef.current.push({ mesh, vel, life: 0, maxLife: 1.8 });
    }

    // Show popup
    const msgs = boothData.messages;
    const msg = msgs[Math.floor(Math.random() * msgs.length)];
    setPopup({ title: boothData.title, body: msg });
    typewrite(msg);

    // Rebuild after 3.2s
    setTimeout(() => {
      group.visible = true;
      group.scale.setScalar(0.01);
      let t = 0;
      const grow = setInterval(() => {
        t += 0.06;
        group.scale.setScalar(Math.min(1, t * 1.8));
        if (t >= 0.6) { group.scale.setScalar(1); clearInterval(grow); destroyingRef.current = false; }
      }, 16);
    }, 3200);
  }, [typewrite]);

  // ── Three.js Init ─────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    rendererRef.current = renderer;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x93c5fd); // sky blue
    scene.fog = new THREE.FogExp2(0xbae6fd, 0.018);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(72, container.clientWidth / container.clientHeight, 0.1, 80);
    camera.position.copy(playerPos.current);
    cameraRef.current = camera;

    // ── Lighting ──────────────────────────────────────────────────────────
    scene.add(new THREE.AmbientLight(0xffffff, 0.9));
    const sun = new THREE.DirectionalLight(0xfff4d6, 1.3);
    sun.position.set(15, 25, 10);
    scene.add(sun);

    // ── Ground ────────────────────────────────────────────────────────────
    const gTex = makeCanvasTexture(512, 512, ctx => {
      const tileColors = ['#dcfce7', '#f0fdf4', '#d1fae5', '#ecfdf5'];
      const ts = 64;
      for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
        ctx.fillStyle = tileColors[(r + c) % 2 === 0 ? 0 : 1];
        ctx.fillRect(c * ts, r * ts, ts, ts);
      }
      ctx.strokeStyle = 'rgba(0,0,0,0.06)';
      ctx.lineWidth = 1;
      for (let i = 0; i <= 8; i++) {
        ctx.beginPath(); ctx.moveTo(i * ts, 0); ctx.lineTo(i * ts, 512); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, i * ts); ctx.lineTo(512, i * ts); ctx.stroke();
      }
    });
    gTex.wrapS = gTex.wrapT = THREE.RepeatWrapping;
    gTex.repeat.set(24, 24);
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(200, 200),
      new THREE.MeshLambertMaterial({ map: gTex })
    );
    ground.rotation.x = -Math.PI / 2;
    scene.add(ground);

    // ── Central plaza ─────────────────────────────────────────────────────
    const plazaTex = makeCanvasTexture(256, 256, ctx => {
      ctx.fillStyle = '#f1f5f9';
      ctx.arc(128, 128, 124, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 6;
      ctx.stroke();
    });
    const plaza = new THREE.Mesh(
      new THREE.CircleGeometry(6, 64),
      new THREE.MeshLambertMaterial({ map: plazaTex })
    );
    plaza.rotation.x = -Math.PI / 2;
    plaza.position.set(0, 0.02, -2);
    scene.add(plaza);

    // Fountain base
    const fBase = new THREE.Mesh(
      new THREE.CylinderGeometry(2.2, 2.4, 0.22, 32),
      new THREE.MeshLambertMaterial({ color: 0xe2e8f0 })
    );
    fBase.position.set(0, 0.11, -2);
    scene.add(fBase);
    const fPillar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.28, 0.35, 1.4, 14),
      new THREE.MeshLambertMaterial({ color: 0xcbd5e1 })
    );
    fPillar.position.set(0, 0.92, -2);
    scene.add(fPillar);
    const fBowl = new THREE.Mesh(
      new THREE.CylinderGeometry(0.75, 0.45, 0.28, 18),
      new THREE.MeshLambertMaterial({ color: 0x93c5fd })
    );
    fBowl.position.set(0, 1.76, -2);
    scene.add(fBowl);

    // ── Carnival booths ───────────────────────────────────────────────────
    BOOTHS.forEach(booth => {
      const g = createBooth(booth);
      g.position.set(booth.x, 0, booth.z);
      // Face center
      const angle = Math.atan2(-booth.x, -(booth.z - (-2)));
      g.rotation.y = angle;
      scene.add(g);
      boothGroupsRef.current.set(booth.id, g);
    });

    // ── Welcome arch ──────────────────────────────────────────────────────
    const archTex = makeCanvasTexture(512, 180, ctx => {
      const g = ctx.createLinearGradient(0, 0, 512, 0);
      g.addColorStop(0, '#1e40af'); g.addColorStop(1, '#7c3aed');
      ctx.fillStyle = g;
      ctx.roundRect(4, 4, 504, 172, 20);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 32px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('🎪 RecruitAIStudio Carnival', 256, 52);
      ctx.font = '20px Arial';
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.fillText('WASD = Move  ·  ◀▶ = Look  ·  E = Interact & DESTROY! 💥', 256, 96);
      ctx.fillText('Explore 5 AI booths to learn how AI transforms your business!', 256, 136);
    });
    const arch = new THREE.Mesh(
      new THREE.PlaneGeometry(5.5, 1.9),
      new THREE.MeshLambertMaterial({ map: archTex, transparent: true })
    );
    arch.position.set(0, 4.5, 6);
    scene.add(arch);

    // ── Characters ────────────────────────────────────────────────────────
    const raibot = createRaibot(scene);
    raibot.position.set(0, 0, -2);
    raibotRef.current = raibot;

    duckyRefs.current = [
      createDucky(scene, -2.5, 0.5),
      createDucky(scene, 2.5, 0.5),
    ];

    // ── Trees ─────────────────────────────────────────────────────────────
    const treeSpots = [
      [-22, -22], [22, -22], [-22, 22], [22, 22],
      [-18, 0], [18, 0], [0, -28], [0, 28],
      [-26, -10], [26, -10], [-24, 15], [24, 15],
      [-12, -26], [12, -26], [-15, 22], [15, 22],
    ];
    treeSpots.forEach(([tx, tz]) => {
      const tg = new THREE.Group();
      const trunkH = 1.8 + Math.random() * 1.2;
      const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.22, 0.3, trunkH, 8),
        new THREE.MeshLambertMaterial({ color: 0x92400e })
      );
      trunk.position.y = trunkH / 2;
      tg.add(trunk);
      const fC = [0x15803d, 0x16a34a, 0x4ade80, 0x22c55e][Math.floor(Math.random() * 4)];
      const foliage = new THREE.Mesh(
        new THREE.SphereGeometry(1.3 + Math.random() * 0.8, 12, 10),
        new THREE.MeshLambertMaterial({ color: fC })
      );
      foliage.position.y = trunkH + 0.8;
      tg.add(foliage);
      // Second foliage cluster
      const f2 = new THREE.Mesh(
        new THREE.SphereGeometry(0.85, 10, 8),
        new THREE.MeshLambertMaterial({ color: fC })
      );
      f2.position.set(0.5, trunkH + 1.5, 0);
      tg.add(f2);
      tg.position.set(tx, 0, tz);
      tg.rotation.y = Math.random() * Math.PI * 2;
      scene.add(tg);
    });

    // ── Bounce balls ──────────────────────────────────────────────────────
    const ballCols = [0xff6b6b, 0xfbbf24, 0x34d399, 0x60a5fa, 0xc084fc, 0xf472b6];
    for (let i = 0; i < 6; i++) {
      const ball = new THREE.Mesh(
        new THREE.SphereGeometry(0.32, 14, 14),
        new THREE.MeshLambertMaterial({ color: ballCols[i] })
      );
      const ang = (i / 6) * Math.PI * 2;
      const r = 4.5;
      ball.position.set(Math.cos(ang) * r, 0.5, Math.sin(ang) * r - 2);
      scene.add(ball);
      bounceBallsRef.current.push({ mesh: ball, baseY: 0.5, phase: i * (Math.PI / 3) });
    }

    // ── Colorful lamp posts ────────────────────────────────────────────────
    const lampPositions: [number, number][] = [[-6, 0], [6, 0], [-6, -8], [6, -8]];
    lampPositions.forEach(([lx, lz]) => {
      const post = new THREE.Mesh(
        new THREE.CylinderGeometry(0.07, 0.09, 3.5, 8),
        new THREE.MeshLambertMaterial({ color: 0x475569 })
      );
      post.position.set(lx, 1.75, lz);
      scene.add(post);
      const lamp = new THREE.Mesh(
        new THREE.SphereGeometry(0.22, 10, 10),
        new THREE.MeshLambertMaterial({ color: 0xfef08a })
      );
      lamp.position.set(lx, 3.6, lz);
      scene.add(lamp);
    });

    // ── Fence ─────────────────────────────────────────────────────────────
    const fenceN = 48;
    for (let i = 0; i < fenceN; i++) {
      const a = (i / fenceN) * Math.PI * 2;
      const post = new THREE.Mesh(
        new THREE.BoxGeometry(0.28, 1.6, 0.28),
        new THREE.MeshLambertMaterial({ color: 0xffffff })
      );
      post.position.set(Math.cos(a) * 28, 0.8, Math.sin(a) * 28);
      scene.add(post);
    }

    // ── Floating stars ────────────────────────────────────────────────────
    const starGeo = new THREE.BufferGeometry();
    const starVerts: number[] = [];
    for (let i = 0; i < 400; i++) {
      starVerts.push(
        (Math.random() - 0.5) * 80,
        10 + Math.random() * 20,
        (Math.random() - 0.5) * 80
      );
    }
    starGeo.setAttribute('position', new THREE.Float32BufferAttribute(starVerts, 3));
    const stars = new THREE.Points(
      starGeo,
      new THREE.PointsMaterial({ color: 0xfef9c3, size: 0.25, sizeAttenuation: true })
    );
    scene.add(stars);

    // ── Animation loop ────────────────────────────────────────────────────
    let prevT = performance.now();

    const loop = () => {
      animFrameRef.current = requestAnimationFrame(loop);
      const now = performance.now();
      const dt = Math.min((now - prevT) / 1000, 0.05);
      prevT = now;
      const elapsed = clockRef.current.getElapsedTime();

      // Player turn
      const keys = keysHeld.current;
      if (keys.has('ArrowLeft')) playerYaw.current += TURN_SPEED * dt;
      if (keys.has('ArrowRight')) playerYaw.current -= TURN_SPEED * dt;

      // Player move
      const fwd = new THREE.Vector3(-Math.sin(playerYaw.current), 0, -Math.cos(playerYaw.current));
      const right = new THREE.Vector3(Math.cos(playerYaw.current), 0, -Math.sin(playerYaw.current));
      const pos = playerPos.current;

      if (keys.has('KeyW') || keys.has('w')) pos.addScaledVector(fwd, MOVE_SPEED * dt);
      if (keys.has('KeyS') || keys.has('s')) pos.addScaledVector(fwd, -MOVE_SPEED * dt);
      if (keys.has('KeyA') || keys.has('a')) pos.addScaledVector(right, -MOVE_SPEED * dt);
      if (keys.has('KeyD') || keys.has('d')) pos.addScaledVector(right, MOVE_SPEED * dt);

      // Boundary
      const xzDist = Math.sqrt(pos.x ** 2 + pos.z ** 2);
      if (xzDist > BOUNDARY_RADIUS) {
        pos.x = (pos.x / xzDist) * BOUNDARY_RADIUS;
        pos.z = (pos.z / xzDist) * BOUNDARY_RADIUS;
      }

      // Booth collision
      BOOTHS.forEach(b => {
        const d = Math.sqrt((pos.x - b.x) ** 2 + (pos.z - b.z) ** 2);
        if (d < 3.2) {
          const nx = (pos.x - b.x) / d, nz = (pos.z - b.z) / d;
          pos.x = b.x + nx * 3.2; pos.z = b.z + nz * 3.2;
        }
      });

      // Camera
      camera.position.set(pos.x, PLAYER_HEIGHT, pos.z);
      camera.rotation.set(0, playerYaw.current, 0, 'YXZ');

      // Nearest booth check
      let nearest: string | null = null;
      let nearestD = INTERACT_DIST;
      BOOTHS.forEach(b => {
        const d = Math.sqrt((pos.x - b.x) ** 2 + (pos.z - b.z) ** 2);
        if (d < nearestD) { nearest = b.id; nearestD = d; }
      });
      if (nearest !== nearestBoothIdRef.current) {
        nearestBoothIdRef.current = nearest;
        setNearestBooth(nearest);
      }

      // Particles
      particlesRef.current = particlesRef.current.filter(p => {
        p.life += dt;
        if (p.life >= p.maxLife) {
          scene.remove(p.mesh);
          p.mesh.geometry.dispose();
          (p.mesh.material as THREE.Material).dispose();
          return false;
        }
        p.vel.y -= 9.8 * dt;
        p.mesh.position.addScaledVector(p.vel, dt);
        p.mesh.scale.setScalar(1 - p.life / p.maxLife);
        return true;
      });

      // Animations
      if (raibotRef.current) {
        raibotRef.current.position.y = Math.sin(elapsed * 1.5) * 0.12;
        raibotRef.current.rotation.y = Math.sin(elapsed * 0.6) * 0.4;
      }
      duckyRefs.current.forEach((d, i) => {
        d.position.y = Math.abs(Math.sin(elapsed * 2 + i * Math.PI)) * 0.25;
        d.rotation.y = elapsed * 0.8 + i * Math.PI;
      });
      bounceBallsRef.current.forEach(b => {
        b.mesh.position.y = b.baseY + Math.abs(Math.sin(elapsed * 2.5 + b.phase)) * 0.9;
      });
      stars.rotation.y = elapsed * 0.005;

      renderer.render(scene, camera);
    };
    loop();

    // Resize
    const onResize = () => {
      if (!container) return;
      const w = container.clientWidth, h = container.clientHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener('resize', onResize);
      if (typeTimerRef.current) clearTimeout(typeTimerRef.current);
      renderer.dispose();
    };
  }, []);

  // ── Keyboard events ────────────────────────────────────────────────────────
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      // Map to simple chars for movement
      const k = e.code || e.key;
      keysHeld.current.add(k);
      keysHeld.current.add(e.key.toLowerCase());

      // E key = interact
      if ((e.key === 'e' || e.key === 'E') && nearestBoothIdRef.current) {
        explodeBooth(nearestBoothIdRef.current);
      }
      // Prevent arrow scroll
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
        e.preventDefault();
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      keysHeld.current.delete(e.code || e.key);
      keysHeld.current.delete(e.key.toLowerCase());
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [explodeBooth]);

  // Hide hint after 7s
  useEffect(() => {
    const t = setTimeout(() => setShowHint(false), 7000);
    return () => clearTimeout(t);
  }, []);

  // Mobile virtual button handler
  const mobilePress = useCallback((key: string, down: boolean) => {
    if (down) keysHeld.current.add(key);
    else keysHeld.current.delete(key);
  }, []);

  const mobileInteract = useCallback(() => {
    if (nearestBoothIdRef.current) explodeBooth(nearestBoothIdRef.current);
  }, [explodeBooth]);

  const nearestBoothData = BOOTHS.find(b => b.id === nearestBooth);

  return (
    <div ref={containerRef} className="relative w-full h-full bg-blue-300 overflow-hidden select-none">
      {/* Three.js Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ display: 'block' }}
      />

      {/* ── HUD Overlay ── */}
      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/50 to-transparent pointer-events-none">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="text-white font-bold text-sm drop-shadow">
            RecruitAI<span className="text-blue-300">Studio</span>
            <span className="text-white/50 ml-1 text-xs">AI Carnival</span>
          </span>
        </div>
        <div className="flex gap-4 text-xs text-white/70 drop-shadow">
          <span>5 AI Booths to explore</span>
          <span className="hidden sm:inline">Press E to interact 💥</span>
        </div>
      </div>

      {/* Instructions hint (fades after 7s) */}
      {showHint && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 bg-black/70 backdrop-blur-sm text-white text-xs rounded-full px-4 py-2 whitespace-nowrap pointer-events-none">
          🎮 WASD to walk · Arrow keys to look · E to interact & destroy booths
        </div>
      )}

      {/* Interact prompt */}
      {nearestBooth && !popup && (
        <div className="absolute bottom-36 sm:bottom-28 left-1/2 -translate-x-1/2 pointer-events-none">
          <div className="flex items-center gap-2 bg-black/70 backdrop-blur-md text-white text-sm rounded-xl px-4 py-2.5 border border-white/20">
            <kbd className="px-2 py-0.5 bg-white/20 rounded text-xs font-mono">E</kbd>
            <span>Interact with <strong>{nearestBoothData?.title}</strong> 💥</span>
          </div>
        </div>
      )}

      {/* ── Popup ── */}
      {popup && (
        <div className="absolute inset-0 flex items-center justify-center px-4 z-20 pointer-events-auto">
          <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-2xl shadow-2xl max-w-sm w-full border border-white/50 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700">
              <span className="text-white font-bold text-sm">{popup.title}</span>
              <button
                onClick={() => setPopup(null)}
                className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>
            {/* Body */}
            <div className="p-4 max-h-64 overflow-y-auto">
              <pre className="whitespace-pre-wrap font-sans text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                {displayedText}
                <span className="animate-pulse text-blue-500">▌</span>
              </pre>
            </div>
            {/* CTA */}
            <div className="px-4 pb-4 flex gap-2">
              <button
                onClick={() => setPopup(null)}
                className="flex-1 py-2 rounded-lg border border-slate-200 text-slate-600 text-xs font-medium hover:bg-slate-50 transition-colors"
              >
                Keep Exploring
              </button>
              <Link
                href="/vibe-demo/recruitai/consultation"
                className="flex-1 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium text-center transition-colors"
              >
                Book Free Consultation →
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ── Mobile Controls ── */}
      <div className="absolute bottom-4 left-4 flex flex-col gap-1 sm:hidden pointer-events-auto touch-none">
        {/* D-pad */}
        <div className="flex justify-center">
          <button
            className="w-12 h-12 bg-black/50 backdrop-blur rounded-xl text-white text-xl flex items-center justify-center active:bg-black/70 border border-white/20"
            onTouchStart={() => mobilePress('w', true)}
            onTouchEnd={() => mobilePress('w', false)}
            onMouseDown={() => mobilePress('w', true)}
            onMouseUp={() => mobilePress('w', false)}
          >↑</button>
        </div>
        <div className="flex gap-1">
          <button
            className="w-12 h-12 bg-black/50 backdrop-blur rounded-xl text-white text-xl flex items-center justify-center active:bg-black/70 border border-white/20"
            onTouchStart={() => mobilePress('a', true)}
            onTouchEnd={() => mobilePress('a', false)}
            onMouseDown={() => mobilePress('a', true)}
            onMouseUp={() => mobilePress('a', false)}
          >←</button>
          <button
            className="w-12 h-12 bg-black/50 backdrop-blur rounded-xl text-white text-xl flex items-center justify-center active:bg-black/70 border border-white/20"
            onTouchStart={() => mobilePress('s', true)}
            onTouchEnd={() => mobilePress('s', false)}
            onMouseDown={() => mobilePress('s', true)}
            onMouseUp={() => mobilePress('s', false)}
          >↓</button>
          <button
            className="w-12 h-12 bg-black/50 backdrop-blur rounded-xl text-white text-xl flex items-center justify-center active:bg-black/70 border border-white/20"
            onTouchStart={() => mobilePress('d', true)}
            onTouchEnd={() => mobilePress('d', false)}
            onMouseDown={() => mobilePress('d', true)}
            onMouseUp={() => mobilePress('d', false)}
          >→</button>
        </div>
      </div>

      {/* Mobile look controls */}
      <div className="absolute bottom-4 right-28 flex gap-1 sm:hidden pointer-events-auto touch-none">
        <button
          className="w-12 h-12 bg-black/50 backdrop-blur rounded-xl text-white text-xl flex items-center justify-center active:bg-black/70 border border-white/20"
          onTouchStart={() => mobilePress('ArrowLeft', true)}
          onTouchEnd={() => mobilePress('ArrowLeft', false)}
          onMouseDown={() => mobilePress('ArrowLeft', true)}
          onMouseUp={() => mobilePress('ArrowLeft', false)}
        >⟵</button>
        <button
          className="w-12 h-12 bg-black/50 backdrop-blur rounded-xl text-white text-xl flex items-center justify-center active:bg-black/70 border border-white/20"
          onTouchStart={() => mobilePress('ArrowRight', true)}
          onTouchEnd={() => mobilePress('ArrowRight', false)}
          onMouseDown={() => mobilePress('ArrowRight', true)}
          onMouseUp={() => mobilePress('ArrowRight', false)}
        >⟶</button>
      </div>

      {/* Mobile interact button */}
      <div className="absolute bottom-4 right-4 sm:hidden pointer-events-auto">
        <button
          onClick={mobileInteract}
          className={`w-16 h-16 rounded-2xl flex flex-col items-center justify-center border-2 text-xs font-bold transition-all ${
            nearestBooth
              ? 'bg-red-500 border-red-300 text-white animate-bounce'
              : 'bg-black/40 border-white/20 text-white/50'
          }`}
        >
          <span className="text-xl">💥</span>
          <span>BLAST</span>
        </button>
      </div>

      {/* ── Scroll down hint ── */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 hidden sm:flex flex-col items-center gap-1 pointer-events-none">
        <span className="text-white/60 text-xs">Scroll to learn more ↓</span>
      </div>
    </div>
  );
}
