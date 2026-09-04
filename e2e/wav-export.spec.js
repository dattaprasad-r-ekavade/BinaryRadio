// @ts-nocheck
import { expect, test } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'

const firstTape = '.rack .cas[role="button"]'

test.describe('WAV export (GitHub Pages base)', () => {
  test('records and downloads a WAV after play', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('.eng')).toContainText('ENGINE READY', { timeout: 60_000 })

    await page.locator(firstTape).first().click()
    const playBtn = page.getByRole('button', { name: 'PLAY', exact: true })
    await expect(playBtn).toBeEnabled({ timeout: 60_000 })
    await playBtn.click()
    await expect(page.locator('.app')).toHaveAttribute('data-deck-state', 'playing', { timeout: 30_000 })
    await expect(page.locator('.app')).toHaveAttribute('data-audio-ready', 'true', { timeout: 15_000 })

    await expect(page.locator('.export-hint')).toBeVisible()
    await page.getByRole('button', { name: 'START REC', exact: true }).click()
    await expect(page.getByRole('button', { name: 'SAVE WAV', exact: true })).toBeVisible({ timeout: 10_000 })
    await expect(page.locator('.export-hint--active')).toBeVisible()

    await page.waitForTimeout(2500)

    const downloadPromise = page.waitForEvent('download', { timeout: 20_000 })
    await page.getByRole('button', { name: 'SAVE WAV', exact: true }).click()
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
    await expect(page.getByRole('button', { name: 'START REC', exact: true })).toBeEnabled({ timeout: 60_000 })
    await page.getByRole('button', { name: 'START REC', exact: true }).click()
    await expect(page.locator('.app-msg.app-msg--err')).toContainText(/PLAY first/i)
  })
})
