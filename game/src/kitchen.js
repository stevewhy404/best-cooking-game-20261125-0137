// Sizzle & Serve — kitchen: stations, cooking progress and the plate.
// A station holds one ingredient, cooks it over its seconds, then holds the
// cooked result until the player picks it up. The plate only accepts the next
// step of the selected order's recipe, in order.

import { DISHES, STATIONS, TUNING } from './data.js';
import { selectedOrder } from './state.js';

export function stationState(state, stationId) {
  return state.stations[stationId] || null;
}

// Put the held raw ingredient onto a free station. Returns a message or null.
export function placeOnStation(state, stationId) {
  const station = STATIONS.find((s) => s.id === stationId);
  if (!station) return 'No such station';
  if (!state.hand || state.hand.kind !== 'raw') return 'Hold an ingredient first';
  if (state.stations[stationId]) return 'Station is busy';
  state.stations[stationId] = {
    ingredient: state.hand.ingredient,
    progress: 0,
    total: station.seconds,
    done: false,
  };
  state.hand = null;
  return null;
}

// Advance every cooking station by dt seconds.
export function tickStations(state, dt) {
  for (const key of Object.keys(state.stations)) {
    const job = state.stations[key];
    if (job.done) continue;
    job.progress += dt / job.total;
    if (job.progress >= 1) {
      job.progress = 1;
      job.done = true;
    }
  }
}

// Pick up a finished dish part from a station into the hand.
export function collectFromStation(state, stationId) {
  const job = state.stations[stationId];
  if (!job) return 'Nothing cooking here';
  if (!job.done) return 'Still cooking — wait for the ding';
  if (state.hand) return 'Your hand is full';
  state.hand = { kind: 'cooked', ingredient: job.ingredient };
  delete state.stations[stationId];
  return null;
}

// The next recipe step the selected order still needs.
export function nextNeededStep(state) {
  const order = selectedOrder(state);
  if (!order) return null;
  const dish = DISHES.find((d) => d.id === order.dishId);
  if (!dish) return null;
  const step = dish.steps[state.plate.length];
  return step || null;
}

export function plateIsComplete(state) {
  const order = selectedOrder(state);
  if (!order) return false;
  const dish = DISHES.find((d) => d.id === order.dishId);
  return dish && state.plate.length === dish.steps.length;
}

// Add the held cooked ingredient to the plate, if it is the next step needed.
export function addToPlate(state) {
  const order = selectedOrder(state);
  if (!order) return 'No order selected';
  if (!state.hand || state.hand.kind !== 'cooked') return 'Hold a cooked ingredient first';
  const step = nextNeededStep(state);
  if (!step) return 'Plate is already complete — serve it!';
  if (step.ingredient !== state.hand.ingredient) {
    return `That order needs ${step.ingredient} next, not ${state.hand.ingredient}`;
  }
  state.plate.push(state.hand.ingredient);
  state.hand = null;
  return null;
}

export function trashPlate(state) {
  if (state.plate.length === 0 && !state.hand) return 'Nothing to trash';
  state.plate = [];
  state.hand = null;
  state.coins = Math.max(0, state.coins - TUNING.trashPenalty);
  return null;
}

// Drop a raw ingredient from the hand onto the counter (max 6).
export function dropOnCounter(state) {
  if (!state.hand || state.hand.kind !== 'raw') return 'Hold a raw ingredient first';
  if (state.counter.length >= 6) return 'Counter is full';
  state.counter.push(state.hand.ingredient);
  state.hand = null;
  return null;
}
