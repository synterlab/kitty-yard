// === KITTY YARD — Intro Screen v4 (Studio Edition) ===
import { generateCatSVG } from "./cats-svg.js";

const INTRO_KEY = "kittyyard_intro_seen";

export function hasSeenIntro() {
  return !!localStorage.getItem(INTRO_KEY);
}

export function markIntroSeen() {
  localStorage.setItem(INTRO_KEY, "1");
}

const FLOAT_CATS = [
  { id: "biscuit",  size: 72, x: 6,  y: 14, dur: 7,   delay: 0   },
  { id: "duchess",  size: 56, x: 74, y: 8,  dur: 9,   delay: 0.8 },
  { id: "emperor",  size: 64, x: 60, y: 54, dur: 8,   delay: 1.4 },
  { id: "aurora",   size: 48, x: 14, y: 60, dur: 10,  delay: 2.0 },
  { id: "phantom",  size: 52, x: 80, y: 72, dur: 7.5, delay: 0.4 },
  { id: "mochi",    size: 42, x: 40, y: 78, dur: 11,  delay: 1.2 },
];

const PARTICLES = Array.from({ length: 10 }, (_, i) => ({
  left: 5 + i * 9.2,
  delay: i * 0.85,
  dur: 7 + (i % 4) * 2.5,
  size: 9 + (i % 3) * 5,
  opacity: 0.12 + (i % 5) * 0.05,
}));

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

      <!-- Ambient drifting particles -->
      <div class="intro-particles" aria-hidden="true">
        ${PARTICLES.map(p => `
          <span class="intro-particle" style="
            left:${p.left}%;
            animation-delay:${p.delay}s;
            animation-duration:${p.dur}s;
            font-size:${p.size}px;
            opacity:${p.opacity};
          ">🐾</span>`).join("")}
      </div>

      <!-- Floating background cats -->
      <div class="intro-bg-cats" aria-hidden="true">
        ${FLOAT_CATS.map(c => `
          <div class="intro-bg-cat" style="
            left:${c.x}%;
            top:${c.y}%;
            animation-duration:${c.dur}s;
            animation-delay:${c.delay}s;
          ">${generateCatSVG(c.id, c.size)}</div>`).join("")}
      </div>

      <!-- Central hero -->
      <div class="intro-hero">

        <!-- Logo -->
        <div class="intro-logo-wrap">
          <img src="logo.png" class="intro-logo-img" alt="Kitty Yard" />
        </div>

        <!-- Brand text -->
        <div class="intro-brand">
          <h1 class="intro-title">Kitty Yard</h1>
          <p class="intro-tagline">A peaceful place where strays come to rest</p>
        </div>

        <!-- Feature pills -->
        <div class="intro-pills">
          ${PILLS.map((p, i) => `
            <div class="intro-pill" style="animation-delay:${0.5 + i * 0.07}s">
              <span class="intro-pill-icon">${p.icon}</span>
              <span class="intro-pill-label">${p.label}</span>
            </div>`).join("")}
        </div>

        <!-- Returning player stats -->
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

        <!-- CTA -->
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
