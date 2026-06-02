/** Read theme token colors from :root CSS variables (for canvas/SVG). */
export function readThemeColors() {
  const root = getComputedStyle(document.documentElement)
  const pick = (name) => root.getPropertyValue(name).trim()
  return {
    green: pick('--green'),
    dim: pick('--dim'),
    vizIdle: pick('--viz-idle'),
    vizFill: pick('--viz-fill'),
    vizHot: pick('--viz-hot'),
    vizMid: pick('--viz-mid'),
  }
}
