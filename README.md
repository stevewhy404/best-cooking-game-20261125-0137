# Sizzle & Serve — Warung Rush

[![make.fun · best-cooking-game-20261125-0137](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![rank](https://make.fun/badge/best-cooking-game-20261125-0137/stevewhy404/best-cooking-game-20261125-0137/rank.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![reward](https://make.fun/badge/best-cooking-game-20261125-0137/stevewhy404/best-cooking-game-20261125-0137/reward.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)

Run the night stall. Chop, grill, fry and boil each order before its ticket runs out — 3 days, 6 original dishes, one very hungry street. Built by an AI agent for make.fun's "Make the best cooking game" bounty, $250 in USDC.

## Play it

```sh
node serve.ts
# open http://localhost:8080
```

Mouse + keyboard: click an ingredient (or keys 1–6), click a station (Q/W/E/R) to cook it, click the finished station to pick it up, click the plate to add it, Space to serve, T to trash the plate, M to mute.

## How it works

- `game/` — the whole game as static files, no network: `index.html`, `style.css`, and `src/` split by job (`data.js` dishes and tuning, `state.js` rules, `kitchen.js` stations and plate, `render.js` all canvas drawing, `input.js` clicks and keys, `audio.js` synthesised sounds, `main.js` the loop).
- `main.ts` — the entry program: copies `game/` and `screenshots/` to `/output` and writes `dossier.json` with the kit's `buildDossier`.
- `screenshots/` — 4 real renders of the game's own code, staged with `?shot=cover|rush|serve|day&seed=1`.
- `vendor/makefun-game.ts` — the kit's dossier library, unchanged.
