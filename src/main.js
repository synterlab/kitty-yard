// === KITTY YARD — Main Entry Point ===
import { CATS } from "./data/cats.js";
import { ITEMS } from "./data/items.js";
import { AREAS } from "./data/areas.js";
import { saveState, loadState, resetState, DEFAULT_STATE } from "./utils/storage.js";
import { pickVisitor, calcGift, simulateOffline, VISIT_INTERVAL_MS } from "./utils/probability.js";

// ——————————————————————————————————————
// STATE
// ——————————————————————————————————————
let state = loadState() || { ...DEFAULT_STATE };
let activeTab = "yard";
let activeAreaId = "front_yard";
let visitTimers = {}; // {areaId: intervalId}
let activeVisitors = {}; // {areaId: [{cat, leaveTimer}]}
let openSheet = null; // current bottom sheet data

// ——————————————————————————————————————
// OFFLINE SIMULATION
// ——————————————————————————————————————
function handleOfflineVisits() {
  const visits = simulateOffline(state, Date.now());
  if (visits.length === 0) return;

  let totalCoins = 0;
  for (const { cat, areaId, coins, timestamp } of visits) {
    totalCoins += coins;
    state.coins += coins;
    state.discoveredCats[cat.id] = (state.discoveredCats[cat.id] || 0) + 1;
    state.gallery.unshift({ catId: cat.id, areaId, itemIds: state.placedItems[areaId] || [], gift: coins, timestamp });
  }
  state.lastSaveTime = Date.now();
  saveState(state);

  if (totalCoins > 0) {
    showNotification("😴", "Welcome back!", `${visits.length} cats visited while you were away! +${totalCoins} 🪙`);
  }
}

// ——————————————————————————————————————
// RENDER ROOT
// ——————————————————————————————————————
function render() {
  const app = document.getElementById("app");
  app.innerHTML = `
    <div class="topbar">
      <div class="topbar-title">Kitty<span>Yard</span> 🐾</div>
      <div class="coin-display">
        <span class="coin-icon">🪙</span>
        <span class="coin-amount" id="coin-amount">${state.coins}</span>
      </div>
    </div>
    <div class="main-content" id="main-content">
      ${renderTab()}
    </div>
    <nav class="tab-bar">
      ${renderTabBar()}
    </nav>
  `;
  attachTabEvents();
  startVisitTimers();
}

function renderTabBar() {
  const tabs = [
    { id: "yard", icon: "🏡", label: "Yard" },
    { id: "shop", icon: "🛒", label: "Shop" },
    { id: "collection", icon: "📖", label: "Cats" },
    { id: "scrapbook", icon: "📸", label: "Memories" },
  ];
  return tabs.map(t => `
    <button class="tab-btn${activeTab === t.id ? " active" : ""}" data-tab="${t.id}">
      <span class="tab-icon">${t.icon}</span>
      <span class="tab-label">${t.label}</span>
    </button>
  `).join("");
}

function attachTabEvents() {
  document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      activeTab = btn.dataset.tab;
      document.getElementById("main-content").innerHTML = renderTab();
      document.querySelectorAll(".tab-btn").forEach(b => b.classList.toggle("active", b.dataset.tab === activeTab));
      attachTabContent();
    });
  });
  attachTabContent();
}

function attachTabContent() {
  if (activeTab === "yard") attachYardEvents();
  else if (activeTab === "shop") attachShopEvents();
  else if (activeTab === "collection") attachCollectionEvents();
}

function renderTab() {
  if (activeTab === "yard") return renderYard();
  if (activeTab === "shop") return renderShop();
  if (activeTab === "collection") return renderCollection();
  if (activeTab === "scrapbook") return renderScrapbook();
  return "";
}

