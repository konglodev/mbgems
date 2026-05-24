import type {
  Challenge,
  Ingredient,
  ScoreResult,
  Student,
  Tray,
} from "../types/game";

export type UpgradeLevels = Record<string, number>;

function upgradeLevel(upgrades: UpgradeLevels | undefined, id: string) {
  return upgrades?.[id] ?? 0;
}

export function ingredientPrice(item: Ingredient, challenge: Challenge) {
  const modifier = challenge.conditions.find(
    (condition) => condition.priceCategory === item.category,
  );
  return (
    Math.round((item.price * (modifier?.priceMultiplier ?? 1)) / 100) * 100
  );
}

export function trayItems(tray: Tray) {
  return Object.values(tray).filter(Boolean) as Ingredient[];
}

export function traySpent(tray: Tray, challenge: Challenge) {
  return trayItems(tray).reduce(
    (sum, item) => sum + ingredientPrice(item, challenge),
    0,
  );
}

export function trayNutrition(tray: Tray) {
  return trayItems(tray).reduce(
    (sum, item) => {
      Object.entries(item.nutrition).forEach(([key, value]) => {
        sum[key as keyof typeof sum] += value;
      });
      return sum;
    },
    { protein: 0, carb: 0, vitamin: 0, fiber: 0, sugar: 0, calories: 0 },
  );
}

function nutritionScore(
  tray: Tray,
  challenge: Challenge,
  upgrades?: UpgradeLevels,
) {
  const totals = trayNutrition(tray);
  const proteinMultiplier = challenge.conditions.some(
    (condition) => condition.id === "protein-week",
  )
    ? 2
    : 1;
  const storageBonus = upgradeLevel(upgrades, "rak-segar") * 2;
  const base =
    Math.min(totals.protein * proteinMultiplier, challenge.target.protein) * 3 +
    Math.min(totals.carb, challenge.target.carb) * 2 +
    Math.min(totals.vitamin, challenge.target.vitamin) * 2.5 +
    Math.min(totals.fiber, challenge.target.fiber) * 3 +
    Math.max(0, 18 - Math.max(0, totals.sugar - challenge.target.sugar) * 3) +
    Math.max(0, 18 - Math.abs(totals.calories - challenge.target.calories)) +
    storageBonus;
  return Math.round(Math.min(100, base));
}

function reactionForStudent(
  student: Student,
  tray: Tray,
  challenge: Challenge,
  upgrades?: UpgradeLevels,
) {
  const items = trayItems(tray);
  let delta =
    8 +
    upgradeLevel(upgrades, "bumbu-racik") * 4 +
    upgradeLevel(upgrades, "dekor-dapur") * 3;
  if (items.some((item) => item.id === student.favorite)) delta += 24;
  if (student.allergy && items.some((item) => item.id === student.allergy))
    delta -= 55;
  if (student.personality === "athletic" && tray.protein) delta += 15;
  if (student.personality === "sleepy" && tray.drink?.id === "susu")
    delta += 12;
  if (student.personality === "vegetable-lover" && tray.vegetable) delta += 18;
  if (
    student.personality === "picky" &&
    items.reduce((sum, item) => sum + item.popularity, 0) /
      Math.max(items.length, 1) <
      82
  )
    delta -= 15;
  challenge.conditions.forEach((condition) => {
    if (condition.categoryBoost && tray[condition.categoryBoost]) delta += 8;
  });
  const label =
    delta >= 35
      ? "Excited!"
      : delta >= 20
        ? "Happy"
        : delta >= 5
          ? "Netral"
          : "Menolak";
  return { student, label, delta };
}

export function scoreTray(
  tray: Tray,
  challenge: Challenge,
  secondsLeft: number,
  upgrades?: UpgradeLevels,
): ScoreResult {
  const spent = traySpent(tray, challenge);
  const budgetPenaltyReduction = Math.min(
    0.5,
    upgradeLevel(upgrades, "kotak-bekal") * 0.08,
  );
  const overBudgetPenalty =
    spent > challenge.budget
      ? ((spent - challenge.budget) / 100) * (1 - budgetPenaltyReduction)
      : 0;
  const nutrition = Math.max(
    0,
    nutritionScore(tray, challenge, upgrades) - overBudgetPenalty,
  );
  const budget = Math.max(
    0,
    Math.round(((challenge.budget - spent) / challenge.budget) * 100),
  );
  const reactions = challenge.students.map((student) =>
    reactionForStudent(student, tray, challenge, upgrades),
  );
  const satisfaction = Math.max(
    0,
    Math.round(
      reactions.reduce((sum, reaction) => sum + reaction.delta, 0) /
        reactions.length +
        35,
    ),
  );
  const variety = Math.round((trayItems(tray).length / 5) * 100);
  const rushBonus = challenge.conditions.some(
    (condition) => condition.id === "canteen-rush",
  )
    ? 1.4
    : 1;
  const time = Math.round(Math.max(0, secondsLeft) * rushBonus);
  const total = Math.max(
    0,
    Math.round(
      nutrition * 3 + budget * 1.2 + satisfaction * 2 + variety + time,
    ),
  );
  return {
    total,
    nutrition,
    budget,
    satisfaction,
    variety,
    time,
    spent,
    reactions,
  };
}
