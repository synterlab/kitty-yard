// === SAVE / LOAD SYSTEM ===
const SAVE_KEY = "kittyyard_save_v1";

export const DEFAULT_STATE = {
  coins: 50,
  ownedItems: { cardboard_box: 1, dried_fish: 1 },
  unlockedAreas: ["front_yard"],
  areaSlots: { front_yard: 3, flower_garden: 4, wooden_deck: 4 },
  placedItems: { front_yard: [], flower_garden: [], wooden_deck: [] },
  discoveredCats: {},
  gallery: [],
  lastSaveTime: Date.now(),
  petCooldowns: {},
  loginStreak: 0,
  lastLoginDate: "",
  playerName: "",
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
    return {
      ...DEFAULT_STATE,
      ...data,
      placedItems: { ...DEFAULT_STATE.placedItems, ...data.placedItems },
      areaSlots:   { ...DEFAULT_STATE.areaSlots,   ...data.areaSlots   },
      petCooldowns:{ ...(data.petCooldowns || {}) },
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
