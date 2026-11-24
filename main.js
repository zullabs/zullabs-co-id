import { initBitsToAtomsScene } from './scene3d.js';

const canvas = document.getElementById('scene3d');
const three = initBitsToAtomsScene(canvas);

// Lenis Smooth Scroll + GSAP ScrollTrigger sync
if (window.gsap && window.ScrollTrigger) {
  window.gsap.registerPlugin(window.ScrollTrigger);
}

let lenis = null;
if (window.Lenis) {
  lenis = new window.Lenis({
    duration: 1.15,
    smoothWheel: true,
    wheelMultiplier: 0.95,
  });
  function raf(time) {
    lenis.raf(time);
    requestAnimationFrame(raf);
  }
  requestAnimationFrame(raf);
}

// Smooth anchor navigation
document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener('click', (e) => {
    const id = link.getAttribute('href');
    if (id.length > 1) {
      const target = document.querySelector(id);
      if (target) {
        e.preventDefault();
        if (lenis) lenis.scrollTo(target, { offset: -40 });
        else target.scrollIntoView({ behavior: 'smooth' });
      }
    }
  });
});

// Scroll progress & Exploded View narrative telemetry
const scrollFill = document.getElementById('scroll-fill');
const explodedSection = document.getElementById('exploded');
const phaseTitle = document.getElementById('phase-title');
const phaseDesc = document.getElementById('phase-desc');
const phaseNum = document.querySelector('.phase-num');
const explodedWord = document.getElementById('exploded-word');
const hudDock = document.getElementById('hud-dock');

const PHASES = [
  {
    num: '01 / 04',
    word: 'STUDIO',
    title: 'Lapisan Optik & Motion AI',
    desc: 'Video demo produk, tutorial dwibahasa, dan iklan vertikal 9:16 yang bikin orang berhenti menggulir.',
  },
  {
    num: '02 / 04',
    word: 'DEVELOP',
    title: 'Arsitektur Aplikasi & IoT',
    desc: 'Flutter, React, Firebase, hingga integrasi hardware — dibangun bersih dari sketsa sampai produksi.',
  },
  {
    num: '03 / 04',
    word: 'NEURAL',
    title: 'AI Tools & Otomasi Kerja',
    desc: 'GasPDF, agen AI, dan alat bantu kantoran yang memangkas klik berulang jadi hitungan detik.',
  },
  {
    num: '04 / 04',
    word: 'ATOMS',
    title: 'Cetak 3D Presisi 0,4 mm',
    desc: 'Dari file STL/3MF langsung jadi benda nyata berbahan PLA/PETG, dikirim ke seluruh Indonesia.',
  },
];

function updateScroll() {
  const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
  const y = window.scrollY;
  const p = Math.max(0, Math.min(1, y / maxScroll));

  three.state.scrollProgress = p;
  scrollFill.style.width = `${(p * 100).toFixed(2)}%`;

  // Compute local progress through #exploded section
  const rect = explodedSection.getBoundingClientRect();
  const totalDist = Math.max(1, explodedSection.offsetHeight - window.innerHeight);
  const localP = Math.max(0, Math.min(1, -rect.top / totalDist));

  // Ramp explode smoothly: 0 -> 1 across localP 0.05..0.35, hold until 0.85, reassemble smoothly after
  let ex = 0;
  if (rect.top < window.innerHeight * 0.65 && rect.bottom > 0) {
    if (localP < 0.28) ex = Math.max(0, (localP + 0.12) / 0.4);
    else if (localP < 0.82) ex = 1;
    else ex = Math.max(0, 1 - (localP - 0.82) / 0.18);
  }
  three.state.explodeScroll = Math.max(0, Math.min(1, ex));

  // Update editorial phase indicator
  const idx = Math.min(PHASES.length - 1, Math.floor(localP * PHASES.length));
  const ph = PHASES[idx];
  phaseNum.textContent = ph.num;
  phaseTitle.textContent = ph.title;
  phaseDesc.textContent = ph.desc;
  explodedWord.textContent = ph.word;

  // Keep HUD visible during hero + exploded + footer; dim gently in dense text zones unless manual inspect
  const hideHud = !three.state.inspectMode && !three.state.manualExplode && p > 0.48 && p < 0.84;
  hudDock.classList.toggle('hidden', hideHud);
}

window.addEventListener('scroll', updateScroll, { passive: true });
updateScroll();

// Interactive HUD Controls
const btnExplode = document.getElementById('btn-explode');
const btnExplodeTxt = document.getElementById('btn-explode-txt');
const btnInspect = document.getElementById('btn-inspect');
const webglWrap = document.getElementById('webgl-wrap');

btnExplode.addEventListener('click', () => {
  three.state.manualExplode = !three.state.manualExplode;
  btnExplode.classList.toggle('active', three.state.manualExplode);
  btnExplodeTxt.textContent = three.state.manualExplode ? 'Satukan Core' : 'Buka Lapisan';
});

btnInspect.addEventListener('click', () => {
  three.state.inspectMode = !three.state.inspectMode;
  btnInspect.classList.toggle('active', three.state.inspectMode);
  webglWrap.classList.toggle('inspecting', three.state.inspectMode);
  btnInspect.textContent = three.state.inspectMode ? 'Mode 360° Aktif' : 'Putar 360°';
});

document.querySelectorAll('.swatch').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.swatch').forEach((s) => s.classList.remove('active'));
    btn.classList.add('active');
    three.setPreset(btn.dataset.preset);
  });
});

// Expose hook for automated QA screenshots
window.__ZULLABS_3D__ = three;
