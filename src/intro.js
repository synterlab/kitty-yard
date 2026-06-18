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
  const SAVE_KEY = "kittyyard_save_v1";
  let saveData = null;
  try { saveData = JSON.parse(localStorage.getItem(SAVE_KEY)); } catch(e) {}
  const isReturning = saveData && (Object.keys(saveData.discoveredCats||{}).length > 0 || saveData.coins !== 50);
  const catsFound   = isReturning ? Object.keys(saveData.discoveredCats||{}).length : 0;
  const coins       = isReturning ? (saveData.coins||0) : 0;
  const btnText     = isReturning ? "Continue Playing" : "Start Exploring";

  const overlay = document.createElement("div");
  overlay.id = "intro-overlay";
  overlay.innerHTML = `
    <div class="intro-bg">
      <div class="intro-stars" aria-hidden="true"></div>

      <div class="cat-parade" aria-hidden="true">
        ${WALKING_CATS.map((id, i) => `
          <div class="parade-cat" style="animation-delay:${i * 0.55}s; top:${4 + ((i%3)*7)}px">
            ${generateCatSVG(id, 50)}
          </div>`).join("")}
      </div>

      <div class="intro-hero">
        <img src="logo.png" class="intro-logo-img" alt="Kitty Yard" />
        <div class="intro-tagline">A peaceful place where strays come to rest</div>
      </div>

      <div class="intro-card">

        ${isReturning ? `
        <div class="returning-banner">
          <div class="returning-banner-row">
            <div class="returning-stat">
              <span class="returning-stat-val">${catsFound}</span>
              <span class="returning-stat-lbl">Cats Found</span>
            </div>
            <div class="returning-stat-divider"></div>
            <div class="returning-stat">
              <span class="returning-stat-val">🪙 ${coins}</span>
              <span class="returning-stat-lbl">Snack Coins</span>
            </div>
            <div class="returning-stat-divider"></div>
            <div class="returning-stat">
              <span class="returning-stat-val">${Math.round((catsFound/22)*100)}%</span>
              <span class="returning-stat-lbl">Collection</span>
            </div>
          </div>
        </div>` : `
        <div class="intro-pills-grid">
          <div class="feature-pill">🐾 22 Unique Cats</div>
          <div class="feature-pill">🗺️ 3 Areas</div>
          <div class="feature-pill">⚡ Free to Play</div>
          <div class="feature-pill">📱 Mobile-First</div>
        </div>`}

        <div class="intro-cat-row">
          ${["biscuit","duchess","emperor","aurora","phantom"].map(id =>
            `<div class="intro-cat-chip">
              <div class="intro-cat-svg">${generateCatSVG(id, 52)}</div>
            </div>`).join("")}
          <div class="intro-cat-chip more-chip">+17<br>more</div>
        </div>

        <div class="intro-tabs">
          <button class="itab active" data-itab="about">About</button>
          <button class="itab" data-itab="howto">How to Play</button>
        </div>

        <div class="intro-panel" id="ipanel-about">
          <div class="intro-game-desc">
            Kitty Yard is a cozy idle game where stray cats visit your yard. Place food and toys, watch unique cats wander in, and grow your collection at your own pace.
          </div>
          <div class="intro-about-grid">
            <div class="about-point">
              <span class="about-icon">🍱</span>
              <div>
                <div class="about-title">Place Food and Toys</div>
                <div class="about-desc">Set out snacks and playthings in your yard slots to lure curious cats.</div>
              </div>
            </div>
            <div class="about-point">
              <span class="about-icon">🐾</span>
              <div>
                <div class="about-title">Cats Arrive on Their Own</div>
                <div class="about-desc">No tapping needed. Visitors wander in based on what you've placed. Rare ones are picky!</div>
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
                <div class="about-desc">22 cats across Common, Rare and Legendary tiers. Each has a personality and a secret.</div>
              </div>
            </div>
            <div class="about-point">
              <span class="about-icon">🌙</span>
              <div>
                <div class="about-title">Offline Progress</div>
                <div class="about-desc">Cats visit even while the game is closed. Come back to surprises every time!</div>
              </div>
            </div>
            <div class="about-point">
              <span class="about-icon">🔓</span>
              <div>
                <div class="about-title">Unlock New Areas</div>
                <div class="about-desc">Expand to the Flower Garden and Wooden Deck where the rarest cats roam.</div>
              </div>
            </div>
          </div>
          <div class="about-rarity-row">
            <div class="about-rarity-chip common">⬤ Common</div>
            <div class="about-rarity-chip rare">⬤ Rare</div>
            <div class="about-rarity-chip legendary">⬤ Legendary</div>
          </div>
        </div>

        <div class="intro-panel hidden" id="ipanel-howto">
          <div class="howto-steps">
            <div class="howto-step">
              <div class="step-num">1</div>
              <div class="step-body">
                <div class="step-title">Open the Yard tab 🏡</div>
                <div class="step-desc">Tap an empty slot in the Front Yard to place your first item from your inventory.</div>
              </div>
            </div>
            <div class="howto-step">
              <div class="step-num">2</div>
              <div class="step-body">
                <div class="step-title">Shop for better items 🛒</div>
                <div class="step-desc">You start with a Cardboard Box and Dried Fish. Premium items attract rarer cats.</div>
              </div>
            </div>
            <div class="howto-step">
              <div class="step-num">3</div>
              <div class="step-body">
                <div class="step-title">Wait for visitors 🐱</div>
                <div class="step-desc">Cats check in every 30 seconds. Tap a visiting cat to read their story and personality.</div>
              </div>
            </div>
            <div class="howto-step">
              <div class="step-num">4</div>
              <div class="step-body">
                <div class="step-title">Collect coins and expand 🪙</div>
                <div class="step-desc">Each departing cat leaves Snack Coins. Use them to buy items and unlock new areas.</div>
              </div>
            </div>
            <div class="howto-step">
              <div class="step-num">5</div>
              <div class="step-body">
                <div class="step-title">Complete your collection 📖</div>
                <div class="step-desc">Find all 22 cats. Legendary ones need 2 or more specific items placed at the same time.</div>
              </div>
            </div>
          </div>
          <div class="howto-tip">
            <span>💡</span>
            <div><strong>Pro tip:</strong> The Wooden Deck has the highest chance for Legendary cats. Unlock it as soon as possible!</div>
          </div>
          <div class="howto-tip" style="margin-top:8px">
            <span>🌙</span>
            <div><strong>Offline:</strong> Close the tab and come back later. Cats keep visiting while you're away!</div>
          </div>
        </div>

        <button class="intro-start-btn" id="intro-start">
          ${btnText} 🐾
        </button>

      </div>
    </div>
  `;

  document.getElementById("app").appendChild(overlay);

  overlay.querySelectorAll(".itab").forEach(btn => {
    btn.addEventListener("click", () => {
      overlay.querySelectorAll(".itab").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      overlay.querySelectorAll(".intro-panel").forEach(p => p.classList.add("hidden"));
      document.getElementById(`ipanel-${btn.dataset.itab}`).classList.remove("hidden");
    });
  });

  document.getElementById("intro-start").addEventListener("click", () => {
    overlay.style.animation = "introFadeOut 0.4s ease forwards";
    setTimeout(() => {
      overlay.remove();
      markIntroSeen();
      onStart();
    }, 380);
  });
}
