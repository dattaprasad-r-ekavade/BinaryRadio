import { useState, useRef, useCallback, useEffect } from 'react'

function waitForGlobal(name, ms = 15000) {
  return new Promise((resolve, reject) => {
    const t0 = Date.now()
    const iv = setInterval(() => {
      if (typeof window[name] === 'function') { clearInterval(iv); resolve() }
      else if (Date.now() - t0 > ms) { clearInterval(iv); reject(new Error(name + ' timed out')) }
    }, 80)
  })
}

export function useStrudel() {
  const [ready, setReady] = useState(false)
  const [initializing, setInitializing] = useState(true)
  const [error, setError] = useState(null)
  const replRef = useRef(null)

  useEffect(() => {
    let cancelled = false
    async function init() {
      try {
        await waitForGlobal('initStrudel')
        const repl = await window.initStrudel()
        if (cancelled) return
        replRef.current = repl
        setReady(true)
      } catch (e) {
        if (!cancelled) setError(e.message)
      } finally {
        if (!cancelled) setInitializing(false)
      }
    }
    init()
    return () => { cancelled = true }
  }, [])

  // Use the repl object directly — window globals can be stale or missing
  const play = useCallback(async (code) => {
    const r = replRef.current
    if (!r) throw new Error('Engine not ready')
    if (typeof r.evaluate === 'function') await r.evaluate(code)
    else if (typeof window.evaluate === 'function') await window.evaluate(code)
    else throw new Error('Strudel evaluate not available')
  }, [])

  const stop = useCallback(() => {
    const r = replRef.current
    if (typeof r?.stop === 'function') r.stop()
    else if (typeof r?.hush === 'function') r.hush()
    else if (typeof window.hush === 'function') window.hush()
  }, [])

  const setCps = useCallback((cps) => {
    try {
      const r = replRef.current
      if (r?.scheduler?.setCps) r.scheduler.setCps(cps)
      else if (r?.setCps) r.setCps(cps)
    } catch { /* noop */ }
    try { if (window.setcps) window.setcps(cps) } catch { /* noop */ }
  }, [])

  return { ready, initializing, error, play, stop, setCps }
}
