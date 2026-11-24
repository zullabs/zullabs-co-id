import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

/**
 * Procedural PBR textures (PCB copper traces + 0.4mm 3D-print filament micro-grain)
 * Zero external image dependencies -> instant load on GitHub Pages.
 */
function createPcbTextures() {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 512;
  const ctx = c.getContext('2d');

  // Deep solder-mask base
  ctx.fillStyle = '#071622';
  ctx.fillRect(0, 0, 512, 512);

  // Fine technical grid
  ctx.strokeStyle = 'rgba(0, 229, 199, 0.08)';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 512; i += 32) {
    ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 512); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(512, i); ctx.stroke();
  }

  // Glowing trace mask canvas
  const em = document.createElement('canvas');
  em.width = 512;
  em.height = 512;
  const ectx = em.getContext('2d');
  ectx.fillStyle = '#000000';
  ectx.fillRect(0, 0, 512, 512);

  // Radial buses from center SoC out to edges
  const paths = [
    [[256, 200], [256, 90], [180, 40]],
    [[280, 200], [330, 120], [430, 120]],
    [[230, 200], [150, 120], [70, 120]],
    [[256, 312], [256, 420], [340, 470]],
    [[312, 256], [420, 256], [465, 340]],
    [[200, 256], [90, 256], [45, 360]],
    [[295, 295], [380, 380], [440, 380]],
    [[215, 295], [130, 380], [70, 430]],
  ];

  paths.forEach((pts, idx) => {
    const col = idx % 3 === 0 ? '#ff9e4a' : '#00e5c7';
    for (const [target, width, alpha] of [[ctx, 5, 0.9], [ectx, 4, 1.0]]) {
      target.strokeStyle = col;
      target.globalAlpha = alpha;
      target.lineWidth = width;
      target.lineCap = 'round';
      target.lineJoin = 'round';
      target.beginPath();
      pts.forEach(([x, y], i) => (i === 0 ? target.moveTo(x, y) : target.lineTo(x, y)));
      target.stroke();
      const [lx, ly] = pts[pts.length - 1];
      target.fillStyle = col;
      target.beginPath();
      target.arc(lx, ly, 6, 0, Math.PI * 2);
      target.fill();
    }
  });
  ctx.globalAlpha = 1;
  ectx.globalAlpha = 1;

  // Gold SMD pads around perimeter
  ctx.fillStyle = '#d4a14c';
  for (let i = 64; i <= 448; i += 28) {
    ctx.fillRect(i - 4, 18, 8, 18);
    ctx.fillRect(i - 4, 476, 8, 18);
    ctx.fillRect(18, i - 4, 18, 8);
    ctx.fillRect(476, i - 4, 18, 8);
  }

  const map = new THREE.CanvasTexture(c);
  map.colorSpace = THREE.SRGBColorSpace;
  const emissiveMap = new THREE.CanvasTexture(em);
  emissiveMap.colorSpace = THREE.SRGBColorSpace;
  return { map, emissiveMap };
}

