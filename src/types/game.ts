export type Category = 'carb' | 'protein' | 'vegetable' | 'fruit' | 'drink';

export type Nutrition = {
  protein: number;
  carb: number;
  vitamin: number;
  fiber: number;
  sugar: number;
  calories: number;
};

export type Ingredient = {
  id: string;
  name: string;
  category: Category;
  price: number;
  freshness: number;
  popularity: number;
  nutrition: Nutrition;
  color: string;
  unlockLevel: number;
  tags: string[];
};

export type DailyCondition = {
  id: string;
  title: string;
  description: string;
  effect: string;
  categoryBoost?: Category;
  priceCategory?: Category;
  priceMultiplier?: number;
};

export type Student = {
  id: string;
  name: string;
  personality: 'picky' | 'athletic' | 'sleepy' | 'vegetable-lover' | 'curious';
  favorite: string;
  allergy?: string;
  mood: 'happy' | 'neutral' | 'tired' | 'hungry';
};

export type Tray = Partial<Record<Category, Ingredient>>;

export type Challenge = {
  seed: number;
  dateKey: string;
  budget: number;
  mission: string;
  target: Nutrition;
  conditions: DailyCondition[];
  students: Student[];
};

export type ScoreResult = {
  total: number;
  nutrition: number;
  budget: number;
  satisfaction: number;
  variety: number;
  time: number;
  spent: number;
  reactions: Array<{ student: Student; label: string; delta: number }>;
};

export type RewardSummary = {
  coinsGained: number;
  xpGained: number;
  previousLevel: number;
  newLevel: number;
  leveledUp: boolean;
  newUnlocks: string[];
};

export type SaveState = {
  coins: number;
  level: number;
  xp: number;
  dayStreak: number;
  lastLogin: string;
  unlockedIngredients: string[];
  upgrades: Record<string, number>;
  achievements: string[];
  leaderboard: ScoreResult[];
};
