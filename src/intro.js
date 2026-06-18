// === KITTY YARD — Intro Screen v5 (Garden Edition) ===
import { generateCatSVG } from "./cats-svg.js";

const INTRO_KEY = "kittyyard_intro_seen";

export function hasSeenIntro() {
  return !!localStorage.getItem(INTRO_KEY);
}

export function markIntroSeen() {
  localStorage.setItem(INTRO_KEY, "1");
}

// Cats playing in the garden — each has a unique role/animation
const GARDEN_CATS = [
  { id: "biscuit",   size: 62, role: "roll",   x: -9,  y: 44, dur: 11,  delay: 0   },
  { id: "duchess",   size: 52, role: "jump",   x: 22,  y: 50, dur: 1.3, delay: 0.4 },
  { id: "emperor",   size: 58, role: "zoom",   x: -12, y: 54, dur: 6.5, delay: 2.2 },
  { id: "mochi",     size: 46, role: "bounce", x: 66,  y: 48, dur: 0.85,delay: 0.7 },
  { id: "blossom",   size: 48, role: "peek",   x: 48,  y: 57, dur: 3.8, delay: 1.1 },
  { id: "aurora",    size: 50, role: "spin",   x: 82,  y: 46, dur: 2.0, delay: 0.5 },
  { id: "tangerine", size: 40, role: "chase",  x: 34,  y: 53, dur: 4.2, delay: 1.6 },
];

// Butterflies drifting across the garden
const BUTTERFLIES = [
  { left: 6,  top: 16, dur: 14, delay: 0,   color: "#ff80c0", w: 20 },
  { left: 28, top: 24, dur: 18, delay: -5,  color: "#c060ff", w: 16 },
  { left: 55, top: 12, dur: 12, delay: -9,  color: "#60c8ff", w: 22 },
  { left: 72, top: 28, dur: 16, delay: -3,  color: "#ffcc40", w: 18 },
  { left: 44, top: 20, dur: 20, delay: -14, color: "#80e880", w: 14 },
];

// Garden floating particles: leaves and flower petals
const GARDEN_PARTICLES = [
  { emoji: "🍃", left: 4,   delay: 0,   dur: 9,  size: 14, op: 0.65 },
  { emoji: "🌸", left: 14,  delay: 1.2, dur: 11, size: 12, op: 0.7  },
  { emoji: "🍀", left: 26,  delay: 0.5, dur: 8,  size: 16, op: 0.55 },
  { emoji: "🌼", left: 38,  delay: 2.1, dur: 13, size: 13, op: 0.6  },
  { emoji: "🍃", left: 52,  delay: 0.8, dur: 10, size: 11, op: 0.65 },
  { emoji: "🌺", left: 64,  delay: 1.7, dur: 12, size: 15, op: 0.6  },
  { emoji: "🍀", left: 77,  delay: 0.3, dur: 9,  size: 12, op: 0.5  },
  { emoji: "🌸", left: 90,  delay: 2.5, dur: 11, size: 14, op: 0.7  },
];

// Clouds drifting through the sky
const CLOUDS = [
  { w: 90,  h: 36, left: 4,   top: 5,  dur: 34, delay: 0    },
  { w: 68,  h: 28, left: 55,  top: 11, dur: 46, delay: -14  },
  { w: 52,  h: 22, left: 30,  top: 22, dur: 40, delay: -24  },
  { w: 76,  h: 30, left: -8,  top: 17, dur: 54, delay: -8   },
];

