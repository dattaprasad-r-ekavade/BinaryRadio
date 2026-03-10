import { spawn } from 'node:child_process'
import fs from 'node:fs/promises'
import path from 'node:path'
import { chromium } from 'playwright'
import gifencPkg from 'gifenc'
import { PNG } from 'pngjs'

const { GIFEncoder, applyPalette, quantize } = gifencPkg

const BASE_URL = 'http://127.0.0.1:4174'
const OUT_FILE = path.resolve(process.cwd(), 'docs/demo-30s.gif')
const FRAME_MS = 500
const TOTAL_MS = 30_000
const WIDTH = 960
const HEIGHT = 540

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function waitForServer(url, timeoutMs = 120_000) {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url)
      if (res.ok) return
    } catch {
      // retry
    }
    await sleep(300)
  }
  throw new Error(`Timed out waiting for dev server: ${url}`)
}

function startDevServer() {
  return spawn('npm', ['run', 'dev', '--', '--host', '127.0.0.1', '--port', '4174'], {
    cwd: process.cwd(),
    shell: true,
    stdio: 'ignore',
  })
}

async function captureFrames(page) {
  const frames = []
  const start = Date.now()
  while (Date.now() - start < TOTAL_MS) {
    const png = await page.screenshot({ type: 'png' })
    frames.push(png)
    await sleep(FRAME_MS)
  }
  return frames
}

async function makeGif(framePngBuffers) {
  if (!framePngBuffers.length) throw new Error('No frames captured')
  const gif = GIFEncoder()
  let width = WIDTH
  let height = HEIGHT

  for (const buf of framePngBuffers) {
    const png = PNG.sync.read(buf)
    width = png.width
    height = png.height
    const palette = quantize(png.data, 256)
    const index = applyPalette(png.data, palette)
    gif.writeFrame(index, width, height, { palette, delay: FRAME_MS })
  }

  gif.finish()
  const gifBytes = Buffer.from(gif.bytesView())
  await fs.writeFile(OUT_FILE, gifBytes)
}

async function runDemo(page) {
  await page.goto(BASE_URL, { waitUntil: 'networkidle' })
  const firstTape = page.locator('[role="button"][aria-label$=" tape"]').first()
  await firstTape.click()
  await page.locator('button[title="PLAY"]').click()

  await sleep(6000)
  await page.keyboard.press('KeyT')
  await sleep(3000)
  await page.keyboard.press('KeyN')
  await sleep(5000)
  await page.keyboard.press('KeyH')
  await sleep(3000)
  await page.keyboard.press('KeyH')
  await sleep(5000)
}

async function main() {
  const server = startDevServer()
  try {
    await waitForServer(BASE_URL)
    const browser = await chromium.launch()
    const context = await browser.newContext({ viewport: { width: WIDTH, height: HEIGHT } })
    const page = await context.newPage()

    const runPromise = runDemo(page)
    const frames = await captureFrames(page)
    await runPromise
    await makeGif(frames)

    await browser.close()
    console.log(`Demo GIF created: ${OUT_FILE}`)
  } finally {
    server.kill('SIGTERM')
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
