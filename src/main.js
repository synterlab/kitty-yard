// === KITTY YARD — Main v4 (Spectacular Garden) ===
import { CATS } from "./data/cats.js";
import { ITEMS } from "./data/items.js";
import { AREAS } from "./data/areas.js";
import { saveState, loadState, resetState, DEFAULT_STATE } from "./utils/storage.js";
import { pickVisitor, calcGift, simulateOffline, VISIT_INTERVAL_MS } from "./utils/probability.js";
import { generateCatSVG } from "./cats-svg.js";
import { showIntroScreen, hasSeenIntro } from "./intro.js";

// ══════════════════════════════════════
// STATE
// ══════════════════════════════════════
let state = loadState() || { ...DEFAULT_STATE };
let activeTab      = "yard";
let activeAreaId   = "front_yard";
let visitTimers    = {};
let activeVisitors = {};

// ══════════════════════════════════════
// WEATHER SYSTEM
// ══════════════════════════════════════
const WEATHER_STATES = [
  { id: "sunny",   emoji: "☀️",  name: "Sunny",   visitMult: 1.0,  desc: "A perfect day! Cats love sunshine." },
  { id: "cloudy",  emoji: "⛅",  name: "Cloudy",  visitMult: 0.9,  desc: "Cozy clouds — cats feel calm."      },
  { id: "breezy",  emoji: "🍃",  name: "Breezy",  visitMult: 1.2,  desc: "The wind carries cat whispers!"    },
  { id: "rainy",   emoji: "🌧️", name: "Rainy",   visitMult: 0.75, desc: "Cats come for shelter! 🏠"         },
  { id: "rainbow", emoji: "🌈",  name: "Rainbow", visitMult: 1.5,  desc: "Rare cats feel the magic! ✨"      },
];
let weatherIdx = Math.floor(Math.random() * 3);
let currentWeather = WEATHER_STATES[weatherIdx];

function cycleWeather() {
  weatherIdx = (weatherIdx + 1) % WEATHER_STATES.length;
  currentWeather = WEATHER_STATES[weatherIdx];
  updateWeatherDisplay();
  if (currentWeather.id === "rainbow") showToast("🌈","Rainbow appeared!","Legendary cats sense the magic! ✨");
  else if (currentWeather.id === "rainy") showToast("🌧️","It's raining!","Cats are seeking shelter in your yard.");
  else if (currentWeather.id === "breezy") showToast("🍃","Breezy afternoon!","The wind is bringing curious cats.");
}
function updateWeatherDisplay() {
  document.querySelectorAll(".area-weather").forEach(el => {
    el.innerHTML = `<span>${currentWeather.emoji}</span><span class="weather-label">${currentWeather.name}</span>`;
  });
  document.querySelectorAll(".area-scene").forEach(el => {
    WEATHER_STATES.forEach(w => el.classList.remove(`weather-${w.id}`));
    el.classList.add(`weather-${currentWeather.id}`);
  });
}
setInterval(cycleWeather, 5 * 60 * 1000);

// ══════════════════════════════════════
// CAT MOODS
// ══════════════════════════════════════
const CAT_MOODS = {
  legendary: ["✨", "👑", "🌟", "💫", "🎶"],
  rare:      ["💎", "🌸", "💜", "🎵", "🍃"],
  common:    ["💤", "😋", "♪", "🐾", "😸", "💕"],
};
function randomMood(rarity) {
  const pool = CAT_MOODS[rarity] || CAT_MOODS.common;
  return pool[Math.floor(Math.random() * pool.length)];
}

// ══════════════════════════════════════
// GARDEN LEVEL
// ══════════════════════════════════════
function getGardenLevel() {
  const totalVisits = Object.values(state.discoveredCats).reduce((s, v) => s + v, 0);
  return Math.max(1, Math.floor(totalVisits / 8) + 1);
}
function getGardenLevelEmoji(level) {
  if (level >= 20) return "🌳";
  if (level >= 10) return "🌿";
  return "🌱";
}

// ══════════════════════════════════════
// DAILY BONUS
// ══════════════════════════════════════
function checkDailyBonus() {
  const today = new Date().toDateString();
  if (state.lastLoginDate === today) return;
  const yesterday = new Date(Date.now() - 86400000).toDateString();
  const streak = state.lastLoginDate === yesterday ? (state.loginStreak || 0) + 1 : 1;
  state.loginStreak = streak;
  state.lastLoginDate = today;
  const bonus = 25 + Math.min(streak - 1, 7) * 15;
  state.coins += bonus;
  saveState(state);
  const fire = streak >= 7 ? "🔥🔥🔥" : streak >= 3 ? "🔥🔥" : "🔥";
  setTimeout(() => showToast("🌅", `Day ${streak} streak! ${fire}`, `Daily bonus: +${bonus} 🪙 coins`), 1800);
}

// ══════════════════════════════════════
// PET CATS
// ══════════════════════════════════════
function petCat(catId) {
  const now = Date.now();
  if (!state.petCooldowns) state.petCooldowns = {};
  if (now - (state.petCooldowns[catId] || 0) < 30000) {
    showToast("😸", "Cat needs a moment!", "Come back soon 🐾");
    return;
  }
  const cat = CATS.find(c => c.id === catId);
  const bonus = { common: 3, rare: 7, legendary: 18 }[cat?.rarity || "common"];
  state.petCooldowns[catId] = now;
  state.coins += bonus;
  saveState(state);
  updateCoinDisplay(true);
  showHeartAnimation(catId);
  closeSheet();
  showToast(generateCatSVG(catId, 44), `${cat?.name || "Cat"} loves you! 😻`, `Petting bonus: +${bonus} 🪙`);
}

function showHeartAnimation(catId) {
  const sprite = document.querySelector(`[data-cat="${catId}"] .cat-visitor-sprite`);
  if (!sprite) return;
  ["💕","💗","💖","✨"].forEach((h, i) => {
    setTimeout(() => {
      const el = document.createElement("div");
      el.className = "pet-heart";
      el.textContent = h;
      el.style.left = `${20 + Math.random() * 60}%`;
      sprite.style.position = "relative";
      sprite.appendChild(el);
      setTimeout(() => el.remove(), 1200);
    }, i * 110);
  });
}

