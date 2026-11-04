import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { useCursor } from '@react-three/drei'
import { CanvasTexture, Color, SRGBColorSpace } from 'three'
import { KEYBOARD } from './shopLayout'
import { LOOKS } from './looks/palettes'
import { createKeyboardSynth } from '../audio/keyboardSynth'
import { isInScale, parseKey, snapToScale } from '../audio/scales'

const KEY_COUNT = 25 // two octaves plus one
const BASE_OCTAVE = 3 // C3 = MIDI 48
const MIN_OCTAVE = 1
const MAX_OCTAVE = 6
const VELOCITY = 0.8
const PRESS_DEPTH = 0.008
const BODY_H = 0.09

/** MIDI number of C for a given octave number (C3 = 48, C4 = 60). */
const octaveBase = (oct) => 12 * (oct + 1)
const clampOctave = (o) => Math.min(MAX_OCTAVE, Math.max(MIN_OCTAVE, o))

/** Computer keys -> semitone offset from the octave base. */
const COMPUTER_KEYS = {
  a: 0, w: 1, s: 2, e: 3, d: 4, f: 5, t: 6, g: 7, y: 8, h: 9, u: 10,
  j: 11, k: 12, o: 13, l: 14, p: 15, ';': 16,
}
const hasComputerKey = (k) => Object.prototype.hasOwnProperty.call(COMPUTER_KEYS, k)

const BLACK_PCS = new Set([1, 3, 6, 8, 10])

// Layout: white keys fill the keyboard width, black keys sit on the boundary
// after their white neighbour. Positions are local to the keyboard group.
const WHITE_OFFSETS = []
for (let s = 0; s < KEY_COUNT; s++) if (!BLACK_PCS.has(s % 12)) WHITE_OFFSETS.push(s)
const WHITE_W = (KEYBOARD.w * 0.94) / WHITE_OFFSETS.length
const WHITE_X0 = -(WHITE_OFFSETS.length * WHITE_W) / 2
const WHITE_INDEX = new Map(WHITE_OFFSETS.map((s, i) => [s, i]))
const LAYOUT = []
for (let s = 0; s < KEY_COUNT; s++) {
  if (BLACK_PCS.has(s % 12)) {
    const prev = WHITE_INDEX.get(s - 1)
    LAYOUT.push({
      offset: s, black: true,
      x: WHITE_X0 + (prev + 1) * WHITE_W,
      restY: KEYBOARD.topY + 0.022, z: -0.04,
      size: [WHITE_W * 0.6, 0.03, 0.15],
    })
  } else {
    LAYOUT.push({
      offset: s, black: false,
      x: WHITE_X0 + (WHITE_INDEX.get(s) + 0.5) * WHITE_W,
      restY: KEYBOARD.topY + 0.01, z: 0.02,
      size: [WHITE_W * 0.9, 0.02, 0.26],
    })
  }
}

const DAY_PAL = { whiteKey: '#f7f2e8', blackKey: '#1c1a18', body: '#4a4543', legs: '#3d3836', label: '#f4eee2' }
const NIGHT_PAL = { whiteKey: '#e9e4f2', blackKey: '#0d0a14', body: '#0a0712', legs: '#0a0712', label: '#ffffff' }

const LABEL_W = 512
const LABEL_H = 144

/** Canvas texture with text. Returns null when no 2D canvas is available (jsdom). */
function makeLabelTexture(text, fg) {
  if (typeof document === 'undefined') return null
  try {
    const canvas = document.createElement('canvas')
    canvas.width = LABEL_W
    canvas.height = LABEL_H
    const g = canvas.getContext('2d')
    if (!g || typeof g.fillText !== 'function') return null
    g.clearRect(0, 0, LABEL_W, LABEL_H)
    g.fillStyle = fg
    g.font = 'bold 64px monospace'
    g.textAlign = 'center'
    g.textBaseline = 'middle'
    g.fillText(text, LABEL_W / 2, LABEL_H / 2 + 4)
    const texture = new CanvasTexture(canvas)
    texture.colorSpace = SRGBColorSpace
    texture.needsUpdate = true
    return texture
  } catch {
    return null
  }
}

function Label({ text, fg, width, position }) {
  const texture = useMemo(() => makeLabelTexture(text, fg), [text, fg])
  useEffect(() => () => texture?.dispose(), [texture])
  const height = (width * LABEL_H) / LABEL_W
  return (
    <mesh position={position} visible={!!texture}>
      <planeGeometry args={[width, height]} />
      <meshBasicMaterial map={texture} transparent toneMapped={false} />
    </mesh>
  )
}

