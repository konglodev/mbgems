# Makanan Bergizi Gems

## Full Game Architecture

The game is split into React UI, Phaser presentation, reusable data, gameplay systems, and LocalStorage persistence.

- `src/data`: ingredients, daily conditions, upgrade catalog.
- `src/systems`: deterministic daily challenge generation, seeded random, scoring, price modifiers.
- `src/store`: save/load/reward progression.
- `src/game`: Phaser scene and event bridge.
- `src/components`: React wrappers for canvas/game surfaces.
- `public`: PWA manifest, service worker, app icon.

## Folder Structure

```txt
src/
  App.tsx
  main.tsx
  styles.css
  components/PhaserStage.tsx
  data/{ingredients,conditions,upgrades}.ts
  game/events.ts
  game/phaserGame.ts
  game/scenes/CafeteriaScene.ts
  store/save.ts
  systems/{challenge,random,scoring}.ts
  types/game.ts
public/
  manifest.webmanifest
  sw.js
  icons/icon.svg
docs/
  PRODUCTION_GUIDE.md
```

## Core Gameplay Systems

Daily play lasts around 3 to 7 minutes:

1. Generate daily modifiers, student personalities, allergies, favorites, and mission.
2. Select one item each from carb, protein, vegetable, fruit, and drink.
3. Prices are modified by the daily event and checked against Rp10.000.
4. Nutrition, budget efficiency, student satisfaction, variety, and time generate the final score.
5. Rewards add coins, XP, achievements, and leaderboard entries.

## UI Layout System

The interface is mobile-first, touch friendly, and uses large pixel buttons. Screens are implemented in `App.tsx` as lightweight state-driven views:

- Main Menu
- Daily Challenge
- Ingredient Shop
- Kitchen Screen
- Student Serving Area
- Results Screen
- Upgrade Shop
- Leaderboard
- Collection Book

## Database And Save Structure

LocalStorage key: `makanan-bergizi-gems-save-v1`.

```ts
type SaveState = {
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
```

For production, this can migrate to IndexedDB with cloud sync later.

## Phaser Scene Structure

`CafeteriaScene` owns the animated cafeteria, steam, tray pixels, student sprites, floating reactions, and cook popups. React sends events through `gameEvents`:

- `challengeChanged`
- `trayChanged`
- `cookPulse`
- `resultReady`

This keeps Phaser visual and React state predictable.

## Pixel Art Direction Guide

- Canvas resolution: 360 x 200 internal, scaled with `pixelArt: true`.
- Sprite target sizes: 16x16 ingredients, 24x32 students, 48x32 counters.
- Palette: warm orange `#f48a3d`, cream `#fff4d6`, soft green `#67b778`, retro blue `#3d6fa8`, pixel brown `#3d2a20`.
- Food silhouettes should be readable at thumbnail size: rice block, egg oval, tempe slab, vegetable strips, cup shapes.
- Avoid heavy gradients. Use flat fills, dark outlines, and single-step shadow pixels.

## Gameplay Balancing Ideas

- Keep reliable low-cost combos possible: nasi putih + tempe + kangkung + pisang + air mineral.
- Premium ingredients should improve popularity but pressure the budget.
- Sugar should be tempting through juice/fruit popularity, but penalized when excessive.
- Allergies should be rare but memorable.
- Daily modifiers should create a new optimal answer, not remove all good choices.

## Example Code Snippets

Daily challenge generation is deterministic by date:

```ts
const { key, seed } = dateSeed(date);
const random = mulberry32(seed);
const conditions = [...conditionPool].sort(() => random() - 0.5).slice(0, 2);
```

Scoring combines multiple motivations:

```ts
const total = nutrition * 3 + budget * 1.2 + satisfaction * 2 + variety + time;
```

## Responsive PWA Structure

- `manifest.webmanifest` enables installability and standalone display.
- `sw.js` caches the app shell and fetched assets.
- The app uses a portrait-first shell with stable controls for low-end Android screens.
- The Phaser canvas scales to the available width without changing game coordinates.

## State Management Structure

The current build uses React state plus small pure systems. This is enough for the game size and keeps dependencies light. A production expansion could move session state into Zustand or Redux Toolkit if async cloud sync, quests, and multiplayer state grow.

## Asset Pipeline Suggestions

- Source art: Aseprite files in `/art/source`.
- Export: packed PNG atlas + JSON hash per release.
- Audio: short WAV source, compressed to OGG and MP3 fallback.
- Keep first load under 5 MB for low-end Android.
- Build sprites at 1x pixel resolution and scale in engine.

## Animation System Ideas

- Ingredient chopping: 3-frame squash and tiny pixel debris.
- Frying: pan shake, steam particles, orange heat pixels.
- Eating: student sprite bounce, cheek pixels, reaction bubble.
- Coin popup: upward float with score tint.
- Rush hour: queue wiggle and faster cafeteria ambience.

## Future Multiplayer Expansion Ideas

- Async daily leaderboard with signed score payloads.
- Weekly school-versus-school challenge.
- Friend ghost trays showing what others served.
- Cosmetic cafeteria visits.
- No pay-to-win boosts; monetization remains skins, tray frames, and chef outfits.
