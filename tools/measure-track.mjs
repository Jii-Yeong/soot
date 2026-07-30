/**
 * Measures a BGM candidate against the four things that decide whether it can
 * be used as a looping game track.
 *
 *   node tools/measure-track.mjs <file> [--loop-from <sec>]
 *
 * Needs ffmpeg on PATH (or FFMPEG env var) purely to decode; every measurement
 * below is computed here so the numbers stay comparable across runs.
 *
 * Why these four:
 *   build    A track that swells cannot loop — the seam becomes a level jump.
 *   pulse    Only some cues want an audible beat. The title screen wants none.
 *   air      8~16kHz is what makes stage 1 sound like glass rather than mud.
 *   loop     How alike the two ends are decides whether a crossfade is audible.
 */
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const FFMPEG = process.env.FFMPEG ?? 'ffmpeg';
const RATE = 11025; // enough for envelope, onsets and loop correlation
const BANDS = [
  { key: 'low', from: 0, to: 250 },
  { key: 'lowMid', from: 250, to: 1000 },
  { key: 'mid', from: 1000, to: 4000 },
  { key: 'high', from: 4000, to: 8000 },
  { key: 'air', from: 8000, to: 16000 },
];

const file = process.argv[2];
if (!file) {
  console.error('usage: node tools/measure-track.mjs <file> [--loop-from <sec>]');
  process.exit(1);
}
const loopFromArg = process.argv.indexOf('--loop-from');

function ffmpeg(args) {
  return execFileSync(FFMPEG, args, { maxBuffer: 1 << 30 });
}

/** Decodes to mono float samples at RATE. */
function decode(path, extraFilters = []) {
  const dir = mkdtempSync(join(tmpdir(), 'soot-measure-'));
  const raw = join(dir, 'pcm.raw');
  try {
    ffmpeg([
      '-v', 'error', '-i', path,
      ...(extraFilters.length > 0 ? ['-af', extraFilters.join(',')] : []),
      '-ac', '1', '-ar', String(RATE), '-f', 'f32le', raw, '-y',
    ]);
    const buf = readFileSync(raw);
    return new Float32Array(buf.buffer, buf.byteOffset, buf.length / 4);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

function probeSeconds(path) {
  const out = ffmpeg(['-v', 'error', '-i', path, '-f', 'null', '-']).toString();
  return out; // unused; duration comes from the sample count instead
}

function rmsDb(data, from = 0, length = data.length) {
  let sum = 0;
  const end = Math.min(from + length, data.length);
  for (let i = from; i < end; i += 1) sum += data[i] * data[i];
  return 10 * Math.log10(sum / Math.max(1, end - from) + 1e-20);
}

// ── build ───────────────────────────────────────────────────────────────────
/**
 * Compares the opening to the closing. Both windows skip the very edges so an
 * intro build or a tail fade does not dominate the number.
 */
function build(mono) {
  const seconds = mono.length / RATE;
  const window = Math.min(15, seconds / 6);
  const skip = Math.min(6, seconds / 12);
  const head = rmsDb(mono, Math.round(skip * RATE), Math.round(window * RATE));
  const tail = rmsDb(
    mono,
    Math.round((seconds - skip - window) * RATE),
    Math.round(window * RATE),
  );
  return { head, tail, delta: tail - head };
}

/** Coarse envelope so the shape can be eyeballed alongside the numbers. */
function envelope(mono, step = 4) {
  const rows = [];
  for (let s = 0; s + step <= mono.length / RATE; s += step) {
    rows.push({ at: s, db: rmsDb(mono, Math.round(s * RATE), Math.round(step * RATE)) });
  }
  return rows;
}

// ── pulse ───────────────────────────────────────────────────────────────────
function fft(re, im) {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i += 1) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) { [re[i], re[j]] = [re[j], re[i]]; [im[i], im[j]] = [im[j], im[i]]; }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = (-2 * Math.PI) / len;
    for (let i = 0; i < n; i += len) {
      for (let k = 0; k < len / 2; k += 1) {
        const w = ang * k, wr = Math.cos(w), wi = Math.sin(w);
        const ur = re[i + k], ui = im[i + k];
        const vr = re[i + k + len / 2] * wr - im[i + k + len / 2] * wi;
        const vi = re[i + k + len / 2] * wi + im[i + k + len / 2] * wr;
        re[i + k] = ur + vr; im[i + k] = ui + vi;
        re[i + k + len / 2] = ur - vr; im[i + k + len / 2] = ui - vi;
      }
    }
  }
}

/**
 * Spectral flux picks out note onsets — energy that *appeared* since the last
 * frame. Autocorrelating that envelope finds the beat period, and the peak
 * height says how strongly a pulse is actually present.
 */
