import { ingredients } from "../data/ingredients";
import type { RewardSummary, SaveState, ScoreResult } from "../types/game";

const KEY = "makanan-bergizi-gems-save-v1";
const LEGACY_KEY = "menu-challenge-harian-save-v1";

const initialSave: SaveState = {
  coins: 120,
  level: 1,
  xp: 0,
  dayStreak: 0,
  lastLogin: "",
  unlockedIngredients: [
    "nasi-putih",
    "mie",
    "telur",
    "tempe",
    "tahu",
    "bayam",
    "wortel",
    "pisang",
    "susu",
    "air-mineral",
  ],
  upgrades: {},
  achievements: [],
  leaderboard: [],
};

export function loadSave(): SaveState {
  try {
    const stored =
      localStorage.getItem(KEY) ?? localStorage.getItem(LEGACY_KEY);
    return stored ? { ...initialSave, ...JSON.parse(stored) } : initialSave;
  } catch {
    return initialSave;
  }
}

export function writeSave(save: SaveState) {
  localStorage.setItem(KEY, JSON.stringify(save));
}

export function xpForNextLevel(level: number) {
  return 120 + (level - 1) * 60;
}

export function unlockedIngredientIds(save: SaveState) {
  const ids = new Set(save.unlockedIngredients);
  ingredients.forEach((item) => {
    if (item.unlockLevel <= save.level) ids.add(item.id);
  });
  return ids;
}

export function applyReward(
  save: SaveState,
  result: ScoreResult,
): { save: SaveState; reward: RewardSummary } {
  const coinsGained = Math.max(12, Math.round(result.total / 16));
  const xpGained = Math.max(20, Math.round(result.total / 8));
  const beforeUnlocks = unlockedIngredientIds(save);
  let xp = save.xp + xpGained;
  let level = save.level;
  while (xp >= xpForNextLevel(level)) {
    xp -= xpForNextLevel(level);
    level += 1;
  }
  const afterSave = { ...save, level, xp };
  const afterUnlocks = unlockedIngredientIds(afterSave);
  const newUnlocks = [...afterUnlocks].filter((id) => !beforeUnlocks.has(id));
  const achievements = new Set(save.achievements);
  if (result.spent <= 9000) achievements.add("Budget Hemat");
  if (result.nutrition >= 90) achievements.add("Ahli Gizi Mini");
  if (result.satisfaction >= 95) achievements.add("Dapur Favorit");
  if (level > save.level) achievements.add(`Naik Level ${level}`);
  const leaderboard = [result, ...save.leaderboard]
    .sort((a, b) => b.total - a.total)
    .slice(0, 10);
  return {
    reward: {
      coinsGained,
      xpGained,
      previousLevel: save.level,
      newLevel: level,
      leveledUp: level > save.level,
      newUnlocks,
    },
    save: {
      ...save,
      coins: save.coins + coinsGained,
      xp,
      level,
      achievements: [...achievements],
      leaderboard,
    },
  };
}
