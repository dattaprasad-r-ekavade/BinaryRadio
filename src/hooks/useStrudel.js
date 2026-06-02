// @ts-nocheck — complex audio/recorder refs; typed migration tracked in issue #TS-001
import { useState, useRef, useCallback, useEffect } from 'react';
import { logExportError, logExportInfo, logExportWarn } from '../utils/exportLog';
import {
  decodeBlobToStereoChunks,
  encodeStereoWav,
  getWavCaptureWorkletUrl,
  loadWavCaptureWorklet,
} from '../utils/wav';

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
      audioState.current.restoreConnect?.();
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

  const getExportDiagnostics = useCallback(() => {
    const a = audioRef.current;
    return {
      wired: a.wired,
      audioReadyState: a.ctx?.state ?? null,
      hasCtx: !!a.ctx,
      hasAnalyser: !!a.analyser,
      hasRecDest: !!a.recDest,
      hasAudioWorklet: !!a.ctx?.audioWorklet,
      hasScriptProcessor: !!a.ctx?.createScriptProcessor,
      hasMediaRecorder: typeof MediaRecorder !== 'undefined',
      captureMode: a.wavCaptureMode,
      bufferChunks: a.wavBuffers?.length ?? 0,
      workletUrl: getWavCaptureWorkletUrl(),
    };
  }, []);

  const startWavCapture = useCallback(async () => {
    if (!audioRef.current.wired && replRef.current) {
      wireAudio(replRef.current);
    }
    const diag = getExportDiagnostics();
    const { ctx, analyser, recDest } = audioRef.current;
    if (!ctx) {
      logExportError('startWavCapture: no AudioContext', diag);
      return { ok: false, reason: 'no-audio-context', diagnostics: diag };
    }
    if (audioRef.current.wavCaptureMode) {
      logExportInfo('startWavCapture: already capturing', { mode: audioRef.current.wavCaptureMode });
      return { ok: true, mode: audioRef.current.wavCaptureMode };
    }

    if (ctx.state === 'suspended') {
      try {
        await ctx.resume();
        logExportInfo('AudioContext resumed for export', { state: ctx.state });
      } catch (err) {
        logExportWarn('AudioContext.resume() failed', { error: String(err), state: ctx.state });
      }
    }

    audioRef.current.wavBuffers = [];
    audioRef.current.wavSampleRate = ctx.sampleRate || 44100;

    if (analyser) {
      if (ctx.audioWorklet) {
        const workletLoad = await loadWavCaptureWorklet(ctx);
        if (workletLoad.ok) {
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
            logExportInfo('Capture started via AudioWorklet', diag);
            return { ok: true, mode: 'worklet' };
          } catch (err) {
            audioRef.current.wavProcessor = null;
            logExportError('AudioWorkletNode setup failed', { error: String(err), ...diag });
          }
        } else {
          logExportWarn('Worklet unavailable; trying fallbacks', {
            workletReason: workletLoad.reason,
            ...diag,
          });
        }
      } else {
        logExportWarn('AudioWorklet not supported in this context', diag);
      }

      if (ctx.createScriptProcessor) {
        try {
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
          logExportInfo('Capture started via ScriptProcessor', diag);
          return { ok: true, mode: 'script' };
        } catch (err) {
          logExportError('ScriptProcessor setup failed', { error: String(err), ...diag });
        }
      } else {
        logExportWarn('ScriptProcessor not available', diag);
      }
    } else {
      logExportWarn('No analyser node; skipping worklet/script capture paths', diag);
    }

    if (recDest && typeof MediaRecorder !== 'undefined') {
      const started = startRecording();
      if (started) {
        audioRef.current.wavCaptureMode = 'mediarecorder';
        logExportInfo('Capture started via MediaRecorder', diag);
        return { ok: true, mode: 'mediarecorder' };
      }
      logExportError('MediaRecorder.start failed', diag);
    } else {
      logExportError('MediaRecorder fallback unavailable', {
        hasRecDest: !!recDest,
        hasMediaRecorder: typeof MediaRecorder !== 'undefined',
        ...diag,
      });
    }

    logExportError('startWavCapture: all capture paths failed', diag);
    return { ok: false, reason: 'capture-unavailable', diagnostics: diag };
  }, [getExportDiagnostics, startRecording, wireAudio]);

  const stopWavCapture = useCallback(async () => {
    const mode = audioRef.current.wavCaptureMode;
    if (!mode) {
      logExportError('stopWavCapture: not recording', getExportDiagnostics());
      return { ok: false, reason: 'not-recording' };
    }
    audioRef.current.wavCaptureMode = null;

    if (mode === 'mediarecorder') {
      const recorded = await stopRecording();
      if (!recorded?.blob?.size) {
        logExportError('stopWavCapture: MediaRecorder produced empty blob', {
          mimeType: recorded?.mimeType,
          ...getExportDiagnostics(),
        });
        return { ok: false, reason: 'empty-recording' };
      }
      const decoded = await decodeBlobToStereoChunks(recorded.blob);
      if (!decoded?.chunks?.length) {
        logExportError('stopWavCapture: could not decode recorded blob to PCM', {
          blobSize: recorded.blob.size,
          mimeType: recorded.mimeType,
        });
        return { ok: false, reason: 'decode-failed' };
      }
      const blob = encodeStereoWav(decoded.chunks, decoded.sampleRate);
      if (!blob) {
        logExportError('stopWavCapture: encodeStereoWav returned null after decode', {
          chunkCount: decoded.chunks.length,
          sampleRate: decoded.sampleRate,
        });
        return { ok: false, reason: 'encode-failed' };
      }
      logExportInfo('Export finished (MediaRecorder path)', { bytes: blob.size });
      return { ok: true, blob, mimeType: 'audio/wav' };
    }

    const processor = audioRef.current.wavProcessor;
    if (!processor) {
      logExportError('stopWavCapture: missing processor node', { mode, ...getExportDiagnostics() });
      return { ok: false, reason: 'missing-processor' };
    }
    processor.disconnect();
    try {
      audioRef.current.analyser?.disconnect(processor);
    } catch (err) {
      logExportWarn('disconnect processor warning', { error: String(err) });
    }
    audioRef.current.wavProcessor = null;

    const chunks = audioRef.current.wavBuffers;
    if (!chunks.length) {
      logExportError('stopWavCapture: no audio buffers captured', {
        mode,
        hint: 'Was PLAY running during the whole recording?',
        ...getExportDiagnostics(),
      });
      return { ok: false, reason: 'no-buffers' };
    }
    audioRef.current.wavBuffers = [];

    const sampleRate = audioRef.current.wavSampleRate || 44100;
    const blob = encodeStereoWav(chunks, sampleRate);
    if (!blob) {
      logExportError('stopWavCapture: encodeStereoWav returned null', {
        chunkCount: chunks.length,
        sampleRate,
      });
      return { ok: false, reason: 'encode-failed' };
    }
    logExportInfo('Export finished', { mode, bytes: blob.size, chunkCount: chunks.length, sampleRate });
    return { ok: true, blob, mimeType: 'audio/wav' };
  }, [getExportDiagnostics, stopRecording]);

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
    getExportDiagnostics,
    warmup,
  };
}
