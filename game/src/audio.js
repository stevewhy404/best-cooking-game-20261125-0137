// Sizzle & Serve — audio: every sound is synthesised live with WebAudio.
// No audio files are shipped; nothing is loaded over the network.

let ctx = null;
let muted = false;

export function ensureAudio() {
  if (!ctx) {
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      ctx = null;
    }
  }
  if (ctx && ctx.state === 'suspended') ctx.resume();
  return ctx;
}

export function toggleMute() {
  muted = !muted;
  return muted;
}

export function isMuted() {
  return muted;
}

function tone(freq, at, dur, type, gain) {
  if (muted || !ctx) return;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime + at);
  g.gain.setValueAtTime(0.0001, ctx.currentTime + at);
  g.gain.exponentialRampToValueAtTime(gain, ctx.currentTime + at + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + at + dur);
  osc.connect(g).connect(ctx.destination);
  osc.start(ctx.currentTime + at);
  osc.stop(ctx.currentTime + at + dur + 0.05);
}

function noiseBurst(at, dur, filterFreq, gain) {
  if (muted || !ctx) return;
  const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = filterFreq;
  const g = ctx.createGain();
  g.gain.value = gain;
  src.connect(filter).connect(g).connect(ctx.destination);
  src.start(ctx.currentTime + at);
}

export const sfx = {
  click() { tone(660, 0, 0.06, 'square', 0.05); },
  pick() { tone(520, 0, 0.07, 'triangle', 0.09); tone(780, 0.05, 0.07, 'triangle', 0.07); },
  chop() { noiseBurst(0, 0.08, 1800, 0.22); tone(180, 0, 0.06, 'sine', 0.12); },
  sizzle() { noiseBurst(0, 0.25, 5200, 0.10); },
  done() { tone(880, 0, 0.09, 'sine', 0.10); tone(1174, 0.08, 0.12, 'sine', 0.10); },
  serve() { tone(523, 0, 0.1, 'triangle', 0.12); tone(659, 0.09, 0.1, 'triangle', 0.12); tone(784, 0.18, 0.16, 'triangle', 0.12); },
  error() { tone(160, 0, 0.15, 'sawtooth', 0.08); tone(120, 0.1, 0.18, 'sawtooth', 0.08); },
  lost() { tone(392, 0, 0.18, 'triangle', 0.10); tone(311, 0.16, 0.2, 'triangle', 0.10); tone(233, 0.32, 0.3, 'triangle', 0.10); },
  dayEnd() { tone(523, 0, 0.12, 'triangle', 0.11); tone(659, 0.12, 0.12, 'triangle', 0.11); tone(784, 0.24, 0.12, 'triangle', 0.11); tone(1046, 0.36, 0.25, 'triangle', 0.12); },
};