// ══════════════════════════════════════
// COIN SPARKLES
// ══════════════════════════════════════
function showCoinBurst(areaId, amount) {
  const scene = document.getElementById(`scene-${areaId}`);
  if (!scene) return;
  // Floating coin pop
  const pop = document.createElement("div");
  pop.className = "gift-pop";
  pop.innerHTML = `<span class="gp-coin">🪙</span> +${amount}`;
  pop.style.left = `${15 + Math.random() * 60}%`;
  pop.style.top = "35%";
  scene.appendChild(pop);
  setTimeout(() => pop.remove(), 1700);
  // Mini sparkles
  for (let i = 0; i < 6; i++) {
    setTimeout(() => {
      const sp = document.createElement("div");
      sp.className = "coin-sparkle";
      sp.style.left = `${10 + Math.random() * 80}%`;
      sp.style.top = `${20 + Math.random() * 60}%`;
      sp.style.animationDelay = `${Math.random() * 0.3}s`;
      scene.appendChild(sp);
      setTimeout(() => sp.remove(), 900);
    }, i * 60);
  }
}

// ══════════════════════════════════════
// OFFLINE SIMULATION
// ══════════════════════════════════════
function handleOfflineVisits() {
  const visits = simulateOffline(state, Date.now());
  if (!visits.length) return;
  let totalCoins = 0;
  for (const { cat, areaId, coins, timestamp } of visits) {
    totalCoins += coins;
    state.coins += coins;
    state.discoveredCats[cat.id] = (state.discoveredCats[cat.id] || 0) + 1;
    state.gallery.unshift({ catId: cat.id, areaId, itemIds: state.placedItems[areaId] || [], gift: coins, timestamp });
  }
  state.lastSaveTime = Date.now();
  saveState(state);
  if (totalCoins > 0) showToast(generateCatSVG(visits[0].cat.id,44), "Welcome back!", `${visits.length} cat${visits.length>1?"s":""} visited! +${totalCoins} 🪙`);
}

// ══════════════════════════════════════
// RENDER ROOT
// ══════════════════════════════════════
function render() {
  const app = document.getElementById("app");
  const level = getGardenLevel();
  const lvEmoji = getGardenLevelEmoji(level);
  const totalVisits = Object.values(state.discoveredCats).reduce((s,v)=>s+v,0);
  const xpNow  = totalVisits % 8;
  const xpPct  = Math.round((xpNow / 8) * 100);
  app.innerHTML = `
    <div class="topbar">
      <div class="topbar-logo">
        <img src="logo.png" class="topbar-logo-img" alt="Kitty Yard" />
      </div>
      <div class="topbar-center">
        <div class="garden-level-badge">
          <span class="garden-level-icon">${lvEmoji}</span>
          <span class="garden-level-text">Lv.${level}</span>
        </div>
        <div class="garden-xp-bar" title="XP to next level">
          <div class="garden-xp-fill" style="width:${xpPct}%"></div>
        </div>
      </div>
      <div class="coin-display">
        <span class="coin-icon">🪙</span>
        <span class="coin-amount" id="coin-amount">${state.coins}</span>
      </div>
    </div>
    <div class="main-content" id="main-content">${renderTab()}</div>
    <nav class="tab-bar">${renderTabBar()}</nav>
  `;
  attachTabEvents();
  startVisitTimers();
}

function renderTabBar() {
  return [
    { id:"yard",       icon:"🏡", label:"Yard" },
    { id:"shop",       icon:"🛒", label:"Shop" },
    { id:"collection", icon:"📖", label:"Cats" },
    { id:"scrapbook",  icon:"📸", label:"Log"  },
    { id:"profile",    icon:"👤", label:"Me"   },
  ].map(t=>`
    <button class="tab-btn${activeTab===t.id?" active":""}" data-tab="${t.id}">
      <span class="tab-icon">${t.icon}</span>
      <span class="tab-label">${t.label}</span>
    </button>`).join("");
}

function attachTabEvents() {
  document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      activeTab = btn.dataset.tab;
      const mc = document.getElementById("main-content");
      mc.innerHTML = renderTab();
      mc.classList.remove("tab-fade-in");
      void mc.offsetWidth;
      mc.classList.add("tab-fade-in");
      document.querySelectorAll(".tab-btn").forEach(b=>b.classList.toggle("active",b.dataset.tab===activeTab));
      attachTabContent();
    });
  });
  attachTabContent();
}

function attachTabContent() {
  if (activeTab==="yard")            attachYardEvents();
  else if (activeTab==="shop")       attachShopEvents();
  else if (activeTab==="collection") attachCollectionEvents();
  else if (activeTab==="profile")    attachProfileEvents();
}

function renderTab() {
  if (activeTab==="yard")       return renderYard();
  if (activeTab==="shop")       return renderShop();
  if (activeTab==="collection") return renderCollection();
  if (activeTab==="scrapbook")  return renderScrapbook();
  if (activeTab==="profile")    return renderProfile();
  return "";
}

// ══════════════════════════════════════
// YARD VIEW
// ══════════════════════════════════════
function renderYard() {
  const area = AREAS.find(a=>a.id===activeAreaId);
  return `
    <div class="yard-view">
      <div class="area-switcher">
        ${AREAS.map(a=>{
          const locked = !state.unlockedAreas.includes(a.id);
          return `<button class="area-btn${a.id===activeAreaId?" active":""}${locked?" locked":""}" data-area="${a.id}">
            ${a.emoji} ${a.name}${locked?" 🔒":""}
          </button>`;
        }).join("")}
      </div>
      ${renderAreaScene(area)}
      ${renderUpgradeSection(area)}
    </div>`;
}

// ── Scene cloud/deco decorations per area ──
const SCENE_DECOS = {
  front_yard:    { clouds: 2, flowers: ["🌻","🌼","🌸"], birds: true  },
  flower_garden: { clouds: 3, flowers: ["🌸","🌺","🌷","🌹"], birds: false },
  wooden_deck:   { clouds: 1, flowers: ["🍀","🌿","🍃"],  birds: true  },
};

