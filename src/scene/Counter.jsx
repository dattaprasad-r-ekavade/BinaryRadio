// @ts-nocheck — react-three-fiber scene component; typed migration tracked with the other audio/visual refs
import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useCursor } from '@react-three/drei'
import { COUNTER, DECK, CRT, RADIO, HEADPHONES } from './shopLayout'

/*
 * The listening counter: counter body, cassette deck (reels, VU meters,
 * transport keys, LED), CRT computer with keyboard, the in-store radio and
 * the decorative headphones. All text is drawn to canvas textures; nothing is
 * loaded from the network.
 */

const FONT_MONO = '"Courier New", Courier, monospace'
const FONT_SANS = 'Arial, Helvetica, sans-serif'
const TWO_PI = Math.PI * 2

// Deck-local front face: the deck origin is its centre, so the front face is at d/2.
const DECK_FRONT = DECK.d / 2
const FZ = DECK_FRONT + 0.002
const BTN_Y = -0.085
const BUTTON_BASE_Z = DECK_FRONT

// VU needle angles (radians from vertical): rest points left, full points right.
const VU_REST = 0.7
const VU_FULL = -0.7

const KEY_PALETTE = {
  day: {
    up: '#efe6d2',
    upText: '#2a1a10',
    lit: '#c8553d',
    litText: '#fff4dc',
    dim: '#cfc6b4',
    dimText: '#8a7d6a',
    edge: '#b9ad98',
    glow: 0,
  },
  night: {
    up: '#241838',
    upText: '#ff8fe0',
    lit: '#ff2fb4',
    litText: '#1a0a22',
    dim: '#120b20',
    dimText: '#4a3a63',
    edge: '#0b0716',
    glow: 1,
  },
}

/* ---------- helpers ---------- */

/** Canvas texture, memoised by deps, disposed when deps change or on unmount. */
function useCanvasTexture(width, height, paint, deps) {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (ctx) paint(ctx, width, height)
    const tex = new THREE.CanvasTexture(canvas)
    tex.colorSpace = THREE.SRGBColorSpace
    tex.anisotropy = 4
    return tex
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
  useEffect(() => () => texture.dispose(), [texture])
  return texture
}

/** Event handler that stops the click reaching other objects, then runs fn. */
const handle = (fn) => (e) => {
  e.stopPropagation()
  fn?.()
}

function useHover() {
  const [hovered, setHovered] = useState(false)
  const handlers = {
    onPointerOver: (e) => {
      e.stopPropagation()
      setHovered(true)
    },
    onPointerOut: () => setHovered(false),
  }
  return [hovered, handlers]
}

function Block({ size, position, rotation, children, ...rest }) {
  return (
    <mesh position={position} rotation={rotation} castShadow receiveShadow {...rest}>
      <boxGeometry args={size} />
      {children}
    </mesh>
  )
}

function Plane({ size, position, rotation, children, ...rest }) {
  return (
    <mesh position={position} rotation={rotation} receiveShadow {...rest}>
      <planeGeometry args={size} />
      {children}
    </mesh>
  )
}

/* ---------- canvas painters ---------- */

function fitText(ctx, text, maxW) {
  if (ctx.measureText(text).width <= maxW) return text
  let s = text
  while (s.length > 1 && ctx.measureText(`${s}…`).width > maxW) s = s.slice(0, -1)
  return `${s}…`
}

function paintScreen(ctx, w, h, track) {
  const GREEN = '#7dff9a'
  ctx.fillStyle = '#031a0b'
  ctx.fillRect(0, 0, w, h)
  ctx.font = `bold 40px ${FONT_MONO}`
  ctx.textAlign = 'left'
  ctx.textBaseline = 'top'
  ctx.fillStyle = GREEN
  ctx.shadowColor = GREEN
  ctx.shadowBlur = 6
  const x = 30
  const maxW = w - 60
  ctx.fillText('SYNTHREEL OS v1.0', x, 28)
  ctx.fillRect(x, 92, maxW, 3)
  ctx.fillText('NOW PLAYING:', x, 118)
  if (track) {
    ctx.fillText(fitText(ctx, track.title ?? '', maxW), x, 176)
    ctx.fillText(`BPM ${track.bpm ?? '--'}   KEY ${track.key ?? '--'}`, x, 250)
  } else {
    ctx.fillText('INSERT TAPE', x, 176)
    ctx.fillText('BPM --   KEY --', x, 250)
  }
  ctx.shadowBlur = 0
  // scanlines
  ctx.fillStyle = 'rgba(0, 0, 0, 0.35)'
  for (let y = 0; y < h; y += 4) ctx.fillRect(0, y, w, 2)
}

