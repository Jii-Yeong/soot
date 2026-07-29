import { readFileSync, writeFileSync } from 'node:fs';

const RATE = 44100;
const CHANNELS = 2;

const [, , rawPath, outPath, startArg, endArg, fadeArg, peakArg] = process.argv;
const START = parseFloat(startArg);
const END = parseFloat(endArg);
const FADE = parseFloat(fadeArg); // crossfade seconds
const TARGET_DBFS = parseFloat(peakArg);

const buf = readFileSync(rawPath);
const pcm = new Float32Array(buf.buffer, buf.byteOffset, buf.length / 4);
const frames = pcm.length / CHANNELS;

const frameAt = (sec) => Math.round(sec * RATE);
const startFrame = frameAt(START);
const endFrame = frameAt(END);
const fadeFrames = frameAt(FADE);
const loopFrames = endFrame - startFrame;

if (endFrame + fadeFrames > frames) {
  throw new Error('crossfade tail runs past the end of the source');
}

const out = new Float32Array(loopFrames * CHANNELS);

// Body first: everything after the crossfade region is copied straight across.
for (let i = fadeFrames; i < loopFrames; i += 1) {
  for (let c = 0; c < CHANNELS; c += 1) {
    out[i * CHANNELS + c] = pcm[(startFrame + i) * CHANNELS + c];
  }
}

/**
 * The loop's opening is the crossfade: material carried past the loop end fades
 * out while the material at the loop start fades in.
 *
 * The curve is chosen by how alike the two sides are. Equal-power holds the
 * level for *uncorrelated* material but adds up to +3dB when the two sides
 * agree, which is exactly the case at a well-chosen loop point. Linear is the
 * correct pair for correlated material.
 */
const CURVE = process.argv[8] ?? 'linear';
for (let i = 0; i < fadeFrames; i += 1) {
  const t = i / fadeFrames;
  const gainIn = CURVE === 'power' ? Math.sin((Math.PI / 2) * t) : t;
  const gainOut = CURVE === 'power' ? Math.cos((Math.PI / 2) * t) : 1 - t;

  for (let c = 0; c < CHANNELS; c += 1) {
    const head = pcm[(startFrame + i) * CHANNELS + c];
    const tail = pcm[(endFrame + i) * CHANNELS + c];
    out[i * CHANNELS + c] = head * gainIn + tail * gainOut;
  }
}

let peak = 0;
for (const sample of out) peak = Math.max(peak, Math.abs(sample));
const gain = Math.pow(10, TARGET_DBFS / 20) / peak;
for (let i = 0; i < out.length; i += 1) out[i] *= gain;

// 16-bit WAV: the encoder reads this and throws it away, so the extra bit depth
// of a float file would only cost disk.
const bytes = out.length * 2;
const wav = Buffer.alloc(44 + bytes);
wav.write('RIFF', 0);
wav.writeUInt32LE(36 + bytes, 4);
wav.write('WAVE', 8);
wav.write('fmt ', 12);
wav.writeUInt32LE(16, 16);
wav.writeUInt16LE(1, 20);
wav.writeUInt16LE(CHANNELS, 22);
wav.writeUInt32LE(RATE, 24);
wav.writeUInt32LE(RATE * CHANNELS * 2, 28);
wav.writeUInt16LE(CHANNELS * 2, 32);
wav.writeUInt16LE(16, 34);
wav.write('data', 36);
wav.writeUInt32LE(bytes, 40);
for (let i = 0; i < out.length; i += 1) {
  const v = Math.max(-1, Math.min(1, out[i]));
  wav.writeInt16LE(Math.round(v * 32767), 44 + i * 2);
}
writeFileSync(outPath, wav);

const seamBefore = 20 * Math.log10(peak);
console.log(`길이 ${(loopFrames / RATE).toFixed(3)}초`);
console.log(`크로스페이드 ${FADE.toFixed(2)}초 (등파워)`);
console.log(`피크 ${seamBefore.toFixed(2)}dBFS → ${TARGET_DBFS.toFixed(1)}dBFS 로 정규화`);