function createFilamentBump() {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext('2d');
  for (let y = 0; y < 256; y++) {
    const v = Math.floor(128 + 60 * Math.sin(y * 1.6));
    ctx.fillStyle = `rgb(${v},${v},${v})`;
    ctx.fillRect(0, y, 256, 1);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(4, 14);
  return tex;
}

export const PRESETS = {
  obsidian: {
    shellColor: 0x111a2c,
    shellRough: 0.34,
    shellMetal: 0.65,
    accent: 0x00e5c7,
    secondary: 0xff9e4a,
    rimColor: 0x00e5c7,
  },
  amber: {
    shellColor: 0x24160e,
    shellRough: 0.28,
    shellMetal: 0.78,
    accent: 0xff9e4a,
    secondary: 0x00e5c7,
    rimColor: 0xff9e4a,
  },
  ivory: {
    shellColor: 0xe8edf4,
    shellRough: 0.42,
    shellMetal: 0.12,
    accent: 0x00e5c7,
    secondary: 0xff9e4a,
    rimColor: 0x38bdf8,
  },
  carbon: {
    shellColor: 0x0b0f18,
    shellRough: 0.22,
    shellMetal: 0.88,
    accent: 0x38bdf8,
    secondary: 0x00e5c7,
    rimColor: 0x38bdf8,
  },
};

export function initBitsToAtomsScene(canvas) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.18;

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x030711, 0.042);

  // Studio IBL reflections without external HDR file
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.82;

  const camera = new THREE.PerspectiveCamera(36, window.innerWidth / window.innerHeight, 0.1, 80);
  camera.position.set(0, 1.2, 8.6);

  // Studio Three-Point + Accent Lighting
  const keyLight = new THREE.DirectionalLight(0xf8fafc, 2.4);
  keyLight.position.set(5, 8, 6);
  scene.add(keyLight);

  const tealRim = new THREE.SpotLight(0x00e5c7, 90, 26, Math.PI / 4, 0.65, 2);
  tealRim.position.set(-6, 4, -4);
  scene.add(tealRim);

  const amberRim = new THREE.SpotLight(0xff9e4a, 75, 26, Math.PI / 4, 0.7, 2);
  amberRim.position.set(6, -2, 4);
  scene.add(amberRim);

  const coreLight = new THREE.PointLight(0x00e5c7, 14, 9, 2);
  coreLight.position.set(0, 0, 0);
  scene.add(coreLight);

  // Root Assembly Group
  const root = new THREE.Group();
  scene.add(root);

  const filamentBump = createFilamentBump();
  const pcbTex = createPcbTextures();

  // Shared Dynamic Materials (updated live by Material Switcher!)
  const shellMat = new THREE.MeshStandardMaterial({
    color: PRESETS.obsidian.shellColor,
    roughness: PRESETS.obsidian.shellRough,
    metalness: PRESETS.obsidian.shellMetal,
    bumpMap: filamentBump,
    bumpScale: 0.015,
  });

  const trimMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.24,
    metalness: 0.9,
  });

  const accentGlowMat = new THREE.MeshStandardMaterial({
    color: PRESETS.obsidian.accent,
    emissive: PRESETS.obsidian.accent,
    emissiveIntensity: 2.2,
    roughness: 0.2,
    metalness: 0.3,
  });

  const secondaryGlowMat = new THREE.MeshStandardMaterial({
    color: PRESETS.obsidian.secondary,
    emissive: PRESETS.obsidian.secondary,
    emissiveIntensity: 1.8,
    roughness: 0.25,
    metalness: 0.4,
  });

  /* ============== LAYER 1: TOP 3D-PRINT SHELL (PINTU 04: ATOMS) ============== */
  const layerShell = new THREE.Group();
  const shellShape = new THREE.Shape();
  const s = 1.25;
  const r = 0.26;
  shellShape.moveTo(-s + r, -s);
  shellShape.lineTo(s - r, -s);
  shellShape.quadraticCurveTo(s, -s, s, -s + r);
  shellShape.lineTo(s, s - r);
  shellShape.quadraticCurveTo(s, s, s - r, s);
  shellShape.lineTo(-s + r, s);
  shellShape.quadraticCurveTo(-s, s, -s, s - r);
  shellShape.lineTo(-s, -s + r);
  shellShape.quadraticCurveTo(-s, -s, -s + r, -s);

  const topCapGeo = new THREE.ExtrudeGeometry(shellShape, {
    depth: 0.22,
    bevelEnabled: true,
    bevelThickness: 0.09,
    bevelSize: 0.09,
    bevelSegments: 4,
  });
  topCapGeo.rotateX(Math.PI / 2);
  topCapGeo.center();
  const topCap = new THREE.Mesh(topCapGeo, shellMat);
  layerShell.add(topCap);

  // Recessed glowing Z-emblem ring on top cap
  const zRing = new THREE.Mesh(new THREE.TorusGeometry(0.54, 0.032, 16, 64), accentGlowMat);
  zRing.rotation.x = Math.PI / 2;
  zRing.position.y = 0.21;
  layerShell.add(zRing);

  // Geometric "Z" bar emblem
  const zGroup = new THREE.Group();
  const barTop = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.04, 0.09), accentGlowMat);
  barTop.position.set(0, 0.215, -0.17);
  const barBot = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.04, 0.09), accentGlowMat);
  barBot.position.set(0, 0.215, 0.17);
  const barDiag = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.04, 0.09), accentGlowMat);
  barDiag.position.set(0, 0.215, 0);
  barDiag.rotation.y = Math.PI / 4;
  zGroup.add(barTop, barBot, barDiag);
  layerShell.add(zGroup);

  // 4 Titanium Corner Hex Bolts
  const boltGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.08, 6);
  for (const [bx, bz] of [[-0.95, -0.95], [0.95, -0.95], [-0.95, 0.95], [0.95, 0.95]]) {
    const bolt = new THREE.Mesh(boltGeo, trimMat);
    bolt.position.set(bx, 0.21, bz);
    layerShell.add(bolt);
  }
  layerShell.position.y = 0.62;
  root.add(layerShell);

  /* ============== LAYER 2: CINEMA OPTICS RING (PINTU 01: STUDIO) ============== */
  const layerOptics = new THREE.Group();
  const barrel = new THREE.Mesh(new THREE.TorusGeometry(0.95, 0.11, 20, 72), trimMat);
  barrel.rotation.x = Math.PI / 2;
  layerOptics.add(barrel);

  // Knurled focus ring teeth
  const toothGeo = new THREE.BoxGeometry(0.05, 0.16, 0.08);
  for (let i = 0; i < 36; i++) {
    const a = (i / 36) * Math.PI * 2;
    const t = new THREE.Mesh(toothGeo, trimMat);
    t.position.set(Math.cos(a) * 1.08, 0, Math.sin(a) * 1.08);
    t.rotation.y = -a;
    layerOptics.add(t);
  }

  // Translucent optical crystal lens disc
  const lensMat = new THREE.MeshPhysicalMaterial({
    color: 0xbefcf5,
    metalness: 0.05,
    roughness: 0.05,
    transmission: 0.85,
    ior: 1.52,
    thickness: 0.35,
    transparent: true,
    opacity: 0.9,
  });
  const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.84, 0.84, 0.07, 48), lensMat);
  layerOptics.add(lens);

  // Amber studio accent ring
  const optGlow = new THREE.Mesh(new THREE.TorusGeometry(0.86, 0.018, 12, 64), secondaryGlowMat);
  optGlow.rotation.x = Math.PI / 2;
  optGlow.position.y = 0.06;
  layerOptics.add(optGlow);

  layerOptics.position.y = 0.32;
  root.add(layerOptics);

  /* ============== LAYER 3: NEURAL AI CORE (PINTU 03: TOOLS / AI) ============== */
  const layerCore = new THREE.Group();
  const coreCrystal = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.46, 0),
    new THREE.MeshPhysicalMaterial({
      color: 0x00e5c7,
      emissive: 0x00a896,
      emissiveIntensity: 1.1,
      roughness: 0.08,
      metalness: 0.15,
      transmission: 0.6,
      thickness: 0.8,
      clearcoat: 1,
    })
  );
  layerCore.add(coreCrystal);

  const coreCage = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.62, 1),
    new THREE.MeshStandardMaterial({
      color: 0xff9e4a,
      emissive: 0xff9e4a,
      emissiveIntensity: 1.2,
      wireframe: true,
      transparent: true,
      opacity: 0.55,
    })
  );
  layerCore.add(coreCage);

  const gyroA = new THREE.Mesh(new THREE.TorusGeometry(0.76, 0.016, 12, 64), accentGlowMat);
  const gyroB = new THREE.Mesh(new THREE.TorusGeometry(0.84, 0.014, 12, 64), secondaryGlowMat);
  gyroB.rotation.x = Math.PI / 3;
  layerCore.add(gyroA, gyroB);

  layerCore.position.y = 0.0;
  root.add(layerCore);

  /* ============== LAYER 4: PRECISION PCB & IOT BOARD (PINTU 02: DEV) ============== */
  const layerPcb = new THREE.Group();
  const pcbMat = new THREE.MeshStandardMaterial({
    map: pcbTex.map,
    emissiveMap: pcbTex.emissiveMap,
    emissive: 0xffffff,
    emissiveIntensity: 1.35,
    roughness: 0.36,
    metalness: 0.42,
  });
  const pcbBoard = new THREE.Mesh(new THREE.BoxGeometry(2.38, 0.09, 2.38), pcbMat);
  layerPcb.add(pcbBoard);

  // Central SoC processor package
  const soc = new THREE.Mesh(
    new THREE.BoxGeometry(0.68, 0.11, 0.68),
    new THREE.MeshStandardMaterial({ color: 0x0a0f1a, roughness: 0.25, metalness: 0.75 })
  );
  soc.position.y = 0.09;
  layerPcb.add(soc);

  // Micro SMD components
  const capMat = new THREE.MeshStandardMaterial({ color: 0xd4a14c, roughness: 0.25, metalness: 0.92 });
  const smdPositions = [
    [-0.78, -0.5], [-0.78, -0.25], [-0.78, 0.25], [-0.78, 0.5],
    [0.78, -0.5], [0.78, -0.25], [0.78, 0.25], [0.78, 0.5],
    [-0.45, 0.82], [0.45, 0.82], [-0.45, -0.82], [0.45, -0.82],
  ];
  for (const [sx, sz] of smdPositions) {
    const smd = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.09, 0.09), capMat);
    smd.position.set(sx, 0.08, sz);
    layerPcb.add(smd);
  }
  layerPcb.position.y = -0.34;
  root.add(layerPcb);

  /* ============== LAYER 5: CNC ALUMINUM HEATSINK CHASSIS ============== */
  const layerBase = new THREE.Group();
  const basePlate = new THREE.Mesh(topCapGeo, shellMat);
  basePlate.scale.set(1.03, 0.85, 1.03);
  layerBase.add(basePlate);

  // Cooling heatsink fins underneath
  const finGeo = new THREE.BoxGeometry(2.1, 0.14, 0.05);
  for (let i = -5; i <= 5; i++) {
    const fin = new THREE.Mesh(finGeo, trimMat);
    fin.position.set(0, -0.17, i * 0.18);
    layerBase.add(fin);
  }
  layerBase.position.y = -0.68;
  root.add(layerBase);

  /* ============== AMBIENT FLOATING DATA PARTICLES ============== */
  const pCount = 220;
  const pPos = new Float32Array(pCount * 3);
  for (let i = 0; i < pCount; i++) {
    const rad = 2.6 + Math.random() * 6.5;
    const th = Math.random() * Math.PI * 2;
    pPos[i * 3] = Math.cos(th) * rad;
    pPos[i * 3 + 1] = (Math.random() - 0.5) * 7.5;
    pPos[i * 3 + 2] = Math.sin(th) * rad;
  }
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
  const pMat = new THREE.PointsMaterial({
    color: 0x00e5c7,
    size: 0.036,
    transparent: true,
    opacity: 0.52,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const particles = new THREE.Points(pGeo, pMat);
  scene.add(particles);

  /* ============== INTERACTIVE STATE ============== */
  const state = {
    scrollProgress: 0,
    explodeScroll: 0,
    manualExplode: false,
    explodeValue: 0,
    inspectMode: false,
    dragRotY: 0,
    dragRotX: 0,
    targetDragY: 0,
    targetDragX: 0,
    mouseX: 0,
    mouseY: 0,
    isDragging: false,
    lastPointerX: 0,
    lastPointerY: 0,
  };

  // Drag-to-rotate support
  canvas.addEventListener('pointerdown', (e) => {
    if (!state.inspectMode) return;
    state.isDragging = true;
    state.lastPointerX = e.clientX;
    state.lastPointerY = e.clientY;
  });
  window.addEventListener('pointermove', (e) => {
    state.mouseX = (e.clientX / window.innerWidth) * 2 - 1;
    state.mouseY = (e.clientY / window.innerHeight) * 2 - 1;
    if (state.isDragging) {
      const dx = e.clientX - state.lastPointerX;
      const dy = e.clientY - state.lastPointerY;
      state.targetDragY += dx * 0.009;
      state.targetDragX = Math.max(-0.75, Math.min(0.75, state.targetDragX + dy * 0.006));
      state.lastPointerX = e.clientX;
      state.lastPointerY = e.clientY;
    }
  });
  window.addEventListener('pointerup', () => { state.isDragging = false; });

  function setPreset(name) {
    const p = PRESETS[name] || PRESETS.obsidian;
    shellMat.color.setHex(p.shellColor);
    shellMat.roughness = p.shellRough;
    shellMat.metalness = p.shellMetal;
    accentGlowMat.color.setHex(p.accent);
    accentGlowMat.emissive.setHex(p.accent);
    secondaryGlowMat.color.setHex(p.secondary);
    secondaryGlowMat.emissive.setHex(p.secondary);
    coreCrystal.material.color.setHex(p.accent);
    coreCrystal.material.emissive.setHex(p.accent);
    coreLight.color.setHex(p.accent);
    tealRim.color.setHex(p.rimColor);
    pMat.color.setHex(p.accent);
  }

  // Anchors for 3D-to-2D projected callouts
  const anchorObjects = {
    shell: layerShell,
    optics: layerOptics,
    core: layerCore,
    pcb: layerPcb,
  };
  const anchorOffsets = {
    shell: new THREE.Vector3(1.15, 0.12, 0),
    optics: new THREE.Vector3(-1.05, 0, 0),
    core: new THREE.Vector3(0.78, 0, 0),
    pcb: new THREE.Vector3(-1.18, 0.05, 0),
  };
  const calloutEls = {};
  document.querySelectorAll('.callout').forEach((el) => {
    calloutEls[el.dataset.target] = el;
  });
  const calloutsLayer = document.getElementById('callouts-layer');
  const tmpVec = new THREE.Vector3();

  // Resize handler
  function onResize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    camera.aspect = w / h;
    camera.fov = w < 768 ? 46 : 36;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  }
  window.addEventListener('resize', onResize);
  onResize();

  const clock = new THREE.Clock();

  function animate() {
    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.getElapsedTime();

    // Smoothly blend scroll explode + manual toggle
    const targetExplode = state.manualExplode ? 1.0 : state.explodeScroll;
    state.explodeValue += (targetExplode - state.explodeValue) * Math.min(1, dt * 5.5);
    const ex = state.explodeValue;

    // Layer vertical separation (Exploded View!)
    layerShell.position.y = 0.58 + ex * 1.48;
    layerOptics.position.y = 0.28 + ex * 0.72;
    layerCore.position.y = 0.0 + Math.sin(t * 1.8) * 0.04;
    layerPcb.position.y = -0.30 - ex * 0.68;
    layerBase.position.y = -0.64 - ex * 1.38;

    // Subtle mechanical motion inside each layer
    layerOptics.rotation.y = t * 0.25 + ex * 0.9;
    coreCrystal.rotation.y = t * 0.7;
    coreCrystal.rotation.x = Math.sin(t * 0.6) * 0.3;
    coreCage.rotation.y = -t * 0.35;
    coreCage.rotation.z = t * 0.2;
    gyroA.rotation.x = t * 0.9;
    gyroA.rotation.y = t * 0.45;
    gyroB.rotation.z = -t * 0.7;
    coreLight.intensity = 12 + Math.sin(t * 3.0) * 3.5 + ex * 10;
    particles.rotation.y = t * 0.04;

    // Scroll-driven root position & rotation
    const sp = state.scrollProgress;
    const isMobile = window.innerWidth < 980;
    // Hero: right side on desktop, clean centered backdrop on mobile; Exploded: dead center with breathing room
    let targetX = isMobile ? 0 : 1.75;
    let targetY = isMobile ? -0.55 : 0.05;
    let targetZ = isMobile ? 11.4 : 8.4;

    if (sp > 0.08 && sp < 0.45) {
      const k = Math.sin(Math.min(1, (sp - 0.08) / 0.14) * (Math.PI / 2));
      targetX = THREE.MathUtils.lerp(isMobile ? 0 : 1.75, 0, k);
      targetY = THREE.MathUtils.lerp(isMobile ? -0.55 : 0.05, -0.05, k);
      targetZ = isMobile ? 13.0 : 11.5;
    } else if (sp >= 0.45 && sp < 0.85) {
      targetX = isMobile ? 0 : 2.55;
      targetY = 0.15;
      targetZ = isMobile ? 12.2 : 10.6;
    } else if (sp >= 0.85) {
      targetX = 0;
      targetY = 0.2;
      targetZ = isMobile ? 11.4 : 9.4;
    }

    root.position.x += (targetX - root.position.x) * Math.min(1, dt * 4);
    root.position.y += (targetY + Math.sin(t * 1.1) * 0.06 - root.position.y) * Math.min(1, dt * 4);
    camera.position.z += (targetZ - camera.position.z) * Math.min(1, dt * 4);

    // Smooth drag + mouse parallax + scroll orbit
    state.dragRotY += (state.targetDragY - state.dragRotY) * Math.min(1, dt * 7);
    state.dragRotX += (state.targetDragX - state.dragRotX) * Math.min(1, dt * 7);

    const autoYaw = sp * Math.PI * 2.4 + t * 0.16;
    const targetRotY = autoYaw + state.dragRotY + state.mouseX * 0.22;
    const targetRotX = 0.28 + Math.sin(sp * Math.PI * 2) * 0.12 + state.dragRotX + state.mouseY * 0.12;
    root.rotation.y += (targetRotY - root.rotation.y) * Math.min(1, dt * 5);
    root.rotation.x += (targetRotX - root.rotation.x) * Math.min(1, dt * 5);

    camera.lookAt(0, 0, 0);
    renderer.render(scene, camera);

    // Update 3D-to-2D callout coordinates anchored cleanly outside left/right silhouette (zero overlap!)
    const showCallouts = ex > 0.55 && window.innerWidth > 900 && (sp < 0.46 || state.manualExplode);
    calloutsLayer.classList.toggle('visible', showCallouts);
    if (showCallouts) {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const sideX = { shell: 1.65, optics: -1.55, core: 1.45, pcb: -1.65 };
      for (const key of Object.keys(calloutEls)) {
        const el = calloutEls[key];
        const obj = anchorObjects[key];
        obj.getWorldPosition(tmpVec);
        tmpVec.x = root.position.x + sideX[key];
        tmpVec.z = 0;
        tmpVec.project(camera);
        const sx = (tmpVec.x * 0.5 + 0.5) * w;
        const sy = (-tmpVec.y * 0.5 + 0.5) * h;
        const isLeft = el.classList.contains('callout--left');
        const tx = isLeft ? sx - el.offsetWidth : sx;
        const ty = sy - el.offsetHeight * 0.5;
        el.style.transform = `translate3d(${tx.toFixed(1)}px, ${ty.toFixed(1)}px, 0)`;
      }
    }
  }

  renderer.setAnimationLoop(animate);

  return {
    state,
    setPreset,
  };
}
