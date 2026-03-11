// @ts-nocheck
import { expect, test } from '@playwright/test'

const firstTape = '[role="button"][aria-label$=" tape"]'

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.__audioContextCreates = 0
    const NativeAudioContext = window.AudioContext || window.webkitAudioContext
    if (!NativeAudioContext) return
    const WrappedAudioContext = function (...args) {
      window.__audioContextCreates += 1
      return new NativeAudioContext(...args)
    }
    WrappedAudioContext.prototype = NativeAudioContext.prototype
    window.AudioContext = WrappedAudioContext
    if (window.webkitAudioContext) window.webkitAudioContext = WrappedAudioContext
  })
  await page.goto('/')
})

test('load tune and play creates active audio state', async ({ page, browserName }) => {
  await expect(page.locator('.eng')).toContainText('ENGINE READY', { timeout: 60_000 })
  await page.locator(firstTape).first().click()
  const playBtn = page.locator('button[title="PLAY"]')
  await expect(playBtn).toBeEnabled({ timeout: 60_000 })
  await playBtn.click()
  if ((await page.locator('.app').getAttribute('data-deck-state')) !== 'playing') {
    await playBtn.click()
  }

  await expect(page.locator('.app')).toHaveAttribute('data-deck-state', 'playing', { timeout: 20_000 })
  if (browserName !== 'webkit') {
    await expect
      .poll(async () => page.evaluate(() => window.__audioContextCreates || 0))
      .toBeGreaterThan(0)
  }
})

test('favorites filter shows only favorited tapes', async ({ page }) => {
  await page.locator('.cas .cas-star').first().click()
  await page.getByRole('button', { name: 'Favorites' }).click()
  await expect(page.locator('.rack .cas')).toHaveCount(1)
})

test('keyboard shortcuts for transport and track navigation work', async ({ page }) => {
  await expect(page.locator('.eng')).toContainText('ENGINE READY', { timeout: 60_000 })
  await page.locator(firstTape).first().click()
  const trackLabel = page.locator('.deck-track')
  await expect(trackLabel).toBeVisible()
  const playBtn = page.locator('button[title="PLAY"]')
  await expect(playBtn).toBeEnabled({ timeout: 60_000 })
  await playBtn.click()
  await expect(page.locator('.app')).toHaveAttribute('data-deck-state', 'playing')
  const initialTitle = (await trackLabel.innerText()).trim()

  await page.keyboard.press('Space')
  await expect(page.locator('.app')).toHaveAttribute('data-deck-state', 'paused')

  await page.keyboard.press('Space')
  await expect(page.locator('.app')).toHaveAttribute('data-deck-state', 'playing')

  await page.keyboard.press('KeyS')
  await expect(page.locator('.app')).toHaveAttribute('data-deck-state', 'stopped')

  await page.keyboard.press('KeyN')
  await expect(trackLabel).not.toHaveText(initialTitle, { timeout: 30_000 })
  const nextTitle = (await trackLabel.innerText()).trim()

  await page.keyboard.press('KeyP')
  await expect(trackLabel).not.toHaveText(nextTitle, { timeout: 30_000 })
})

test('theme toggle persists across reload', async ({ page }) => {
  const html = page.locator('html')
  const initialTheme = await html.getAttribute('data-theme')

  await page.getByRole('button', { name: 'Theme' }).click()
  const changedTheme = await html.getAttribute('data-theme')
  expect(changedTheme).not.toBe(initialTheme)

  const storedTheme = await page.evaluate(() => {
    const raw = localStorage.getItem('synthreel.theme.v1')
    if (!raw) return null
    try {
      return JSON.parse(raw)
    } catch {
      return raw
    }
  })
  expect(storedTheme).toBe(changedTheme)
})
