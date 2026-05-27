/**
 * Playwright automation: patches AudioNode.prototype.connect before page load
 * to intercept Strudel's audio output, records via MediaRecorder, then
 * converts to WAV with ffmpeg and saves to the project root.
 *
 * Usage:  node scripts/export-wav.mjs
 */

import { chromium } from '@playwright/test'
import { spawn, execSync } from 'node:child_process'
import path from 'node:path'
import fs from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const BASE_URL = 'http://127.0.0.1:4173'
const OUT_WAV = path.join(ROOT, 'gentle-focus.wav')
const TMP_WEBM = path.join(ROOT, 'gentle-focus.tmp.webm')
const RECORD_MS = 22_000

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)) }

async function waitForServer(url, timeoutMs = 60_000) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    try { if ((await fetch(url)).ok) return } catch { /* retry */ }
    await sleep(400)
  }
  throw new Error(`Server not ready at ${url}`)
}

/** Injected before page scripts: taps the first node that connects to AudioDestinationNode */
const CAPTURE_INIT_SCRIPT = `
(function () {
  const origConnect = AudioNode.prototype.connect;
  AudioNode.prototype.connect = function (dest, ...args) {
    const result = origConnect.call(this, dest, ...args);
    if (!window.__captureInstalled && dest instanceof AudioDestinationNode) {
      window.__captureInstalled = true;
      const ctx = this.context;
      try {
        const captureDest = ctx.createMediaStreamDestination();
        origConnect.call(this, captureDest);  // parallel tap — original stays connected
        window.__captureStream = captureDest.stream;
        window.__captureChunks = [];
        window.__captureRecorder = null;
        window.__startCapture = function () {
          const mime = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
            ? 'audio/webm;codecs=opus'
            : MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')
              ? 'audio/ogg;codecs=opus'
              : '';
          const rec = new MediaRecorder(
            window.__captureStream,
            mime ? { mimeType: mime } : undefined
          );
          window.__captureChunks = [];
          rec.ondataavailable = (e) => { if (e.data.size > 0) window.__captureChunks.push(e.data); };
          rec.start(200);
          window.__captureRecorder = rec;
          console.log('[capture] MediaRecorder started, mime=' + rec.mimeType);
        };
        window.__stopCapture = function () {
          return new Promise((resolve) => {
            const rec = window.__captureRecorder;
            if (!rec || rec.state === 'inactive') { resolve(null); return; }
            rec.onstop = function () {
              const blob = new Blob(window.__captureChunks, { type: rec.mimeType || 'audio/webm' });
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result);   // base64 data URL
              reader.readAsDataURL(blob);
            };
            rec.stop();
          });
        };
        console.log('[capture] Tap installed on AudioDestinationNode source');
      } catch (e) {
        console.error('[capture] Failed to install tap:', e.message);
        window.__captureInstalled = false;
      }
    }
    return result;
  };
})();
`

async function main() {
  // ── 1. Start preview server ───────────────────────────────────────────────
  console.log('Starting preview server...')
  const server = spawn(
    'npm', ['run', 'preview', '--', '--host', '127.0.0.1', '--port', '4173'],
    { cwd: ROOT, shell: true, stdio: 'ignore' },
  )
  try {
    await waitForServer(BASE_URL)
    console.log('Server ready.')

    // ── 2. Launch browser with audio tap injected before page scripts ─────────
    const browser = await chromium.launch({
      headless: false,
      args: ['--autoplay-policy=no-user-gesture-required', '--no-sandbox'],
    })
    const context = await browser.newContext({ acceptDownloads: true })
    await context.addInitScript(CAPTURE_INIT_SCRIPT)
    const page = await context.newPage()

    page.on('console', (msg) => {
      if (['error', 'warn'].includes(msg.type()) || msg.text().startsWith('[capture]') || msg.text().startsWith('[SynthReel]'))
        console.log(`  [browser] ${msg.text()}`)
    })

    // ── 3. Load app + select track ────────────────────────────────────────────
    console.log('Navigating...')
    await page.goto(BASE_URL, { waitUntil: 'networkidle' })
    await page.locator('[aria-label="Gentle Focus tape"]').click()
    await sleep(500)

    // ── 4. PLAY — user gesture resumes AudioContext; Strudel wires to destination
    console.log('Clicking PLAY...')
    await page.locator('button[title="PLAY"]').click()

    // Wait for .deck-state--playing (Strudel evaluate completed)
    console.log('Waiting for playback to start...')
    await page.locator('.deck-state--playing').waitFor({ timeout: 30_000 })
    console.log('Playback confirmed. Letting audio settle (5s)...')
    await sleep(5_000)

    // Confirm the capture tap was installed
    const tapReady = await page.evaluate(() => typeof window.__startCapture === 'function')
    if (!tapReady) throw new Error('Audio tap not installed — AudioDestinationNode connect never intercepted.')

    // ── 5. Start MediaRecorder capture ────────────────────────────────────────
    console.log('Starting capture...')
    await page.evaluate(() => window.__startCapture())
    await sleep(500)

    // ── 6. Record ─────────────────────────────────────────────────────────────
    console.log(`Recording ${RECORD_MS / 1000}s...`)
    await sleep(RECORD_MS)

    // ── 7. Stop and retrieve base64 audio data ────────────────────────────────
    console.log('Stopping capture...')
    const dataUrl = await page.evaluate(() => window.__stopCapture())
    if (!dataUrl) throw new Error('No audio data captured.')

    // ── 8. Write WebM temp file ───────────────────────────────────────────────
    const base64 = dataUrl.split(',')[1]
    await fs.writeFile(TMP_WEBM, Buffer.from(base64, 'base64'))
    console.log(`Temp audio written (${(Buffer.from(base64, 'base64').length / 1024).toFixed(0)} KB)`)

    await browser.close()

    // ── 9. Convert to WAV with ffmpeg ─────────────────────────────────────────
    console.log('Converting to WAV...')
    execSync(
      `ffmpeg -y -i "${TMP_WEBM}" -ar 44100 -ac 2 "${OUT_WAV}"`,
      { stdio: 'inherit' },
    )
    await fs.unlink(TMP_WEBM).catch(() => {})

    const stat = await fs.stat(OUT_WAV)
    console.log(`\n✓  gentle-focus.wav  (${(stat.size / 1024 / 1024).toFixed(2)} MB)  →  ${OUT_WAV}`)
  } finally {
    server.kill()
  }
}

main().catch((err) => {
  console.error('\nExport failed:', err.message)
  process.exit(1)
})