// ——————————————————————————————————————
// YARD VIEW
// ——————————————————————————————————————
function renderYard() {
  const area = AREAS.find(a => a.id === activeAreaId);
  return `
    <div class="yard-view">
      <div class="area-switcher">
        ${AREAS.map(a => {
          const locked = !state.unlockedAreas.includes(a.id);
          return `<button class="area-btn${a.id === activeAreaId ? " active" : ""}${locked ? " locked" : ""}" data-area="${a.id}">
            ${a.emoji} ${a.name}${locked ? " 🔒" : ""}
          </button>`;
        }).join("")}
      </div>
      ${renderAreaScene(area)}
      ${renderUpgradeSection(area)}
    </div>
  `;
}

function renderAreaScene(area) {
  const isLocked = !state.unlockedAreas.includes(area.id);
  const slots = state.areaSlots[area.id] || area.baseSlots;
  const placed = state.placedItems[area.id] || [];
  const visitors = activeVisitors[area.id] || [];

  const slotHtml = Array.from({ length: slots }).map((_, i) => {
    const itemId = placed[i];
    const item = itemId ? ITEMS.find(it => it.id === itemId) : null;
    return `
      <div class="item-slot${item ? " filled" : ""}" data-slot="${i}" data-area="${area.id}">
        ${item ? `<span class="slot-emoji">${item.emoji}</span><span class="slot-name">${item.name}</span>` : `<span class="slot-plus">+</span>`}
      </div>`;
  }).join("");

  const visitorsHtml = visitors.length > 0
    ? visitors.map(v => `
        <div class="cat-visitor" data-cat="${v.cat.id}">
          <div class="cat-visitor-sprite">${v.cat.emoji}</div>
          <div class="cat-visitor-name">${v.cat.name}</div>
        </div>`).join("")
    : `<div class="no-cats-msg">Waiting for visitors…</div>`;

  return `
    <div class="area-scene ${area.cssClass}" id="scene-${area.id}">
      ${isLocked ? renderLockedOverlay(area) : ""}
      <div class="area-scene-title">${area.emoji} ${area.name}</div>
      <div class="visiting-cats" id="visitors-${area.id}">${visitorsHtml}</div>
      <div class="slot-section-title">Item Slots</div>
      <div class="item-slots">${slotHtml}</div>
    </div>`;
}

function renderLockedOverlay(area) {
  const canAfford = state.coins >= area.unlockCost;
  return `
    <div class="area-locked-overlay" id="locked-${area.id}">
      <div class="area-locked-icon">🔒</div>
      <div class="area-locked-title">${area.name}</div>
      <div class="area-locked-cost"><span>🪙</span> ${area.unlockCost}</div>
      <button class="unlock-btn" data-unlock="${area.id}" ${canAfford ? "" : "disabled"}>
        ${canAfford ? "Unlock Area" : "Need more coins"}
      </button>
    </div>`;
}

function renderUpgradeSection(area) {
  if (!state.unlockedAreas.includes(area.id)) return "";
  const slots = state.areaSlots[area.id] || area.baseSlots;
  if (slots >= area.maxSlots) return "";
  const cost = area.upgradeSlotCost;
  const canAfford = state.coins >= cost;
  return `
    <div class="upgrade-section">
      <button class="upgrade-btn" data-upgrade="${area.id}" ${canAfford ? "" : "disabled"}>
        ➕ Add Slot — <span>🪙</span> ${cost}
      </button>
    </div>`;
}

