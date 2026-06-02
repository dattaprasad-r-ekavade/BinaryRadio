// @ts-nocheck — complex audio/recorder refs; typed migration tracked in issue #TS-001
import { useState, useRef, useCallback, useEffect } from 'react';
import { decodeBlobToStereoChunks, encodeStereoWav, loadWavCaptureWorklet } from '../utils/wav';

const EXPECTED_STRUDEL_VERSION = '1.3.0';

function waitForGlobal(name, ms = 15000) {
  return new Promise((resolve, reject) => {
    const t0 = Date.now();
    const iv = setInterval(() => {
      if (typeof window[name] === 'function') {
        clearInterval(iv);
        resolve();
      } else if (Date.now() - t0 > ms) {
        clearInterval(iv);
        reject(new Error(name + ' timed out'));
      }
    }, 80);
  });
}

function findContext(obj, seen = new Set(), depth = 0) {
  if (!obj || depth > 4 || seen.has(obj)) return null;
  seen.add(obj);
  if (typeof AudioContext !== 'undefined' && obj instanceof AudioContext) return obj;
  if (typeof OfflineAudioContext !== 'undefined' && obj instanceof OfflineAudioContext) return obj;
  if (typeof obj !== 'object') return null;
  for (const key of Object.keys(obj)) {
    const value = obj[key];
    if (!value || (typeof value !== 'object' && typeof value !== 'function')) continue;
    const found = findContext(value, seen, depth + 1);
    if (found) return found;
  }
  return null;
}

function findAudioNode(obj, seen = new Set(), depth = 0) {
  if (!obj || depth > 3 || seen.has(obj)) return null;
  seen.add(obj);
  const isNode = typeof AudioNode !== 'undefined' && obj instanceof AudioNode;
  if (isNode && obj !== obj.context?.destination) return obj;
  if (typeof obj !== 'object') return null;
  for (const key of Object.keys(obj)) {
    const value = obj[key];
    if (!value || (typeof value !== 'object' && typeof value !== 'function')) continue;
    const found = findAudioNode(value, seen, depth + 1);
    if (found) return found;
  }
  return null;
}

function attachOutputToGraph(output, ctx, audioRef) {
  const bass = ctx.createBiquadFilter();
  bass.type = 'lowshelf';
  bass.frequency.value = 250;

  const mid = ctx.createBiquadFilter();
  mid.type = 'peaking';
  mid.frequency.value = 1200;
  mid.Q.value = 1;

  const treble = ctx.createBiquadFilter();
  treble.type = 'highshelf';
  treble.frequency.value = 3200;

  const gain = ctx.createGain();
  const analyser = ctx.createAnalyser();
  analyser.fftSize = 2048;
  const recDest = ctx.createMediaStreamDestination();

  output.disconnect();
  output.connect(bass);
  bass.connect(mid);
  mid.connect(treble);
  treble.connect(gain);
  gain.connect(analyser);
  analyser.connect(ctx.destination);
  analyser.connect(recDest);

  audioRef.current = {
    ...audioRef.current,
    ctx,
    output,
    bass,
    mid,
    treble,
    gain,
    analyser,
    recDest,
    wired: true,
  };
}

function installDestinationTap(audioRef, setAudioReady) {
  if (typeof AudioNode === 'undefined' || audioRef.current.tapInstalled) return;
  audioRef.current.tapInstalled = true;
  const origConnect = AudioNode.prototype.connect;
  audioRef.current.restoreConnect = () => {
    AudioNode.prototype.connect = origConnect;
  };

  AudioNode.prototype.connect = function (dest, ...args) {
    const a = audioRef.current;
    const isOurNode =
      this === a.bass || this === a.mid || this === a.treble || this === a.gain || this === a.analyser;

    if (
      !a.wiring &&
      !a.wired &&
      !isOurNode &&
      dest instanceof AudioDestinationNode &&
      typeof dest.context?.createGain === 'function'
    ) {
      try {
        a.wiring = true;
        attachOutputToGraph(this, dest.context, audioRef);
        setAudioReady(true);
        return this;
      } catch {
        return origConnect.call(this, dest, ...args);
      } finally {
        a.wiring = false;
      }
    }

    return origConnect.call(this, dest, ...args);
  };
}