function renderAreaScene(area) {
  const isLocked = !state.unlockedAreas.includes(area.id);
  const slots    = state.areaSlots[area.id] || area.baseSlots;
  const placed   = state.placedItems[area.id] || [];
  const visitors = activeVisitors[area.id] || [];
  const deco     = SCENE_DECOS[area.id] || SCENE_DECOS.front_yard;

  // Happiness hearts (0-3 based on visitor count)
  const heartCount = Math.min(visitors.length, 3);
  const heartsHtml = [1,2,3].map(i =>
    `<span class="hap-heart${i <= heartCount ? " filled" : ""}">${i <= heartCount ? "💖" : "🤍"}</span>`
  ).join("");

  // Floating deco flowers
  const flowersHtml = deco.flowers.map((f, i) => `
    <span class="scene-deco-flower" style="
      left:${8 + i * 22 + Math.floor(i*7)%15}%;
      animation-duration:${3.5 + i * 0.8}s;
      animation-delay:${i * 0.5}s;
    ">${f}</span>`).join("");

  // Cloud elements
  const cloudsHtml = Array.from({length: deco.clouds}).map((_,i) => `
    <div class="scene-cloud sc${i+1}" style="
      animation-duration:${22 + i*10}s;
      animation-delay:${-i*8}s;
      top:${8+i*7}%;
    "></div>`).join("");

  // Bird decoration
  const birdHtml = deco.birds ? `<div class="scene-bird">🐦</div>` : "";

  // Visitors or waiting state
  const visitorsHtml = visitors.length > 0
    ? visitors.map(v => {
        const mood = randomMood(v.cat.rarity);
        const visits = state.discoveredCats[v.cat.id] || 1;
        const isNew = visits === 1;
        const rarityLabel = v.cat.rarity === "legendary" ? "✨ Legendary" : v.cat.rarity === "rare" ? "💎 Rare" : "🐱 Common";
        return `
          <div class="cat-visitor rarity-${v.cat.rarity}${isNew?" cat-visitor-new":""}" data-cat="${v.cat.id}">
            <div class="cat-rarity-aura"></div>
            ${isNew ? '<div class="cat-new-badge">New! ✨</div>' : ""}
            <div class="cat-mood-bubble">${mood}</div>
            <div class="cat-visitor-sprite">${generateCatSVG(v.cat.id, 80)}</div>
            <div class="cat-visitor-name">${v.cat.name}</div>
            <div class="cat-visitor-rarity">${rarityLabel}</div>
            <div class="cat-visitor-blurb">${v.cat.blurb.slice(0,48)}…</div>
            <button class="cat-pet-btn" data-pet="${v.cat.id}">🐾 Pet</button>
          </div>`;
      }).join("")
    : `<div class="waiting-scene">
         <div class="waiting-cat-silhouette">🐱</div>
         <div class="no-cats-msg waiting-dots">Waiting for visitors<span>.</span><span>.</span><span>.</span></div>
         ${getYardHint(area.id)}
       </div>`;

  // Item slots as garden beds
  const slotsHtml = Array.from({length: slots}).map((_, i) => {
    const itemId = placed[i];
    const item   = itemId ? ITEMS.find(it => it.id === itemId) : null;
    return `
      <div class="item-slot garden-bed${item ? " filled" : ""}" data-slot="${i}" data-area="${area.id}">
        <div class="bed-soil"></div>
        ${item
          ? `<span class="slot-emoji">${item.emoji}</span><span class="slot-name">${item.name}</span>`
          : `<span class="slot-plus">+</span>`}
      </div>`;
  }).join("");

  return `
    <div class="area-scene ${area.cssClass} weather-${currentWeather.id}" id="scene-${area.id}">
      ${isLocked ? lockedOverlayHTML(area) : ""}

      <!-- Sky layer with clouds & birds -->
      <div class="scene-sky" aria-hidden="true">
        ${cloudsHtml}
        ${birdHtml}
      </div>

      <!-- Scene header -->
      <div class="area-scene-header">
        <div class="area-scene-title">${area.emoji} ${area.name}</div>
        <div class="area-weather">
          <span>${currentWeather.emoji}</span>
          <span class="weather-label">${currentWeather.name}</span>
        </div>
      </div>

      <!-- Happiness hearts -->
      <div class="yard-happiness">${heartsHtml}</div>

      <!-- Cat visitors -->
      <div class="visiting-cats" id="visitors-${area.id}">${visitorsHtml}</div>

      <!-- Decorative flowers -->
      <div class="scene-flowers" aria-hidden="true">${flowersHtml}</div>

      <!-- Grass divider -->
      <div class="grass-divider" aria-hidden="true">
        <span>🌿</span><span>🌱</span><span>🍀</span><span>🌿</span>
        <span>🌱</span><span>🌿</span><span>🍀</span><span>🌱</span>
        <span>🌿</span>
      </div>

      <!-- Item slots -->
      <div class="slot-section-title">🌱 Garden Spots</div>
      <div class="item-slots">${slotsHtml}</div>
    </div>`;
}

function getYardHint(areaId) {
  const placed = (state.placedItems[areaId] || []).filter(Boolean);
  if (placed.length === 0) {
    const owned = Object.entries(state.ownedItems).filter(([,c])=>c>0);
    if (owned.length > 0) return `<div class="yard-hint">💡 Tap a <strong>+</strong> slot to place items!</div>`;
    return `<div class="yard-hint">💡 Visit the <strong>Shop</strong> to buy items for cats!</div>`;
  }
  return `<div class="yard-hint">⏳ Check back soon — cats are on their way!</div>`;
}

function lockedOverlayHTML(area) {
  const canAfford = state.coins >= area.unlockCost;
  return `
    <div class="area-locked-overlay">
      <div class="lock-sparkles">✨🔒✨</div>
      <div class="area-locked-title">${area.emoji} ${area.name}</div>
      <div class="area-locked-desc">${area.description}</div>
      <div class="area-locked-cost"><span>🪙</span> ${area.unlockCost} coins needed</div>
      <button class="unlock-btn" data-unlock="${area.id}" ${canAfford?"":"disabled"}>
        ${canAfford ? "🔓 Unlock Area!" : `Need ${area.unlockCost - state.coins} more 🪙`}
      </button>
    </div>`;
}

function renderUpgradeSection(area) {
  if (!state.unlockedAreas.includes(area.id)) return "";
  const slots = state.areaSlots[area.id] || area.baseSlots;
  if (slots >= area.maxSlots) {
    return `<div class="upgrade-section">
      <div class="max-slots-badge">🌟 Max garden spots reached!</div>
    </div>`;
  }
  const cost = area.upgradeSlotCost;
  const ok   = state.coins >= cost;
  return `
    <div class="upgrade-section">
      <button class="upgrade-btn" data-upgrade="${area.id}" ${ok?"":"disabled"}>
        <span>🌱 Add Garden Spot</span>
        <span class="upgrade-cost">🪙 ${cost}</span>
      </button>
    </div>`;
}

