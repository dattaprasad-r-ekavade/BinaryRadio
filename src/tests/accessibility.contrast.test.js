import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

function hexToRgb(hex) {
  const raw = hex.replace('#', '').trim()
  const full = raw.length === 3 ? raw.split('').map((c) => c + c).join('') : raw
  const int = parseInt(full, 16)
  return { r: (int >> 16) & 255, g: (int >> 8) & 255, b: int & 255 }
}

function channelToLinear(channel) {
  const c = channel / 255
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
}

function luminance(hex) {
  const { r, g, b } = hexToRgb(hex)
  return 0.2126 * channelToLinear(r) + 0.7152 * channelToLinear(g) + 0.0722 * channelToLinear(b)
}

function contrast(a, b) {
  const l1 = luminance(a)
  const l2 = luminance(b)
  const [hi, lo] = l1 > l2 ? [l1, l2] : [l2, l1]
  return (hi + 0.05) / (lo + 0.05)
}

/**
 * Collect hex-valued custom properties from *every* block matching `selector`.
 *
 * The palettes are split across multiple `:root` blocks (scales vs colours),
 * so matching only the first block silently returned an empty map — the
 * previous version of this test passed vacuously with `undefined` colours.
 */
function extractThemeVarMap(css, selector) {
  const re = new RegExp(`${selector}\\s*\\{([\\s\\S]*?)\\n\\}`, 'gm')
  const map = {}
  let block
  let found = false
  while ((block = re.exec(css))) {
    found = true
    const varRe = /--([a-z0-9-]+):\s*(#[0-9a-fA-F]{3,8})\s*;/g
    let m
    while ((m = varRe.exec(block[1]))) map[m[1]] = m[2]
  }
  if (!found) throw new Error(`Selector not found: ${selector}`)
  return map
}

/** Text tokens that must be readable on every surface token. */
const TEXT_TOKENS = ['text', 'dim', 'dimmer']
const SURFACE_TOKENS = ['bg', 'bg2', 'bg3', 'bg4', 'panel', 'surface', 'surface-deep']
/** WCAG 2.1 AA for normal-size text. */
const AA_NORMAL = 4.5
/** WCAG 2.1 AA for large text and non-text UI components. */
const AA_LARGE = 3

const css = fs.readFileSync(
  path.resolve(process.cwd(), 'src/styles/variables.css'),
  'utf8',
)
const themes = {
  dark: extractThemeVarMap(css, ':root'),
  light: extractThemeVarMap(css, ":root\\[data-theme='light'\\]"),
}

describe('accessibility color contrast', () => {
  it('actually parses both palettes', () => {
    for (const [name, vars] of Object.entries(themes)) {
      for (const token of [...TEXT_TOKENS, ...SURFACE_TOKENS]) {
        expect(vars[token], `${name} --${token} should be a hex value`).toMatch(/^#[0-9a-f]{3,8}$/i)
      }
    }
  })

  it('meets WCAG AA for every text token on every surface, in both themes', () => {
    const failures = []
    for (const [themeName, vars] of Object.entries(themes)) {
      for (const text of TEXT_TOKENS) {
        for (const surface of SURFACE_TOKENS) {
          const ratio = contrast(vars[text], vars[surface])
          if (ratio < AA_NORMAL) {
            failures.push(
              `${themeName}: --${text} (${vars[text]}) on --${surface} (${vars[surface]}) = ${ratio.toFixed(2)}:1`,
            )
          }
        }
      }
    }
    expect(failures, `contrast failures:\n${failures.join('\n')}`).toEqual([])
  })

  it('keeps accent colours usable as text and as UI indicators', () => {
    for (const [themeName, vars] of Object.entries(themes)) {
      for (const accent of ['green', 'amber', 'red', 'blue']) {
        const ratio = contrast(vars[accent], vars.bg)
        expect(
          ratio,
          `${themeName} --${accent} (${vars[accent]}) on --bg is ${ratio.toFixed(2)}:1`,
        ).toBeGreaterThanOrEqual(AA_LARGE)
      }
    }
  })
})