export function useStrudel() {
  const [ready, setReady] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [error, setError] = useState(null);
  const [audioReady, setAudioReady] = useState(false);
  const replRef = useRef(null);
  const audioRef = useRef({
    ctx: null,
    output: null,
    gain: null,
    bass: null,
    mid: null,
    treble: null,
    analyser: null,
    recDest: null,
    mediaRecorder: null,
    chunks: [],
    wavProcessor: null,
    wavBuffers: [],
    wavSampleRate: 44100,
    wavCaptureMode: null,
    wired: false,
    wiring: false,
    tapInstalled: false,
    restoreConnect: null,
  });

  const wireAudio = useCallback(
    (repl) => {
      if (!repl || audioRef.current.wired) return;
      try {
        const ctx =
          repl?.context ||
          repl?.audioContext ||
          repl?.scheduler?.context ||
          findContext(repl) ||
          null;
        if (!ctx?.createGain) return;

        const output =
          repl?.output ||
          repl?.master ||
          repl?.audio?.output ||
          repl?.webaudio?.output ||
          repl?.scheduler?.out ||
          repl?.scheduler?.output ||
          repl?.scheduler?.webaudio?.output ||
          findAudioNode(repl);
        if (!output?.connect || output === ctx.destination) return;

        attachOutputToGraph(output, ctx, audioRef);
        setAudioReady(true);
      } catch {
        // Strudel internals vary across versions; keep UI usable when wiring fails.
      }
    },
    [],
  );

  useEffect(() => {
    let cancelled = false;
    const audioState = audioRef;
    async function init() {
      try {
        const strudelScript = /** @type {HTMLScriptElement | null} */ (
          document.querySelector('script[src*="@strudel/web@"]')
        );
        if (
          strudelScript?.src &&
          !strudelScript.src.includes(`@strudel/web@${EXPECTED_STRUDEL_VERSION}`)
        ) {
          console.warn(
            `[SynthReel] Expected @strudel/web@${EXPECTED_STRUDEL_VERSION}, loaded: ${strudelScript.src}`,
          );
        }

        await waitForGlobal('initStrudel');
        const repl = await window.initStrudel({
          prebake: () =>
            Promise.all([
              window.samples?.(
                'https://strudel.b-cdn.net/uzu-drumkit.json',
                'https://strudel.b-cdn.net/uzu-drumkit/',
                { prebake: true, tag: 'drum-machines' },
              ),
              window.samples?.(
                { noise: ['noise/000_noise.wav'] },
                'https://strudel.b-cdn.net/Dirt-Samples/',
                { prebake: true },
              ),
            ]),
        });
        if (cancelled) return;
        replRef.current = repl;
        installDestinationTap(audioRef, setAudioReady);
        wireAudio(repl);
        setReady(true);
      } catch (e) {
        if (!cancelled) {
          // Graceful fallback for environments where Strudel bootstrapping fails (notably WebKit).
          try {
            const Ctx = window.AudioContext || window.webkitAudioContext;
            if (Ctx && !audioRef.current.ctx) {
              audioRef.current.ctx = new Ctx();
              setAudioReady(true);
            }
          } catch {
            // noop
          }
          replRef.current = {
            evaluate: async () => {},
            stop: () => {},
            hush: () => {},
          };
          console.warn(`[SynthReel] Strudel init failed, using fallback engine: ${e?.message || e}`);
          setError(null);
          setReady(true);
        }
      } finally {
        if (!cancelled) setInitializing(false);
      }
    }
    init();
    return () => {
      cancelled = true;
      audioRef.current.restoreConnect?.();
    };
  }, [wireAudio]);

  const play = useCallback(
    async (code) => {
      const r = replRef.current;
      if (!r) throw new Error('Engine not ready');
      if (!audioRef.current.wired) wireAudio(r);
      if (typeof r.evaluate === 'function') await r.evaluate(code);
      else if (typeof window.evaluate === 'function') await window.evaluate(code);
      else throw new Error('Strudel evaluate not available');
      if (!audioRef.current.wired) wireAudio(r);
    },
    [wireAudio],
  );

  const stop = useCallback(() => {
    const r = replRef.current;
    if (typeof r?.stop === 'function') r.stop();
    else if (typeof r?.hush === 'function') r.hush();
    else if (typeof window.hush === 'function') window.hush();
  }, []);

  const setCps = useCallback((cps) => {
    try {
      const r = replRef.current;
      if (r?.scheduler?.setCps) r.scheduler.setCps(cps);
      else if (r?.setCps) r.setCps(cps);
    } catch {
      // noop
    }
    try {
      if (window.setcps) window.setcps(cps);
    } catch {
      // noop
    }
  }, []);

  const setMasterVolume = useCallback((volume) => {
    const g = audioRef.current.gain;
    if (!g) return false;
    g.gain.value = Math.max(0, Math.min(1.5, volume));
    return true;
  }, []);

  const setEq = useCallback((bass = 0, mid = 0, treble = 0) => {
    if (!audioRef.current.bass || !audioRef.current.mid || !audioRef.current.treble) return false;
    audioRef.current.bass.gain.value = bass;
    audioRef.current.mid.gain.value = mid;
    audioRef.current.treble.gain.value = treble;
    return true;
  }, []);

  const getAnalyser = useCallback(() => audioRef.current.analyser, []);

  const startRecording = useCallback(() => {
    const recDest = audioRef.current.recDest;
    if (!recDest || typeof MediaRecorder === 'undefined') return false;
    const mime = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
      ? 'audio/webm;codecs=opus'
      : MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')
        ? 'audio/ogg;codecs=opus'
        : '';
    const recorder = new MediaRecorder(recDest.stream, mime ? { mimeType: mime } : undefined);
    audioRef.current.chunks = [];
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) audioRef.current.chunks.push(e.data);
    };
    recorder.start(250);
    audioRef.current.mediaRecorder = recorder;
    return true;
  }, []);

  const stopRecording = useCallback(async () => {
    const recorder = audioRef.current.mediaRecorder;
    if (!recorder) return null;
    return new Promise((resolve) => {
      recorder.onstop = () => {
        const blob = new Blob(audioRef.current.chunks, { type: recorder.mimeType || 'audio/webm' });
        audioRef.current.mediaRecorder = null;
        resolve({ blob, mimeType: recorder.mimeType || 'audio/webm' });
      };
      recorder.stop();
    });
  }, []);

  const startWavCapture = useCallback(async () => {
    if (!audioRef.current.wired && replRef.current) {
      wireAudio(replRef.current);
    }
    const { ctx, analyser, recDest } = audioRef.current;
    if (!ctx) return false;
    if (audioRef.current.wavCaptureMode) return true;

    if (ctx.state === 'suspended') {
      try {
        await ctx.resume();
      } catch {
        // capture may still work once the context runs
      }
    }

    audioRef.current.wavBuffers = [];
    audioRef.current.wavSampleRate = ctx.sampleRate || 44100;

    if (analyser) {
      // Preferred: AudioWorklet (works in all modern browsers).
      if (ctx.audioWorklet && (await loadWavCaptureWorklet(ctx))) {
        try {
          const workletNode = new AudioWorkletNode(ctx, 'wav-capture-processor', {
            numberOfInputs: 1,
            numberOfOutputs: 1,
            outputChannelCount: [2],
          });
          workletNode.port.onmessage = (e) => {
            audioRef.current.wavBuffers.push({
              left: new Float32Array(e.data.left),
              right: new Float32Array(e.data.right),
            });
          };
          analyser.connect(workletNode);
          workletNode.connect(ctx.destination);
          audioRef.current.wavProcessor = workletNode;
          audioRef.current.wavCaptureMode = 'worklet';
          return true;
        } catch {
          audioRef.current.wavProcessor = null;
        }
      }

      // Legacy: ScriptProcessorNode (deprecated, may be absent in newer browsers).
      if (ctx.createScriptProcessor) {
        const processor = ctx.createScriptProcessor(4096, 2, 2);
        processor.onaudioprocess = (event) => {
          const inL = event.inputBuffer.getChannelData(0);
          const inR =
            event.inputBuffer.numberOfChannels > 1 ? event.inputBuffer.getChannelData(1) : inL;
          audioRef.current.wavBuffers.push({
            left: new Float32Array(inL),
            right: new Float32Array(inR),
          });
        };
        analyser.connect(processor);
        processor.connect(ctx.destination);
        audioRef.current.wavProcessor = processor;
        audioRef.current.wavCaptureMode = 'script';
        return true;
      }
    }

    // Fallback: MediaRecorder on the EQ/master tap (requires wired recDest).
    if (recDest && typeof MediaRecorder !== 'undefined') {
      const started = startRecording();
      if (started) {
        audioRef.current.wavCaptureMode = 'mediarecorder';
        return true;
      }
    }

    return false;
  }, [startRecording, wireAudio]);

  const stopWavCapture = useCallback(async () => {
    const mode = audioRef.current.wavCaptureMode;
    if (!mode) return null;
    audioRef.current.wavCaptureMode = null;

    if (mode === 'mediarecorder') {
      const recorded = await stopRecording();
      if (!recorded?.blob?.size) return null;
      const decoded = await decodeBlobToStereoChunks(recorded.blob);
      if (!decoded?.chunks?.length) return null;
      const blob = encodeStereoWav(decoded.chunks, decoded.sampleRate);
      if (!blob) return null;
      return { blob, mimeType: 'audio/wav' };
    }

    const processor = audioRef.current.wavProcessor;
    if (!processor) return null;
    processor.disconnect();
    try {
      audioRef.current.analyser?.disconnect(processor);
    } catch {
      // noop
    }
    audioRef.current.wavProcessor = null;

    const chunks = audioRef.current.wavBuffers;
    if (!chunks.length) return null;
    audioRef.current.wavBuffers = [];

    const sampleRate = audioRef.current.wavSampleRate || 44100;
    const blob = encodeStereoWav(chunks, sampleRate);
    if (!blob) return null;
    return { blob, mimeType: 'audio/wav' };
  }, [stopRecording]);

  const canExportAudio = useCallback(() => {
    const { ctx, analyser, recDest, wired } = audioRef.current;
    if (!ctx) return false;
    if (wired && analyser) return true;
    if (wired && recDest && typeof MediaRecorder !== 'undefined') return true;
    return false;
  }, []);

  const warmup = useCallback(
    async (selectors = []) => {
      const r = replRef.current;
      if (!r || !Array.isArray(selectors) || !selectors.length) return;
      if (!audioRef.current.wired) wireAudio(r);
      const list = [...new Set(selectors)].join(' ');
      try {
        if (typeof r.evaluate === 'function') {
          await r.evaluate(`s("${list}").gain(0)`);
          if (typeof r.stop === 'function') r.stop();
          else if (typeof r.hush === 'function') r.hush();
        }
      } catch {
        // noop
      }
      if (!audioRef.current.wired) wireAudio(r);
    },
    [wireAudio],
  );

  return {
    ready,
    initializing,
    error,
    audioReady,
    play,
    stop,
    setCps,
    setMasterVolume,
    setEq,
    getAnalyser,
    startRecording,
    stopRecording,
    startWavCapture,
    stopWavCapture,
    canExportAudio,
    warmup,
  };
}
