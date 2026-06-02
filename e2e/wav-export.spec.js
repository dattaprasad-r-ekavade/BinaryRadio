// @ts-nocheck
import { expect, test } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'

const firstTape = '[role="button"][aria-label$=" tape"]'

test.describe('WAV export (GitHub Pages base)', () => {
  test('records and downloads a WAV after play', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('.eng')).toContainText('ENGINE READY', { timeout: 60_000 })

    await page.locator(firstTape).first().click()
    const playBtn = page.locator('button[title="PLAY"]')
    await expect(playBtn).toBeEnabled({ timeout: 60_000 })
    await playBtn.click()
    await expect(page.locator('.app')).toHaveAttribute('data-deck-state', 'playing', { timeout: 30_000 })
    await expect(page.locator('.app')).toHaveAttribute('data-audio-ready', 'true', { timeout: 15_000 })

    await expect(page.locator('.export-hint')).toBeVisible()
    await page.locator('button[title="START REC"]').click()
    await expect(page.locator('button[title="SAVE WAV"]')).toBeVisible({ timeout: 10_000 })
    await expect(page.locator('.export-hint--active')).toBeVisible()

    await page.waitForTimeout(2500)

    const downloadPromise = page.waitForEvent('download', { timeout: 20_000 })
    await page.locator('button[title="SAVE WAV"]').click()
    const download = await downloadPromise

    expect(download.suggestedFilename()).toMatch(/\.wav$/i)
    const outPath = path.join(test.info().outputDir, download.suggestedFilename())
    await download.saveAs(outPath)
    const size = fs.statSync(outPath).size
    expect(size).toBeGreaterThan(1000)

    await expect(page.locator('.app-msg')).toContainText(/export complete/i, { timeout: 10_000 })
    await expect(page.locator('.app-msg.app-msg--err')).toHaveCount(0)
  })

  test('shows guidance when export starts without play', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('.eng')).toContainText('ENGINE READY', { timeout: 60_000 })
    await page.locator(firstTape).first().click()
    await expect(page.locator('button[title="START REC"]')).toBeEnabled({ timeout: 60_000 })
    await page.locator('button[title="START REC"]').click()
    await expect(page.locator('.app-msg.app-msg--err')).toContainText(/PLAY first/i)
  })
})