function attachYardEvents() {
  document.querySelectorAll(".area-btn").forEach(btn=>{
    btn.addEventListener("click",()=>{
      activeAreaId = btn.dataset.area;
      document.getElementById("main-content").innerHTML = renderYard();
      attachYardEvents();
    });
  });
  document.querySelectorAll(".item-slot").forEach(slot=>{
    slot.addEventListener("click",()=>{
      const areaId = slot.dataset.area;
      if (!state.unlockedAreas.includes(areaId)) return;
      openItemPicker(areaId, parseInt(slot.dataset.slot), (state.placedItems[areaId]||[])[parseInt(slot.dataset.slot)]);
    });
  });
  document.querySelectorAll("[data-unlock]").forEach(btn=>{
    btn.addEventListener("click",()=>{
      const area = AREAS.find(a=>a.id===btn.dataset.unlock);
      if (state.coins<area.unlockCost) return;
      state.coins -= area.unlockCost;
      state.unlockedAreas.push(area.id);
      saveState(state); updateCoinDisplay();
      document.getElementById("main-content").innerHTML = renderYard();
      attachYardEvents();
      showToast(area.emoji,"Area Unlocked!", `${area.name} is now open! 🎉`);
    });
  });
  document.querySelectorAll("[data-upgrade]").forEach(btn=>{
    btn.addEventListener("click",()=>{
      const area = AREAS.find(a=>a.id===btn.dataset.upgrade);
      if (state.coins<area.upgradeSlotCost) return;
      state.coins -= area.upgradeSlotCost;
      state.areaSlots[area.id] = (state.areaSlots[area.id]||area.baseSlots)+1;
      saveState(state); updateCoinDisplay();
      document.getElementById("main-content").innerHTML = renderYard();
      attachYardEvents();
      showToast("🌱","Spot Added!",`${area.name} now has ${state.areaSlots[area.id]} garden spots!`);
    });
  });
  document.querySelectorAll(".cat-visitor .cat-visitor-sprite, .cat-visitor .cat-visitor-name").forEach(el=>{
    el.addEventListener("click", () => openCatSheet(el.closest("[data-cat]").dataset.cat));
  });
  document.querySelectorAll(".cat-pet-btn").forEach(btn=>{
    btn.addEventListener("click", e => { e.stopPropagation(); petCat(btn.dataset.pet); });
  });
}

// ══════════════════════════════════════
// ITEM PICKER SHEET
// ══════════════════════════════════════
function openItemPicker(areaId, slotIdx, currentItemId) {
  const owned = Object.entries(state.ownedItems)
    .filter(([,c])=>c>0)
    .map(([id])=>ITEMS.find(it=>it.id===id))
    .filter(Boolean);

  const listHtml = owned.length > 0
    ? owned.map(item=>`
        <button class="item-picker-btn" data-pick="${item.id}">
          <span class="picker-emoji">${item.emoji}</span>
          <div>
            <div class="picker-name">${item.name}</div>
            <div class="picker-count">Owned: ${state.ownedItems[item.id]}</div>
          </div>
        </button>`).join("")
    : `<div class="picker-empty">
         <div style="font-size:36px">🛒</div>
         <p>No items yet — visit the Shop first!</p>
       </div>`;

  showBottomSheet(`
    <div class="sheet-handle"></div>
    <div class="sheet-content">
      <h2 class="sheet-title">🌱 Place an Item</h2>
      <div class="item-picker-list">${listHtml}</div>
      ${currentItemId ? `<button class="remove-slot-btn" id="rm-slot">🗑️ Remove Item</button>` : ""}
    </div>`, () => {
    document.querySelectorAll("[data-pick]").forEach(btn => {
      btn.addEventListener("click", () => { placeItem(areaId, slotIdx, btn.dataset.pick); closeSheet(); });
    });
    document.getElementById("rm-slot")?.addEventListener("click", () => { placeItem(areaId, slotIdx, null); closeSheet(); });
  });
}

function placeItem(areaId, idx, itemId) {
  if (!state.placedItems[areaId]) state.placedItems[areaId] = [];
  state.placedItems[areaId][idx] = itemId || null;
  saveState(state);
  if (activeTab==="yard") { document.getElementById("main-content").innerHTML=renderYard(); attachYardEvents(); }
}

// ══════════════════════════════════════
// CAT DETAIL SHEET
// ══════════════════════════════════════
function openCatSheet(catId) {
  const cat        = CATS.find(c=>c.id===catId); if (!cat) return;
  const discovered = !!state.discoveredCats[catId];
  const visits     = state.discoveredCats[catId] || 0;
  const favItem    = ITEMS.find(it=>it.id===cat.favoriteItem);
  const catSVG     = generateCatSVG(catId, 110);
  const isCurrentVisitor = Object.values(activeVisitors).some(arr => arr.some(v => v.cat.id === catId));
  const cooldownMs = (state.petCooldowns || {})[catId] || 0;
  const canPet = Date.now() - cooldownMs >= 30000;
  const petBonus = { common: 3, rare: 7, legendary: 18 }[cat.rarity];
  const rarityStars = { common:"⭐", rare:"⭐⭐", legendary:"⭐⭐⭐" }[cat.rarity];

  showBottomSheet(`
    <div class="sheet-handle"></div>
    <div class="sheet-content">
      <div class="sheet-cat-portrait cat-portrait-${cat.rarity}">${catSVG}</div>
      <div class="sheet-cat-name">${discovered ? cat.name : "???"}</div>
      <div class="sheet-rarity">
        <span class="rarity-badge ${cat.rarity}">${cat.rarity.toUpperCase()}</span>
        ${discovered ? `<span class="rarity-stars">${rarityStars}</span>` : ""}
      </div>
      <p class="sheet-blurb">${discovered ? cat.blurb : "You haven't met this cat yet… leave some items out!"}</p>
      <div class="sheet-stats">
        <div class="stat-box">
          <div class="stat-val">${visits}</div>
          <div class="stat-lbl">Visits</div>
        </div>
        <div class="stat-box">
          <div class="stat-val">${discovered ? rarityStars : "???"}</div>
          <div class="stat-lbl">Rarity</div>
        </div>
        <div class="stat-box">
          <div class="stat-val">${petBonus} 🪙</div>
          <div class="stat-lbl">Pet Bonus</div>
        </div>
      </div>
      ${discovered && favItem ? `
        <div class="sheet-fav">
          <span class="fav-emoji">${favItem.emoji}</span>
          <div>
            <div class="fav-label">Favorite Item</div>
            <div class="fav-name">${favItem.name}</div>
          </div>
        </div>` :
        discovered && cat.rarity === "legendary" ? `
        <div class="sheet-fav legendary-hint">
          <span class="fav-emoji">✨</span>
          <div>
            <div class="fav-label">Legendary Hint</div>
            <div class="fav-name">Needs ${(cat.requiredItems||[]).length}+ specific items${cat.requiredArea ? ` in ${AREAS.find(a=>a.id===cat.requiredArea)?.name}` : ""}!</div>
          </div>
        </div>` : ""}
      ${isCurrentVisitor ? `
        <button class="pet-btn" id="pet-sheet-btn" ${canPet?"":"disabled"}>
          ${canPet
            ? `🐾 Pet ${cat.name} <span class="pet-bonus-badge">+${petBonus} 🪙</span>`
            : `😺 Resting… come back soon`}
        </button>` : ""}
    </div>`, () => {
    document.getElementById("pet-sheet-btn")?.addEventListener("click", () => petCat(catId));
  });
}

