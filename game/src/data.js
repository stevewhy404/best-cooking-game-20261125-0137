// Sizzle & Serve — data: every dish, ingredient, station and tuning number.
// Nothing here is copied from any other game: the dishes, names and numbers are our own.

export const STATIONS = [
  { id: 'chop',  name: 'Chopping Board', short: 'Chop',  key: 'Q', seconds: 2, color: '#8d6e63', verb: 'Chopping' },
  { id: 'grill', name: 'Grill',          short: 'Grill', key: 'W', seconds: 5, color: '#b34a2e', verb: 'Grilling' },
  { id: 'fry',   name: 'Fryer',          short: 'Fry',   key: 'E', seconds: 3, color: '#d98e1f', verb: 'Frying' },
  { id: 'pot',   name: 'Soup Pot',       short: 'Boil',  key: 'R', seconds: 4, color: '#3e6b8e', verb: 'Boiling' },
];

export const INGREDIENTS = [
  { id: 'rice',    name: 'Rice',    key: '1', color: '#f5f0e1', dark: '#8a7d5f' },
  { id: 'egg',     name: 'Egg',     key: '2', color: '#ffd94d', dark: '#a67c00' },
  { id: 'chili',   name: 'Chili',   key: '3', color: '#d9382b', dark: '#7a150c' },
  { id: 'chicken', name: 'Chicken', key: '4', color: '#c98a4b', dark: '#6e4420' },
  { id: 'noodle',  name: 'Noodle',  key: '5', color: '#f2c14e', dark: '#8a6d1f' },
  { id: 'veg',     name: 'Veg',     key: '6', color: '#58a34a', dark: '#2c5a24' },
];

export const DISHES = [
  {
    id: 'nasi-goreng', name: 'Nasi Goreng', price: 70,
    steps: [
      { ingredient: 'rice', station: 'fry' },
      { ingredient: 'egg', station: 'fry' },
      { ingredient: 'chili', station: 'chop' },
    ],
  },
  {
    id: 'mie-ayam', name: 'Mie Ayam', price: 80,
    steps: [
      { ingredient: 'noodle', station: 'pot' },
      { ingredient: 'chicken', station: 'grill' },
      { ingredient: 'veg', station: 'chop' },
    ],
  },
  {
    id: 'sate-ayam', name: 'Sate Ayam', price: 90,
    steps: [
      { ingredient: 'chicken', station: 'grill' },
      { ingredient: 'chili', station: 'chop' },
      { ingredient: 'rice', station: 'fry' },
    ],
  },
  {
    id: 'gado-gado', name: 'Gado-Gado', price: 85,
    steps: [
      { ingredient: 'veg', station: 'chop' },
      { ingredient: 'egg', station: 'fry' },
      { ingredient: 'noodle', station: 'pot' },
    ],
  },
  {
    id: 'ayam-geprek', name: 'Ayam Geprek', price: 95,
    steps: [
      { ingredient: 'chicken', station: 'grill' },
      { ingredient: 'chili', station: 'chop' },
      { ingredient: 'egg', station: 'fry' },
    ],
  },
  {
    id: 'bakso', name: 'Bakso', price: 110,
    steps: [
      { ingredient: 'noodle', station: 'pot' },
      { ingredient: 'veg', station: 'chop' },
      { ingredient: 'chicken', station: 'grill' },
      { ingredient: 'egg', station: 'fry' },
    ],
  },
];

export const CUSTOMERS = [
  { name: 'Maya', color: '#e07856' },
  { name: 'Budi', color: '#5b8dd9' },
  { name: 'Sari', color: '#c86dd7' },
  { name: 'Agus', color: '#4da66e' },
  { name: 'Rina', color: '#d9a441' },
  { name: 'Dedi', color: '#7a68c9' },
  { name: 'Lilis', color: '#d95f8e' },
  { name: 'Joko', color: '#4fb3a9' },
];

export const TUNING = {
  shiftSeconds: 150,
  orderLifetime: 45,
  maxOrders: 4,
  firstOrderAt: 2,
  orderGapDay1: 13,
  orderGapDay2: 10,
  orderGapDay3: 8,
  hearts: 3,
  days: 3,
  trashPenalty: 5,
  tipMax: 30,
  comboStep: 0.1,
  comboCap: 2.0,
};

// Small deterministic PRNG so screenshot scenes are reproducible with ?seed=.
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function ingredientById(id) {
  return INGREDIENTS.find((i) => i.id === id);
}

export function stationById(id) {
  return STATIONS.find((s) => s.id === id);
}

export function dishById(id) {
  return DISHES.find((d) => d.id === id);
}