function attachYardEvents() {
  // Area switcher
  document.querySelectorAll(".area-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      activeAreaId = btn.dataset.area;
      document.getElementById("main-content").innerHTML = renderYard();
      attachYardEvents();
    });
  });

  // Item slots
  document.querySelectorAll(".item-slot").forEach(slot => {
    slot.addEventListener("click", () => {
      const areaId = slot.dataset.area;
      if (!state.unlockedAreas.includes(areaId)) return;
      const i = parseInt(slot.dataset.slot);
      const placed = state.placedItems[areaId] || [];
      const currentItemId = placed[i];
      openItemPicker(areaId, i, currentItemId);
    });
  });

  // Unlock buttons
  document.querySelectorAll("[data-unlock]").forEach(btn => {
    btn.addEventListener("click", () => {
      const areaId = btn.dataset.unlock;
      const area = AREAS.find(a => a.id === areaId);
      if (state.coins < area.unlockCost) return;
      state.coins -= area.unlockCost;
      state.unlockedAreas.push(areaId);
      saveState(state);
      updateCoinDisplay();
      document.getElementById("main-content").innerHTML = renderYard();
      attachYardEvents();
      showNotification(area.emoji, "Area Unlocked!", `${area.name} is now open for visitors!`);
    });
  });

  // Upgrade buttons
  document.querySelectorAll("[data-upgrade]").forEach(btn => {
    btn.addEventListener("click", () => {
      const areaId = btn.dataset.upgrade;
      const area = AREAS.find(a => a.id === areaId);
      if (state.coins < area.upgradeSlotCost) return;
      state.coins -= area.upgradeSlotCost;
      state.areaSlots[areaId] = (state.areaSlots[areaId] || area.baseSlots) + 1;
      saveState(state);
      updateCoinDisplay();
      document.getElementById("main-content").innerHTML = renderYard();
      attachYardEvents();
      showNotification("➕", "Slot Added!", `${area.name} now has ${state.areaSlots[areaId]} item slots.`);
    });
  });

  // Cat visitors
  document.querySelectorAll(".cat-visitor").forEach(el => {
    el.addEventListener("click", () => openCatSheet(el.dataset.cat));
  });
}

// ——————————————————————————————————————
// ITEM PICKER
// ——————————————————————————————————————
function openItemPicker(areaId, slotIndex, currentItemId) {
  const ownedItems = Object.entries(state.ownedItems)
    .filter(([id, count]) => count > 0)
    .map(([id]) => ITEMS.find(it => it.id === id))
    .filter(Boolean);

  const listHtml = ownedItems.length > 0
    ? ownedItems.map(item => `
      <button class="item-picker-btn" data-pick="${item.id}">
        <span class="picker-emoji">${item.emoji}</span>
        <div class="picker-info">
          <div class="picker-name">${item.name}</div>
          <div class="picker-count">Owned: ${state.ownedItems[item.id]}</div>
        </div>
      </button>`).join("")
    : `<p style="color:var(--text-light);font-size:14px;padding:12px 0;">No items owned — visit the Shop!</p>`;

  const removeHtml = currentItemId
    ? `<button class="remove-btn" id="remove-item-btn">🗑️ Remove Item</button>`
    : "";

  showOverlay(`
    <div class="sheet-handle"></div>
    <div class="sheet-content">
      <h2 style="font-size:20px;font-weight:900;margin-bottom:16px;">Place an Item</h2>
      <div class="item-picker-list">${listHtml}</div>
      ${removeHtml}
    </div>
  `, () => {
    document.querySelectorAll("[data-pick]").forEach(btn => {
      btn.addEventListener("click", () => {
        placeItem(areaId, slotIndex, btn.dataset.pick);
        closeOverlay();
      });
    });
    const rmBtn = document.getElementById("remove-item-btn");
    if (rmBtn) {
      rmBtn.addEventListener("click", () => {
        placeItem(areaId, slotIndex, null);
        closeOverlay();
      });
    }
  });
}

function placeItem(areaId, slotIndex, itemId) {
  if (!state.placedItems[areaId]) state.placedItems[areaId] = [];
  state.placedItems[areaId][slotIndex] = itemId || null;
  saveState(state);
  // Re-render yard view if on yard tab
  if (activeTab === "yard") {
    document.getElementById("main-content").innerHTML = renderYard();
    attachYardEvents();
  }
}

