// Sizzle & Serve — state: the shift, the orders, the coins, the hearts.
// Pure game rules live here; drawing lives in render.js, clicks in input.js.

import { CUSTOMERS, DISHES, TUNING, mulberry32 } from './data.js';

let orderSeq = 0;

export function newGame() {
  return {
    screen: 'title', // title | playing | dayEnd | gameOver
    day: 1,
    shiftLeft: TUNING.shiftSeconds,
    coins: 0,
    served: 0,
    lost: 0,
    hearts: TUNING.hearts,
    combo: 0,
    bestCombo: 0,
    orders: [],
    stations: {},
    counter: [], // ingredient ids waiting on the counter
    hand: null, // { kind: 'raw'|'cooked', ingredient } or null
    plate: [], // cooked ingredient ids on the plate
    selectedOrder: null, // order id the plate is building for
    nextOrderIn: TUNING.firstOrderAt,
    customerIdx: 0,
    message: '',
    messageUntil: 0,
    particles: [],
    floats: [],
    muted: false,
    rng: Math.random,
  };
}

export function startShift(state) {
  state.screen = 'playing';
  state.shiftLeft = TUNING.shiftSeconds;
  state.orders = [];
  state.stations = {};
  state.counter = [];
  state.hand = null;
  state.plate = [];
  state.selectedOrder = null;
  state.nextOrderIn = TUNING.firstOrderAt;
  state.particles = [];
  state.floats = [];
}

function pickDish(rng) {
  return DISHES[Math.floor(rng() * DISHES.length)];
}

function spawnOrder(state) {
  const dish = pickDish(state.rng);
  const customer = CUSTOMERS[state.customerIdx % CUSTOMERS.length];
  state.customerIdx++;
  const order = {
    id: ++orderSeq,
    dishId: dish.id,
    customer: customer.name,
    color: customer.color,
    timeLeft: TUNING.orderLifetime,
    maxTime: TUNING.orderLifetime,
    doneSteps: 0,
  };
  state.orders.push(order);
  if (state.selectedOrder === null) state.selectedOrder = order.id;
  return order;
}

export function orderGapForDay(day) {
  if (day <= 1) return TUNING.orderGapDay1;
  if (day === 2) return TUNING.orderGapDay2;
  return TUNING.orderGapDay3;
}

export function selectedOrder(state) {
  return state.orders.find((o) => o.id === state.selectedOrder) || null;
}

export function comboMultiplier(state) {
  return Math.min(1 + state.combo * TUNING.comboStep, TUNING.comboCap);
}

export function serveOrder(state, order) {
  const dish = DISHES.find((d) => d.id === order.dishId);
  const tip = Math.round((order.timeLeft / order.maxTime) * TUNING.tipMax);
  const earned = Math.round((dish.price + tip) * comboMultiplier(state));
  state.coins += earned;
  state.served++;
  state.combo++;
  state.bestCombo = Math.max(state.bestCombo, state.combo);
  state.orders = state.orders.filter((o) => o.id !== order.id);
  state.plate = [];
  state.selectedOrder = state.orders.length ? state.orders[0].id : null;
  state.message = `Served ${dish.name}! +${earned} coins`;
  state.messageUntil = performance.now() + 1800;
  return earned;
}

export function loseOrder(state, order) {
  state.orders = state.orders.filter((o) => o.id !== order.id);
  state.hearts--;
  state.combo = 0;
  state.lost++;
  if (state.selectedOrder === order.id) {
    state.plate = [];
    state.selectedOrder = state.orders.length ? state.orders[0].id : null;
  }
  state.message = `${order.customer} walked out! -1 heart`;
  state.messageUntil = performance.now() + 1800;
}

export function endDay(state) {
  state.screen = 'dayEnd';
}

export function nextDay(state) {
  state.day++;
  if (state.day > TUNING.days) {
    state.screen = 'gameOver';
    return;
  }
  startShift(state);
}

