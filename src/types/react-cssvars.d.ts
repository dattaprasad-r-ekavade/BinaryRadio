import 'react'

declare module 'react' {
  interface CSSProperties {
    /** CassetteCard: track label colour. */
    '--cc'?: string
    /** CassetteCard: track accent colour. */
    '--ca'?: string
    /** Generic per-item index used by staggered animations. */
    '--i'?: number | string
    /** EQ fader: lower/upper bounds of the centre-anchored fill, as percentages. */
    '--lo'?: string
    '--hi'?: string
    /** VU meter: peak-hold position, 0–1. */
    '--peak'?: number | string
  }
}