// ——————————————————————————————————————
// CAT DETAIL SHEET
// ——————————————————————————————————————
function openCatSheet(catId) {
  const cat = CATS.find(c => c.id === catId);
  if (!cat) return;
  const discovered = !!state.discoveredCats[catId];
  const visits = state.discoveredCats[catId] || 0;
  const favItem = ITEMS.find(it => it.id === cat.favoriteItem);

  showOverlay(`
    <div class="sheet-handle"></div>
    <div class="sheet-content">
      <div class="sheet-cat-emoji">${cat.emoji}</div>
      <div class="sheet-cat-name">${cat.name}</div>
      <div class="sheet-rarity">
        <span class="rarity-badge ${cat.rarity}">${cat.rarity.toUpperCase()}</span>
      </div>
      <p class="sheet-blurb">${discovered ? cat.blurb : "You haven't met this cat yet…"}</p>
      <div class="sheet-stats">
        <div class="stat-box">
          <div class="stat-val">${visits}</div>
          <div class="stat-lbl">Visits</div>
        </div>
        <div class="stat-box">
          <div class="stat-val">${discovered ? cat.rarity[0].toUpperCase() + cat.rarity.slice(1) : "???"}</div>
          <div class="stat-lbl">Rarity</div>
        </div>
      </div>
      ${discovered && favItem ? `
        <div class="sheet-fav">
          <span class="fav-emoji">${favItem.emoji}</span>
          <div>
            <div class="fav-label">Favorite Item</div>
            <div class="fav-name">${favItem.name}</div>
          </div>
        </div>` : ""}
    </div>
  `);
}

// ——————————————————————————————————————
// SHOP VIEW
// ——————————————————————————————————————
function renderShop() {
  const itemsHtml = ITEMS.map(item => {
    const owned = state.ownedItems[item.id] || 0;
    const canAfford = state.coins >= item.price;
    return `
      <div class="shop-item">
        <div class="shop-item-emoji">${item.emoji}</div>
        <div class="shop-item-info">
          <div class="shop-item-name">${item.name}</div>
          <div class="shop-item-desc">${item.desc}</div>
          ${owned > 0 ? `<div class="shop-item-owned">Owned: ${owned}</div>` : ""}
        </div>
        <div class="shop-item-buy">
          <button class="buy-btn" data-buy="${item.id}" data-price="${item.price}" ${canAfford ? "" : "disabled"}>
            Buy<br><span class="btn-price">🪙 ${item.price}</span>
          </button>
        </div>
      </div>`;
  }).join("");

  return `
    <div class="view-header">🛒 Shop</div>
    ${itemsHtml
      ? `<div class="shop-items">${itemsHtml}</div>`
      : ""}
    <div class="settings-area">
      <p style="font-size:13px;color:var(--text-light);font-weight:600;">⚠️ Reset all progress</p>
      <button class="reset-btn" id="reset-btn">Reset Progress</button>
    </div>
  `;
}

function attachShopEvents() {
  document.querySelectorAll("[data-buy]").forEach(btn => {
    btn.addEventListener("click", () => {
      const itemId = btn.dataset.buy;
      const price = parseInt(btn.dataset.price);
      if (state.coins < price) return;
      state.coins -= price;
      state.ownedItems[itemId] = (state.ownedItems[itemId] || 0) + 1;
      saveState(state);
      updateCoinDisplay();
      document.getElementById("main-content").innerHTML = renderShop();
      attachShopEvents();
      const item = ITEMS.find(it => it.id === itemId);
      showNotification(item.emoji, "Purchased!", `You bought ${item.name}. Place it in a yard slot!`);
    });
  });

  document.getElementById("reset-btn")?.addEventListener("click", () => {
    if (confirm("Reset all progress? This cannot be undone.")) {
      clearVisitTimers();
      state = resetState();
      activeVisitors = {};
      render();
    }
  });
}