function keyAppearance(black, lit, dim, pal, look) {
  const color = new Color(black ? pal.blackKey : pal.whiteKey)
  let emissive = '#000000'
  let emissiveIntensity = 0
  if (dim) color.lerp(new Color('#6b6b6b'), 0.5)
  if (lit) {
    if (look.night) {
      emissive = look.accentA
      emissiveIntensity = 0.9
    } else {
      color.lerp(new Color(look.accentA), black ? 0.45 : 0.3)
    }
  }
  return { color: `#${color.getHexString()}`, emissive, emissiveIntensity }
}

function PianoKey({ midi, layout, lit, dim, pal, look, pressedRef, onDown, onUp, onHover }) {
  const ref = useRef(null)
  const restY = layout.restY
  useFrame((_, delta) => {
    const mesh = ref.current
    if (!mesh) return
    const target = restY - (pressedRef.current.has(midi) ? PRESS_DEPTH : 0)
    mesh.position.y += (target - mesh.position.y) * Math.min(1, delta * 40)
  })
  const look2 = keyAppearance(layout.black, lit, dim, pal, look)
  return (
    <mesh
      ref={ref}
      position={[layout.x, restY, layout.z]}
      onPointerDown={(e) => { e.stopPropagation(); onDown(midi) }}
      onPointerUp={(e) => { e.stopPropagation(); onUp(midi) }}
      onPointerLeave={() => { onUp(midi); onHover(false) }}
      onPointerOver={(e) => { e.stopPropagation(); onHover(true) }}
      onPointerOut={() => onHover(false)}
    >
      <boxGeometry args={layout.size} />
      <meshStandardMaterial
        color={look2.color}
        emissive={look2.emissive}
        emissiveIntensity={look2.emissiveIntensity}
        roughness={0.4}
      />
    </mesh>
  )
}

/**
 * The demo booth keyboard. Plays a small Web Audio synth from pointer or
 * computer keys, with an optional scale lock that snaps notes to the tape's key.
 */