// ══════════════════════════════════════
// SHOP VIEW
// ══════════════════════════════════════
function renderShop() {
  const categories = [
    { id:"food",    label:"🍽️ Food",    desc:"Attract with flavour" },
    { id:"toy",     label:"🧸 Toys",    desc:"Playful cats love these" },
    { id:"plant",   label:"🌿 Plants",  desc:"Fresh garden items" },
    { id:"shelter", label:"🏠 Shelter", desc:"Cozy hiding spots" },
    { id:"comfort", label:"💤 Comfort", desc:"For distinguished guests" },
  ];

  const shopHtml = categories.map(cat => {
    const catItems = ITEMS.filter(it => it.category === cat.id);
    if (!catItems.length) return "";
    return `
      <div class="shop-category">
        <div class="shop-category-header">
          <span class="shop-cat-label">${cat.label}</span>
          <span class="shop-cat-desc">${cat.desc}</span>
        </div>
        <div class="shop-card-grid">
          ${catItems.map(item => {
            const owned = state.ownedItems[item.id] || 0;
            const canAfford = state.coins >= item.price;
            return `
              <div class="shop-card${canAfford?"":" unaffordable"}">
                <div class="shop-card-emoji">${item.emoji}</div>
                <div class="shop-card-name">${item.name}</div>
                <div class="shop-card-desc">${item.desc}</div>
                ${owned > 0 ? `<div class="shop-card-owned">✓ ×${owned}</div>` : ""}
                <button class="buy-btn" data-buy="${item.id}" data-price="${item.price}" ${canAfford?"":"disabled"}>
                  🪙 ${item.price}
                </button>
              </div>`;
          }).join("")}
        </div>
      </div>`;
  }).join("");

  const level = getGardenLevel();
  return `
    <div class="view-header">🛒 Shop <span class="view-header-sub">Garden Lv.${level}</span></div>
    <div class="weather-info-bar weather-${currentWeather.id}">
      <span class="wib-emoji">${currentWeather.emoji}</span>
      <span class="wib-text">${currentWeather.desc}</span>
    </div>
    <div class="shop-items">${shopHtml}</div>
  `;
}

function attachShopEvents() {
  document.querySelectorAll("[data-buy]").forEach(btn => {
    btn.addEventListener("click", () => {
      const itemId = btn.dataset.buy;
      const price  = parseInt(btn.dataset.price);
      if (state.coins < price) return;
      state.coins -= price;
      state.ownedItems[itemId] = (state.ownedItems[itemId] || 0) + 1;
      saveState(state); updateCoinDisplay();
      document.getElementById("main-content").innerHTML = renderShop();
      attachShopEvents();
      const item = ITEMS.find(it => it.id === itemId);
      showToast(item.emoji, "Purchased!", `You got ${item.name}! Place it in the Yard. 🌱`);
    });
  });
}

// ══════════════════════════════════════
// COLLECTION VIEW
// ══════════════════════════════════════
function renderCollection() {
  const total = CATS.length;
  const found = Object.keys(state.discoveredCats).length;
  const pct   = Math.round((found / total) * 100);

  const groups = [
    { id:"legendary", label:"✨ Legendary", color:"#a855f7" },
    { id:"rare",      label:"💎 Rare",      color:"#3b82f6" },
    { id:"common",    label:"🐱 Common",    color:"#22c55e" },
  ];

  const groupsHtml = groups.map(group => {
    const groupCats = CATS.filter(c => c.rarity === group.id);
    const foundIn   = groupCats.filter(c => !!state.discoveredCats[c.id]).length;
    return `
      <div class="collection-group">
        <div class="collection-group-header" style="--group-color:${group.color}">
          <span>${group.label}</span>
          <span class="group-progress-text">${foundIn}/${groupCats.length}</span>
        </div>
        <div class="collection-grid">
          ${groupCats.map(cat => {
            const disc   = !!state.discoveredCats[cat.id];
            const visits = state.discoveredCats[cat.id] || 0;
            return `
              <div class="cat-card ${cat.rarity}${disc?"":" locked"}" data-cat="${cat.id}">
                ${disc && cat.rarity==="legendary" ? `<div class="legendary-sparkle-bg"></div>` : ""}
                <div class="cat-card-svg">${disc ? generateCatSVG(cat.id,56) : `<div class="cat-lock-icon">❓</div>`}</div>
                <div class="cat-card-name">${disc ? cat.name : "???"}</div>
                <div class="cat-card-visits">${disc ? `${visits}×` : ""}</div>
              </div>`;
          }).join("")}
        </div>
      </div>`;
  }).join("");

  return `
    <div class="view-header">📖 Cat Catalogue <span class="view-header-sub">${found}/${total}</span></div>
    <div class="collection-summary">
      <div class="coll-ring-wrap">
        <svg class="coll-ring" viewBox="0 0 44 44" width="72" height="72">
          <circle cx="22" cy="22" r="18" fill="none" stroke="#e8f5e0" stroke-width="5"/>
          <circle cx="22" cy="22" r="18" fill="none" stroke="#4ea630" stroke-width="5"
            stroke-dasharray="${Math.round(pct * 1.131)} 113.1"
            stroke-linecap="round" transform="rotate(-90 22 22)"/>
        </svg>
        <div class="coll-pct">${pct}%</div>
      </div>
      <div class="coll-summary-text">
        <div class="coll-found">${found} cats met</div>
        <div class="coll-remain">${total - found} left to discover</div>
      </div>
    </div>
    ${groupsHtml}`;
}