// Advance timers by dt seconds. Returns 'dayEnd' | 'gameOver' | null.
export function tick(state, dt) {
  if (state.screen !== 'playing') return null;
  state.shiftLeft -= dt;
  state.nextOrderIn -= dt;
  if (state.nextOrderIn <= 0 && state.orders.length < TUNING.maxOrders) {
    spawnOrder(state);
    state.nextOrderIn = orderGapForDay(state.day);
  }
  const expired = [];
  for (const order of state.orders) {
    order.timeLeft -= dt;
    if (order.timeLeft <= 0) expired.push(order);
  }
  for (const order of expired) loseOrder(state, order);
  if (state.hearts <= 0) {
    state.screen = 'gameOver';
    return 'gameOver';
  }
  if (state.shiftLeft <= 0) {
    state.shiftLeft = 0;
    endDay(state);
    return 'dayEnd';
  }
  return null;
}

// Deterministic staged scenes for screenshots: real game states rendered by the
// game's own code, exactly like the kit starter's ?shot= scenes.
export function stageShot(state, shot, seed) {
  state.rng = mulberry32(seed || 1);
  startShift(state);
  state.screen = 'playing';
  if (shot === 'cover') {
    state.coins = 240;
    state.combo = 3;
    state.shiftLeft = 98;
    state.counter = ['rice', 'egg', 'chili'];
    state.stations.grill = { ingredient: 'chicken', progress: 0.6, total: 5, done: false };
    state.stations.fry = { ingredient: 'rice', progress: 0.35, total: 3, done: false };
    state.orders = [
      { id: 101, dishId: 'nasi-goreng', customer: 'Maya', color: '#e07856', timeLeft: 31, maxTime: 45, doneSteps: 0 },
      { id: 102, dishId: 'mie-ayam', customer: 'Budi', color: '#5b8dd9', timeLeft: 22, maxTime: 45, doneSteps: 0 },
      { id: 103, dishId: 'sate-ayam', customer: 'Sari', color: '#c86dd7', timeLeft: 12, maxTime: 45, doneSteps: 0 },
    ];
    state.selectedOrder = 101;
    state.plate = ['rice', 'egg'];
  } else if (shot === 'rush') {
    state.coins = 410;
    state.combo = 5;
    state.shiftLeft = 54;
    state.counter = ['noodle', 'veg'];
    state.stations.chop = { ingredient: 'chili', progress: 0.8, total: 2, done: false };
    state.stations.grill = { ingredient: 'chicken', progress: 0.9, total: 5, done: false };
    state.stations.pot = { ingredient: 'noodle', progress: 0.5, total: 4, done: false };
    state.orders = [
      { id: 201, dishId: 'mie-ayam', customer: 'Agus', color: '#4da66e', timeLeft: 8, maxTime: 45, doneSteps: 0 },
      { id: 202, dishId: 'bakso', customer: 'Rina', color: '#d9a441', timeLeft: 19, maxTime: 45, doneSteps: 0 },
      { id: 203, dishId: 'ayam-geprek', customer: 'Dedi', color: '#7a68c9', timeLeft: 27, maxTime: 45, doneSteps: 0 },
      { id: 204, dishId: 'gado-gado', customer: 'Lilis', color: '#d95f8e', timeLeft: 36, maxTime: 45, doneSteps: 0 },
    ];
    state.selectedOrder = 201;
    state.plate = ['noodle'];
  } else if (shot === 'serve') {
    state.coins = 385;
    state.combo = 4;
    state.shiftLeft = 71;
    state.counter = ['egg'];
    state.stations.fry = { ingredient: 'egg', progress: 1, total: 3, done: true };
    state.orders = [
      { id: 301, dishId: 'nasi-goreng', customer: 'Maya', color: '#e07856', timeLeft: 26, maxTime: 45, doneSteps: 0 },
      { id: 302, dishId: 'sate-ayam', customer: 'Joko', color: '#4fb3a9', timeLeft: 33, maxTime: 45, doneSteps: 0 },
    ];
    state.selectedOrder = 301;
    state.plate = ['rice', 'egg', 'chili'];
    state.message = 'Plate complete — serve it!';
    state.messageUntil = performance.now() + 60000;
  } else if (shot === 'day') {
    state.coins = 520;
    state.served = 9;
    state.lost = 1;
    state.bestCombo = 6;
    state.shiftLeft = 0;
    state.screen = 'dayEnd';
  }
}
