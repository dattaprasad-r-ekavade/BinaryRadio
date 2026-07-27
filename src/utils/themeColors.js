/**
 * Read theme token colours from CSS custom properties so canvas-rendered UI
 * (the visualizer) stays in sync with the active theme.
 *
 * Every key returned here must exist in *both* palettes in variables.css.
 */
export function readThemeColors() {
  const root = getComputedStyle(document.documentElement)
  const pick = (name) => root.getPropertyValue(name).trim()
  return {
    green: pick('--green'),
    dim: pick('--dim'),
    vizIdle: pick('--viz-idle'),
    vizGrid: pick('--viz-grid'),
    vizFill: pick('--viz-fill'),
    vizHot: pick('--viz-hot'),
    vizMid: pick('--viz-mid'),
  }
}
