import { useCallback, useEffect, useState } from 'react'

export function usePwaInstall({ setMsg }) {
  const [installPromptEvent, setInstallPromptEvent] = useState(/** @type {any} */(null))

  useEffect(() => {
    const onBeforeInstallPrompt = (event) => {
      event.preventDefault()
      setInstallPromptEvent(event)
    }
    const onInstalled = () => {
      setInstallPromptEvent(null)
      setMsg({ type: 'wait', text: 'SynthReel installed successfully.' })
    }
    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [setMsg])

  const handleInstall = useCallback(async () => {
    if (!installPromptEvent) return
    try {
      await installPromptEvent.prompt()
      await installPromptEvent.userChoice
    } catch {
      // noop
    } finally {
      setInstallPromptEvent(null)
    }
  }, [installPromptEvent])

  return { installPromptEvent, handleInstall }
}
