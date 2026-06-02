/**
 * Resolve app-relative public asset paths for the current Vite base URL
 * (e.g. `/BinaryRadio/` on GitHub Pages).
 */
export function resolvePublicUrl(path) {
  if (!path || /^https?:\/\//i.test(path)) return path
  const base = import.meta.env.BASE_URL || '/'
  const normalizedBase = base.endsWith('/') ? base : `${base}/`
  const normalizedPath = path.startsWith('/') ? path.slice(1) : path
  return `${normalizedBase}${normalizedPath}`
}
