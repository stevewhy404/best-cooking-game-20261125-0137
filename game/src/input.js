// Sizzle & Serve — input: mouse clicks and keyboard, wired to kitchen actions.

import { DISHES, INGREDIENTS, STATIONS } from './data.js';
import { HIT } from './render.js';
import {
  addToPlate, collectFromStation, dropOnCounter, placeOnStation, trashPlate,
} from './kitchen.js';
import { nextDay, serveOrder, selectedOrder } from './state.js';
import { sfx, toggleMute, ensureAudio } from './audio.js';

function inside(box, x, y) {
  return box && x >= box.x && x <= box.x + box.w && y >= box.y && y <= box.y + box.h;
}

export function burst(state, x, y, color, n) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2;
    const speed = 40 + Math.random() * 90;
    state.particles.push({
      x, y,
      vx: Math.cos(a) * speed,
      vy: Math.sin(a) * speed - 40,
      r: 2 + Math.random() * 3,
      color,
      life: 1,
    });
  }
}

export function floatText(state, x, y, text, color) {
  state.floats.push({ x, y, text, color, life: 1 });
}

function fail(state, msg) {
  state.message = msg;
  state.messageUntil = performance.now() + 1800;
  sfx.error();
}

export function tryServe(state, x, y) {
  const order = selectedOrder(state);
  if (!order) { fail(state, 'No order selected'); return null; }
  const dish = DISHES.find((d) => d.id === order.dishId);
  if (state.plate.length < dish.steps.length) {
    fail(state, `Plate is not complete yet (${state.plate.length}/${dish.steps.length})`);
    return null;
  }
  const earned = serveOrder(state, order);
  sfx.serve();
  burst(state, x || 920, y || 580, '#ffd94d', 22);
  floatText(state, 920, 540, `+${earned}`, '#ffd94d');
  return 'served';
}

export function clickAt(state, x, y) {
  ensureAudio();
  if (state.screen === 'title') {
    if (inside(HIT.start, x, y)) return 'start';
    return null;
  }
  if (state.screen === 'dayEnd' || state.screen === 'gameOver') {
    if (inside(HIT.start, x, y)) return 'advance';
    return null;
  }
  // tickets: choose which order the plate builds for
  for (const t of HIT.tickets) {
    if (inside(t, x, y)) {
      if (state.selectedOrder !== t.orderId) {
        state.selectedOrder = t.orderId;
        state.plate = [];
        sfx.click();
      }
      return null;
    }
  }
  // stations
  for (const s of HIT.stations) {
    if (inside(s, x, y)) {
      const job = state.stations[s.stationId];
      if (job && job.done) {
        const err = collectFromStation(state, s.stationId);
        if (err) fail(state, err);
        else { sfx.pick(); burst(state, x, y, '#ffd94d', 8); }
      } else if (job) {
        fail(state, 'Still cooking — wait for the ding');
      } else {
        const err = placeOnStation(state, s.stationId);
        if (err) fail(state, err);
        else { sfx.chop(); burst(state, x, y, '#f5f0e1', 6); }
      }
      return null;
    }
  }
  // pantry bins: take a raw ingredient into the hand
  for (const b of HIT.bins) {
    if (inside(b, x, y)) {
      if (state.hand) { fail(state, 'Your hand is full'); return null; }
      state.hand = { kind: 'raw', ingredient: b.ingredient };
      sfx.pick();
      return null;
    }
  }
  // counter slots: pick up a waiting ingredient, or set one down
  for (const c of HIT.counterSlots) {
    if (inside(c, x, y)) {
      if (state.hand && state.hand.kind === 'raw' && !state.counter[c.index]) {
        state.counter[c.index] = state.hand.ingredient;
        state.hand = null;
        sfx.click();
      } else if (!state.hand && state.counter[c.index]) {
        state.hand = { kind: 'raw', ingredient: state.counter[c.index] };
        state.counter[c.index] = undefined;
        state.counter = state.counter.filter(Boolean);
        sfx.pick();
      } else if (state.hand) {
        fail(state, 'Counter slot is taken');
      }
      return null;
    }
  }
  // plate: add the held cooked ingredient
  if (inside(HIT.plate, x, y)) {
    const err = addToPlate(state);
    if (err) fail(state, err);
    else { sfx.done(); burst(state, x, y, '#7be07b', 8); }
    return null;
  }
  // serve
  if (inside(HIT.serve, x, y)) return tryServe(state, x, y);
  // trash
  if (inside(HIT.trash, x, y)) {
    const err = trashPlate(state);
    if (err) fail(state, err);
    else { sfx.error(); state.message = 'Plate trashed (-5 coins)'; state.messageUntil = performance.now() + 1500; }
    return null;
  }
  return null;
}

export function keyDown(state, key) {
  ensureAudio();
  const k = key.toLowerCase();
  if (k === 'm') {
    state.muted = toggleMute();
    return null;
  }
  if (state.screen === 'title' && (k === 'enter' || k === ' ')) return 'start';
  if ((state.screen === 'dayEnd' || state.screen === 'gameOver') && (k === 'enter' || k === ' ')) return 'advance';
  if (state.screen !== 'playing') return null;

  const ing = INGREDIENTS.find((i) => i.key === k);
  if (ing) {
    if (state.hand) { fail(state, 'Your hand is full'); return null; }
    state.hand = { kind: 'raw', ingredient: ing.id };
    sfx.pick();
    return null;
  }
  const station = STATIONS.find((s) => s.key.toLowerCase() === k);
  if (station) {
    const job = state.stations[station.id];
    if (job && job.done) {
      const err = collectFromStation(state, station.id);
      if (err) fail(state, err); else sfx.pick();
    } else if (job) {
      fail(state, 'Still cooking — wait for the ding');
    } else {
      const err = placeOnStation(state, station.id);
      if (err) fail(state, err); else sfx.chop();
    }
    return null;
  }
  if (k === ' ') return tryServe(state);
  if (k === 't') {
    const err = trashPlate(state);
    if (err) fail(state, err);
    else { sfx.error(); state.message = 'Plate trashed (-5 coins)'; state.messageUntil = performance.now() + 1500; }
    return null;
  }
  if (k === 'd') {
    const err = dropOnCounter(state);
    if (err) fail(state, err); else sfx.click();
    return null;
  }
  return null;
}

export { nextDay };