function attachCollectionEvents() {
  document.querySelectorAll(".cat-card").forEach(c => c.addEventListener("click", () => openCatSheet(c.dataset.cat)));
}

// ══════════════════════════════════════
// SCRAPBOOK VIEW
// ══════════════════════════════════════
function renderScrapbook() {
  if (!state.gallery.length) return `
    <div class="view-header">📸 Memories</div>
    <div class="empty-state">
      <div class="empty-icon">🪴</div>
      <p>No visits yet!<br>Place some items to attract cats.</p>
    </div>`;

  const totalGifts = state.gallery.reduce((s,e) => s + (e.gift||0), 0);
  const catsMap = {};
  state.gallery.forEach(e => { catsMap[e.catId] = (catsMap[e.catId]||0)+1; });
  const topCatId = Object.entries(catsMap).sort((a,b)=>b[1]-a[1])[0]?.[0];
  const topCat = CATS.find(c=>c.id===topCatId);

  const entries = state.gallery.slice(0,100).map(entry => {
    const cat  = CATS.find(c=>c.id===entry.catId);
    const area = AREAS.find(a=>a.id===entry.areaId);
    if (!cat||!area) return "";
    const dt = new Date(entry.timestamp);
    const timeStr = dt.toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"});
    const dateStr = dt.toLocaleDateString([], {month:"short",day:"numeric"});
    return `
      <div class="scrapbook-entry rarity-entry-${cat.rarity}">
        <div class="entry-cat-svg">${generateCatSVG(cat.id, 48)}</div>
        <div class="entry-info">
          <div class="entry-cat-name">${cat.name}</div>
          <div class="entry-detail">${area.emoji} ${area.name}</div>
          <div class="entry-time">${dateStr} · ${timeStr}</div>
        </div>
        <div class="entry-gift-badge">+${entry.gift} 🪙</div>
      </div>`;
  }).join("");

  return `
    <div class="view-header">📸 Memories <span class="view-header-sub">${state.gallery.length} visits</span></div>
    <div class="scrapbook-summary">
      <div class="sb-stat">
        <div class="sb-stat-icon">🏅</div>
        <div class="sb-stat-val">${state.gallery.length}</div>
        <div class="sb-stat-lbl">Visits</div>
      </div>
      <div class="sb-stat">
        <div class="sb-stat-icon">🪙</div>
        <div class="sb-stat-val">${totalGifts}</div>
        <div class="sb-stat-lbl">Coins Earned</div>
      </div>
      <div class="sb-stat">
        <div class="sb-stat-icon">😻</div>
        <div class="sb-stat-val">${topCat ? topCat.name : "—"}</div>
        <div class="sb-stat-lbl">Top Visitor</div>
      </div>
    </div>
    <div class="scrapbook-list">${entries}</div>`;
}

// ══════════════════════════════════════
// VISIT TIMERS
// ══════════════════════════════════════
function startVisitTimers() {
  clearVisitTimers();
  for (const area of AREAS) {
    visitTimers[area.id] = setInterval(() => {
      if (!state.unlockedAreas.includes(area.id)) return;
      if (Math.random() > currentWeather.visitMult) return;
      const placed   = (state.placedItems[area.id]||[]).filter(Boolean);
      const existing = (activeVisitors[area.id]||[]).map(v=>v.cat.id);
      const cat = pickVisitor(area.id, placed, existing);
      if (!cat) return;
      spawnVisitor(area.id, cat);
    }, VISIT_INTERVAL_MS);
  }
}

function clearVisitTimers() {
  Object.values(visitTimers).forEach(id => clearInterval(id));
  visitTimers = {};
}

function spawnVisitor(areaId, cat) {
  if (!activeVisitors[areaId]) activeVisitors[areaId] = [];
  const coins     = calcGift(cat);
  const leaveMs   = 20_000 + Math.random() * 40_000;
  const leaveTimer = setTimeout(() => catLeaves(areaId, cat, coins), leaveMs);
  activeVisitors[areaId].push({ cat, leaveTimer });

  const isFirst = !state.discoveredCats[cat.id];
  state.discoveredCats[cat.id] = (state.discoveredCats[cat.id] || 0) + 1;
  saveState(state);
  updateLevelDisplay();

  if (isFirst) {
    showToast(generateCatSVG(cat.id,44), `✨ New cat discovered!`, `${cat.name} — ${cat.rarity}`, cat.rarity);
    const scene = document.getElementById(`scene-${areaId}`);
    if (scene) {
      const flash = document.createElement("div");
      flash.className = "discovery-flash";
      scene.appendChild(flash);
      setTimeout(() => flash.remove(), 1300);
    }
  } else {
    const areaName = AREAS.find(a=>a.id===areaId)?.name;
    const rar = cat.rarity === "common" ? "" : cat.rarity;
    showToast(generateCatSVG(cat.id,44), `${cat.name} arrived! ${randomMood(cat.rarity)}`, `Visiting ${areaName}`, rar);
  }
  refreshVisitorUI(areaId);
}

function catLeaves(areaId, cat, coins) {
  if (!activeVisitors[areaId]) return;
  activeVisitors[areaId] = activeVisitors[areaId].filter(v => v.cat.id !== cat.id);
  state.coins += coins;
  const placed = (state.placedItems[areaId]||[]).filter(Boolean);
  state.gallery.unshift({ catId:cat.id, areaId, itemIds:placed, gift:coins, timestamp:Date.now() });
  if (state.gallery.length > 500) state.gallery = state.gallery.slice(0,500);
  saveState(state);
  updateCoinDisplay(true);
  refreshVisitorUI(areaId);
  if (activeTab==="yard" && activeAreaId===areaId) showCoinBurst(areaId, coins);
}

