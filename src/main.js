// === KITTY YARD — Main v3 (Garden Edition) ===
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
  { id: "sunny",   emoji: "☀️",  name: "Sunny",   visitMult: 1.0,  desc: "Perfect day for cat watching!"  },
  { id: "cloudy",  emoji: "⛅",  name: "Cloudy",  visitMult: 0.9,  desc: "Cats prefer the shade today."   },
  { id: "breezy",  emoji: "🍃",  name: "Breezy",  visitMult: 1.2,  desc: "The wind brings curious visitors!" },
  { id: "rainy",   emoji: "🌧️", name: "Rainy",   visitMult: 0.75, desc: "Cats seek shelter... yours!"    },
  { id: "rainbow", emoji: "🌈",  name: "Rainbow", visitMult: 1.5,  desc: "Legendary cats feel the magic!" },
];

// Start with sunny/cloudy/breezy (first 3 states)
let weatherIdx = Math.floor(Math.random() * 3);
let currentWeather = WEATHER_STATES[weatherIdx];

function cycleWeather() {
  weatherIdx = (weatherIdx + 1) % WEATHER_STATES.length;
  currentWeather = WEATHER_STATES[weatherIdx];
  updateWeatherDisplay();
  if (currentWeather.id === "rainbow") {
    showToast("🌈", "Rainbow appeared!", "Legendary cats are more likely to visit! ✨");
  } else if (currentWeather.id === "rainy") {
    showToast("🌧️", "It's raining!", "Cats are seeking shelter in your yard.");
  }
}

function updateWeatherDisplay() {
  document.querySelectorAll(".area-weather").forEach(el => {
    el.innerHTML = `<span class="weather-emoji">${currentWeather.emoji}</span><span class="weather-label">${currentWeather.name}</span>`;
  });
  // Update scene weather class
  document.querySelectorAll(".area-scene").forEach(el => {
    WEATHER_STATES.forEach(w => el.classList.remove(`weather-${w.id}`));
    el.classList.add(`weather-${currentWeather.id}`);
  });
}

// Weather cycles every 5 minutes
setInterval(cycleWeather, 5 * 60 * 1000);

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
  if (level >= 5)  return "🌱";
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
  const bonus = 25 + Math.min(streak - 1, 7) * 15; // 25 base, +15/day streak, max 130
  state.coins += bonus;
  saveState(state);
  const streakEmoji = streak >= 7 ? "🔥🔥🔥" : streak >= 3 ? "🔥🔥" : "🔥";
  setTimeout(() => {
    showToast("🌅", `Day ${streak} streak! ${streakEmoji}`, `Daily bonus: +${bonus} 🪙 coins`);
  }, 1800);
}

// ══════════════════════════════════════
// PET CATS
// ══════════════════════════════════════
function petCat(catId) {
  const now = Date.now();
  if (!state.petCooldowns) state.petCooldowns = {};
  if (now - (state.petCooldowns[catId] || 0) < 30000) {
    showToast("😸", "Cat needs a moment!", "Come back soon to pet again 🐾");
    return;
  }
  const cat = CATS.find(c => c.id === catId);
  const bonusMap = { common: 3, rare: 7, legendary: 18 };
  const bonus = bonusMap[cat?.rarity || "common"];
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
  ["💕", "💗", "💖"].forEach((h, i) => {
    setTimeout(() => {
      const el = document.createElement("div");
      el.className = "pet-heart";
      el.textContent = h;
      el.style.left = `${30 + Math.random() * 40}%`;
      sprite.style.position = "relative";
      sprite.appendChild(el);
      setTimeout(() => el.remove(), 1200);
    }, i * 120);
  });
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
  if (totalCoins > 0) showToast(generateCatSVG(visits[0].cat.id, 44), "Welcome back!", `${visits.length} cat${visits.length>1?"s":""} visited! +${totalCoins} 🪙`);
}

