// Sizzle & Serve — main: the game loop, screen flow and screenshot staging.
// Open with ?shot=cover|rush|serve|day&seed=1 for a deterministic staged scene
// (real renders of this game's own code, the same pattern the kit starter uses).

import { newGame, startShift, nextDay, tick, stageShot } from './state.js';
import { tickStations } from './kitchen.js';
import { render } from './render.js';
import { clickAt, keyDown, burst } from './input.js';
import { sfx } from './audio.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const state = newGame();

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seed = parseInt(params.get('seed') || '1', 10);
if (shot) stageShot(state, shot, seed);

let last = performance.now();
let lastDing = {};

function frame(now) {
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;

  if (state.screen === 'playing') {
    const result = tick(state, dt);
    tickStations(state, dt);
    // ding once per station when it finishes
    for (const key of Object.keys(state.stations)) {
      const job = state.stations[key];
      if (job.done && !lastDing[key]) {
        lastDing[key] = true;
        sfx.done();
      } else if (!job.done) {
        lastDing[key] = false;
      }
    }
    if (result === 'dayEnd') sfx.dayEnd();
    if (result === 'gameOver') sfx.lost();
    // particles
    for (const p of state.particles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 220 * dt;
      p.life -= dt * 1.6;
    }
    state.particles = state.particles.filter((p) => p.life > 0);
    for (const f of state.floats) {
      f.y -= 40 * dt;
      f.life -= dt * 0.9;
    }
    state.floats = state.floats.filter((f) => f.life > 0);
  }

  render(ctx, state, now);
  requestAnimationFrame(frame);
}

function canvasPos(event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: (event.clientX - rect.left) * (canvas.width / rect.width),
    y: (event.clientY - rect.top) * (canvas.height / rect.height),
  };
}

canvas.addEventListener('click', (event) => {
  const pos = canvasPos(event);
  const action = clickAt(state, pos.x, pos.y);
  if (action === 'start') {
    state.day = 1;
    state.coins = 0;
    state.served = 0;
    state.lost = 0;
    state.bestCombo = 0;
    state.hearts = 3;
    startShift(state);
    sfx.pick();
  } else if (action === 'advance') {
    if (state.screen === 'dayEnd') {
      nextDay(state);
      sfx.dayEnd();
    } else if (state.screen === 'gameOver') {
      const fresh = newGame();
      Object.assign(state, fresh);
      state.screen = 'title';
    }
  }
});

window.addEventListener('keydown', (event) => {
  if ([' ', 'ArrowUp', 'ArrowDown'].includes(event.key)) event.preventDefault();
  const action = keyDown(state, event.key);
  if (action === 'start') {
    state.day = 1;
    state.coins = 0;
    state.served = 0;
    state.lost = 0;
    state.bestCombo = 0;
    state.hearts = 3;
    startShift(state);
    sfx.pick();
  } else if (action === 'advance') {
    if (state.screen === 'dayEnd') {
      nextDay(state);
      sfx.dayEnd();
    } else if (state.screen === 'gameOver') {
      const fresh = newGame();
      Object.assign(state, fresh);
      state.screen = 'title';
    }
  }
});

// expose a tiny handle for automated play-testing (not part of the game UI)
window.__warung = { state, burst };
requestAnimationFrame(frame);
