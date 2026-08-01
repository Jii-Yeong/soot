import { writeFileSync } from 'node:fs';

const RATE = 44100;

/** Seeded so a regenerated file is byte-identical to the one that was auditioned. */
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296 - 0.5;
  };
}

/** RBJ biquad. Only the shapes a gunshot needs. */
function biquad(type, freq, q) {
  const w = (2 * Math.PI * freq) / RATE;
  const cos = Math.cos(w);
  const alpha = Math.sin(w) / (2 * q);
  let b0, b1, b2, a0, a1, a2;

  if (type === 'lowpass') {
    b0 = (1 - cos) / 2;
    b1 = 1 - cos;
    b2 = b0;
  } else if (type === 'highpass') {
    b0 = (1 + cos) / 2;
    b1 = -(1 + cos);
    b2 = b0;
  } else {
    // bandpass, constant skirt gain
    b0 = alpha;
    b1 = 0;
    b2 = -alpha;
  }
  a0 = 1 + alpha;
  a1 = -2 * cos;
  a2 = 1 - alpha;

  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  return (x) => {
    const y = (b0 / a0) * x + (b1 / a0) * x1 + (b2 / a0) * x2 - (a1 / a0) * y1 - (a2 / a0) * y2;
    x2 = x1; x1 = x; y2 = y1; y1 = y;
    return y;
  };
}

function apply(signal, ...filters) {
  const out = new Float64Array(signal.length);
  for (let i = 0; i < signal.length; i += 1) {
    let v = signal[i];
    for (const f of filters) v = f(v);
    out[i] = v;
  }
  return out;
}

function noise(frames, seed) {
  const random = rng(seed);
  const out = new Float64Array(frames);
  for (let i = 0; i < frames; i += 1) out[i] = random() * 2;
  return out;
}

/** Exponential decay. `tau` in seconds is the time to fall to 1/e. */
function decay(frames, tau, delay = 0) {
  const out = new Float64Array(frames);
  for (let i = 0; i < frames; i += 1) {
    const t = i / RATE - delay;
    out[i] = t < 0 ? 0 : Math.exp(-t / tau);
  }
  return out;
}

function mix(frames, ...layers) {
  const out = new Float64Array(frames);
  for (const [signal, envelope, gain] of layers) {
    for (let i = 0; i < frames; i += 1) out[i] += signal[i] * envelope[i] * gain;
  }
  return out;
}

function wav(samples) {
  const bytes = samples.length * 2;
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
  for (let i = 0; i < samples.length; i += 1) {
    buffer.writeInt16LE(Math.round(Math.max(-1, Math.min(1, samples[i])) * 32767), 44 + i * 2);
  }
  return buffer;
}

/**
 * A firearm report is a pressure step, not a note. Every layer here is noise
 * and every filter is Butterworth (Q = 1/sqrt(2)), so nothing resonates and
 * nothing can read as a pitch.
 *
 * The character comes from the decay times, not the spectrum: high frequencies
 * die in milliseconds while the low end hangs on. That ratio is what the ear
 * hears as "a hard thing happened", and it is why a sine thump is the wrong
 * tool — a pure tone is maximal pitch by definition.
 */
const BUTTER = Math.SQRT1_2;

function gunshot({ seconds, topHz, midLoHz, midHiHz, lowHz, topTau, midTau, lowTau, tailTau, gains, seed }) {
  const frames = Math.round(RATE * seconds);
  const source = noise(frames, seed);

  const top = apply(source, biquad('highpass', topHz, BUTTER));
  const mid = apply(source, biquad('highpass', midLoHz, BUTTER), biquad('lowpass', midHiHz, BUTTER));
  const low = apply(source, biquad('lowpass', lowHz, BUTTER), biquad('lowpass', lowHz, BUTTER));
  const tail = apply(noise(frames, seed + 7), biquad('lowpass', 1200, BUTTER), biquad('highpass', 200, BUTTER));

  const out = mix(
    frames,
    [top, decay(frames, topTau), gains.top],
    [mid, decay(frames, midTau), gains.mid],
    [low, decay(frames, lowTau), gains.low],
    [tail, decay(frames, tailTau, 0.01), gains.tail],
  );

  // 1ms ramp so the very first sample is not a step, then normalise to -1dBFS.
  const ramp = Math.round(RATE * 0.001);
  for (let i = 0; i < ramp; i += 1) out[i] *= i / ramp;
  const fade = Math.round(RATE * 0.006);
  for (let i = 0; i < fade; i += 1) out[frames - 1 - i] *= i / fade;

  let peak = 0;
  for (const v of out) peak = Math.max(peak, Math.abs(v));
  const target = Math.pow(10, -1 / 20);
  for (let i = 0; i < frames; i += 1) out[i] = (out[i] / peak) * target;

  return wav(out);
}

/**
 * Chamberlin state-variable filter whose cutoff moves per sample.
 *
 * The rule above — all noise, nothing resonant — has one exception. The rail
 * rifle is a coilgun, and a *swept* resonance is the whole of that sound. A
 * glide has no stable pitch, so it still cannot clash with a stage's key. A
 * fixed biquad cannot do this: its coefficients are baked at construction.
 */
function sweptBandpass(signal, fromHz, toHz, q) {
  const out = new Float64Array(signal.length);
  let low = 0;
  let band = 0;
  for (let i = 0; i < signal.length; i += 1) {
    const t = i / (signal.length - 1);
    // Exponential glide, so the sweep is even in pitch rather than in hertz.
    const hz = fromHz * Math.pow(toHz / fromHz, t);
    const f = 2 * Math.sin((Math.PI * Math.min(hz, RATE * 0.45)) / RATE);
    const high = signal[i] - low - (1 / q) * band;
    band += f * high;
    low += f * band;
    out[i] = band;
  }
  return out;
}