function paintKeyLabel(ctx, w, h, label, bg, fg, edge) {
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, w, h)
  ctx.fillStyle = edge
  ctx.fillRect(0, h - 12, w, 12)
  ctx.fillStyle = fg
  ctx.font = `900 54px ${FONT_SANS}`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(label, w / 2, (h - 12) / 2 + 2)
}

function paintVuFace(ctx, w, h, label, look) {
  const night = Boolean(look.night)
  const bg = night ? look.amber : '#fff6e0'
  const ink = night ? '#3b1d05' : '#2a1a10'
  const red = night ? '#c2185b' : '#c8553d'
  const px = w / 2
  const py = h - 2
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, w, h)
  ctx.lineWidth = 4
  for (let i = 0; i <= 10; i++) {
    const t = i / 10
    const a = VU_REST + (VU_FULL - VU_REST) * t
    const r1 = 150
    const r2 = i % 5 === 0 ? 176 : 166
    ctx.strokeStyle = t > 0.8 ? red : ink
    ctx.beginPath()
    ctx.moveTo(px - Math.sin(a) * r1, py - Math.cos(a) * r1)
    ctx.lineTo(px - Math.sin(a) * r2, py - Math.cos(a) * r2)
    ctx.stroke()
  }
  ctx.fillStyle = ink
  ctx.beginPath()
  ctx.arc(px, py, 8, 0, TWO_PI)
  ctx.fill()
  ctx.font = `900 46px ${FONT_SANS}`
  ctx.textBaseline = 'top'
  ctx.textAlign = 'left'
  ctx.fillText(label, 14, 10)
  ctx.textAlign = 'right'
  ctx.fillText('VU', w - 14, 10)
}

function paintKeys(ctx, w, h, look) {
  const base = look.night ? '#100b1e' : '#b9ad98'
  const key = look.night ? '#2f2750' : '#f7f1e3'
  ctx.fillStyle = base
  ctx.fillRect(0, 0, w, h)
  const rows = 4
  const cols = 15
  const m = 16
  const kw = (w - m * 2) / cols
  const kh = (h - m * 2) / rows
  ctx.fillStyle = key
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      ctx.fillRect(m + c * kw + 3, m + r * kh + 3, kw - 6, kh - 6)
    }
  }
}

function paintGrille(ctx, w, h, base, dot) {
  ctx.fillStyle = base
  ctx.fillRect(0, 0, w, h)
  ctx.fillStyle = dot
  for (let y = 12, row = 0; y < h; y += 20, row++) {
    for (let x = 12 + (row % 2) * 10; x < w; x += 20) {
      ctx.beginPath()
      ctx.arc(x, y, 6, 0, TWO_PI)
      ctx.fill()
    }
  }
}

function paintLamp(ctx, w, h, enabled) {
  ctx.fillStyle = enabled ? '#ff2a3d' : '#3a0c16'
  ctx.fillRect(0, 0, w, h)
  ctx.fillStyle = enabled ? '#fff1f2' : '#8a3a46'
  ctx.font = `900 50px ${FONT_SANS}`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('ON AIR', w / 2, h / 2 + 2)
}

/* ---------- counter body ---------- */

function CounterBody({ look, onFocus }) {
  const { x, z, w, h, d, topY } = COUNTER
  return (
    <group>
      <Block size={[w, h, d]} position={[x, h / 2, z]} onClick={handle(onFocus)}>
        <meshStandardMaterial color={look.counter} roughness={0.92} metalness={0} />
      </Block>
      <Block size={[w + 0.06, 0.05, d + 0.06]} position={[x, topY - 0.025, z]}>
        <meshStandardMaterial color={look.woodDark} roughness={0.7} metalness={0} />
      </Block>
    </group>
  )
}

/* ---------- cassette deck ---------- */