// ——————————————————————————————————————
// COLLECTION VIEW
// ——————————————————————————————————————
function renderCollection() {
  const cardsHtml = CATS.map(cat => {
    const discovered = !!state.discoveredCats[cat.id];
    const visits = state.discoveredCats[cat.id] || 0;
    return `
      <div class="cat-card${discovered ? "" : " locked"}" data-cat="${cat.id}">
        <div class="cat-card-emoji">${discovered ? cat.emoji : "❓"}</div>
        <div class="cat-card-name">${discovered ? cat.name : "???"}</div>
        <div class="cat-card-rarity ${cat.rarity}">${cat.rarity}</div>
        <div class="cat-card-visits">${discovered ? `${visits} visit${visits !== 1 ? "s" : ""}` : "Not yet met"}</div>
      </div>`;
  }).join("");

  const total = CATS.length;
  const found = Object.keys(state.discoveredCats).length;

  return `
    <div class="view-header">📖 Cat Collection <span style="font-size:14px;font-weight:700;color:var(--text-light)">${found}/${total}</span></div>
    <div class="collection-grid">${cardsHtml}</div>
  `;
}

function attachCollectionEvents() {
  document.querySelectorAll(".cat-card").forEach(card => {
    card.addEventListener("click", () => openCatSheet(card.dataset.cat));
  });
}

// ——————————————————————————————————————
// SCRAPBOOK VIEW
// ——————————————————————————————————————
function renderScrapbook() {
  if (state.gallery.length === 0) {
    return `
      <div class="view-header">📸 Memories</div>
      <div class="empty-state">
        <div class="empty-icon">🪴</div>
        <p>No visits yet — place some items in the yard to attract cats!</p>
      </div>`;
  }

  const entriesHtml = state.gallery.slice(0, 100).map(entry => {
    const cat = CATS.find(c => c.id === entry.catId);
    const area = AREAS.find(a => a.id === entry.areaId);
    const time = new Date(entry.timestamp).toLocaleString();
    if (!cat || !area) return "";
    return `
      <div class="scrapbook-entry">
        <div class="entry-cat-emoji">${cat.emoji}</div>
        <div class="entry-info">
          <div class="entry-cat-name">${cat.name}</div>
          <div class="entry-detail">Visited ${area.name}</div>
          <div class="entry-gift">🪙 +${entry.gift}</div>
          <div class="entry-time">${time}</div>
        </div>
      </div>`;
  }).join("");

  return `
    <div class="view-header">📸 Memories</div>
    <div class="scrapbook-list">${entriesHtml}</div>
  `;
}

// ——————————————————————————————————————
// VISIT TIMERS
// ——————————————————————————————————————
function startVisitTimers() {
  clearVisitTimers();
  for (const area of AREAS) {
    visitTimers[area.id] = setInterval(() => {
      if (!state.unlockedAreas.includes(area.id)) return;
      const placed = (state.placedItems[area.id] || []).filter(Boolean);
      const existingIds = (activeVisitors[area.id] || []).map(v => v.cat.id);
      const cat = pickVisitor(area.id, placed, existingIds);
      if (!cat) return;
      spawnVisitor(area.id, cat);
    }, VISIT_INTERVAL_MS);
  }
}

function clearVisitTimers() {
  for (const id of Object.values(visitTimers)) clearInterval(id);
  visitTimers = {};
}

function spawnVisitor(areaId, cat) {
  if (!activeVisitors[areaId]) activeVisitors[areaId] = [];

  // Add to active visitors
  const coins = calcGift(cat);
  const leaveDelay = 20_000 + Math.random() * 40_000; // 20–60 seconds

  const leaveTimer = setTimeout(() => {
    catLeaves(areaId, cat, coins);
  }, leaveDelay);

  activeVisitors[areaId].push({ cat, leaveTimer });

  // Update state
  state.discoveredCats[cat.id] = (state.discoveredCats[cat.id] || 0) + 1;
  saveState(state);

  // Show notification
  showNotification(cat.emoji, `${cat.name} arrived!`, `Visiting ${AREAS.find(a => a.id === areaId)?.name}`);

  // Update UI
  refreshVisitorUI(areaId);
}