function pulse(mono) {
  const N = 1024, HOP = 128;
  const flux = [];
  let previous = new Float64Array(N / 2);
  for (let start = 0; start + N < mono.length; start += HOP) {
    const re = new Float64Array(N), im = new Float64Array(N);
    for (let i = 0; i < N; i += 1) {
      re[i] = (mono[start + i] ?? 0) * (0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (N - 1)));
    }
    fft(re, im);
    const mag = new Float64Array(N / 2);
    let sum = 0;
    for (let i = 0; i < N / 2; i += 1) {
      mag[i] = Math.hypot(re[i], im[i]);
      const rise = mag[i] - previous[i];
      if (rise > 0) sum += rise;
    }
    flux.push(sum);
    previous = mag;
  }
  const mean = flux.reduce((a, b) => a + b, 0) / Math.max(1, flux.length);
  const centred = flux.map((v) => v - mean);
  const fps = RATE / HOP;
  const score = (bpm) => {
    const lag = Math.round((60 / bpm) * fps);
    let dot = 0, norm = 0;
    for (let i = 0; i + lag < centred.length; i += 1) {
      dot += centred[i] * centred[i + lag];
      norm += centred[i] * centred[i];
    }
    return dot / (norm + 1e-12);
  };
  let best = { bpm: 0, score: -2 };
  for (let bpm = 60; bpm <= 180; bpm += 0.25) {
    const s = score(bpm);
    if (s > best.score) best = { bpm, score: s };
  }
  return best;
}

// ── bands ───────────────────────────────────────────────────────────────────
/** Each band relative to the track's own level, so loudness does not skew it. */
function bands(path) {
  const overall = rmsDb(decode(path));
  const out = {};
  for (const band of BANDS) {
    const filters = [];
    if (band.from > 0) filters.push(`highpass=f=${band.from}`, `highpass=f=${band.from}`);
    filters.push(`lowpass=f=${band.to}`, `lowpass=f=${band.to}`);
    out[band.key] = +(rmsDb(decode(path, filters)) - overall).toFixed(1);
  }
  return out;
}

// ── loop ────────────────────────────────────────────────────────────────────
/**
 * Finds where the track could wrap. Scores each candidate end by how alike its
 * material is to the loop start, because that similarity is what decides
 * whether the crossfade sounds like one continuous passage.
 */
function loop(mono, from) {
  const seconds = mono.length / RATE;
  const start = from ?? Math.min(24, seconds * 0.2);
  const win = Math.round(RATE * 1.0);
  const at = (s) => Math.round(s * RATE);
  const corr = (a0, b0) => {
    let dot = 0, aa = 0, bb = 0;
    for (let i = 0; i < win; i += 1) {
      const a = mono[a0 + i] ?? 0, b = mono[b0 + i] ?? 0;
      dot += a * b; aa += a * a; bb += b * b;
    }
    return dot / (Math.sqrt(aa * bb) + 1e-12);
  };
  let best = { end: 0, corr: -2 };
  for (let end = start + 45; end <= seconds - 1; end += 0.02) {
    const c = corr(at(start), at(end));
    if (c > best.corr) best = { end, corr: c };
  }
  const level = rmsDb(mono, at(best.end) - win, win) - rmsDb(mono, at(start), win);
  return { start, ...best, levelDelta: level };
}

// ── report ──────────────────────────────────────────────────────────────────
const mono = decode(file);
const seconds = mono.length / RATE;
const b = build(mono);
const p = pulse(mono);
const bd = bands(file);
const lp = loop(mono, loopFromArg > 0 ? parseFloat(process.argv[loopFromArg + 1]) : undefined);

console.log(`${file}`);
console.log(`  길이        ${seconds.toFixed(1)}초`);
console.log(`  빌드        ${b.delta >= 0 ? '+' : ''}${b.delta.toFixed(1)} dB   (앞 ${b.head.toFixed(1)} → 뒤 ${b.tail.toFixed(1)})`);
console.log(`  박          상관 ${p.score.toFixed(3)} @ ${p.bpm.toFixed(2)} BPM`);
console.log(`  대역        저 ${bd.low} / 중저 ${bd.lowMid} / 중 ${bd.mid} / 고 ${bd.high} / 공기감 ${bd.air}`);
console.log(`  루프        ${lp.start.toFixed(2)}s → ${lp.end.toFixed(2)}s (${(lp.end - lp.start).toFixed(1)}초)  상관 ${lp.corr.toFixed(3)}  레벨차 ${lp.levelDelta >= 0 ? '+' : ''}${lp.levelDelta.toFixed(2)}dB`);
console.log('  윤곽');
for (const row of envelope(mono, Math.max(4, Math.round(seconds / 30)))) {
  const bar = '#'.repeat(Math.max(0, Math.round((row.db + 40) / 0.6)));
  console.log(`    ${String(Math.round(row.at)).padStart(4)}s ${row.db.toFixed(1).padStart(7)} ${bar}`);
}
