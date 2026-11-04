import { useEffect, useMemo } from 'react'
import * as THREE from 'three'

// Canvas size of the case front (aspect 256:160, the case is 0.22 x 0.14 m).
const W = 256
const H = 160
const FONT = 'monospace'

/** Shrinks `text` with an ellipsis until it fits in `maxWidth` pixels. */
function truncate(ctx, text, maxWidth) {
  if (ctx.measureText(text).width <= maxWidth) return text
  let s = text
  while (s.length > 1 && ctx.measureText(`${s}…`).width > maxWidth) s = s.slice(0, -1)
  return `${s.trimEnd()}…`
}

/**
 * Paints the front of a cassette case onto a fresh canvas and wraps it in a
 * CanvasTexture. The caller owns the texture and must dispose it.
 */
export function makeCassetteTexture(track, look) {
  const night = !!look?.night
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = /** @type {CanvasRenderingContext2D} */ (canvas.getContext('2d'))

  // Case colour.
  ctx.fillStyle = track.color || '#333333'
  ctx.fillRect(0, 0, W, H)

  // Accent band across the top, with the title on it.
  ctx.fillStyle = track.accent || '#888888'
  ctx.fillRect(0, 0, W, 44)
  ctx.font = `bold 22px ${FONT}`
  ctx.textAlign = 'left'
  ctx.textBaseline = 'middle'
  ctx.fillStyle = '#ffffff'
  if (night) {
    ctx.shadowColor = '#ffffff'
    ctx.shadowBlur = 6
  }
  ctx.fillText(truncate(ctx, String(track.title ?? ''), W - 24), 12, 23)
  ctx.shadowBlur = 0

  // Pale cassette window with two dark reels.
  ctx.fillStyle = 'rgba(233, 228, 212, 0.92)'
  ctx.fillRect(40, 60, 176, 60)
  ctx.strokeStyle = '#2a2a2a'
  ctx.lineWidth = 2
  ctx.strokeRect(40, 60, 176, 60)
  for (const cx of [88, 168]) {
    ctx.fillStyle = '#1d1d1d'
    ctx.beginPath()
    ctx.arc(cx, 90, 20, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#bdb6a4'
    ctx.beginPath()
    ctx.arc(cx, 90, 7, 0, Math.PI * 2)
    ctx.fill()
  }

  // Tempo and key along the bottom.
  const bpm = track.bpm ?? '—'
  const key = track.key ?? '—'
  ctx.font = `bold ${night ? 18 : 16}px ${FONT}`
  ctx.textAlign = 'center'
  ctx.fillStyle = night ? '#ffffff' : '#f7f1e3'
  if (night) {
    ctx.shadowColor = track.accent || '#ffffff'
    ctx.shadowBlur = 4
  }
  ctx.fillText(`${bpm} BPM · ${key}`, W / 2, 146)
  ctx.shadowBlur = 0

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 8
  return texture
}

/**
 * Memoised cassette front texture for `track` in `look`. Disposed when the
 * track or look changes, and on unmount.
 */
export function useCassetteTexture(track, look) {
  const texture = useMemo(() => makeCassetteTexture(track, look), [track, look])
  useEffect(() => () => texture.dispose(), [texture])
  return texture
}