function refreshVisitorUI(areaId) {
  if (activeTab !== "yard") return;
  const el = document.getElementById(`visitors-${areaId}`);
  if (!el) return;
  const visitors = activeVisitors[areaId] || [];
  const heartCount = Math.min(visitors.length, 3);
  // Update happiness hearts
  const happinessEl = el.closest(".area-scene")?.querySelector(".yard-happiness");
  if (happinessEl) {
    happinessEl.innerHTML = [1,2,3].map(i =>
      `<span class="hap-heart${i <= heartCount ? " filled" : ""}">${i <= heartCount ? "💖" : "🤍"}</span>`
    ).join("");
  }
  el.innerHTML = visitors.length > 0
    ? visitors.map(v => {
        const mood = randomMood(v.cat.rarity);
        return `
          <div class="cat-visitor rarity-${v.cat.rarity}" data-cat="${v.cat.id}">
            <div class="cat-rarity-aura"></div>
            <div class="cat-mood-bubble">${mood}</div>
            <div class="cat-visitor-sprite">${generateCatSVG(v.cat.id, 68)}</div>
            <div class="cat-visitor-name">${v.cat.name}</div>
            <button class="cat-pet-btn" data-pet="${v.cat.id}">🐾</button>
          </div>`;
      }).join("")
    : `<div class="waiting-scene">
         <div class="waiting-cat-silhouette">🐱</div>
         <div class="no-cats-msg waiting-dots">Waiting for visitors<span>.</span><span>.</span><span>.</span></div>
         ${getYardHint(areaId)}
       </div>`;
  el.querySelectorAll(".cat-visitor .cat-visitor-sprite, .cat-visitor .cat-visitor-name").forEach(e => {
    e.addEventListener("click", () => openCatSheet(e.closest("[data-cat]").dataset.cat));
  });
  el.querySelectorAll(".cat-pet-btn").forEach(btn => {
    btn.addEventListener("click", e => { e.stopPropagation(); petCat(btn.dataset.pet); });
  });
}

// ══════════════════════════════════════
// UI HELPERS
// ══════════════════════════════════════
function updateCoinDisplay(bump=false) {
  const el = document.getElementById("coin-amount");
  if (!el) return;
  el.textContent = state.coins;
  if (bump) { el.classList.remove("bump"); void el.offsetWidth; el.classList.add("bump"); }
}

function updateLevelDisplay() {
  const el = document.querySelector(".garden-level-text");
  if (el) el.textContent = `Lv.${getGardenLevel()}`;
  const fill = document.querySelector(".garden-xp-fill");
  if (fill) {
    const totalVisits = Object.values(state.discoveredCats).reduce((s,v)=>s+v,0);
    fill.style.width = `${Math.round(((totalVisits % 8) / 8) * 100)}%`;
  }
}

let toastTimeout = null;
function showToast(svgOrIcon, title, sub, rarity="") {
  document.querySelector(".notification")?.remove();
  if (toastTimeout) clearTimeout(toastTimeout);
  const isSVG = typeof svgOrIcon==="string" && svgOrIcon.includes("<svg");
  const el = document.createElement("div");
  el.className = `notification${rarity?" rarity-"+rarity:""}`;
  el.innerHTML = `
    ${isSVG
      ? `<div class="notif-cat-svg">${svgOrIcon}</div>`
      : `<div style="font-size:32px">${svgOrIcon}</div>`}
    <div class="notif-text">
      <div class="notif-title">${title}</div>
      <div class="notif-sub">${sub}</div>
    </div>`;
  document.getElementById("app").appendChild(el);
  toastTimeout = setTimeout(() => { el.classList.add("leaving"); setTimeout(() => el.remove(), 300); }, 3500);
}


let sheetEl = null;
function showBottomSheet(html, onReady=null) {
  closeSheet();
  sheetEl = document.createElement("div");
  sheetEl.className = "overlay";
  sheetEl.innerHTML = `<div class="bottom-sheet">${html}</div>`;
  document.getElementById("app").appendChild(sheetEl);
  sheetEl.addEventListener("click", e => { if (e.target===sheetEl) closeSheet(); });
  if (onReady) onReady();
}
function closeSheet() { if (sheetEl) { sheetEl.remove(); sheetEl = null; } }



