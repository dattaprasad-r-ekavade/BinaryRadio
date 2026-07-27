export {}

declare global {
  const __SW_CACHE_VERSION__: string

  interface Window {
    __audioContextCreates?: number
    webkitAudioContext?: typeof AudioContext
    initStrudel?: (...args: any[]) => Promise<any>
    samples?: (...args: any[]) => Promise<any>
    evaluate?: (code: string) => Promise<any>
    hush?: () => void
    setcps?: (cps: number) => void
    /** Injected into the page by scripts/export-wav.mjs during headless WAV capture. */
    __startCapture?: (...args: any[]) => any
    /** Injected into the page by scripts/export-wav.mjs during headless WAV capture. */
    __stopCapture?: (...args: any[]) => any
  }

  interface Navigator {
    deviceMemory?: number
  }
}
