import { resolvePublicUrl } from '../utils/publicUrl'

function clampVolume(value) {
  return Math.max(0, Math.min(1, Number.isFinite(value) ? value : 1));
}

export function getAnnouncementPath(currentTrack, nextTrack) {
  return resolvePublicUrl(`/rj/${currentTrack.id}-to-${nextTrack.id}.mp3`);
}

async function hasAnnouncementFile(path) {
  try {
    const check = await fetch(path, { method: 'HEAD' });
    if (!check.ok) return false;
    /* A host with an SPA fallback answers 200 with index.html for missing
       files; only accept something that is actually audio. */
    const type = check.headers?.get?.('content-type') || '';
    return !type || type.startsWith('audio/') || type.includes('octet-stream');
  } catch {
    return false;
  }
}

const SCRIPTS = [
  (cur, next) =>
    `That was ${cur.title}. Stay with us on SynthReel radio. Coming up next, ${next.title}.`,
  (cur, next) =>
    `You're tuned in to SynthReel. We just heard ${cur.title}. Next on the deck: ${next.title}${
      next.description ? `, ${next.description.toLowerCase()}` : ''
    }.`,
  (cur, next) => `${cur.title}, fading out. Flipping the tape now. Here's ${next.title}.`,
];

/** Pick a script deterministically per transition so a pair always sounds the same. */
export function buildAnnouncementText(currentTrack, nextTrack) {
  const key = `${currentTrack?.id || ''}>${nextTrack?.id || ''}`;
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  const cur = { title: currentTrack?.title || 'that tape', description: currentTrack?.description };
  const next = { title: nextTrack?.title || 'something new', description: nextTrack?.description };
  return SCRIPTS[hash % SCRIPTS.length](cur, next);
}

function pickVoice(synth) {
  const voices = synth.getVoices?.() || [];
  return (
    voices.find((v) => /^en(-|_)/i.test(v.lang) && /natural|neural|google/i.test(v.name)) ||
    voices.find((v) => /^en(-|_)/i.test(v.lang)) ||
    null
  );
}

/** Speak the announcement with the browser's built-in TTS. Resolves false when unsupported. */
function speakAnnouncement(text, { volume, onAudioChange }) {
  const synth = typeof window !== 'undefined' ? window.speechSynthesis : undefined;
  const Utterance = typeof window !== 'undefined' ? window.SpeechSynthesisUtterance : undefined;
  if (!synth || typeof Utterance !== 'function') return Promise.resolve(false);

  return new Promise((resolve) => {
    let settled = false;
    let watchdog = null;
    const done = (spoken) => {
      if (settled) return;
      settled = true;
      clearTimeout(watchdog);
      onAudioChange?.(null);
      resolve(spoken);
    };

    const utterance = new Utterance(text);
    utterance.volume = clampVolume(volume);
    utterance.rate = 1;
    utterance.pitch = 0.95;
    const voice = pickVoice(synth);
    if (voice) utterance.voice = voice;
    utterance.onend = () => done(true);
    utterance.onerror = () => done(false);

    // Same shape as an <audio> element so the radio can cut it off on stop/skip.
    onAudioChange?.({
      pause: () => {
        synth.cancel();
        done(false);
      },
    });

    // Some engines never fire onend (no voices installed, tab in background).
    watchdog = setTimeout(() => {
      synth.cancel();
      done(false);
    }, 20000);

    try {
      synth.cancel();
      synth.speak(utterance);
    } catch {
      done(false);
    }
  });
}

/**
 * Play the pre-generated RJ clip for this transition, or speak a generated
 * line when there is none (every v2 / newly added tape lacks an MP3).
 * Resolves true if something was announced.
 */
export async function playAnnouncementIfAvailable(currentTrack, nextTrack, options = {}) {
  const { volume = 1, onAudioChange } = options;
  if (clampVolume(volume) === 0) return false;
  const path = getAnnouncementPath(currentTrack, nextTrack);
  const exists = await hasAnnouncementFile(path);
  if (!exists) {
    return speakAnnouncement(buildAnnouncementText(currentTrack, nextTrack), {
      volume,
      onAudioChange,
    });
  }

  return new Promise((resolve) => {
    const audio = new Audio(path);
    audio.volume = clampVolume(volume);
    onAudioChange?.(audio);

    const done = () => {
      onAudioChange?.(null);
      resolve(true);
    };

    audio.onended = done;
    audio.onerror = done;
    audio.play().catch(done);
  });
}