// ══════════════════════════════════════
// PROFILE / DASHBOARD VIEW
// ══════════════════════════════════════
function renderProfile() {
  const level      = getGardenLevel();
  const lvEmoji    = getGardenLevelEmoji(level);
  const totalVisits= Object.values(state.discoveredCats).reduce((s,v)=>s+v,0);
  const foundCats  = Object.keys(state.discoveredCats).length;
  const totalCoins = state.gallery.reduce((s,e)=>s+(e.gift||0),0);
  const streak     = state.loginStreak || 0;
  const name       = state.playerName || "";
  const xpNow      = totalVisits % 8;
  const xpPct      = Math.round((xpNow / 8) * 100);
  const totalGifts = state.gallery.length;

  const commonCats  = CATS.filter(c=>c.rarity==="common");
  const rareCats    = CATS.filter(c=>c.rarity==="rare");
  const legendCats  = CATS.filter(c=>c.rarity==="legendary");
  const cFound  = c => !!state.discoveredCats[c.id];
  const cf = commonCats.filter(cFound).length;
  const rf = rareCats.filter(cFound).length;
  const lf = legendCats.filter(cFound).length;

  // Pick avatar cat: most-visited discovered cat, or default
  const topCatId = Object.entries(state.discoveredCats)
    .sort((a,b)=>b[1]-a[1])[0]?.[0];
  const avatarSvg = topCatId
    ? generateCatSVG(topCatId, 72)
    : `<span style="font-size:52px;line-height:1">🐱</span>`;

  // Streak display
  const streakFire = streak >= 7 ? "🔥🔥🔥" : streak >= 3 ? "🔥🔥" : streak >= 1 ? "🔥" : "";
  const streakColor = streak >= 7 ? "#ff4d00" : streak >= 3 ? "#ff8c00" : "#ffc107";

  // Cat collection grid — all 22 cats
  const catGridHtml = CATS.map(cat => {
    const discovered = !!state.discoveredCats[cat.id];
    const visits     = state.discoveredCats[cat.id] || 0;
    const rarityClass = cat.rarity;
    if (discovered) {
      return `<div class="cat-grid-card discovered rarity-card-${rarityClass}" title="${cat.name}: ${cat.blurb}">
        <div class="cat-grid-sprite">${generateCatSVG(cat.id, 52)}</div>
        <div class="cat-grid-name">${cat.name}</div>
        <div class="cat-grid-visits">${visits}x</div>
        ${rarityClass==="legendary"?'<div class="cat-grid-badge">✨</div>':rarityClass==="rare"?'<div class="cat-grid-badge">💎</div>':''}
      </div>`;
    } else {
      return `<div class="cat-grid-card locked" title="???">
        <div class="cat-grid-silhouette">🐾</div>
        <div class="cat-grid-name unknown">???</div>
      </div>`;
    }
  }).join("");

  // Achievement badges
  const badges = [];
  if (foundCats >= 1)  badges.push({ icon:"🐱", label:"First Cat!" });
  if (streak >= 3)     badges.push({ icon:"🔥", label:"On Fire" });
  if (streak >= 7)     badges.push({ icon:"⚡", label:"Unstoppable" });
  if (foundCats >= 8)  badges.push({ icon:"📖", label:"Cat Lover" });
  if (lf >= 1)         badges.push({ icon:"✨", label:"Legend Found" });
  if (totalGifts >= 10)badges.push({ icon:"🎁", label:"Gift Master" });
  if (foundCats >= CATS.length) badges.push({ icon:"👑", label:"Complete!" });
  const badgesHtml = badges.length
    ? badges.map(b=>`<div class="achieve-badge"><span class="achieve-icon">${b.icon}</span><span class="achieve-lbl">${b.label}</span></div>`).join("")
    : `<div class="achieve-empty">Keep playing to earn badges! 🌟</div>`;

  return `
    <div class="profile-view">

      <!-- HERO CARD -->
      <div class="profile-hero">
        <div class="profile-hero-bg"></div>
        <div class="profile-avatar-circle">
          ${avatarSvg}
        </div>
        <div class="profile-hero-info">
          <input class="profile-name-input profile-name-big" id="profile-name-input"
            type="text" maxlength="24"
            placeholder="Your garden name…"
            value="${name}" />
          <div class="profile-level-row">
            <span class="profile-lv-badge">${lvEmoji} Lv.${level}</span>
            ${streak > 0 ? `<span class="profile-streak-badge" style="color:${streakColor}">${streakFire} ${streak} day streak</span>` : ""}
          </div>
          <div class="profile-xp-slim-wrap">
            <div class="profile-xp-slim-bg">
              <div class="profile-xp-slim-fill" style="width:${xpPct}%"></div>
            </div>
            <span class="profile-xp-slim-pct">${xpPct}% to Lv.${level+1}</span>
          </div>
        </div>
      </div>

      <!-- STATS ROW -->
      <div class="profile-stats-row">
        <div class="pstat2-card pstat2-cats">
          <div class="pstat2-icon">🐱</div>
          <div class="pstat2-val">${foundCats}<span class="pstat2-denom">/${CATS.length}</span></div>
          <div class="pstat2-lbl">Cats Found</div>
        </div>
        <div class="pstat2-card pstat2-visits">
          <div class="pstat2-icon">🎯</div>
          <div class="pstat2-val">${totalVisits}</div>
          <div class="pstat2-lbl">Visits</div>
        </div>
        <div class="pstat2-card pstat2-coins">
          <div class="pstat2-icon">🪙</div>
          <div class="pstat2-val">${totalCoins}</div>
          <div class="pstat2-lbl">Earned</div>
        </div>
        <div class="pstat2-card pstat2-gifts">
          <div class="pstat2-icon">🎁</div>
          <div class="pstat2-val">${totalGifts}</div>
          <div class="pstat2-lbl">Gifts</div>
        </div>
      </div>

      <!-- ACHIEVEMENTS -->
      <div class="profile-section-title">🏅 Achievements</div>
      <div class="achieve-row">${badgesHtml}</div>

      <!-- COLLECTION PROGRESS BARS -->
      <div class="profile-section-title">📊 Collection Progress</div>
      <div class="profile-coll-bars">
        <div class="pcb-row">
          <span class="pcb-label">🐱 Common</span>
          <div class="pcb-bar"><div class="pcb-fill pcb-common" style="width:${Math.round(cf/commonCats.length*100)}%"></div></div>
          <span class="pcb-count">${cf}/${commonCats.length}</span>
        </div>
        <div class="pcb-row">
          <span class="pcb-label">💎 Rare</span>
          <div class="pcb-bar"><div class="pcb-fill pcb-rare" style="width:${Math.round(rf/rareCats.length*100)}%"></div></div>
          <span class="pcb-count">${rf}/${rareCats.length}</span>
        </div>
        <div class="pcb-row">
          <span class="pcb-label">✨ Legendary</span>
          <div class="pcb-bar"><div class="pcb-fill pcb-legend" style="width:${Math.round(lf/legendCats.length*100)}%"></div></div>
          <span class="pcb-count">${lf}/${legendCats.length}</span>
        </div>
      </div>

      <!-- CAT COLLECTION GRID -->
      <div class="profile-section-title">🐾 My Cats <span class="cat-grid-total">${foundCats}/${CATS.length}</span></div>
      <div class="cat-collection-grid">${catGridHtml}</div>

      <!-- SETTINGS -->
      <div class="profile-section-title">⚙️ Settings</div>
      <div class="profile-danger-zone">
        <p class="profile-danger-hint">Resetting will erase all cats, coins, and progress permanently.</p>
        <button class="reset-game-btn" id="reset-btn">🗑️ Reset All Progress</button>
      </div>
    </div>`;
}

function attachProfileEvents() {
  const nameInput = document.getElementById("profile-name-input");
  if (nameInput) {
    nameInput.addEventListener("input", e => {
      state.playerName = e.target.value;
      saveState(state);
    });
  }
  document.getElementById("reset-btn")?.addEventListener("click", () => {
    if (confirm("Reset all your progress? This cannot be undone.")) {
      clearVisitTimers();
      state = resetState();
      activeVisitors = {};
      activeTab = "yard";
      render();
    }
  });
}

// ══════════════════════════════════════
// BOOT
// ══════════════════════════════════════
document.addEventListener("DOMContentLoaded", () => {
  handleOfflineVisits();
  checkDailyBonus();
  showIntroScreen(() => { render(); });
});
