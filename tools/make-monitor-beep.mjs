/**
 * Synthesises the hospital-monitor beep layered under `sfx-player-hit`.
 *
 *   node tools/make-monitor-beep.mjs <out.wav> [hz] [ms]
 *
 * The Kenney pack was measured first and could not supply this. Its closest
 * file (`tone1`) is 81ms of 261Hz: at native pitch the fundamental sits on top
 * of the punch's own 310Hz component, and pitching it to monitor range shortens
 * it to 20ms, which reads as a click rather than a beep. Rate change moves
 * pitch and length together, so no single setting gives both. A beep is a plain
 * tone, so generating one costs less than fighting the sample.
 *
 * The target is a real bedside monitor: around 1kHz, roughly 130ms, a hard
 * onset and a short release. The tone is deliberately not a pure sine — those
 * speakers are small and cheap, and the odd harmonics they add are most of what
 * makes the sound recognisable as medical rather than as a game UI blip.
 */
import { writeFileSync } from 'node:fs';

const RATE = 44100;

/**
 * Odd harmonics only, falling steeply. This is a mild square-wave tilt: enough
 * edge to sound like a small transducer, far short of the buzz that an actual
 * square wave would put in the 4~8kHz band where the punch has nothing to mask
 * it.
 */
const HARMONICS = [
  { multiple: 1, gain: 1 },
  { multiple: 3, gain: 0.125 },
  { multiple: 5, gain: 0.05 },
];

/** Fades are raised-cosine so neither end can click. */
const ATTACK_MS = 2;
const RELEASE_MS = 28;

const [, , outPath, hzArg, msArg] = process.argv;

if (!outPath) {
  console.error('usage: node tools/make-monitor-beep.mjs <out.wav> [hz] [ms]');
  process.exit(1);
}

const hz = Number(hzArg ?? 1000);
const totalMs = Number(msArg ?? 130);
const frames = Math.round((totalMs / 1000) * RATE);
const attack = Math.round((ATTACK_MS / 1000) * RATE);
const release = Math.round((RELEASE_MS / 1000) * RATE);

const samples = new Float64Array(frames);

for (let i = 0; i < frames; i += 1) {
  const t = i / RATE;
  let value = 0;
  for (const { multiple, gain } of HARMONICS) {
    value += Math.sin(2 * Math.PI * hz * multiple * t) * gain;
  }

  let envelope = 1;
  if (i < attack) {
    envelope = 0.5 - 0.5 * Math.cos((Math.PI * i) / attack);
  } else if (i >= frames - release) {
    const position = (i - (frames - release)) / release;
    envelope = 0.5 + 0.5 * Math.cos(Math.PI * position);
  }

  samples[i] = value * envelope;
}

// Normalised to -1dBFS so the file matches the Kenney set, which is uniformly
// near full scale. Cue balance belongs to SFX_CONFIG, not to the file.
let peak = 0;
for (const sample of samples) peak = Math.max(peak, Math.abs(sample));
const scale = (10 ** (-1 / 20) / peak) || 0;

const bytes = frames * 2;
const buffer = Buffer.alloc(44 + bytes);
buffer.write('RIFF', 0);
buffer.writeUInt32LE(36 + bytes, 4);
buffer.write('WAVE', 8);
buffer.write('fmt ', 12);
buffer.writeUInt32LE(16, 16);
buffer.writeUInt16LE(1, 20);
buffer.writeUInt16LE(1, 22);
buffer.writeUInt32LE(RATE, 24);
buffer.writeUInt32LE(RATE * 2, 28);
buffer.writeUInt16LE(2, 32);
buffer.writeUInt16LE(16, 34);
buffer.write('data', 36);
buffer.writeUInt32LE(bytes, 40);

for (let i = 0; i < frames; i += 1) {
  const value = Math.max(-1, Math.min(1, samples[i] * scale));
  buffer.writeInt16LE(Math.round(value * 32767), 44 + i * 2);
}

writeFileSync(outPath, buffer);
console.log(`${outPath}  ${hz}Hz  ${totalMs}ms  ${frames} frames`);
