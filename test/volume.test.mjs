// Regression tests for the injected setVolume() routine.
//
// Run with: npm test   (requires `npx playwright install firefox`)
//
// These run in real Firefox because the bug they guard against is
// Firefox-specific: createMediaElementSource() on a cross-origin media
// element does not throw, it silently outputs silence.

import { firefox } from 'playwright';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, '..');

// A 1 second 440Hz mono WAV, generated so the repo carries no binary fixture.
function tone() {
  const rate = 44100;
  const frames = rate;
  const data = Buffer.alloc(frames * 2);
  for (let i = 0; i < frames; i++) {
    data.writeInt16LE(Math.round(20000 * Math.sin((2 * Math.PI * 440 * i) / rate)), i * 2);
  }
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + data.length, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(1, 22);
  header.writeUInt32LE(rate, 24);
  header.writeUInt32LE(rate * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write('data', 36);
  header.writeUInt32LE(data.length, 40);
  return Buffer.concat([header, data]);
}

const WAV = tone();

function serve(port, html) {
  const server = createServer((req, res) => {
    if (req.url.startsWith('/tone.wav')) {
      res.writeHead(200, { 'Content-Type': 'audio/wav' });
      res.end(WAV);
    } else if (html) {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(html);
    } else {
      res.writeHead(404);
      res.end();
    }
  });
  return new Promise(resolve => server.listen(port, '127.0.0.1', () => resolve(server)));
}

// Pull setVolume() out of popup.js so the tests exercise the shipped source.
async function setVolumeSource() {
  const src = await readFile(path.join(root, 'popup.js'), 'utf8');
  const start = src.indexOf('function setVolume(');
  assert.notEqual(start, -1, 'setVolume not found in popup.js');
  const end = src.indexOf('\nfunction ', start + 1);
  return src.slice(start, end === -1 ? undefined : end);
}

const PAGE = `<!doctype html><html><body>
  <audio id="same" src="/tone.wav" loop></audio>
  <audio id="cross" src="http://127.0.0.1:8902/tone.wav" loop></audio>
</body></html>`;

// Boost the element, then report the peak amplitude actually reaching the
// speakers plus whether the element got routed through Web Audio at all.
async function boost(page, id, multiplier, source) {
  return page.evaluate(
    async ([id, multiplier, source]) => {
      const el = document.getElementById(id);
      // Only touch the element under test.
      document.querySelectorAll('audio').forEach(a => { if (a !== el) a.remove(); });

      let routed = false;
      const origCreate = AudioContext.prototype.createMediaElementSource;
      AudioContext.prototype.createMediaElementSource = function (media) {
        routed = true;
        return origCreate.call(this, media);
      };

      await el.play();
      // eslint-disable-next-line no-eval
      const setVolume = eval(`(${source})`);
      setVolume(multiplier);
      await new Promise(r => setTimeout(r, 800));

      let peak = 0;
      if (el.__mvbCtx) {
        // Tap the graph output to measure what is really being played.
        const an = el.__mvbCtx.ctx.createAnalyser();
        an.fftSize = 2048;
        el.__mvbCtx.gain.connect(an);
        const buf = new Float32Array(an.fftSize);
        for (let i = 0; i < 8; i++) {
          an.getFloatTimeDomainData(buf);
          for (const v of buf) peak = Math.max(peak, Math.abs(v));
          await new Promise(r => setTimeout(r, 100));
        }
      }

      AudioContext.prototype.createMediaElementSource = origCreate;
      return { routed, peak, volume: el.volume, playing: !el.paused };
    },
    [id, multiplier, source]
  );
}

const results = [];
function check(name, fn) {
  results.push([name, fn]);
}

check('cross-origin media is never routed through Web Audio', async page => {
  const source = await setVolumeSource();
  const r = await boost(page, 'cross', 2, source);
  assert.equal(r.playing, true, 'element should still be playing');
  assert.equal(
    r.routed,
    false,
    'Firefox silences cross-origin media routed through createMediaElementSource, ' +
      'so the element must keep playing natively instead'
  );
  assert.equal(r.volume, 1, 'native volume should be left at full for a boost');
});

check('same-origin media is boosted above 100%', async page => {
  const source = await setVolumeSource();
  const r = await boost(page, 'same', 2, source);
  assert.equal(r.routed, true, 'same-origin media should use the gain node');
  assert.ok(r.peak > 1, `expected boosted output above 1.0, got ${r.peak}`);
});

check('attenuation below 100% uses native volume', async page => {
  const source = await setVolumeSource();
  const r = await boost(page, 'cross', 0.25, source);
  assert.equal(r.routed, false, 'attenuation needs no Web Audio graph');
  assert.equal(r.volume, 0.25);
});

const servers = [await serve(8901, PAGE), await serve(8902, null)];
const browser = await firefox.launch();
let failed = 0;

for (const [name, fn] of results) {
  const page = await (await browser.newContext()).newPage();
  try {
    await page.goto('http://127.0.0.1:8901/');
    await fn(page);
    console.log(`ok - ${name}`);
  } catch (e) {
    failed++;
    console.error(`FAIL - ${name}\n  ${e.message}`);
  }
  await page.context().close();
}

await browser.close();
servers.forEach(s => s.close());
process.exit(failed ? 1 : 0);