export default function KeyboardStation({ look, trackKey, active, onFocus }) {
  const L = look ?? LOOKS.day
  const night = !!L.night
  const pal = night ? NIGHT_PAL : DAY_PAL

  const synth = useMemo(() => createKeyboardSynth(), [])
  const parsed = useMemo(() => parseKey(trackKey), [trackKey])
  const parsedRef = useRef(parsed)
  useEffect(() => { parsedRef.current = parsed }, [parsed])

  const [octave, setOctave] = useState(BASE_OCTAVE)
  const octaveRef = useRef(BASE_OCTAVE)
  const [lockOn, setLockOn] = useState(false)
  const lockRef = useRef(false)
  const [hovering, setHovering] = useState(false)
  useCursor(hovering)

  // Held notes, keyed by source id ('m<midi>' for pointer, 'k<key>' for computer keys).
  const heldRef = useRef(new Map())
  const [pressed, setPressed] = useState(() => new Set())
  const pressedRef = useRef(pressed)

  const syncPressed = useCallback(() => {
    const next = new Set()
    heldRef.current.forEach((v) => next.add(v.keyMidi))
    pressedRef.current = next
    setPressed(next)
  }, [])

  const pressNote = useCallback((id, keyMidi) => {
    if (heldRef.current.has(id)) return
    const sounding = lockRef.current ? snapToScale(keyMidi, parsedRef.current) : keyMidi
    heldRef.current.set(id, { keyMidi, sounding })
    synth.noteOn(sounding, VELOCITY)
    syncPressed()
  }, [synth, syncPressed])

  const releaseNote = useCallback((id) => {
    const held = heldRef.current.get(id)
    if (!held) return
    heldRef.current.delete(id)
    let stillSounding = false
    heldRef.current.forEach((v) => { if (v.sounding === held.sounding) stillSounding = true })
    if (!stillSounding) synth.noteOff(held.sounding)
    syncPressed()
  }, [synth, syncPressed])

  const releaseAll = useCallback(() => {
    heldRef.current.clear()
    synth.allOff()
    syncPressed()
  }, [synth, syncPressed])

  // Pointer notes end on pointerup anywhere in the window, not only on the key.
  useEffect(() => {
    const onUp = () => {
      Array.from(heldRef.current.keys())
        .filter((id) => id.startsWith('m'))
        .forEach(releaseNote)
    }
    window.addEventListener('pointerup', onUp)
    return () => window.removeEventListener('pointerup', onUp)
  }, [releaseNote])

  // Computer keys: only while this keyboard is the active instrument.
  useEffect(() => {
    if (!active) return undefined
    const isTypingTarget = (t) => {
      const tag = t?.tagName
      return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || !!t?.isContentEditable
    }
    const typing = (e) => isTypingTarget(e.target) || isTypingTarget(document.activeElement)
    const normalise = (e) => (typeof e.key === 'string' ? e.key.toLowerCase() : '')

    const onKeyDown = (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return
      if (typing(e)) return
      const key = normalise(e)
      if (key === 'z' || key === 'x') {
        e.preventDefault()
        e.stopPropagation()
        if (e.repeat) return
        const next = clampOctave(octaveRef.current + (key === 'x' ? 1 : -1))
        if (next !== octaveRef.current) {
          octaveRef.current = next
          setOctave(next)
        }
        return
      }
      if (!hasComputerKey(key)) return
      e.preventDefault()
      e.stopPropagation()
      if (e.repeat) return
      pressNote(`k${key}`, octaveBase(octaveRef.current) + COMPUTER_KEYS[key])
    }

    const onKeyUp = (e) => {
      const key = normalise(e)
      if (key !== 'z' && key !== 'x' && !hasComputerKey(key)) return
      if (!typing(e)) {
        e.preventDefault()
        e.stopPropagation()
      }
      if (hasComputerKey(key)) releaseNote(`k${key}`)
    }

    window.addEventListener('keydown', onKeyDown, { capture: true })
    window.addEventListener('keyup', onKeyUp, { capture: true })
    return () => {
      window.removeEventListener('keydown', onKeyDown, { capture: true })
      window.removeEventListener('keyup', onKeyUp, { capture: true })
      releaseAll()
    }
  }, [active, pressNote, releaseNote, releaseAll])

  // Free the audio context on unmount. A later noteOn would open a new one.
  useEffect(() => () => synth.dispose(), [synth])

  const toggleLock = () => {
    const next = !lockRef.current
    lockRef.current = next
    setLockOn(next)
  }

  const topY = KEYBOARD.topY
  const bodyCenterY = topY - BODY_H / 2
  const legH = topY - BODY_H
  const bw = KEYBOARD.w
  const bd = KEYBOARD.d
  const base = octaveBase(octave)
  const labelFg = night ? L.accentB : pal.label
  const keyFg = night ? L.accentA : pal.label

  return (
    <group position={[KEYBOARD.x, 0, KEYBOARD.z]} rotation={[0, KEYBOARD.rotY, 0]}>
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * (bw / 2 - 0.1), legH / 2, 0]}>
          <boxGeometry args={[0.05, legH, bd - 0.06]} />
          <meshStandardMaterial color={pal.legs} roughness={0.8} />
        </mesh>
      ))}

      <mesh position={[0, bodyCenterY, 0]} onPointerDown={() => onFocus?.()}>
        <boxGeometry args={[bw, BODY_H, bd]} />
        <meshStandardMaterial color={pal.body} roughness={0.6} />
      </mesh>
      {night && (
        <mesh position={[0, topY - 0.003, bd / 2 + 0.001]}>
          <boxGeometry args={[bw, 0.006, 0.004]} />
          <meshStandardMaterial color={L.accentA} emissive={L.accentA} emissiveIntensity={2} toneMapped={false} />
        </mesh>
      )}

      {LAYOUT.map((layout) => {
        const midi = base + layout.offset
        return (
          <PianoKey
            key={layout.offset}
            midi={midi}
            layout={layout}
            lit={pressed.has(midi)}
            dim={lockOn && !isInScale(midi, parsed)}
            pal={pal}
            look={L}
            pressedRef={pressedRef}
            onDown={(m) => pressNote(`m${m}`, m)}
            onUp={(m) => releaseNote(`m${m}`)}
            onHover={setHovering}
          />
        )
      })}

      <group position={[-0.56, bodyCenterY, bd / 2]}>
        <mesh
          position={[0, 0, 0.003]}
          onPointerDown={() => toggleLock()}
          onPointerOver={() => setHovering(true)}
          onPointerOut={() => setHovering(false)}
        >
          <boxGeometry args={[0.07, 0.035, 0.006]} />
          <meshStandardMaterial color="#1a1a1a" />
        </mesh>
        <mesh
          position={[0, lockOn ? 0.006 : -0.006, 0.008]}
          onPointerDown={() => toggleLock()}
          onPointerOver={() => setHovering(true)}
          onPointerOut={() => setHovering(false)}
        >
          <boxGeometry args={[0.014, 0.026, 0.01]} />
          <meshStandardMaterial
            color={lockOn ? L.accentB : '#8a8a8a'}
            emissive={lockOn && night ? L.accentB : '#000000'}
            emissiveIntensity={lockOn && night ? 1 : 0}
          />
        </mesh>
      </group>
      <Label text="SCALE LOCK" fg={labelFg} width={0.3} position={[-0.3, bodyCenterY, bd / 2 + 0.0015]} />
      <Label text={`KEY: ${parsed.name}`} fg={keyFg} width={0.3} position={[0.02, bodyCenterY, bd / 2 + 0.0015]} />
      <Label text={`OCT ${octave}`} fg={labelFg} width={0.2} position={[0.4, bodyCenterY, bd / 2 + 0.0015]} />
    </group>
  )
}
