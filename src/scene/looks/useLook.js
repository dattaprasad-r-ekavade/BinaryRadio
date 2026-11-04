import { useEffect, useState } from 'react'
import { LOOKS } from './palettes'

function currentLookId() {
  if (typeof document === 'undefined') return 'night'
  return document.documentElement.getAttribute('data-theme') === 'light' ? 'day' : 'night'
}

/** Follows the app theme (`data-theme` on <html>): light → Cosy Day, dark → Neon Night. */
export function useLook() {
  const [id, setId] = useState(currentLookId)
  useEffect(() => {
    const obs = new MutationObserver(() => setId(currentLookId()))
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    return () => obs.disconnect()
  }, [])
  return LOOKS[id]
}
