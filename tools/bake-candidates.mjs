/**
 * Rebuilds `tools/audio-candidates.js` from whatever is in
 * `client/src/assets/audio/candidates/`.
 *
 *   node tools/bake-candidates.mjs
 *
 * Why this exists: `audio-check.html` is meant to be opened straight off the
 * file system, and a page loaded over `file://` may play audio but may not
 * read its bytes. So the measurements cannot be computed when the page opens —
 * they have to be baked in beforehand. This script does that by driving the
 * same page in a real browser, where the bytes are readable, and dumping the
 * `window.__manifest` it prints.
 *
 * The numbers therefore come from the page's own analysis and stay on its
 * yardstick. They are not comparable with `measure-track.mjs` output, which is
 * why the two never share a table. This tool is for listening and for the
 * plain-language verdicts; `measure-track.mjs` is for the numbers in the docs.
 */
import { createRequire } from 'node:module';
import { createReadStream, readdirSync, statSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// Playwright is a devDependency of the client workspace, not of the root where
// this script lives, so it is resolved from there rather than imported by bare
// name. Every other tool here needs nothing but node and ffmpeg; this one is
// the exception because only a browser can run the page's analysis.
// The resolved entry is CommonJS, so the named export may only be reachable
// through the interop default.
const playwright = await import(
  pathToFileURL(
    createRequire(path.join(ROOT, 'client/package.json')).resolve('@playwright/test'),
  ).href
);
const { chromium } = playwright.chromium ? playwright : playwright.default;
const CANDIDATES = 'client/src/assets/audio/candidates';
const PLAYABLE = /\.(ogg|mp3|wav|m4a|webm)$/i;

/** Cue order matches the order the player hears them. */
const GROUPS = [
  { cue: 'bgm-title', dir: 'title' },
  { cue: 'bgm-city', dir: 'city' },
  { cue: 'bgm-alley', dir: 'alley' },
  { cue: 'bgm-underground', dir: 'underground' },
  { cue: 'bgm-inferno', dir: 'inferno' },
  { cue: 'bgm-return', dir: 'return' },
];

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.ogg': 'audio/ogg',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.m4a': 'audio/mp4',
  '.webm': 'audio/webm',
};

/**
 * The page is served over http rather than opened as a file because reading
 * bytes is exactly what `file://` forbids.
 */
function serve() {
  const server = createServer((request, response) => {
    const requested = decodeURIComponent((request.url ?? '/').split('?')[0]);
    const filePath = path.join(ROOT, requested);

    if (!filePath.startsWith(ROOT) || !statSync(filePath, { throwIfNoEntry: false })?.isFile()) {
      response.statusCode = 404;
      response.end();
      return;
    }

    response.setHeader('content-type', TYPES[path.extname(filePath).toLowerCase()] ?? 'application/octet-stream');
    createReadStream(filePath).pipe(response);
  });

  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => resolve({ server, port: server.address().port }));
  });
}

/** Falls back to the system Chrome when the pinned build is not downloaded. */
async function launch() {
  try {
    return await chromium.launch();
  } catch {
    return await chromium.launch({ channel: 'chrome' });
  }
}

function takesIn(dir) {
  const folder = path.join(ROOT, CANDIDATES, dir);

  if (!statSync(folder, { throwIfNoEntry: false })?.isDirectory()) {
    return [];
  }

  return readdirSync(folder).filter((name) => PLAYABLE.test(name)).sort();
}

const { server, port } = await serve();
const browser = await launch();
const page = await browser.newPage();
const groups = [];

try {
  for (const group of GROUPS) {
    const files = takesIn(group.dir);

    if (files.length === 0) {
      continue;
    }

    process.stdout.write(`${group.dir}: ${files.length}개 분석 중`);

    const src = files.map((file) => `/${CANDIDATES}/${group.dir}/${file}`).join(',');
    await page.goto(`http://127.0.0.1:${port}/tools/audio-check.html?src=${src}`);
    await page.waitForFunction(
      (count) => window.__manifest?.length === count,
      files.length,
      { timeout: 300_000 },
    );

    groups.push({
      cue: group.cue,
      base: `../${CANDIDATES}/${group.dir}/`,
      takes: await page.evaluate(() => window.__manifest),
    });

    process.stdout.write(' — 완료\n');
  }
} finally {
  await browser.close();
  server.close();
}

// One take per line: the file is read by people looking for one filename, and
// a pretty-printed metrics object would bury it under thirty lines.
const body = groups
  .map((group) =>
    [
      '  {',
      `    cue: '${group.cue}',`,
      `    base: '${group.base}',`,
      '    takes: [',
      ...group.takes.map((take) => `      ${JSON.stringify(take)},`),
      '    ],',
      '  },',
    ].join('\n'),
  )
  .join('\n');

writeFileSync(
  path.join(ROOT, 'tools/audio-candidates.js'),
  [
    '// 후보 음원의 측정 결과. tools/audio-check.html이 이 파일을 읽어',
    '// 열자마자 목록을 보여 준다. 같은 파일이면 결과가 늘 같으므로',
    '// 열 때마다 다시 분석하지 않는다.',
    '//',
    '// 후보를 추가하거나 교체한 뒤에는 tools/bake-candidates.mjs를 돌려',
    '// 이 파일을 다시 만든다. 손으로 고치지 않는다.',
    '',
    `window.AUDIO_CANDIDATES = [\n${body}\n];`,
    '',
  ].join('\n'),
);

const total = groups.reduce((count, group) => count + group.takes.length, 0);
console.log(`\ntools/audio-candidates.js 갱신 — ${groups.length}개 큐, ${total}개 테이크`);