/** Rises then falls. The charge before a coil release, not a hit. */
function swell(frames, attack, tau, delay = 0) {
  const out = new Float64Array(frames);
  for (let i = 0; i < frames; i += 1) {
    const t = i / RATE - delay;
    if (t < 0) out[i] = 0;
    else if (t < attack) out[i] = t / attack;
    else out[i] = Math.exp(-(t - attack) / tau);
  }
  return out;
}

/** The 1ms ramp, the tail fade and the -1dBFS normalise, shared by every shape. */
function finish(out, frames, fadeSeconds) {
  const ramp = Math.round(RATE * 0.001);
  for (let i = 0; i < ramp; i += 1) out[i] *= i / ramp;
  const fade = Math.round(RATE * fadeSeconds);
  for (let i = 0; i < fade; i += 1) out[frames - 1 - i] *= i / fade;

  let peak = 0;
  for (const v of out) peak = Math.max(peak, Math.abs(v));
  const target = Math.pow(10, -1 / 20);
  for (let i = 0; i < frames; i += 1) out[i] = (out[i] / peak) * target;
  return out;
}

/**
 * Burst rifle. Deliberately darker and heavier than the SMG.
 *
 * A first pass built it bright and short and measured at a 3049Hz opening
 * centroid against the SMG's 3276 over the same 0.15s — near enough that in play
 * they were the same sound. A rifle round is the heavier one; the contrast lives
 * there, not in being brighter.
 */
function burstRifle() {
  const seconds = 0.17;
  const frames = Math.round(RATE * seconds);
  const source = noise(frames, 4242);

  const crack = apply(source, biquad('highpass', 3000, BUTTER));
  const body = apply(source, biquad('highpass', 480, BUTTER), biquad('lowpass', 3000, BUTTER));
  const low = apply(source, biquad('lowpass', 260, BUTTER), biquad('lowpass', 260, BUTTER));
  const room = apply(noise(frames, 4249), biquad('lowpass', 1400, BUTTER), biquad('highpass', 260, BUTTER));

  return wav(
    finish(
      mix(
        frames,
        [crack, decay(frames, 0.004), 0.62],
        [body, decay(frames, 0.016), 1.0],
        // Trimmed against the 72ms burst interval: long enough that three
        // rounds stack into one aggressive event, short enough that they do
        // not smear into a single low blur.
        [low, decay(frames, 0.033), 0.85],
        [room, decay(frames, 0.03, 0.008), 0.1],
      ),
      frames,
      0.008,
    ),
  );
}

/**
 * Rail rifle. 75 damage on a 760ms interval, so it is allowed to be the longest
 * and heaviest cue in the game: a short coil charge, the discharge, then a
 * resonance sweeping down out of everything else's way.
 */
function railRifle() {
  const seconds = 0.52;
  const frames = Math.round(RATE * seconds);
  const source = noise(frames, 909);

  const charge = sweptBandpass(noise(frames, 911), 320, 2600, 6);
  const snap = apply(source, biquad('highpass', 5000, BUTTER));
  const body = apply(source, biquad('highpass', 600, BUTTER), biquad('lowpass', 5000, BUTTER));
  const slam = apply(
    apply(source, biquad('lowpass', 150, BUTTER)),
    biquad('lowpass', 150, BUTTER),
  );
  const coil = sweptBandpass(noise(frames, 913), 1800, 190, 9);

  return wav(
    finish(
      mix(
        frames,
        [charge, swell(frames, 0.055, 0.008), 0.5],
        // The shot lands at 60ms, after the charge has risen.
        [snap, decay(frames, 0.006, 0.06), 0.85],
        [body, decay(frames, 0.02, 0.06), 1.0],
        [slam, decay(frames, 0.09, 0.06), 0.9],
        [coil, decay(frames, 0.16, 0.062), 0.75],
      ),
      frames,
      0.008,
    ),
  );
}

const SHAPED = {
  'burst-rifle-fire_synth-crack': burstRifle,
  'rail-rifle-fire_synth-coil': railRifle,
};

const VARIANTS = {
  // Tight and dry. Built for a 110ms fire interval — barely any tail to stack.
  'synth-a-dry': {
    seconds: 0.16, topHz: 3200, midLoHz: 700, midHiHz: 3200, lowHz: 260,
    topTau: 0.007, midTau: 0.016, lowTau: 0.038, tailTau: 0.045,
    gains: { top: 0.9, mid: 1.0, low: 0.7, tail: 0.15 }, seed: 12345,
  },
  // Same shape with more air and a longer tail. Reads as a bigger room.
  'synth-b-open': {
    seconds: 0.24, topHz: 3800, midLoHz: 800, midHiHz: 3800, lowHz: 240,
    topTau: 0.009, midTau: 0.02, lowTau: 0.042, tailTau: 0.09,
    gains: { top: 1.0, mid: 0.95, low: 0.6, tail: 0.3 }, seed: 2024,
  },
  // Weighted low. Sits furthest from the BGM's bright content.
  'synth-c-heavy': {
    seconds: 0.2, topHz: 2600, midLoHz: 500, midHiHz: 2600, lowHz: 300,
    topTau: 0.006, midTau: 0.018, lowTau: 0.055, tailTau: 0.06,
    gains: { top: 0.6, mid: 0.9, low: 1.0, tail: 0.18 }, seed: 777,
  },
};

const dir = process.argv[2];
for (const [name, options] of Object.entries(VARIANTS)) {
  writeFileSync(`${dir}/${name}.wav`, gunshot(options));
  console.log('written', name);
}
for (const [name, build] of Object.entries(SHAPED)) {
  writeFileSync(`${dir}/${name}.wav`, build());
  console.log('written', name);
}