function makeButterflyWings(color, w) {
  const h = Math.round(w * 0.7);
  const hw = w / 2, hh = h / 2;
  return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" fill="none" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="${hw * 0.5}" cy="${hh * 0.9}" rx="${hw * 0.5}" ry="${hh * 0.95}" fill="${color}" opacity="0.88"/>
    <ellipse cx="${w - hw * 0.5}" cy="${hh * 0.9}" rx="${hw * 0.5}" ry="${hh * 0.95}" fill="${color}" opacity="0.88"/>
    <ellipse cx="${hw * 0.5}" cy="${h - hh * 0.6}" rx="${hw * 0.38}" ry="${hh * 0.7}" fill="${color}" opacity="0.65"/>
    <ellipse cx="${w - hw * 0.5}" cy="${h - hh * 0.6}" rx="${hw * 0.38}" ry="${hh * 0.7}" fill="${color}" opacity="0.65"/>
    <rect x="${hw - 0.5}" y="${hh * 0.25}" width="1" height="${h * 0.75}" rx="0.5" fill="#3d2c1e" opacity="0.45"/>
  </svg>`;
}

export function showIntroScreen(onStart) {
  const SAVE_KEY = "kittyyard_save_v1";
  let saveData = null;
  try { saveData = JSON.parse(localStorage.getItem(SAVE_KEY)); } catch(e) {}
  const isReturning = saveData && (Object.keys(saveData.discoveredCats||{}).length > 0 || saveData.coins !== 50);
  const catsFound   = isReturning ? Object.keys(saveData.discoveredCats||{}).length : 0;
  const coins       = isReturning ? (saveData.coins||0) : 0;
  const btnText     = isReturning ? "Continue Playing" : "Start Exploring";

  const PILLS = [
    { icon: "🐾", label: "22 Cats" },
    { icon: "🗺️", label: "3 Areas" },
    { icon: "⚡", label: "Free Play" },
    { icon: "🌙", label: "Offline" },
  ];

  const overlay = document.createElement("div");
  overlay.id = "intro-overlay";
  overlay.innerHTML = `
    <div class="intro-bg">

      <!-- Floating garden particles: leaves & petals -->
      <div class="intro-particles" aria-hidden="true">
        ${GARDEN_PARTICLES.map(p => `
          <span class="intro-particle" style="
            left:${p.left}%;
            animation-delay:${p.delay}s;
            animation-duration:${p.dur}s;
            font-size:${p.size}px;
            --op:${p.op};
          ">${p.emoji}</span>`).join("")}
      </div>

      <!-- Sky decoration: sun + drifting clouds -->
      <div class="intro-garden-sky" aria-hidden="true">
        <div class="garden-sun">
          <div class="garden-sun-rays"></div>
          <div class="garden-sun-core"></div>
        </div>
        ${CLOUDS.map(c => `
          <div class="garden-cloud" style="
            width:${c.w}px; height:${c.h}px;
            left:${c.left}%; top:${c.top}%;
            animation-duration:${c.dur}s;
            animation-delay:${c.delay}s;
          "></div>`).join("")}
      </div>

      <!-- Cats playing in the garden + butterflies to chase -->
      <div class="intro-bg-cats" aria-hidden="true">

        ${BUTTERFLIES.map(b => `
          <div class="garden-butterfly" style="
            left:${b.left}%;
            top:${b.top}%;
            animation-duration:${b.dur}s;
            animation-delay:${b.delay}s;
          ">${makeButterflyWings(b.color, b.w)}</div>`).join("")}

        ${GARDEN_CATS.map(c => `
          <div class="garden-cat garden-cat-${c.role}" style="
            left:${c.x}%;
            top:${c.y}%;
            animation-duration:${c.dur}s;
            animation-delay:${c.delay}s;
          ">${generateCatSVG(c.id, c.size)}</div>`).join("")}

      </div>

      <!-- Decorative grass border -->
      <div class="garden-grass-border" aria-hidden="true"></div>

      <!-- Hero content: logo + CTA -->
      <div class="intro-hero">

        <div class="intro-logo-wrap">
          <img src="logo.png" class="intro-logo-img" alt="Kitty Yard" />
        </div>

        <div class="intro-brand">
          <h1 class="intro-title">Kitty Yard</h1>
          <p class="intro-tagline">A peaceful place where strays come to rest</p>
        </div>

        <div class="intro-pills">
          ${PILLS.map((p, i) => `
            <div class="intro-pill" style="animation-delay:${0.5 + i * 0.07}s">
              <span class="intro-pill-icon">${p.icon}</span>
              <span class="intro-pill-label">${p.label}</span>
            </div>`).join("")}
        </div>

        ${isReturning ? `
        <div class="intro-stats">
          <div class="intro-stat">
            <span class="intro-stat-val">${catsFound}</span>
            <span class="intro-stat-lbl">Cats Found</span>
          </div>
          <div class="intro-stat-sep"></div>
          <div class="intro-stat">
            <span class="intro-stat-val">🪙 ${coins}</span>
            <span class="intro-stat-lbl">Snack Coins</span>
          </div>
          <div class="intro-stat-sep"></div>
          <div class="intro-stat">
            <span class="intro-stat-val">${Math.round((catsFound/22)*100)}%</span>
            <span class="intro-stat-lbl">Collection</span>
          </div>
        </div>` : ""}

        <div class="intro-cta">
          <button class="intro-start-btn" id="intro-start">
            <span class="intro-btn-shimmer" aria-hidden="true"></span>
            <span class="intro-btn-text">${btnText}</span>
            <span class="intro-btn-paw" aria-hidden="true">🐾</span>
          </button>
          <p class="intro-credit">by Synterlab</p>
        </div>

      </div>
    </div>
  `;

  document.getElementById("app").appendChild(overlay);

  document.getElementById("intro-start").addEventListener("click", () => {
    overlay.classList.add("intro-exit");
    setTimeout(() => {
      overlay.remove();
      markIntroSeen();
      onStart();
    }, 500);
  });
}
