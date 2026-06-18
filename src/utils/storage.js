// === SAVE / LOAD SYSTEM ===
const SAVE_KEY = "kittyyard_save_v1";

export const DEFAULT_STATE = {
  coins: 50,
  ownedItems: { cardboard_box: 1, dried_fish: 1 }, // {itemId: count}
  unlockedAreas: ["front_yard"],
  areaSlots: { front_yard: 3, flower_garden: 4, wooden_deck: 4 },
  placedItems: { front_yard: [], flower_garden: [], wooden_deck: [] }, // [itemId|null, ...]
  discoveredCats: {}, // {catId: visitCount}
  gallery: [], // [{catId, areaId, itemIds, gift, timestamp}]
  lastSaveTime: Date.now(),
};

export function saveState(state) {
  try {
    const data = { ...state, lastSaveTime: Date.now() };
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn("Save failed:", e);
  }
}

export function loadState() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    // Merge with defaults to handle missing keys from old saves
    return {
      ...DEFAULT_STATE,
      ...data,
      placedItems: { ...DEFAULT_STATE.placedItems, ...data.placedItems },
      areaSlots: { ...DEFAULT_STATE.areaSlots, ...data.areaSlots },
    };
  } catch (e) {
    console.warn("Load failed:", e);
    return null;
  }
}

export function resetState() {
  localStorage.removeItem(SAVE_KEY);
  return { ...DEFAULT_STATE, lastSaveTime: Date.now() };
}
