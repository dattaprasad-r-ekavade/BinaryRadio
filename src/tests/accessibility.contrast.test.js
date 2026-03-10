import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

function hexToRgb(hex) {
  const raw = hex.replace('#', '').trim()
  const full = raw.length === 3 ? raw.split('').map((c) => c + c).join('') : raw
  const int = parseInt(full, 16)
  return {
    r: (int >> 16) & 255,
    g: (int >> 8) & 255,
    b: int & 255,
  }
}

function channelToLinear(channel) {
  const c = channel / 255
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
}

function luminance(hex) {
  const { r, g, b } = hexToRgb(hex)
  return (
    0.2126 * channelToLinear(r) + 0.7152 * channelToLinear(g) + 0.0722 * channelToLinear(b)
  )
}

function contrast(a, b) {
  const l1 = luminance(a)
  const l2 = luminance(b)
  const [hi, lo] = l1 > l2 ? [l1, l2] : [l2, l1]
  return (hi + 0.05) / (lo + 0.05)
}

function extractThemeVarMap(css, selector) {
  const re = new RegExp(`${selector}\\s*\\{([\\s\\S]*?)\\}`, 'm')
  const match = css.match(re)
  if (!match) throw new Error(`Selector not found: ${selector}`)
  const body = match[1]
  const map = {}
  const varRe = /--([a-z0-9-]+):\s*(#[0-9a-fA-F]{3,6})\s*;/g
  let m
  while ((m = varRe.exec(body))) {
    map[m[1]] = m[2]
  }
  return map
}

describe('accessibility color contrast', () => {
  it('meets WCAG AA for primary text in dark and light themes', () => {
    const cssPath = path.resolve(process.cwd(), 'src/styles/variables.css')
    const css = fs.readFileSync(cssPath, 'utf8')

    const dark = extractThemeVarMap(css, ':root')
    const light = extractThemeVarMap(css, ":root\\[data-theme='light'\\]")

    expect(contrast(dark.text, dark.bg)).toBeGreaterThanOrEqual(4.5)
    expect(contrast(light.text, light.bg)).toBeGreaterThanOrEqual(4.5)
  })
})
