// === VISIT PROBABILITY SYSTEM ===
import { CATS, RARITY_WEIGHTS } from "../data/cats.js";
import { AREAS } from "../data/areas.js";

// How many seconds between visit checks (per area)
export const VISIT_INTERVAL_MS = 30_000; // 30 seconds (demo mode)

/**
 * Given an area and its placed items, pick a cat that might visit.
 * Returns null if no visit happens (empty area or bad luck).
 */
export function pickVisitor(areaId, placedItemIds, existingVisitorIds = []) {
  const area = AREAS.find((a) => a.id === areaId);
  if (!area) return null;

  // Need at least 1 item placed
  const activeItems = placedItemIds.filter(Boolean);
  if (activeItems.length === 0) return null;

  // 60% base chance a cat shows up each interval
  if (Math.random() > 0.60) return null;

  // Filter eligible cats
  let eligible = CATS.filter((cat) => {
    // Don't double-stack the same cat
    if (existingVisitorIds.includes(cat.id)) return false;

    if (cat.rarity === "legendary") {
      // Needs 2+ required items all placed
      const reqItems = cat.requiredItems || [];
      const hasItems = reqItems.every((id) => activeItems.includes(id));
      // Needs required area if specified
      const hasArea = cat.requiredArea ? cat.requiredArea === areaId : true;
      return hasItems && hasArea;
    }

    if (cat.rarity === "rare") {
      // Needs its favorite item placed
      return activeItems.includes(cat.favoriteItem);
    }

    // Common: any item works
    return true;
  });

  if (eligible.length === 0) return null;

  // Weighted random by rarity + area bonus
  const rarityBonus = area.rarityBonus || {};

  const weighted = eligible.map((cat) => {
    const base = RARITY_WEIGHTS[cat.rarity];
    const bonus = rarityBonus[cat.rarity] || 0;
    return { cat, weight: base + bonus };
  });

  const total = weighted.reduce((s, w) => s + w.weight, 0);
  let rand = Math.random() * total;
  for (const { cat, weight } of weighted) {
    rand -= weight;
    if (rand <= 0) return cat;
  }
  return weighted[weighted.length - 1].cat;
}

/**
 * Calculate coin gift for a visiting cat.
 */
export function calcGift(cat) {
  const base = { common: 8, rare: 20, legendary: 60 };
  const coins = base[cat.rarity] + Math.floor(Math.random() * 10);
  return coins;
}

/**
 * Simulate offline visits — called when the app reopens.
 * Returns array of {catId, areaId, coins} visit records.
 */
export function simulateOffline(state, now = Date.now()) {
  const elapsed = now - (state.lastSaveTime || now);
  if (elapsed < VISIT_INTERVAL_MS) return [];

  const visits = [];
  const intervals = Math.min(Math.floor(elapsed / VISIT_INTERVAL_MS), 60); // cap at 60 offline visits

  for (let i = 0; i < intervals; i++) {
    for (const area of AREAS) {
      if (!state.unlockedAreas.includes(area.id)) continue;
      const placed = (state.placedItems[area.id] || []).filter(Boolean);
      const cat = pickVisitor(area.id, placed, []);
      if (cat) {
        const coins = calcGift(cat);
        visits.push({ cat, areaId: area.id, coins, timestamp: state.lastSaveTime + (i + 1) * VISIT_INTERVAL_MS });
      }
    }
  }
  return visits;
}
