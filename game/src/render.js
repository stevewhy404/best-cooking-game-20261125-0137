// Sizzle & Serve — render: every pixel the player sees, drawn on one canvas.
// Layout (1280x720): top bar, order board, stations, pantry + counter, plating.

import { DISHES, INGREDIENTS, STATIONS, TUNING, ingredientById, stationById, dishById } from './data.js';
import { selectedOrder, comboMultiplier } from './state.js';

const W = 1280;
const H = 720;

export const HIT = {
  tickets: [], // {x,y,w,h,orderId}
  stations: [], // {x,y,w,h,stationId}
  bins: [], // {x,y,w,h,ingredient}
  counterSlots: [], // {x,y,w,h,index}
  plate: null, // {x,y,w,h}
  serve: null, // {x,y,w,h}
  trash: null, // {x,y,w,h}
  start: null, // title/dayEnd/gameOver button {x,y,w,h}
};

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, s, x, y, size, color, align, weight) {
  ctx.fillStyle = color;
  ctx.font = `${weight || 'bold'} ${size}px "Trebuchet MS", Verdana, sans-serif`;
  ctx.textAlign = align || 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(s, x, y);
}

function fmtTime(sec) {
  const s = Math.max(0, Math.ceil(sec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

// ---- food icons (flat, drawn from shapes; all original art) ----
export function drawIngredient(ctx, id, cx, cy, r, cooked) {
  ctx.save();
  ctx.translate(cx, cy);
  if (cooked) {
    ctx.strokeStyle = '#ffd94d';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, r + 4, 0, Math.PI * 2);
    ctx.stroke();
  }
  if (id === 'rice') {
    ctx.fillStyle = '#f5f0e1';
    ctx.beginPath();
    ctx.arc(0, r * 0.25, r * 0.85, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = '#fffdf5';
    ctx.beginPath();
    ctx.ellipse(0, r * 0.25, r * 0.85, r * 0.3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#d8cfae';
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      ctx.arc(-r * 0.5 + i * r * 0.25, -r * 0.15 - (i % 2) * r * 0.2, r * 0.09, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (id === 'egg') {
    ctx.fillStyle = '#fdf6e3';
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 0.95, r * 0.8, 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = cooked ? '#e8a91c' : '#ffd94d';
    ctx.beginPath();
    ctx.arc(r * 0.1, -r * 0.05, r * 0.45, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.beginPath();
    ctx.arc(r * 0.1 - r * 0.15, -r * 0.2, r * 0.12, 0, Math.PI * 2);
    ctx.fill();
  } else if (id === 'chili') {
    ctx.strokeStyle = '#d9382b';
    ctx.lineWidth = r * 0.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(0, -r * 0.1, r * 0.7, Math.PI * 0.15, Math.PI * 0.85);
    ctx.stroke();
    ctx.strokeStyle = '#58a34a';
    ctx.lineWidth = r * 0.18;
    ctx.beginPath();
    ctx.moveTo(-r * 0.62, -r * 0.55);
    ctx.lineTo(-r * 0.85, -r * 0.85);
    ctx.stroke();
  } else if (id === 'chicken') {
    ctx.fillStyle = cooked ? '#a86a2e' : '#c98a4b';
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 0.75, r * 0.6, -0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#f5f0e1';
    ctx.lineWidth = r * 0.16;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(r * 0.55, r * 0.35);
    ctx.lineTo(r * 0.95, r * 0.7);
    ctx.moveTo(r * 0.55, r * 0.35);
    ctx.lineTo(r * 0.7, r * 0.95);
    ctx.stroke();
    ctx.fillStyle = '#f5f0e1';
    ctx.beginPath();
    ctx.arc(r * 0.95, r * 0.7, r * 0.16, 0, Math.PI * 2);
    ctx.arc(r * 0.7, r * 0.95, r * 0.16, 0, Math.PI * 2);
    ctx.fill();
  } else if (id === 'noodle') {
    ctx.strokeStyle = '#f2c14e';
    ctx.lineWidth = r * 0.22;
    ctx.lineCap = 'round';
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.moveTo(-r * 0.8, i * r * 0.45);
      ctx.bezierCurveTo(-r * 0.3, i * r * 0.45 - r * 0.35, r * 0.3, i * r * 0.45 + r * 0.35, r * 0.8, i * r * 0.45);
      ctx.stroke();
    }
  } else if (id === 'veg') {
    ctx.fillStyle = '#58a34a';
    for (let i = 0; i < 3; i++) {
      const a = -0.6 + i * 0.6;
      ctx.beginPath();
      ctx.ellipse(Math.sin(a) * r * 0.4, -Math.abs(Math.cos(a)) * r * 0.2, r * 0.42, r * 0.62, a, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#2c5a24';
    ctx.fillRect(-r * 0.08, r * 0.3, r * 0.16, r * 0.55);
  }
  ctx.restore();
}

function drawFace(ctx, color, cx, cy, r, mood) {
  ctx.fillStyle = '#f2c49b';
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(cx, cy - r * 0.55, r * 0.95, Math.PI, 0);
  ctx.fill();
  ctx.fillStyle = '#241a12';
  ctx.beginPath();
  ctx.arc(cx - r * 0.35, cy - r * 0.1, r * 0.09, 0, Math.PI * 2);
  ctx.arc(cx + r * 0.35, cy - r * 0.1, r * 0.09, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#241a12';
  ctx.lineWidth = r * 0.1;
  ctx.lineCap = 'round';
  ctx.beginPath();
  if (mood === 'happy') ctx.arc(cx, cy + r * 0.25, r * 0.45, Math.PI * 0.15, Math.PI * 0.85);
  else if (mood === 'angry') {
    ctx.moveTo(cx - r * 0.45, cy + r * 0.55);
    ctx.lineTo(cx + r * 0.45, cy + r * 0.55);
  } else ctx.arc(cx, cy + r * 0.45, r * 0.4, Math.PI * 1.15, Math.PI * 1.85);
  ctx.stroke();
}

function drawProgressBar(ctx, x, y, w, h, frac, color) {
  rr(ctx, x, y, w, h, h / 2);
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.fill();
  if (frac > 0) {
    rr(ctx, x + 2, y + 2, Math.max(h - 4, (w - 4) * frac), h - 4, (h - 4) / 2);
    ctx.fillStyle = color;
    ctx.fill();
  }
}

// ---- main render ----
export function render(ctx, state, now) {
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = '#2a1d16';
  ctx.fillRect(0, 0, W, H);

  if (state.screen === 'title') { renderTitle(ctx, state); return; }
  if (state.screen === 'dayEnd') { renderKitchen(ctx, state, now); renderDayEnd(ctx, state); return; }
  if (state.screen === 'gameOver') { renderKitchen(ctx, state, now); renderGameOver(ctx, state); return; }
  renderKitchen(ctx, state, now);
}

function renderTopBar(ctx, state) {
  ctx.fillStyle = '#1d1410';
  ctx.fillRect(0, 0, W, 64);
  ctx.fillStyle = '#e07840';
  ctx.fillRect(0, 60, W, 4);
  text(ctx, 'SIZZLE & SERVE', 24, 34, 30, '#f5e6c8', 'left');
  text(ctx, 'WARUNG RUSH', 300, 36, 13, '#d98e1f', 'left');
  text(ctx, `DAY ${state.day}/${TUNING.days}`, 560, 34, 22, '#f5e6c8', 'center');
  const shiftColor = state.shiftLeft <= 20 ? '#ff5a4d' : '#f5e6c8';
  text(ctx, `SHIFT ${fmtTime(state.shiftLeft)}`, 700, 34, 26, shiftColor, 'center');
  text(ctx, `🪙 ${state.coins}`, 900, 34, 24, '#ffd94d', 'center');
  let hearts = '';
  for (let i = 0; i < TUNING.hearts; i++) hearts += i < state.hearts ? '♥ ' : '♡ ';
  text(ctx, hearts.trim(), 1030, 34, 22, '#ff6b6b', 'center');
  text(ctx, state.combo > 1 ? `COMBO x${comboMultiplier(state).toFixed(1)}` : '', 1170, 34, 20, '#7be07b', 'center');
  if (state.muted) text(ctx, 'MUTED', 1240, 34, 13, '#999', 'right');
}

function renderOrderBoard(ctx, state) {
  text(ctx, 'ORDER BOARD', 24, 84, 15, '#d8c3a5', 'left');
  HIT.tickets = [];
  const sel = selectedOrder(state);
  state.orders.forEach((order, i) => {
    const x = 24 + i * 308;
    const y = 94;
    const w = 292;
    const h = 92;
    const dish = dishById(order.dishId);
    const isSel = sel && sel.id === order.id;
    const urgent = order.timeLeft <= 10;
    rr(ctx, x, y, w, h, 10);
    ctx.fillStyle = isSel ? '#4a3220' : '#33241a';
    ctx.fill();
    ctx.lineWidth = isSel ? 3 : 1;
    ctx.strokeStyle = isSel ? '#ffd94d' : urgent ? '#ff5a4d' : '#6b4a2f';
    ctx.stroke();
    drawFace(ctx, order.color, x + 30, y + 30, 20, urgent ? 'angry' : 'happy');
    text(ctx, order.customer, x + 58, y + 20, 16, '#f5e6c8', 'left');
    text(ctx, dish.name, x + 58, y + 44, 17, '#ffd94d', 'left');
    text(ctx, `${dish.price} coins`, x + w - 12, y + 20, 14, '#d8c3a5', 'right');
    // recipe steps as icons
    dish.steps.forEach((step, si) => {
      const ix = x + 58 + si * 40;
      const iy = y + 70;
      const done = si < state.plate.length && isSel;
      ctx.globalAlpha = done ? 0.35 : 1;
      drawIngredient(ctx, step.ingredient, ix, iy, 13, false);
      ctx.globalAlpha = 1;
      if (done) {
        ctx.strokeStyle = '#7be07b';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(ix - 8, iy);
        ctx.lineTo(ix - 2, iy + 6);
        ctx.lineTo(ix + 9, iy - 7);
        ctx.stroke();
      }
    });
    // order countdown bar
    drawProgressBar(ctx, x + 12, y + h - 12, w - 24, 8, order.timeLeft / order.maxTime, urgent ? '#ff5a4d' : '#58a34a');
    text(ctx, `${Math.ceil(order.timeLeft)}s`, x + w - 12, y + h - 26, 13, urgent ? '#ff8a80' : '#d8c3a5', 'right');
    HIT.tickets.push({ x, y, w, h, orderId: order.id });
  });
  if (state.orders.length === 0) {
    text(ctx, 'No orders yet — the first customer is on the way…', 24, 140, 16, '#8a7d6b', 'left');
  }
}

function renderStations(ctx, state, now) {
  text(ctx, 'KITCHEN STATIONS — click a station with an ingredient in hand', 24, 208, 15, '#d8c3a5', 'left');
  HIT.stations = [];
  STATIONS.forEach((station, i) => {
    const x = 24 + i * 308;
    const y = 218;
    const w = 292;
    const h = 158;
    const job = state.stations[station.id];
    rr(ctx, x, y, w, h, 12);
    ctx.fillStyle = '#33241a';
    ctx.fill();
    ctx.lineWidth = 1;
    ctx.strokeStyle = '#6b4a2f';
    ctx.stroke();
    // station colour strip
    ctx.fillStyle = station.color;
    rr(ctx, x, y, w, 34, 12);
    ctx.fillRect(x, y + 22, w, 12);
    text(ctx, station.name.toUpperCase(), x + 14, y + 18, 16, '#fff', 'left');
    text(ctx, `[${station.key}] ${station.seconds}s`, x + w - 12, y + 18, 13, '#ffe9c9', 'right');
    // slot
    const cx = x + w / 2;
    const cy = y + 88;
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.beginPath();
    ctx.arc(cx, cy, 40, 0, Math.PI * 2);
    ctx.fill();
    if (job) {
      drawIngredient(ctx, job.ingredient, cx, cy, 28, job.done);
      if (!job.done) {
        // progress ring
        ctx.strokeStyle = '#ffd94d';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.arc(cx, cy, 46, -Math.PI / 2, -Math.PI / 2 + job.progress * Math.PI * 2);
        ctx.stroke();
        text(ctx, station.verb + '…', cx, cy + 58, 14, '#d8c3a5', 'center');
      } else {
        const pulse = 0.6 + 0.4 * Math.sin(now / 150);
        text(ctx, 'READY!', cx, cy - 52, 15, `rgba(123,224,123,${pulse})`, 'center');
        text(ctx, 'click to pick up', cx, cy + 58, 13, '#7be07b', 'center');
      }
    } else {
      ctx.strokeStyle = '#6b4a2f';
      ctx.setLineDash([6, 6]);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, 40, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      text(ctx, 'empty', cx, cy, 14, '#8a7d6b', 'center');
    }
    HIT.stations.push({ x, y, w, h, stationId: station.id });
  });
}

function renderPantryAndCounter(ctx, state) {
  // Pantry (ingredient bins)
  text(ctx, 'PANTRY — click an ingredient to take it', 24, 398, 15, '#d8c3a5', 'left');
  HIT.bins = [];
  INGREDIENTS.forEach((ing, i) => {
    const x = 24 + i * 102;
    const y = 408;
    const w = 92;
    const h = 84;
    rr(ctx, x, y, w, h, 10);
    ctx.fillStyle = '#33241a';
    ctx.fill();
    ctx.strokeStyle = '#6b4a2f';
    ctx.lineWidth = 1;
    ctx.stroke();
    drawIngredient(ctx, ing.id, x + w / 2, y + 34, 24, false);
    text(ctx, ing.name, x + w / 2, y + 68, 13, '#f5e6c8', 'center');
    text(ctx, `[${ing.key}]`, x + w - 6, y + 12, 11, '#8a7d6b', 'right');
    HIT.bins.push({ x, y, w, h, ingredient: ing.id });
  });
  // Counter
  const cx0 = 660;
  text(ctx, 'COUNTER — ingredients waiting (click one to pick it up)', cx0, 398, 15, '#d8c3a5', 'left');
  HIT.counterSlots = [];
  for (let i = 0; i < 6; i++) {
    const x = cx0 + i * 102;
    const y = 408;
    const w = 92;
    const h = 84;
    rr(ctx, x, y, w, h, 10);
    ctx.fillStyle = '#241a12';
    ctx.fill();
    ctx.strokeStyle = '#4a3220';
    ctx.lineWidth = 1;
    ctx.stroke();
    if (state.counter[i]) drawIngredient(ctx, state.counter[i], x + w / 2, y + 42, 28, false);
    HIT.counterSlots.push({ x, y, w, h, index: i });
  }
}

function renderPlating(ctx, state, now) {
  const y = 512;
  ctx.fillStyle = '#1d1410';
  ctx.fillRect(0, y, W, 148);
  ctx.fillStyle = '#e07840';
  ctx.fillRect(0, y, W, 3);
  const order = selectedOrder(state);
  const dish = order ? dishById(order.dishId) : null;

  // plate
  const px = 150;
  const py = y + 74;
  ctx.fillStyle = '#f5f0e1';
  ctx.beginPath();
  ctx.ellipse(px, py, 105, 58, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#e8ddc0';
  ctx.beginPath();
  ctx.ellipse(px, py, 82, 44, 0, 0, Math.PI * 2);
  ctx.fill();
  // plate contents
  state.plate.forEach((ing, i) => {
    drawIngredient(ctx, ing, px - 45 + i * 45, py - 6, 22, true);
  });
  text(ctx, 'PLATE', px, py + 78, 13, '#d8c3a5', 'center');
  HIT.plate = { x: px - 110, y: py - 62, w: 220, h: 124 };

  // recipe progress for selected order
  const rx = 300;
  text(ctx, order ? `BUILDING: ${dish.name} for ${order.customer}` : 'No order selected — click a ticket', rx, y + 26, 17, '#ffd94d', 'left');
  if (dish) {
    dish.steps.forEach((step, i) => {
      const sx = rx + i * 120;
      const done = i < state.plate.length;
      rr(ctx, sx, y + 42, 108, 62, 8);
      ctx.fillStyle = done ? '#2c5a24' : '#33241a';
      ctx.fill();
      ctx.strokeStyle = done ? '#7be07b' : '#6b4a2f';
      ctx.lineWidth = done ? 2 : 1;
      ctx.stroke();
      drawIngredient(ctx, step.ingredient, sx + 26, y + 73, 18, done);
      text(ctx, stationById(step.station).short, sx + 52, y + 62, 12, '#f5e6c8', 'left');
      text(ctx, done ? 'DONE' : `step ${i + 1}`, sx + 52, y + 84, 12, done ? '#7be07b' : '#d8c3a5', 'left');
    });
  }

  // hand
  const hx = 700;
  text(ctx, 'HAND', hx, y + 26, 13, '#d8c3a5', 'center');
  rr(ctx, hx - 40, y + 38, 80, 66, 10);
  ctx.fillStyle = '#33241a';
  ctx.fill();
  ctx.strokeStyle = '#6b4a2f';
  ctx.stroke();
  if (state.hand) {
    drawIngredient(ctx, state.hand.ingredient, hx, y + 71, 24, state.hand.kind === 'cooked');
    text(ctx, state.hand.kind, hx, y + 118, 11, '#d8c3a5', 'center');
  } else {
    text(ctx, 'empty', hx, y + 71, 13, '#8a7d6b', 'center');
  }

  // serve button
  const complete = state.plate.length > 0 && dish && state.plate.length === dish.steps.length;
  const bx = 830;
  const bw = 180;
  const bh = 66;
  const glow = complete ? 0.7 + 0.3 * Math.sin(now / 180) : 1;
  rr(ctx, bx, y + 38, bw, bh, 12);
  ctx.fillStyle = complete ? `rgba(88,163,74,${glow})` : '#4a4a42';
  ctx.fill();
  ctx.strokeStyle = complete ? '#a8e6a8' : '#6b6b60';
  ctx.lineWidth = 2;
  ctx.stroke();
  text(ctx, 'SERVE  [Space]', bx + bw / 2, y + 71, 20, complete ? '#fff' : '#bdbdb0', 'center');
  HIT.serve = { x: bx, y: y + 38, w: bw, h: bh };

  // trash button
  const tx = 1030;
  rr(ctx, tx, y + 38, 110, 66, 12);
  ctx.fillStyle = '#5a2e24';
  ctx.fill();
  ctx.strokeStyle = '#a86a5a';
  ctx.lineWidth = 2;
  ctx.stroke();
  text(ctx, 'TRASH [T]', tx + 55, y + 71, 16, '#f5c9b8', 'center');
  HIT.trash = { x: tx, y: y + 38, w: 110, h: 66 };

  // message line
  if (state.message && now < state.messageUntil) {
    text(ctx, state.message, 1160, y + 130, 15, '#ffd94d', 'center');
  }
  text(ctx, 'Click a ticket to choose which order the plate builds for.', 300, y + 130, 13, '#8a7d6b', 'left');
}

function renderParticles(ctx, state) {
  for (const p of state.particles) {
    ctx.globalAlpha = Math.max(0, p.life);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  for (const f of state.floats) {
    ctx.globalAlpha = Math.max(0, f.life);
    text(ctx, f.text, f.x, f.y, 22, f.color, 'center');
  }
  ctx.globalAlpha = 1;
}

function renderKitchen(ctx, state, now) {
  renderTopBar(ctx, state);
  renderOrderBoard(ctx, state);
  renderStations(ctx, state, now);
  renderPantryAndCounter(ctx, state);
  renderPlating(ctx, state, now);
  renderParticles(ctx, state);
}

function renderTitle(ctx, state) {
  ctx.fillStyle = '#2a1d16';
  ctx.fillRect(0, 0, W, H);
  // warm backdrop: big pan + steam
  ctx.fillStyle = '#e07840';
  ctx.beginPath();
  ctx.arc(640, 250, 120, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#2a1d16';
  ctx.beginPath();
  ctx.arc(640, 250, 96, 0, Math.PI * 2);
  ctx.fill();
  drawIngredient(ctx, 'egg', 640, 250, 46, true);
  text(ctx, 'SIZZLE & SERVE', 640, 420, 64, '#f5e6c8', 'center');
  text(ctx, 'W A R U N G   R U S H', 640, 468, 26, '#d98e1f', 'center');
  text(ctx, 'Run the night stall. Chop, grill, fry and boil each order before its ticket runs out.', 640, 520, 19, '#d8c3a5', 'center');
  text(ctx, '3 days. 6 dishes. One very hungry street.', 640, 550, 19, '#d8c3a5', 'center');
  const pulse = 0.65 + 0.35 * Math.sin(Date.now() / 300);
  text(ctx, 'CLICK OR PRESS ENTER TO START DAY 1', 640, 620, 22, `rgba(255,217,77,${pulse})`, 'center');
  HIT.start = { x: 440, y: 590, w: 400, h: 60 };
  text(ctx, 'Mouse + keys 1–6, Q/W/E/R, Space to serve, T to trash, M to mute', 640, 680, 14, '#8a7d6b', 'center');
}

function renderDayEnd(ctx, state) {
  ctx.fillStyle = 'rgba(20,12,8,0.78)';
  ctx.fillRect(0, 0, W, H);
  rr(ctx, 390, 180, 500, 360, 16);
  ctx.fillStyle = '#33241a';
  ctx.fill();
  ctx.strokeStyle = '#ffd94d';
  ctx.lineWidth = 3;
  ctx.stroke();
  text(ctx, `DAY ${state.day} COMPLETE!`, 640, 230, 34, '#ffd94d', 'center');
  text(ctx, `Orders served: ${state.served}`, 640, 300, 22, '#f5e6c8', 'center');
  text(ctx, `Orders lost: ${state.lost}`, 640, 336, 22, '#f5e6c8', 'center');
  text(ctx, `Best combo: x${(1 + state.bestCombo * 0.1).toFixed(1)}`, 640, 372, 22, '#f5e6c8', 'center');
  text(ctx, `Coins so far: ${state.coins}`, 640, 408, 24, '#ffd94d', 'center');
  const pulse = 0.65 + 0.35 * Math.sin(Date.now() / 300);
  text(ctx, state.day >= TUNING.days ? 'PRESS ENTER FOR THE FINAL TALLY' : `PRESS ENTER FOR DAY ${state.day + 1}`, 640, 480, 20, `rgba(255,217,77,${pulse})`, 'center');
  HIT.start = { x: 390, y: 440, w: 500, h: 70 };
}

function renderGameOver(ctx, state) {
  ctx.fillStyle = 'rgba(20,12,8,0.82)';
  ctx.fillRect(0, 0, W, H);
  rr(ctx, 390, 170, 500, 380, 16);
  ctx.fillStyle = '#33241a';
  ctx.fill();
  ctx.strokeStyle = '#e07840';
  ctx.lineWidth = 3;
  ctx.stroke();
  text(ctx, state.hearts <= 0 ? 'THE STALL CLOSED EARLY' : 'SHIFT COMPLETE!', 640, 220, 32, '#ffd94d', 'center');
  text(ctx, `Total coins: ${state.coins}`, 640, 290, 26, '#f5e6c8', 'center');
  text(ctx, `Orders served: ${state.served}   •   lost: ${state.lost}`, 640, 330, 20, '#d8c3a5', 'center');
  text(ctx, `Best combo: x${(1 + state.bestCombo * 0.1).toFixed(1)}`, 640, 366, 20, '#d8c3a5', 'center');
  const rank = state.coins >= 1200 ? 'LEGENDARY HAWKER' : state.coins >= 800 ? 'HEAD CHEF' : state.coins >= 450 ? 'LINE COOK' : 'APPRENTICE';
  text(ctx, `Rank: ${rank}`, 640, 410, 22, '#7be07b', 'center');
  const pulse = 0.65 + 0.35 * Math.sin(Date.now() / 300);
  text(ctx, 'PRESS ENTER TO PLAY AGAIN', 640, 480, 20, `rgba(255,217,77,${pulse})`, 'center');
  HIT.start = { x: 390, y: 440, w: 500, h: 70 };
}