function Reel({ position, active, cps }) {
  const ref = useRef()
  useFrame((_, delta) => {
    if (!active || !ref.current) return
    const speed = Math.min(Math.max(cps || 0, 0), 4)
    ref.current.rotation.z -= speed * TWO_PI * 0.6 * delta
  })
  return (
    <group position={position}>
      <group ref={ref}>
        <mesh position={[0, 0, 0.001]} receiveShadow>
          <circleGeometry args={[0.05, 28]} />
          <meshStandardMaterial color="#1c1a18" roughness={0.6} />
        </mesh>
        <mesh position={[0, 0, 0.002]}>
          <circleGeometry args={[0.018, 16]} />
          <meshStandardMaterial color="#d9d2c0" roughness={0.5} />
        </mesh>
        {[0, 1, 2].map((i) => (
          <Block key={i} size={[0.08, 0.008, 0.004]} position={[0, 0, 0.003]} rotation={[0, 0, (i * TWO_PI) / 3]}>
            <meshStandardMaterial color="#d9d2c0" roughness={0.5} />
          </Block>
        ))}
      </group>
    </group>
  )
}

function VuMeter({ position, label, look, active, analyser, onFocus }) {
  const night = Boolean(look.night)
  const needleRef = useRef()
  const spring = useRef({ angle: VU_REST, vel: 0 })
  const buf = useRef(null)
  const face = useCanvasTexture(256, 232, (ctx, w, h) => paintVuFace(ctx, w, h, label, look), [label, look])

  useFrame(() => {
    let target = VU_REST
    if (active && analyser) {
      if (!buf.current || buf.current.length !== analyser.fftSize) {
        buf.current = new Uint8Array(analyser.fftSize)
      }
      analyser.getByteTimeDomainData(buf.current)
      let sum = 0
      for (let i = 0; i < buf.current.length; i++) {
        const s = (buf.current[i] - 128) / 128
        sum += s * s
      }
      const level = Math.min(1, Math.sqrt(sum / buf.current.length) * 4)
      target = VU_REST + (VU_FULL - VU_REST) * level
    }
    // Damped spring gives the needle some inertia.
    const s = spring.current
    s.vel = (s.vel + (target - s.angle) * 0.12) * 0.72
    s.angle += s.vel
    if (needleRef.current) needleRef.current.rotation.z = s.angle
  })

  return (
    <group position={position}>
      <Plane size={[0.11, 0.1]} onClick={handle(onFocus)}>
        {night ? (
          <meshStandardMaterial
            map={face}
            emissive="#ffb347"
            emissiveMap={face}
            emissiveIntensity={0.9}
            roughness={0.4}
            toneMapped={false}
          />
        ) : (
          <meshStandardMaterial map={face} roughness={0.5} />
        )}
      </Plane>
      <group position={[0, -0.049, 0.002]}>
        <group ref={needleRef}>
          <Block size={[0.003, 0.075, 0.002]} position={[0, 0.0375, 0]}>
            <meshStandardMaterial
              color={night ? look.accentA : '#c8553d'}
              emissive={night ? look.accentA : '#000000'}
              emissiveIntensity={night ? 1 : 0}
              toneMapped={!night}
            />
          </Block>
        </group>
      </group>
    </group>
  )
}

