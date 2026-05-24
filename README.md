# Makanan Bergizi Gems

Retro pixel-art cooking strategy game about building nutritious Indonesian school meals with a Rp10.000 budget.

Players buy ingredients, build a meal tray, cook under time pressure, serve students, earn score, level up, unlock ingredients, and upgrade the cafeteria.

## Features

- Mobile-first browser game
- React + Phaser + Vite
- PWA support with manifest and service worker
- Offline-capable production build
- LocalStorage save system
- Random challenge every play
- Indonesian food ingredient system
- Nutrition, budget, satisfaction, variety, and time scoring
- Student personalities, favorites, allergies, and reactions
- Leveling, XP, coins, unlocks, achievements, and leaderboard
- Upgrade shop with gameplay effects
- Cooking rush phase with adaptive prep time
- Pixel-style UI, alerts, timer, and CRT filter
- Mute/unmute audio toggle

## Gameplay Loop

1. Start a new challenge.
2. Read the mission, conditions, and budget.
3. Buy ingredients while the timer runs.
4. Build a tray with carb, protein, vegetable, fruit, and drink.
5. Cook through a short rush phase.
6. Serve students and see their reactions.
7. Earn coins, XP, unlocks, and leaderboard score.
8. Upgrade the cafeteria and play again.

## Tech Stack

- React
- TypeScript
- Phaser.js
- Vite
- TailwindCSS
- LocalStorage
- PWA manifest + service worker

## Getting Started

Install dependencies:

```bash
npm install
```

Run development server:

```bash
npm run dev
```

Build production files:

```bash
npm run build
```

Preview production build:

```bash
npm run preview
```

## Project Structure

```txt
src/
  App.tsx                  Main React app and screen flow
  main.tsx                 App entry and PWA registration
  styles.css               Pixel UI styling
  components/              React components
  data/                    Ingredients, conditions, upgrades
  game/                    Phaser setup and scenes
  store/                   Local save, rewards, leveling
  systems/                 Challenge generation and scoring
  types/                   Shared TypeScript types
public/
  manifest.webmanifest     PWA metadata
  sw.js                    Service worker
  icons/                   App icon
docs/
  PRODUCTION_GUIDE.md      Design and production notes
```

## Progression

Leveling is tied to score from serving students. Higher scores grant more XP and coins. New levels unlock more ingredients and upgrade options.

Upgrades affect the run:

- Kompor cepat: more time and faster cooking
- Rak segar: nutrition score bonus
- Bumbu racik: better student reactions
- Dekor kantin: improved mood baseline
- Kotak bekal: extra budget tolerance

## PWA Notes

The service worker is registered only in production mode. During development, this prevents stale cached files from causing confusing bugs.

After deployment, users can install the game from supported mobile browsers.

## License

# This project is currently private/prototype code. Add a license before publishing publicly if needed.

# mbgems

A pixel art style nutritious food strategy game with a budget of Rp. 10,000.

> > > > > > > 2a4926a35c6d04166c93c2a11dd388d2f3663e6e
