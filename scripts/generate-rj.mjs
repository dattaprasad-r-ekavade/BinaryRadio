#!/usr/bin/env node
/**
 * SynthReel Radio — RJ voice generator
 * Pre-generates MP3 announcements for every track transition using Kokoro TTS.
 *
 * Prerequisites:
 *   Kokoro TTS running locally — https://kokorottsai.com/
 *   (kokoro-fastapi exposes an OpenAI-compatible API at http://localhost:8880)
 *
 * Usage:
 *   node scripts/generate-rj.mjs
 *   node scripts/generate-rj.mjs --force   # overwrite existing files
 *   node scripts/generate-rj.mjs --dry-run # print intended operations only
 *
 * Output: public/rj/*.mp3
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

const KOKORO_URL = process.env.KOKORO_URL  || 'http://localhost:8880'
const VOICE      = process.env.KOKORO_VOICE || 'af_nicole'  // smooth, calm American female
const OUT_DIR    = join(__dirname, '../public/rj')
const FORCE      = process.argv.includes('--force')
const DRY_RUN    = process.argv.includes('--dry-run')

const manifest = JSON.parse(
  readFileSync(join(__dirname, '../public/tunes/manifest.json'), 'utf-8')
)

// Four announcement variants; chosen by track-index mod 4 for variety across transitions
function buildScript(current, next, idx) {
  const variants = [
    `That was "${current.title}" — ${current.description}. You're tuned in to SynthReel Radio, your home for ambient and electronic music. Coming up next: "${next.title}". ${next.description}. Stay with us.`,
    `And that was "${current.title}". This is SynthReel Radio. Up next is "${next.title}" — ${next.description}. Keep it here.`,
    `"${current.title}" — what a ride. Thank you for listening to SynthReel Radio. Our next piece is "${next.title}". ${next.description}. Let's keep the vibe going.`,
    `Beautiful sounds from "${current.title}". You're listening to SynthReel Radio. Prepare yourself for "${next.title}". ${next.description}. Coming right up.`,
  ]
  return variants[idx % variants.length]
}

async function generateAudio(text, outputPath) {
  if (!FORCE && existsSync(outputPath)) {
    console.log(`  skip (exists) ${outputPath}`)
    return
  }
  if (DRY_RUN) {
    console.log(`  dry-run ${outputPath}`)
    return
  }
  const res = await fetch(`${KOKORO_URL}/v1/audio/speech`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'kokoro',
      input: text,
      voice: VOICE,
      response_format: 'mp3',
    }),
  })
  if (!res.ok) {
    const detail = await res.text().catch(() => String(res.status))
    throw new Error(`Kokoro API ${res.status}: ${detail}`)
  }
  const buf = await res.arrayBuffer()
  writeFileSync(outputPath, Buffer.from(buf))
  console.log(`  ✓  saved ${outputPath}`)
}

async function main() {
  console.log(`\n🎙  SynthReel RJ Generator`)
  console.log(`   Kokoro URL : ${KOKORO_URL}`)
  console.log(`   Voice      : ${VOICE}`)
  console.log(`   Output     : ${OUT_DIR}\n`)
  if (DRY_RUN) {
    console.log('   Mode       : dry-run (no requests, no files written)\n')
  }

  mkdirSync(OUT_DIR, { recursive: true })

  // Station intro (played when radio mode first starts)
  console.log('Generating station intro…')
  await generateAudio(
    'Welcome to SynthReel Radio — ambient, synthwave, and electronic sounds, all day, all night. Sit back, relax, and let the music take you somewhere.',
    join(OUT_DIR, 'intro.mp3')
  )

  // One announcement per track → next-track transition
  console.log('\nGenerating track transition announcements…')
  for (let i = 0; i < manifest.length; i++) {
    const current = manifest[i]
    const next    = manifest[(i + 1) % manifest.length]
    const text    = buildScript(current, next, i)
    const file    = `${current.id}-to-${next.id}.mp3`
    console.log(`  🔄 ${current.id} → ${next.id}`)
    await generateAudio(text, join(OUT_DIR, file))
  }

  console.log('\n✅  All RJ audio generated successfully!\n')
}

main().catch(e => {
  console.error('\n❌  Error:', e.message)
  console.error('\nMake sure Kokoro TTS is running — https://kokorottsai.com/')
  console.error('Then retry:  node scripts/generate-rj.mjs\n')
  process.exit(1)
})