// ══════════════════════════════════════
// RENDER ROOT
// ══════════════════════════════════════
function render() {
  const app = document.getElementById("app");
  const level = getGardenLevel();
  const lvEmoji = getGardenLevelEmoji(level);
  app.innerHTML = `
    <div class="topbar">
      <div class="topbar-logo">
        <img src="logo.png" class="topbar-logo-img" alt="Kitty Yard" />
      </div>
      <div class="garden-level-badge" title="Garden Level — gain XP by attracting cats!">
        <span class="garden-level-icon">${lvEmoji}</span>
        <span class="garden-level-text">Lv.${level}</span>
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
    { id:"yard",      icon:"🏡", label:"Yard"     },
    { id:"shop",      icon:"🛒", label:"Shop"     },
    { id:"collection",icon:"📖", label:"Cats"     },
    { id:"scrapbook", icon:"📸", label:"Memories" },
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
  if (activeTab==="yard")       attachYardEvents();
  else if (activeTab==="shop")  attachShopEvents();
  else if (activeTab==="collection") attachCollectionEvents();
}

function renderTab() {
  if (activeTab==="yard")       return renderYard();
  if (activeTab==="shop")       return renderShop();
  if (activeTab==="collection") return renderCollection();
  if (activeTab==="scrapbook")  return renderScrapbook();
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

function renderAreaScene(area) {
  const isLocked  = !state.unlockedAreas.includes(area.id);
  const slots     = state.areaSlots[area.id] || area.baseSlots;
  const placed    = state.placedItems[area.id] || [];
  const visitors  = activeVisitors[area.id] || [];

  const slotsHtml = Array.from({length:slots}).map((_,i)=>{
    const itemId = placed[i];
    const item   = itemId ? ITEMS.find(it=>it.id===itemId) : null;
    return `<div class="item-slot${item?" filled":""}" data-slot="${i}" data-area="${area.id}">
      ${item
        ? `<span class="slot-emoji">${item.emoji}</span><span class="slot-name">${item.name}</span>`
        : `<span class="slot-plus">+</span>`}
    </div>`;
  }).join("");

  const visitorsHtml = visitors.length>0
    ? visitors.map(v=>`
        <div class="cat-visitor rarity-${v.cat.rarity}" data-cat="${v.cat.id}">
          <div class="cat-visitor-sprite">${generateCatSVG(v.cat.id, 64)}</div>
          <div class="cat-visitor-name">${v.cat.name}</div>
          <button class="cat-pet-btn" data-pet="${v.cat.id}" title="Pet ${v.cat.name}">🐾</button>
        </div>`).join("")
    : `<div class="no-cats-msg waiting-dots">Waiting for visitors<span>.</span><span>.</span><span>.</span></div>`;

  return `
    <div class="area-scene ${area.cssClass} weather-${currentWeather.id}" id="scene-${area.id}">
      ${isLocked ? lockedOverlayHTML(area) : ""}
      <div class="area-scene-header">
        <div class="area-scene-title">${area.emoji} ${area.name}</div>
        <div class="area-weather">
          <span class="weather-emoji">${currentWeather.emoji}</span>
          <span class="weather-label">${currentWeather.name}</span>
        </div>
      </div>
      <div class="visiting-cats" id="visitors-${area.id}">${visitorsHtml}</div>
      <div class="slot-section-title">Item Slots</div>
      <div class="item-slots">${slotsHtml}</div>
    </div>`;
}

function lockedOverlayHTML(area) {
  const canAfford = state.coins >= area.unlockCost;
  return `
    <div class="area-locked-overlay">
      <div class="area-locked-icon">🔒</div>
      <div class="area-locked-title">${area.name}</div>
      <div class="area-locked-cost">🪙 ${area.unlockCost}</div>
      <button class="unlock-btn" data-unlock="${area.id}" ${canAfford?"":"disabled"}>
        ${canAfford?"Unlock Area!":"Need more coins"}
      </button>
    </div>`;
}

function renderUpgradeSection(area) {
  if (!state.unlockedAreas.includes(area.id)) return "";
  const slots = state.areaSlots[area.id] || area.baseSlots;
  if (slots >= area.maxSlots) return "";
  const cost = area.upgradeSlotCost;
  const ok   = state.coins >= cost;
  return `
    <div class="upgrade-section">
      <button class="upgrade-btn" data-upgrade="${area.id}" ${ok?"":"disabled"}>
        ➕ Add Slot &nbsp;·&nbsp; 🪙 ${cost}
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
      showToast(area.emoji, "Area Unlocked!", `${area.name} is now open for visitors!`);
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
      showToast("➕","Slot Added!",`${area.name} now has ${state.areaSlots[area.id]} item slots.`);
    });
  });
  // Cat sprite: open detail sheet
  document.querySelectorAll(".cat-visitor").forEach(el=>{
    el.querySelector(".cat-visitor-sprite")?.addEventListener("click",()=>openCatSheet(el.dataset.cat));
    el.querySelector(".cat-visitor-name")?.addEventListener("click",()=>openCatSheet(el.dataset.cat));
  });
  // Pet button: quick pet from yard
  document.querySelectorAll(".cat-pet-btn").forEach(btn=>{
    btn.addEventListener("click", e => {
      e.stopPropagation();
      petCat(btn.dataset.pet);
    });
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

  const listHtml = owned.length>0
    ? owned.map(item=>`
        <button class="item-picker-btn" data-pick="${item.id}">
          <span class="picker-emoji">${item.emoji}</span>
          <div><div class="picker-name">${item.name}</div><div class="picker-count">Owned: ${state.ownedItems[item.id]}</div></div>
        </button>`).join("")
    : `<p style="color:var(--text-light);font-size:14px;padding:12px 0;">No items owned — visit the Shop first!</p>`;

  showBottomSheet(`
    <div class="sheet-handle"></div>
    <div class="sheet-content">
      <h2 style="font-family:'Fredoka One',cursive;font-size:22px;margin-bottom:16px;">Place an Item</h2>
      <div class="item-picker-list">${listHtml}</div>
      ${currentItemId?`<button class="remove-slot-btn" id="rm-slot">🗑️ Remove Item</button>`:""}
    </div>`, ()=>{
    document.querySelectorAll("[data-pick]").forEach(btn=>{
      btn.addEventListener("click",()=>{ placeItem(areaId,slotIdx,btn.dataset.pick); closeSheet(); });
    });
    document.getElementById("rm-slot")?.addEventListener("click",()=>{ placeItem(areaId,slotIdx,null); closeSheet(); });
  });
}

function placeItem(areaId, idx, itemId) {
  if (!state.placedItems[areaId]) state.placedItems[areaId]=[];
  state.placedItems[areaId][idx] = itemId||null;
  saveState(state);
  if (activeTab==="yard") { document.getElementById("main-content").innerHTML=renderYard(); attachYardEvents(); }
}

// ══════════════════════════════════════
// CAT DETAIL SHEET
// ══════════════════════════════════════
function openCatSheet(catId) {
  const cat        = CATS.find(c=>c.id===catId); if (!cat) return;
  const discovered = !!state.discoveredCats[catId];
  const visits     = state.discoveredCats[catId]||0;
  const favItem    = ITEMS.find(it=>it.id===cat.favoriteItem);
  const catSVG     = generateCatSVG(catId, 110);

  const isCurrentVisitor = Object.values(activeVisitors).some(arr => arr.some(v => v.cat.id === catId));
  const cooldownMs = (state.petCooldowns || {})[catId] || 0;
  const canPet = Date.now() - cooldownMs >= 30000;
  const petBonusMap = { common: 3, rare: 7, legendary: 18 };
  const petBonus = petBonusMap[cat.rarity];

  showBottomSheet(`
    <div class="sheet-handle"></div>
    <div class="sheet-content">
      <div class="sheet-cat-portrait">${catSVG}</div>
      <div class="sheet-cat-name">${discovered?cat.name:"???"}</div>
      <div class="sheet-rarity">
        <span class="rarity-badge ${cat.rarity}">${cat.rarity.toUpperCase()}</span>
      </div>
      <p class="sheet-blurb">${discovered?cat.blurb:"You haven't met this cat yet… leave some items out!"}</p>
      <div class="sheet-stats">
        <div class="stat-box"><div class="stat-val">${visits}</div><div class="stat-lbl">Visits</div></div>
        <div class="stat-box"><div class="stat-val">${discovered?{common:"⭐",rare:"⭐⭐",legendary:"⭐⭐⭐"}[cat.rarity]:"???"}
        </div><div class="stat-lbl">Rarity</div></div>
      </div>
      ${discovered&&favItem?`
        <div class="sheet-fav">
          <span class="fav-emoji">${favItem.emoji}</span>
          <div><div class="fav-label">Favorite Item</div><div class="fav-name">${favItem.name}</div></div>
        </div>`:
        discovered&&cat.rarity==="legendary"?`
        <div class="sheet-fav" style="background:#f3e5f5">
          <span class="fav-emoji">✨</span>
          <div><div class="fav-label">Hint</div><div class="fav-name">Needs ${(cat.requiredItems||[]).length}+ specific items${cat.requiredArea?` in ${AREAS.find(a=>a.id===cat.requiredArea)?.name}`:""}!</div></div>
        </div>`:""}
      ${isCurrentVisitor ? `
        <button class="pet-btn" id="pet-sheet-btn" ${canPet?"":"disabled"}>
          ${canPet
            ? `🐾 Pet ${cat.name} <span class="pet-bonus-badge">+${petBonus} 🪙</span>`
            : `😺 Already petted — come back soon!`}
        </button>` : ""}
    </div>`, () => {
    document.getElementById("pet-sheet-btn")?.addEventListener("click", () => petCat(catId));
  });
}

// ══════════════════════════════════════
// SHOP VIEW
// ══════════════════════════════════════
function renderShop() {
  // Group items by category
  const categories = [
    { id: "food",    label: "🍽️ Food",    emoji: "🍽️" },
    { id: "toy",     label: "🧸 Toys",    emoji: "🧸" },
    { id: "plant",   label: "🌿 Plants",  emoji: "🌿" },
    { id: "shelter", label: "🏠 Shelter", emoji: "🏠" },
    { id: "comfort", label: "💤 Comfort", emoji: "💤" },
  ];

  const shopHtml = categories.map(cat => {
    const catItems = ITEMS.filter(it => it.category === cat.id);
    if (!catItems.length) return "";
    return `
      <div class="shop-category">
        <div class="shop-category-label">${cat.label}</div>
        ${catItems.map(item => {
          const owned = state.ownedItems[item.id]||0;
          const canAfford = state.coins>=item.price;
          return `
            <div class="shop-item">
              <div class="shop-item-emoji">${item.emoji}</div>
              <div class="shop-item-info">
                <div class="shop-item-name">${item.name}</div>
                <div class="shop-item-desc">${item.desc}</div>
                ${owned>0?`<div class="shop-item-owned">✓ Owned: ${owned}</div>`:""}
              </div>
              <div>
                <button class="buy-btn" data-buy="${item.id}" data-price="${item.price}" ${canAfford?"":"disabled"}>
                  Buy<br><span class="btn-price">🪙 ${item.price}</span>
                </button>
              </div>
            </div>`;
        }).join("")}
      </div>`;
  }).join("");

  const level = getGardenLevel();
  return `
    <div class="view-header">🛒 Shop <span class="view-header-sub">Level ${level} garden</span></div>
    <div class="garden-weather-banner weather-${currentWeather.id}">
      <span class="gwb-emoji">${currentWeather.emoji}</span>
      <span class="gwb-text">${currentWeather.desc}</span>
    </div>
    <div class="shop-items">${shopHtml}</div>
    <div class="settings-area">
      <p>⚠️ Danger Zone</p>
      <button class="reset-btn" id="reset-btn">Reset All Progress</button>
    </div>`;
}

function attachShopEvents() {
  document.querySelectorAll("[data-buy]").forEach(btn=>{
    btn.addEventListener("click",()=>{
      const itemId = btn.dataset.buy;
      const price  = parseInt(btn.dataset.price);
      if (state.coins<price) return;
      state.coins -= price;
      state.ownedItems[itemId] = (state.ownedItems[itemId]||0)+1;
      saveState(state); updateCoinDisplay();
      document.getElementById("main-content").innerHTML=renderShop();
      attachShopEvents();
      const item = ITEMS.find(it=>it.id===itemId);
      showToast(item.emoji,"Purchased!",`You got ${item.name}! Place it in the Yard.`);
    });
  });
  document.getElementById("reset-btn")?.addEventListener("click",()=>{
    if (confirm("Reset all your progress? This cannot be undone.")) {
      clearVisitTimers();
      state = resetState();
      activeVisitors = {};
      render();
    }
  });
}

// ══════════════════════════════════════
// COLLECTION VIEW
// ══════════════════════════════════════
function renderCollection() {
  const total = CATS.length;
  const found = Object.keys(state.discoveredCats).length;
  const pct   = Math.round((found / total) * 100);

  // Group by rarity
  const groups = [
    { id:"legendary", label:"✨ Legendary", cats: CATS.filter(c=>c.rarity==="legendary") },
    { id:"rare",      label:"💎 Rare",      cats: CATS.filter(c=>c.rarity==="rare")      },
    { id:"common",    label:"🐱 Common",    cats: CATS.filter(c=>c.rarity==="common")    },
  ];

  const cardsHtml = groups.map(group => {
    const foundInGroup = group.cats.filter(c => !!state.discoveredCats[c.id]).length;
    return `
      <div class="collection-group">
        <div class="collection-group-label">${group.label} <span class="group-count">${foundInGroup}/${group.cats.length}</span></div>
        <div class="collection-grid">
          ${group.cats.map(cat => {
            const disc  = !!state.discoveredCats[cat.id];
            const visits= state.discoveredCats[cat.id]||0;
            return `
              <div class="cat-card ${cat.rarity}${disc?"":" locked"}" data-cat="${cat.id}">
                <div class="cat-card-svg">${disc ? generateCatSVG(cat.id,60) : `<div class="cat-lock-icon">❓</div>`}</div>
                <div class="cat-card-name">${disc?cat.name:"???"}</div>
                <div class="cat-card-rarity ${cat.rarity}">${cat.rarity}</div>
                <div class="cat-card-visits">${disc?`${visits} visit${visits!==1?"s":""}`:""}</div>
              </div>`;
          }).join("")}
        </div>
      </div>`;
  }).join("");

  return `
    <div class="view-header">📖 Cats <span class="view-header-sub">${found}/${total} found</span></div>
    <div class="collection-progress">
      <div class="collection-progress-fill" style="width:${pct}%"></div>
    </div>
    <div class="collection-pct-label">${pct}% complete</div>
    ${cardsHtml}`;
}

function attachCollectionEvents() {
  document.querySelectorAll(".cat-card").forEach(c=>c.addEventListener("click",()=>openCatSheet(c.dataset.cat)));
}

// ══════════════════════════════════════
// SCRAPBOOK VIEW
// ══════════════════════════════════════
function renderScrapbook() {
  if (!state.gallery.length) return `
    <div class="view-header">📸 Memories</div>
    <div class="empty-state">
      <div class="empty-icon">🪴</div>
      <p>No visits yet!<br>Place some items in the yard to attract cats.</p>
    </div>`;

  const totalGifts = state.gallery.reduce((s,e) => s + (e.gift||0), 0);
  const entries = state.gallery.slice(0,100).map(entry=>{
    const cat  = CATS.find(c=>c.id===entry.catId);
    const area = AREAS.find(a=>a.id===entry.areaId);
    if (!cat||!area) return "";
    return `
      <div class="scrapbook-entry">
        <div class="entry-cat-svg">${generateCatSVG(cat.id,42)}</div>
        <div class="entry-info">
          <div class="entry-cat-name">${cat.name}</div>
          <div class="entry-detail">Visited ${area.name}</div>
          <div class="entry-gift">🪙 +${entry.gift}</div>
          <div class="entry-time">${new Date(entry.timestamp).toLocaleString()}</div>
        </div>
      </div>`;
  }).join("");

  return `
    <div class="view-header">📸 Memories <span class="view-header-sub">${state.gallery.length} visits</span></div>
    <div class="scrapbook-summary">
      <div class="summary-stat"><span class="summary-val">${state.gallery.length}</span><span class="summary-lbl">Total Visits</span></div>
      <div class="summary-divider"></div>
      <div class="summary-stat"><span class="summary-val">🪙 ${totalGifts}</span><span class="summary-lbl">Coins Earned</span></div>
      <div class="summary-divider"></div>
      <div class="summary-stat"><span class="summary-val">${Object.keys(state.discoveredCats).length}</span><span class="summary-lbl">Cats Met</span></div>
    </div>
    <div class="scrapbook-list">${entries}</div>`;
}

// ══════════════════════════════════════
// VISIT TIMERS
// ══════════════════════════════════════
function startVisitTimers() {
  clearVisitTimers();
  for (const area of AREAS) {
    visitTimers[area.id] = setInterval(()=>{
      if (!state.unlockedAreas.includes(area.id)) return;
      // Apply weather multiplier to visit chance
      if (Math.random() > currentWeather.visitMult) return;
      const placed  = (state.placedItems[area.id]||[]).filter(Boolean);
      const existing = (activeVisitors[area.id]||[]).map(v=>v.cat.id);
      const cat = pickVisitor(area.id, placed, existing);
      if (!cat) return;
      spawnVisitor(area.id, cat);
    }, VISIT_INTERVAL_MS);
  }
}

function clearVisitTimers() {
  Object.values(visitTimers).forEach(id=>clearInterval(id));
  visitTimers={};
}

function spawnVisitor(areaId, cat) {
  if (!activeVisitors[areaId]) activeVisitors[areaId]=[];
  const coins     = calcGift(cat);
  const leaveMs   = 20_000 + Math.random()*40_000;
  const leaveTimer = setTimeout(()=>catLeaves(areaId,cat,coins), leaveMs);
  activeVisitors[areaId].push({cat,leaveTimer});

  const isFirstDiscovery = !state.discoveredCats[cat.id];
  state.discoveredCats[cat.id] = (state.discoveredCats[cat.id]||0)+1;
  saveState(state);
  // Update level display
  updateLevelDisplay();

  const areaName = AREAS.find(a=>a.id===areaId)?.name;
  if (isFirstDiscovery) {
    showToast(generateCatSVG(cat.id,44), `✨ New cat discovered!`, `${cat.name} — ${cat.rarity}`, cat.rarity);
    const scene = document.getElementById(`scene-${areaId}`);
    if (scene) {
      const flash = document.createElement("div");
      flash.className = "discovery-flash";
      scene.appendChild(flash);
      setTimeout(() => flash.remove(), 1300);
    }
  } else {
    const rar = cat.rarity === "common" ? "" : cat.rarity;
    showToast(generateCatSVG(cat.id,44), `${cat.name} arrived!`, `Visiting ${areaName}`, rar);
  }
  refreshVisitorUI(areaId);
}

function catLeaves(areaId, cat, coins) {
  if (!activeVisitors[areaId]) return;
  activeVisitors[areaId] = activeVisitors[areaId].filter(v=>v.cat.id!==cat.id);
  state.coins += coins;
  const placed = (state.placedItems[areaId]||[]).filter(Boolean);
  state.gallery.unshift({catId:cat.id, areaId, itemIds:placed, gift:coins, timestamp:Date.now()});
  if (state.gallery.length>500) state.gallery=state.gallery.slice(0,500);
  saveState(state);
  updateCoinDisplay(true);
  refreshVisitorUI(areaId);
  if (activeTab==="yard" && activeAreaId===areaId) showGiftPop(`+${coins} 🪙`);
}

function refreshVisitorUI(areaId) {
  if (activeTab!=="yard") return;
  const el = document.getElementById(`visitors-${areaId}`);
  if (!el) return;
  const visitors = activeVisitors[areaId]||[];
  el.innerHTML = visitors.length>0
    ? visitors.map(v=>`
        <div class="cat-visitor rarity-${v.cat.rarity}" data-cat="${v.cat.id}">
          <div class="cat-visitor-sprite">${generateCatSVG(v.cat.id,64)}</div>
          <div class="cat-visitor-name">${v.cat.name}</div>
          <button class="cat-pet-btn" data-pet="${v.cat.id}" title="Pet ${v.cat.name}">🐾</button>
        </div>`).join("")
    : `<div class="no-cats-msg waiting-dots">Waiting for visitors<span>.</span><span>.</span><span>.</span></div>`;
  el.querySelectorAll(".cat-visitor .cat-visitor-sprite, .cat-visitor .cat-visitor-name").forEach(e=>{
    e.addEventListener("click", () => openCatSheet(e.closest("[data-cat]").dataset.cat));
  });
  el.querySelectorAll(".cat-pet-btn").forEach(btn=>{
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
  const badge = document.querySelector(".garden-level-text");
  if (badge) badge.textContent = `Lv.${getGardenLevel()}`;
}

let toastTimeout=null;
function showToast(svgOrIcon, title, sub, rarity="") {
  document.querySelector(".notification")?.remove();
  if (toastTimeout) clearTimeout(toastTimeout);
  const isSVG = typeof svgOrIcon==="string" && svgOrIcon.includes("<svg");
  const el = document.createElement("div");
  el.className=`notification${rarity?" rarity-"+rarity:""}`;
  el.innerHTML=`
    ${isSVG
      ? `<div class="notif-cat-svg">${svgOrIcon}</div>`
      : `<div style="font-size:32px">${svgOrIcon}</div>`}
    <div class="notif-text">
      <div class="notif-title">${title}</div>
      <div class="notif-sub">${sub}</div>
    </div>`;
  document.getElementById("app").appendChild(el);
  toastTimeout=setTimeout(()=>{ el.classList.add("leaving"); setTimeout(()=>el.remove(),300); },3500);
}

function showGiftPop(text) {
  const scene = document.getElementById(`scene-${activeAreaId}`);
  if (!scene) return;
  const pop = document.createElement("div");
  pop.className="gift-pop";
  pop.textContent=text;
  pop.style.left=`${15+Math.random()*60}%`;
  pop.style.top="40%";
  scene.appendChild(pop);
  setTimeout(()=>pop.remove(),1700);
}

let sheetEl=null;
function showBottomSheet(html, onReady=null) {
  closeSheet();
  sheetEl=document.createElement("div");
  sheetEl.className="overlay";
  sheetEl.innerHTML=`<div class="bottom-sheet">${html}</div>`;
  document.getElementById("app").appendChild(sheetEl);
  sheetEl.addEventListener("click",e=>{ if(e.target===sheetEl) closeSheet(); });
  if (onReady) onReady();
}
function closeSheet() { if(sheetEl){sheetEl.remove();sheetEl=null;} }

// ══════════════════════════════════════
// BOOT
// ══════════════════════════════════════
document.addEventListener("DOMContentLoaded",()=>{
  handleOfflineVisits();
  checkDailyBonus();
  if (!hasSeenIntro()) {
    showIntroScreen(()=>{ render(); });
  } else {
    showIntroScreen(()=>{ render(); });
  }
});
