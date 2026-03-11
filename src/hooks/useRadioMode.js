// @ts-nocheck — complex timer/audio refs; typed migration tracked in issue #TS-001
import { useState, useRef, useCallback, useEffect } from 'react';
import { playAnnouncementIfAvailable } from '../rj/playAnnouncement';

// 5–6 minute range per track
const MIN_SECS = 5 * 60;
const MAX_SECS = 6 * 60;

export function useRadioMode({ tracks, onLoadAndPlay, onStop, rjVolume = 1 }) {
  const [enabled, setEnabled] = useState(false);
  const [phase, setPhase] = useState('idle'); // idle | playing | announcing
  const [timeLeft, setTimeLeft] = useState(null); // seconds

  // All mutable scheduling state in a single ref — callbacks always read fresh values
  const s = useRef({
    enabled: false,
    index: 0,
    timer: null,
    tick: null,
    audio: null,
  });

  const clearTimers = () => {
    clearTimeout(s.current.timer);
    clearInterval(s.current.tick);
  };

  const stopAudio = () => {
    if (s.current.audio) {
      s.current.audio.pause();
      s.current.audio = null;
    }
  };

  // Forward-declare with refs so they can call each other without circular hook deps
  const runTransitionRef = useRef(null);
  const scheduleRef = useRef(null);

  // Reassigned every render — always captures latest tracks/onLoadAndPlay/onStop
  runTransitionRef.current = async (fromIndex) => {
    if (!s.current.enabled) return;
    const current = tracks[fromIndex];
    const nextIndex = (fromIndex + 1) % tracks.length;
    const next = tracks[nextIndex];

    setPhase('announcing');

    await playAnnouncementIfAvailable(current, next, {
      volume: rjVolume,
      onAudioChange: (audio) => {
        s.current.audio = audio;
      },
    });

    if (!s.current.enabled) return;
    s.current.index = nextIndex;
    setPhase('playing');
    onLoadAndPlay(tracks[nextIndex]);
    scheduleRef.current(nextIndex);
  };

  scheduleRef.current = (index) => {
    clearTimers();
    const durationSec = MIN_SECS + Math.floor(Math.random() * (MAX_SECS - MIN_SECS + 1));
    let rem = durationSec;
    setTimeLeft(rem);
    s.current.tick = setInterval(() => {
      rem--;
      setTimeLeft(rem);
      if (rem <= 0) clearInterval(s.current.tick);
    }, 1000);
    s.current.timer = setTimeout(() => {
      clearInterval(s.current.tick);
      setTimeLeft(0);
      if (!s.current.enabled) return;
      onStop();
      runTransitionRef.current(index);
    }, durationSec * 1000);
  };

  const start = useCallback(
    (startIndex = 0) => {
      clearTimers();
      stopAudio();
      onStop();
      s.current.enabled = true;
      s.current.index = startIndex;
      setPhase('playing');
      onLoadAndPlay(tracks[startIndex]);
      scheduleRef.current(startIndex);
    },
    [tracks, onLoadAndPlay, onStop],
  );

  const stop = useCallback(() => {
    s.current.enabled = false;
    clearTimers();
    stopAudio();
    setPhase('idle');
    setTimeLeft(null);
    onStop();
  }, [onStop]);

  const toggle = useCallback(
    (startIndex = 0) => {
      const next = !s.current.enabled;
      s.current.enabled = next;
      setEnabled(next);
      if (next) start(startIndex);
      else stop();
    },
    [start, stop],
  );

  useEffect(
    () => () => {
      clearTimers();
      stopAudio();
    },
    [],
  );

  return { enabled, phase, timeLeft, start, stop, toggle };
}