function Led({ color, on, night, position }) {
  return (
    <mesh position={position} castShadow>
      <sphereGeometry args={[0.011, 14, 10]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={on ? (night ? 3 : 0.5) : 0}
        toneMapped={!night}
      />
    </mesh>
  )
}

function DeckButton({ label, x, palette, night, lit, enabled, onPress }) {
  const pressRef = useRef()
  const pressedAt = useRef(-1)
  const [hovered, hover] = useHover()
  useCursor(hovered && enabled)

  const tone = !enabled
    ? { bg: palette.dim, fg: palette.dimText }
    : lit
      ? { bg: palette.lit, fg: palette.litText }
      : { bg: palette.up, fg: palette.upText }

  const tex = useCanvasTexture(
    256,
    106,
    (ctx, w, h) => paintKeyLabel(ctx, w, h, label, tone.bg, tone.fg, palette.edge),
    [label, tone.bg, tone.fg, palette.edge],
  )

  useFrame(() => {
    const g = pressRef.current
    if (!g) return
    const pressed = performance.now() / 1000 - pressedAt.current < 0.14
    const target = pressed ? -0.012 : 0
    g.position.z += (target - g.position.z) * 0.5
  })

  const click = (e) => {
    e.stopPropagation()
    if (!enabled) return
    pressedAt.current = performance.now() / 1000
    onPress?.()
  }

  const glow = night ? (lit && enabled ? 0.9 : 0.35) : hovered && enabled ? 0.15 : 0

  return (
    <group position={[x, BTN_Y, BUTTON_BASE_Z]}>
      <group ref={pressRef}>
        <Block size={[0.17, 0.07, 0.035]} position={[0, 0, 0.0175]} onClick={click} {...hover}>
          <meshStandardMaterial
            color={tone.bg}
            roughness={0.45}
            emissive={palette.lit}
            emissiveIntensity={night && lit && enabled ? 0.35 : 0}
          />
        </Block>
        <Plane size={[0.16, 0.066]} position={[0, 0, 0.0355]} onClick={click} {...hover}>
          <meshStandardMaterial
            map={tex}
            emissive="#ffffff"
            emissiveMap={tex}
            emissiveIntensity={glow}
            roughness={0.5}
            toneMapped={!night}
          />
        </Plane>
      </group>
    </group>
  )
}

function CassetteDeck({ look, transport, onFocus }) {
  const { deckState, looping, loadedTrack, cps, ready, channelAnalysers } = transport
  const { play, pause, stop, toggleLooping } = transport.actions
  const night = Boolean(look.night)
  const palette = night ? KEY_PALETTE.night : KEY_PALETTE.day
  const playing = deckState === 'playing'
  const paused = deckState === 'paused'
  const canPlay = Boolean(ready && loadedTrack)
  const accent = loadedTrack?.accent
  const windowColor = loadedTrack?.color ?? (night ? '#07050d' : '#0c0a0a')
  const ledColor = playing ? '#39e07a' : paused ? '#ffb020' : '#2a2a2a'
  const focus = { onClick: handle(onFocus) }

  return (
    <group position={[DECK.x, DECK.y, DECK.z]}>
      <Block size={[DECK.w, DECK.h, DECK.d]} {...focus}>
        <meshStandardMaterial color={look.deckBody} roughness={0.6} metalness={0.1} />
      </Block>

      {/* cassette window with frame, accent strip and reels */}
      <Plane size={[0.53, 0.19]} position={[-0.2, 0.045, FZ]} {...focus}>
        <meshStandardMaterial color={night ? '#1a1430' : '#4a4540'} roughness={0.6} />
      </Plane>
      <Plane size={[0.5, 0.16]} position={[-0.2, 0.045, FZ + 0.001]} {...focus}>
        <meshStandardMaterial color={windowColor} roughness={0.35} />
      </Plane>
      {accent && (
        <Plane size={[0.5, 0.012]} position={[-0.2, -0.027, FZ + 0.002]}>
          <meshStandardMaterial color={accent} roughness={0.4} />
        </Plane>
      )}
      <Reel position={[-0.33, 0.045, FZ + 0.003]} active={playing} cps={cps} />
      <Reel position={[-0.07, 0.045, FZ + 0.003]} active={playing} cps={cps} />

      {/* VU meters */}
      <VuMeter
        position={[0.2, 0.045, FZ]}
        label="L"
        look={look}
        active={playing}
        analyser={channelAnalysers?.left ?? null}
        onFocus={onFocus}
      />
      <VuMeter
        position={[0.33, 0.045, FZ]}
        label="R"
        look={look}
        active={playing}
        analyser={channelAnalysers?.right ?? null}
        onFocus={onFocus}
      />

      <Led color={ledColor} on={playing || paused} night={night} position={[0.43, 0.1, FZ + 0.008]} />

      {/* transport keys */}
      <DeckButton
        label="STOP"
        x={-0.33}
        palette={palette}
        night={night}
        lit={false}
        enabled
        onPress={() => stop?.()}
      />
      <DeckButton
        label="PLAY"
        x={-0.11}
        palette={palette}
        night={night}
        lit={playing}
        enabled={canPlay}
        onPress={() => play?.()}
      />
      <DeckButton
        label="PAUSE"
        x={0.11}
        palette={palette}
        night={night}
        lit={paused}
        enabled
        onPress={() => pause?.()}
      />
      <DeckButton
        label="LOOP"
        x={0.33}
        palette={palette}
        night={night}
        lit={Boolean(looping)}
        enabled
        onPress={() => toggleLooping?.()}
      />
    </group>
  )
}

/* ---------- CRT computer ---------- */

function CrtComputer({ look, track }) {
  const night = Boolean(look.night)
  const screen = useCanvasTexture(
    512,
    400,
    (ctx, w, h) => paintScreen(ctx, w, h, track),
    [track?.id, track?.title, track?.bpm, track?.key],
  )
  const keys = useCanvasTexture(512, 180, (ctx, w, h) => paintKeys(ctx, w, h, look), [look])
  const keyboardZ = CRT.z + CRT.d / 2 + 0.12

  return (
    <group>
      <group position={[CRT.x, CRT.y, CRT.z]}>
        <Block size={[CRT.w, CRT.h, CRT.d]}>
          <meshStandardMaterial color={look.crtBody} roughness={0.55} />
        </Block>
        <Plane size={[0.4, 0.32]} position={[0, 0.06, CRT.d / 2 + 0.001]}>
          <meshStandardMaterial color={night ? '#07050d' : '#8f8571'} roughness={0.8} />
        </Plane>
        <Plane size={[0.36, 0.28]} position={[0, 0.06, CRT.d / 2 + 0.002]}>
          <meshBasicMaterial map={screen} toneMapped={!night} />
        </Plane>
      </group>

      {/* keyboard slab in front of the screen */}
      <group position={[CRT.x, COUNTER.topY + 0.015, keyboardZ]}>
        <Block size={[0.42, 0.03, 0.16]}>
          <meshStandardMaterial color={look.crtBody} roughness={0.6} />
        </Block>
        <Plane size={[0.4, 0.14]} position={[0, 0.017, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <meshStandardMaterial map={keys} roughness={0.6} />
        </Plane>
      </group>
    </group>
  )
}

/* ---------- radio ---------- */

function Radio({ look, enabled, onToggle }) {
  const night = Boolean(look.night)
  const [hovered, hover] = useHover()
  useCursor(hovered)
  const grille = useCanvasTexture(
    256,
    256,
    (ctx, w, h) => paintGrille(ctx, w, h, look.woodDark, night ? '#05030b' : '#3b2412'),
    [look.woodDark, night],
  )
  const lamp = useCanvasTexture(256, 118, (ctx, w, h) => paintLamp(ctx, w, h, enabled), [enabled])
  const hit = { onClick: handle(onToggle), ...hover }

  return (
    <group position={[RADIO.x, RADIO.y, RADIO.z]}>
      <Block size={[RADIO.w, RADIO.h, RADIO.d]} {...hit}>
        <meshStandardMaterial color={look.wood} roughness={0.65} metalness={0} />
      </Block>
      <Plane size={[0.28, 0.16]} position={[-0.07, 0, RADIO.d / 2 + 0.002]} {...hit}>
        <meshStandardMaterial map={grille} roughness={0.8} />
      </Plane>
      <Plane size={[0.13, 0.062]} position={[0.13, 0, RADIO.d / 2 + 0.002]} {...hit}>
        <meshStandardMaterial
          map={lamp}
          emissive="#ff2a3d"
          emissiveMap={lamp}
          emissiveIntensity={enabled ? (night ? 2.4 : 0.6) : 0}
          roughness={0.5}
          toneMapped={!night}
        />
      </Plane>
    </group>
  )
}

/* ---------- headphones (decorative) ---------- */

function Headphones({ look }) {
  const band = look.night ? '#2b2440' : '#3b2e24'
  const cup = look.night ? '#14101e' : '#2b2620'
  return (
    <group position={[HEADPHONES.x, HEADPHONES.y, HEADPHONES.z]}>
      <mesh castShadow>
        <torusGeometry args={[0.15, 0.018, 12, 40, Math.PI]} />
        <meshStandardMaterial color={band} roughness={0.5} />
      </mesh>
      {[-0.15, 0.15].map((x) => (
        <group key={x} position={[x, 0, 0]}>
          <Block size={[0.03, 0.1, 0.03]} position={[0, -0.05, 0]}>
            <meshStandardMaterial color={band} roughness={0.5} />
          </Block>
          <mesh position={[0, -0.1, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
            <cylinderGeometry args={[0.05, 0.05, 0.04, 20]} />
            <meshStandardMaterial color={cup} roughness={0.4} />
          </mesh>
          <mesh position={[0, -0.1, 0.022]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.035, 0.035, 0.004, 18]} />
            <meshStandardMaterial color={look.accentA} roughness={0.6} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

/* ---------- counter ---------- */

export default function Counter({ look, transport, onFocus }) {
  return (
    <group>
      <CounterBody look={look} onFocus={onFocus} />
      <CassetteDeck look={look} transport={transport} onFocus={onFocus} />
      <CrtComputer look={look} track={transport.loadedTrack} />
      <Radio
        look={look}
        enabled={Boolean(transport.radio?.enabled)}
        onToggle={transport.actions.radioToggle}
      />
      <Headphones look={look} />
    </group>
  )
}
