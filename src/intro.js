// === KITTY YARD — Intro Screen ===
import { generateCatSVG } from "./cats-svg.js";

const INTRO_KEY = "kittyyard_intro_seen";

export function hasSeenIntro() {
  return !!localStorage.getItem(INTRO_KEY);
}

export function markIntroSeen() {
  localStorage.setItem(INTRO_KEY, "1");
}

const WALKING_CATS = ["biscuit","smoky","mochi","pebble","noodle","pudding","duchess","pirate","emperor","aurora"];

export function showIntroScreen(onStart) {
  const overlay = document.createElement("div");
  overlay.id = "intro-overlay";
  overlay.innerHTML = `
    <div class="intro-bg">
      <!-- Starfield layer -->
      <div class="intro-stars" aria-hidden="true"></div>

      <!-- Animated cat parade -->
      <div class="cat-parade" aria-hidden="true">
        ${WALKING_CATS.map((id, i) => `
          <div class="parade-cat" style="animation-delay:${i * 0.55}s; top:${10 + ((i%3)*8)}px">
            ${generateCatSVG(id, 56)}
          </div>`).join("")}
      </div>

      <div class="intro-card">
        <!-- Logo -->
        <div class="intro-logo">
          <div class="intro-logo-paw">🐾</div>
          <div class="intro-logo-text">
            <span class="logo-kitty">Kitty</span><span class="logo-yard">Yard</span><span class="version-badge">v2</span>
          </div>
          <div class="intro-tagline">A peaceful place where strays come to rest</div>
          <div class="studio-badge">
            <span class="studio-badge-dot"></span>Synterlab
          </div>
        </div>

        <!-- Cat preview row -->
        <div class="intro-cat-row">
          ${["biscuit","duchess","emperor","aurora","phantom"].map(id =>
            `<div class="intro-cat-chip" title="${id}">
              <div class="intro-cat-svg">${generateCatSVG(id, 52)}</div>
            </div>`).join("")}
          <div class="intro-cat-chip more-chip">+17 more!</div>
        </div>

        <!-- Tabs -->
        <div class="intro-tabs">
          <button class="itab active" data-itab="about">About</button>
          <button class="itab" data-itab="howto">How to Play</button>
        </div>

        <!-- About content -->
        <div class="intro-panel" id="ipanel-about">
          <div class="intro-about-grid">
            <div class="about-point">
              <span class="about-icon">🍱</span>
              <div>
                <div class="about-title">Place Food & Toys</div>
                <div class="about-desc">Set out snacks and playthings in your yard slots to lure curious cats.</div>
              </div>
            </div>
            <div class="about-point">
              <span class="about-icon">🐾</span>
              <div>
                <div class="about-title">Cats Arrive on Their Own</div>
                <div class="about-desc">No tapping needed — visitors wander in based on what you've placed. Rare ones are picky!</div>
              </div>
            </div>
            <div class="about-point">
              <span class="about-icon">🪙</span>
              <div>
                <div class="about-title">Collect Snack Coins</div>
                <div class="about-desc">Every cat leaves a gift when they depart. Spend coins on better items and new areas.</div>
              </div>
            </div>
            <div class="about-point">
              <span class="about-icon">📖</span>
              <div>
                <div class="about-title">Fill Your Collection</div>
                <div class="about-desc">22 cats to discover. Each has a personality, favorite item, and a secret to uncover.</div>
              </div>
            </div>
          </div>
        </div>

        <!-- How to Play content -->
        <div class="intro-panel hidden" id="ipanel-howto">
          <div class="howto-steps">
            <div class="howto-step">
              <div class="step-num">1</div>
              <div class="step-body">
                <div class="step-title">Go to the Yard tab 🏡</div>
                <div class="step-desc">Tap an empty item slot in the Front Yard area to place your first item.</div>
              </div>
            </div>
            <div class="howto-step">
              <div class="step-num">2</div>
              <div class="step-body">
                <div class="step-title">Visit the Shop 🛒</div>
                <div class="step-desc">You start with a Cardboard Box and Dried Fish. Buy more items to attract rarer cats.</div>
              </div>
            </div>
            <div class="howto-step">
              <div class="step-num">3</div>
              <div class="step-body">
                <div class="step-title">Wait for visitors 🐱</div>
                <div class="step-desc">Cats check in every ~30 seconds. Tap a visiting cat to read their story!</div>
              </div>
            </div>
            <div class="howto-step">
              <div class="step-num">4</div>
              <div class="step-body">
                <div class="step-title">Unlock new areas 🔓</div>
                <div class="step-desc">Save up coins to unlock the Flower Garden and Wooden Deck — that's where Legendary cats hide.</div>
              </div>
            </div>
            <div class="howto-tip">
              <span>💡</span> <strong>Legendary cats</strong> need 2+ specific items placed at once. Check the Collection tab for hints!
            </div>
          </div>
        </div>

        <button class="intro-start-btn" id="intro-start">
          Start Exploring 🐾
        </button>

        <div class="synterlab-footer">
          A free game by <strong>Synterlab</strong> · Play it anywhere, no downloads
        </div>
      </div>
    </div>
  `;

  document.getElementById("app").appendChild(overlay);

  // Tab switching
  overlay.querySelectorAll(".itab").forEach(btn => {
    btn.addEventListener("click", () => {
      overlay.querySelectorAll(".itab").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      overlay.querySelectorAll(".intro-panel").forEach(p => p.classList.add("hidden"));
      document.getElementById(`ipanel-${btn.dataset.itab}`).classList.remove("hidden");
    });
  });

  // Start button
  document.getElementById("intro-start").addEventListener("click", () => {
    overlay.style.animation = "introFadeOut 0.4s ease forwards";
    setTimeout(() => {
      overlay.remove();
      markIntroSeen();
      onStart();
    }, 380);
  });
}