function catLeaves(areaId, cat, coins) {
  if (!activeVisitors[areaId]) return;
  activeVisitors[areaId] = activeVisitors[areaId].filter(v => v.cat.id !== cat.id);

  // Give coins
  state.coins += coins;
  const placed = (state.placedItems[areaId] || []).filter(Boolean);
  state.gallery.unshift({ catId: cat.id, areaId, itemIds: placed, gift: coins, timestamp: Date.now() });
  if (state.gallery.length > 500) state.gallery = state.gallery.slice(0, 500);
  saveState(state);

  updateCoinDisplay(true);
  refreshVisitorUI(areaId);

  // Show floating gift if on yard tab
  if (activeTab === "yard" && activeAreaId === areaId) {
    showGiftPop(`+${coins} 🪙`);
  }
}

function refreshVisitorUI(areaId) {
  if (activeTab !== "yard") return;
  const container = document.getElementById(`visitors-${areaId}`);
  if (!container) return;
  const visitors = activeVisitors[areaId] || [];
  container.innerHTML = visitors.length > 0
    ? visitors.map(v => `
        <div class="cat-visitor" data-cat="${v.cat.id}">
          <div class="cat-visitor-sprite">${v.cat.emoji}</div>
          <div class="cat-visitor-name">${v.cat.name}</div>
        </div>`).join("")
    : `<div class="no-cats-msg">Waiting for visitors…</div>`;

  container.querySelectorAll(".cat-visitor").forEach(el => {
    el.addEventListener("click", () => openCatSheet(el.dataset.cat));
  });
}

// ——————————————————————————————————————
// UI HELPERS
// ——————————————————————————————————————
function updateCoinDisplay(bump = false) {
  const el = document.getElementById("coin-amount");
  if (el) {
    el.textContent = state.coins;
    if (bump) {
      el.classList.add("bump");
      setTimeout(() => el.classList.remove("bump"), 200);
    }
  }
}

let notifTimeout = null;
function showNotification(icon, title, sub) {
  const existing = document.querySelector(".notification");
  if (existing) existing.remove();
  if (notifTimeout) clearTimeout(notifTimeout);

  const notif = document.createElement("div");
  notif.className = "notification";
  notif.innerHTML = `
    <div class="notif-emoji">${icon}</div>
    <div class="notif-text">
      <div class="notif-title">${title}</div>
      <div class="notif-sub">${sub}</div>
    </div>`;
  document.getElementById("app").appendChild(notif);
  notifTimeout = setTimeout(() => notif.remove(), 3000);
}

function showGiftPop(text) {
  const scene = document.getElementById(`scene-${activeAreaId}`);
  if (!scene) return;
  const pop = document.createElement("div");
  pop.className = "gift-pop";
  pop.textContent = text;
  pop.style.left = `${20 + Math.random() * 60}%`;
  pop.style.top = "40%";
  scene.appendChild(pop);
  setTimeout(() => pop.remove(), 1600);
}

let overlayEl = null;
function showOverlay(html, onReady = null) {
  closeOverlay();
  overlayEl = document.createElement("div");
  overlayEl.className = "overlay";
  overlayEl.innerHTML = `<div class="bottom-sheet">${html}</div>`;
  document.getElementById("app").appendChild(overlayEl);
  overlayEl.addEventListener("click", e => { if (e.target === overlayEl) closeOverlay(); });
  if (onReady) onReady();
}

function closeOverlay() {
  if (overlayEl) { overlayEl.remove(); overlayEl = null; }
}

// ——————————————————————————————————————
// BOOT
// ——————————————————————————————————————
document.addEventListener("DOMContentLoaded", () => {
  handleOfflineVisits();
  render();
});
