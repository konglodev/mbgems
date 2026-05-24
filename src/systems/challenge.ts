import { conditionPool, missions } from '../data/conditions';
import { ingredients } from '../data/ingredients';
import type { Challenge, Student } from '../types/game';
import { mulberry32, pick, runSeed } from './random';

const names = ['Ayu', 'Bima', 'Citra', 'Dimas', 'Eka', 'Fajar', 'Gita', 'Hana', 'Irfan', 'Joko'];
const personalities: Student['personality'][] = ['picky', 'athletic', 'sleepy', 'vegetable-lover', 'curious'];
const moods: Student['mood'][] = ['happy', 'neutral', 'tired', 'hungry'];

export function generateChallenge(date = new Date()): Challenge {
  const { key, seed } = runSeed(date);
  const random = mulberry32(seed);
  const conditions = [...conditionPool].sort(() => random() - 0.5).slice(0, 2);
  const students = Array.from({ length: 5 }, (_, index) => {
    const personality = pick(personalities, random);
    const favorite = pick(ingredients, random).id;
    const allergy = random() > 0.82 ? pick(ingredients.filter((item) => item.category === 'protein'), random).id : undefined;
    return {
      id: `student-${index}`,
      name: names[(Math.floor(random() * names.length) + index) % names.length],
      personality,
      favorite,
      allergy,
      mood: pick(moods, random),
    };
  });

  return {
    seed,
    dateKey: key,
    budget: conditions.some((condition) => condition.id === 'canteen-rush') ? 10000 : 10000,
    mission: pick(missions, random),
    target: { protein: 18, carb: 15, vitamin: 18, fiber: 10, sugar: 12, calories: 22 },
    conditions,
    students,
  };
}
