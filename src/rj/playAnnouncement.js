function clampVolume(value) {
  return Math.max(0, Math.min(1, Number.isFinite(value) ? value : 1))
}

export function getAnnouncementPath(currentTrack, nextTrack) {
  return `/rj/${currentTrack.id}-to-${nextTrack.id}.mp3`
}

async function hasAnnouncementFile(path) {
  try {
    const check = await fetch(path, { method: 'HEAD' })
    return check.ok
  } catch {
    return false
  }
}

export async function playAnnouncementIfAvailable(currentTrack, nextTrack, options = {}) {
  const { volume = 1, onAudioChange } = options
  const path = getAnnouncementPath(currentTrack, nextTrack)
  const exists = await hasAnnouncementFile(path)
  if (!exists) return false

  return new Promise((resolve) => {
    const audio = new Audio(path)
    audio.volume = clampVolume(volume)
    onAudioChange?.(audio)

    const done = () => {
      onAudioChange?.(null)
      resolve(true)
    }

    audio.onended = done
    audio.onerror = done
    audio.play().catch(done)
  })
}
