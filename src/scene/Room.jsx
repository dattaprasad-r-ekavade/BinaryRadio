import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { MeshReflectorMaterial } from '@react-three/drei'
import { ROOM, SIGN, BIN, WINDOW, SHELF, COUNTER, DECK } from './shopLayout'

/* ------------------------------------------------------------------ *
 * Room shell for the 3D cassette shop: floor, walls, window, sign,
 * bargain bin, posters and the lighting for both looks.
 * All text and images are canvas textures (no network assets).
 * ------------------------------------------------------------------ */

const NEON_FONT = "'Brush Script MT', 'Segoe Script', 'Lucida Handwriting', 'Apple Chancery', cursive"
const SERIF_FONT = "Georgia, 'Times New Roman', serif"
const SANS_FONT = "'Arial Black', 'Helvetica Neue', Arial, sans-serif"

const SIGN_W = 3072 // 5:1, same ratio as SIGN (3.0 x 0.6 m)
const SIGN_H = 614
const WINDOW_W = 1100
const WINDOW_H = 800

/** Beams stop just under the sign (its bottom edge is SIGN.y - SIGN.h / 2). */
const BEAM_TOP = SIGN.y - SIGN.h / 2 - 0.25
const BEAM_TOP_R = 0.24
const BEAM_BOTTOM_R = 1.05
const SPOT_Y = ROOM.height - 0.1

const SHELF_CX = (SHELF.x0 + SHELF.x1) / 2
const SHELF_FRONT_Z = SHELF.z + 0.12 + SHELF.depth / 2
const COUNTER_FRONT_Z = COUNTER.z + COUNTER.d / 2

const BEAM_VERT = /* glsl */ `
  varying vec3 vN;
  varying vec3 vV;
  varying float vY;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vN = normalize(normalMatrix * normal);
    vV = -mv.xyz;
    vY = position.y;
    gl_Position = projectionMatrix * mv;
  }
`

const BEAM_FRAG = /* glsl */ `
  uniform vec3 uColor;
  uniform float uHalf;
  uniform float uStrength;
  varying vec3 vN;
  varying vec3 vV;
  varying float vY;
  void main() {
    float facing = abs(dot(normalize(vN), normalize(vV)));
    float edge = smoothstep(0.05, 0.7, facing);      // soft silhouette
    float height = smoothstep(-uHalf, uHalf, vY);     // 0 at the floor, 1 at the top
    float a = edge * pow(height, 1.4) * uStrength;
    gl_FragColor = vec4(uColor, a);
    #include <colorspace_fragment>
  }
`

/* ----------------------------- helpers ----------------------------- */

function rng(seed) {
  let s = seed >>> 0
  return () => {
    s = (s + 0x6d2b79f5) >>> 0
    let t = s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function makeCanvasTexture(w, h, draw) {
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  draw(canvas.getContext('2d'), w, h)
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 4
  return tex
}

/** Largest font size (from start down) whose text fits within maxWidth. */
function fitSize(ctx, text, fontFor, maxWidth, start) {
  let size = start
  while (size > 40) {
    ctx.font = fontFor(size)
    if (ctx.measureText(text).width <= maxWidth) break
    size -= 4
  }
  return size
}

const boost = (hex, k) => new THREE.Color(hex).multiplyScalar(k)

function makeBeamMaterial(hex, strength) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: new THREE.Color(hex) },
      uHalf: { value: BEAM_TOP / 2 },
      uStrength: { value: strength },
    },
    vertexShader: BEAM_VERT,
    fragmentShader: BEAM_FRAG,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.FrontSide,
  })
}

/* ----------------------------- canvases ---------------------------- */

function drawChecker(ctx, w, h, colA, colB, n = 8) {
  ctx.fillStyle = colA
  ctx.fillRect(0, 0, w, h)
  ctx.fillStyle = colB
  const cw = w / n
  const ch = h / n
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if ((i + j) % 2 === 1) ctx.fillRect(i * cw, j * ch, cw, ch)
    }
  }
}

function drawWall(ctx, w, h, look) {
  ctx.fillStyle = look.wall
  ctx.fillRect(0, 0, w, h)
  const dado = h * 0.68
  ctx.fillStyle = look.wallLower
  ctx.fillRect(0, dado, w, h - dado)
  ctx.fillStyle = look.woodDark
  ctx.fillRect(0, dado - 3, w, 6)
  // Faint brush speckle for the painted look (day) and grain (night).
  const rand = rng(look.night ? 11 : 7)
  for (let i = 0; i < 900; i++) {
    ctx.fillStyle = look.night
      ? `rgba(255,255,255,${rand() * 0.03})`
      : `rgba(90,50,20,${rand() * 0.05})`
    const r = 1 + rand() * 5
    ctx.fillRect(rand() * w, rand() * h, r * 3, r)
  }
}

function drawNeonSign(ctx, w, h, look) {
  const text = 'SynthReel Tapes'
  const fontFor = (px) => `italic 700 ${px}px ${NEON_FONT}`
  ctx.clearRect(0, 0, w, h) // transparent: the dark backing box shows through
  const size = fitSize(ctx, text, fontFor, w * 0.9, 300)
  ctx.font = fontFor(size)
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.lineJoin = 'round'
  // Narrow pink halo around each letter, then a bright near-white core.
  ctx.lineWidth = Math.round(size * 0.075)
  ctx.strokeStyle = look.sign
  ctx.strokeText(text, w / 2, h / 2)
  ctx.fillStyle = look.signText
  ctx.fillText(text, w / 2, h / 2)
}

function drawPaintedSign(ctx, w, h, look) {
  const text = 'SYNTHREEL TAPES'
  ctx.fillStyle = look.sign
  ctx.fillRect(0, 0, w, h)
  // Brush strokes go on the board, before the lettering.
  const rand = rng(23)
  for (let i = 0; i < 260; i++) {
    ctx.strokeStyle = rand() < 0.5 ? 'rgba(255,255,255,0.07)' : 'rgba(60,20,10,0.08)'
    ctx.lineWidth = 6 + rand() * 18
    const y = rand() * h
    ctx.beginPath()
    ctx.moveTo(-20, y)
    ctx.bezierCurveTo(w * 0.3, y + (rand() - 0.5) * 30, w * 0.6, y + (rand() - 0.5) * 30, w + 20, y)
    ctx.stroke()
  }
  ctx.strokeStyle = look.signText
  ctx.globalAlpha = 0.6
  ctx.lineWidth = 10
  ctx.strokeRect(28, 28, w - 56, h - 56)
  ctx.globalAlpha = 1

  const fontFor = (px) => `700 ${px}px ${SERIF_FONT}`
  const size = fitSize(ctx, text, fontFor, w * 0.9, 260)
  ctx.font = fontFor(size)
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.lineJoin = 'round'
  ctx.lineWidth = Math.round(size * 0.07)
  ctx.strokeStyle = look.ink // dark outline
  ctx.strokeText(text, w / 2, h / 2)
  ctx.fillStyle = look.signText
  ctx.fillText(text, w / 2, h / 2)
}

function drawDayWindow(ctx, w, h) {
  const sky = ctx.createLinearGradient(0, 0, 0, h)
  sky.addColorStop(0, '#4f9fe0')
  sky.addColorStop(0.7, '#bfe3f7')
  sky.addColorStop(1, '#eef8ff')
  ctx.fillStyle = sky
  ctx.fillRect(0, 0, w, h)

  const rand = rng(5)
  ctx.fillStyle = 'rgba(255,255,255,0.85)'
  for (let i = 0; i < 6; i++) {
    const cx = rand() * w
    const cy = h * (0.12 + rand() * 0.25)
    for (let k = 0; k < 3; k++) {
      ctx.beginPath()
      ctx.ellipse(cx + k * 38, cy + (k % 2) * 8, 70 + rand() * 40, 26 + rand() * 10, 0, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  const ground = h * 0.8
  let x = 0
  while (x < w) {
    const bw = 70 + rand() * 90
    const bh = 200 + rand() * 300
    ctx.fillStyle = rand() < 0.5 ? '#f2ead9' : '#dfe8f0'
    ctx.fillRect(x, ground - bh, bw, bh)
    ctx.fillStyle = '#b9cbdb'
    for (let wy = ground - bh + 24; wy < ground - 20; wy += 42) {
      for (let wx = x + 14; wx < x + bw - 22; wx += 30) {
        if (rand() < 0.8) ctx.fillRect(wx, wy, 14, 20)
      }
    }
    x += bw + 6
  }
  ctx.fillStyle = '#b7c7a6'
  ctx.fillRect(0, ground, w, h - ground)
  ctx.fillStyle = '#d9d2c0'
  ctx.fillRect(0, ground + (h - ground) * 0.45, w, 10)
}

function drawNightWindow(ctx, w, h) {
  const sky = ctx.createLinearGradient(0, 0, 0, h)
  sky.addColorStop(0, '#04050f')
  sky.addColorStop(1, '#1c0f3a')
  ctx.fillStyle = sky
  ctx.fillRect(0, 0, w, h)

  const rand = rng(41)
  const ground = h * 0.8
  const litColors = ['#ffd27a', '#ff5fb8', '#5fe8ff', '#fff1c9']
  let x = 0
  while (x < w) {
    const bw = 60 + rand() * 90
    const bh = 220 + rand() * 380
    ctx.fillStyle = '#0a0818'
    ctx.fillRect(x, ground - bh, bw, bh)
    for (let wy = ground - bh + 20; wy < ground - 18; wy += 36) {
      for (let wx = x + 10; wx < x + bw - 16; wx += 24) {
        if (rand() < 0.3) {
          ctx.fillStyle = litColors[Math.floor(rand() * litColors.length)]
          ctx.globalAlpha = 0.5 + rand() * 0.4
          ctx.fillRect(wx, wy, 10, 14)
        }
      }
    }
    ctx.globalAlpha = 1
    x += bw + 4
  }
  // Street band with coloured reflections.
  ctx.fillStyle = '#07061a'
  ctx.fillRect(0, ground, w, h - ground)
  for (let i = 0; i < 26; i++) {
    ctx.fillStyle = litColors[i % 3]
    ctx.globalAlpha = 0.35
    ctx.fillRect(rand() * w, ground + rand() * (h - ground), 4 + rand() * 6, 30 + rand() * 60)
  }
  ctx.globalAlpha = 1

  // Rain streaks on the glass.
  ctx.strokeStyle = 'rgba(170,205,255,0.28)'
  ctx.lineWidth = 1.5
  for (let i = 0; i < 260; i++) {
    const x0 = rand() * w
    const y0 = rand() * h
    ctx.beginPath()
    ctx.moveTo(x0, y0)
    ctx.lineTo(x0 - 6, y0 + 30 + rand() * 30)
    ctx.stroke()
  }
}

function drawBargainCard(ctx, w, h, look) {
  const text = 'BARGAIN BIN'
  if (look.night) {
    ctx.fillStyle = look.cardBg
    ctx.fillRect(0, 0, w, h)
    ctx.lineWidth = 14
    ctx.strokeStyle = look.accentA
    ctx.strokeRect(20, 20, w - 40, h - 40)
    ctx.lineWidth = 4
    ctx.strokeStyle = look.accentB
    ctx.strokeRect(42, 42, w - 84, h - 84)
  } else {
    ctx.fillStyle = look.cardBg
    ctx.fillRect(0, 0, w, h)
    ctx.lineWidth = 8
    ctx.strokeStyle = look.ink
    ctx.strokeRect(24, 24, w - 48, h - 48)
  }
  const fontFor = (px) =>
    look.night ? `900 ${px}px ${SANS_FONT}` : `700 ${px}px ${SERIF_FONT}`
  const size = fitSize(ctx, text, fontFor, w * 0.8, 170)
  ctx.font = fontFor(size)
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillStyle = look.night ? look.cardText : look.ink
  ctx.fillText(text, w / 2, h / 2 + 4)
}

/** Original abstract art: no real brands, labels or album covers. */
function drawPoster(ctx, w, h, look, variant) {
  const night = look.night
  const c1 = look.accentA
  const c2 = look.accentB
  const c3 = night ? look.violet : '#e0a24a'
  const c4 = night ? look.amber : look.cardBg
  ctx.fillStyle = night ? '#0c0718' : '#fbeed6'
  ctx.fillRect(0, 0, w, h)

  if (variant === 0) {
    for (let i = 0; i < 9; i++) {
      ctx.beginPath()
      ctx.arc(w * 0.5, h * 0.62, 40 + i * 40, Math.PI, 0)
      ctx.strokeStyle = i % 2 ? c1 : c2
      ctx.lineWidth = 14
      ctx.stroke()
    }
    ctx.fillStyle = c4
    ctx.beginPath()
    ctx.arc(w * 0.5, h * 0.62, 60, Math.PI, 0)
    ctx.fill()
    ;[c3, c1, c2].forEach((c, i) => {
      ctx.fillStyle = c
      ctx.fillRect(0, h * 0.72 + i * h * 0.07, w, h * 0.04)
    })
  } else {
    ctx.fillStyle = c3
    ctx.beginPath()
    ctx.moveTo(0, h)
    ctx.lineTo(w * 0.9, h * 0.15)
    ctx.lineTo(w, h)
    ctx.closePath()
    ctx.fill()
    ctx.fillStyle = c1
    ctx.beginPath()
    ctx.arc(w * 0.3, h * 0.3, w * 0.16, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = c2
    ctx.lineWidth = 10
    for (let i = 0; i < 5; i++) {
      ctx.beginPath()
      ctx.moveTo(0, h * (0.1 + i * 0.08))
      ctx.lineTo(w, h * (0.05 + i * 0.08))
      ctx.stroke()
    }
    ctx.fillStyle = c4
    ctx.fillRect(w * 0.62, h * 0.5, w * 0.2, w * 0.2)
  }
  ctx.strokeStyle = night ? c2 : look.ink
  ctx.lineWidth = 16
  ctx.strokeRect(16, 16, w - 32, h - 32)
}

/** Every texture and shader material the room uses, built once per look. */
function buildAssets(look) {
  const night = look.night
  return {
    floor: makeCanvasTexture(512, 512, (ctx, w, h) =>
      drawChecker(ctx, w, h, look.floor, night ? '#171030' : '#b88a5f'),
    ),
    wall: makeCanvasTexture(1024, 512, (ctx, w, h) => drawWall(ctx, w, h, look)),
    window: makeCanvasTexture(WINDOW_W, WINDOW_H, (ctx, w, h) =>
      night ? drawNightWindow(ctx, w, h) : drawDayWindow(ctx, w, h),
    ),
    sign: makeCanvasTexture(SIGN_W, SIGN_H, (ctx, w, h) =>
      night ? drawNeonSign(ctx, w, h, look) : drawPaintedSign(ctx, w, h, look),
    ),
    card: makeCanvasTexture(1024, 300, (ctx, w, h) => drawBargainCard(ctx, w, h, look)),
    posterA: makeCanvasTexture(512, 730, (ctx, w, h) => drawPoster(ctx, w, h, look, 0)),
    posterB: makeCanvasTexture(512, 730, (ctx, w, h) => drawPoster(ctx, w, h, look, 1)),
    beamCyan: makeBeamMaterial(look.accentB, 0.55),
    beamViolet: makeBeamMaterial(look.violet || look.accentB, 0.55),
  }
}

/** Seeded dust positions inside one beam (relative to the beam's floor point). */
function dustPositions(seed) {
  const rand = rng(seed)
  const count = 70
  const arr = new Float32Array(count * 3)
  for (let i = 0; i < count; i++) {
    const y = 0.2 + rand() * (BEAM_TOP - 0.4)
    const t = y / BEAM_TOP
    const radius = (BEAM_BOTTOM_R + (BEAM_TOP_R - BEAM_BOTTOM_R) * t) * 0.85 * Math.sqrt(rand())
    const a = rand() * Math.PI * 2
    arr[i * 3] = Math.cos(a) * radius
    arr[i * 3 + 1] = y
    arr[i * 3 + 2] = Math.sin(a) * radius
  }
  return arr
}

function makeSpot(color, intensity, x, z, target) {
  const spot = new THREE.SpotLight(color, intensity, 9, 0.42, 0.85, 2)
  spot.position.set(x, SPOT_Y, z)
  spot.target = target
  return spot
}

/** Day: hemisphere fill plus one warm sun from the window side. */
function buildDayRig(look) {
  const hemi = new THREE.HemisphereLight('#fff1d6', look.floor, 0.9)
  const sun = new THREE.DirectionalLight('#ffd9a0', 2.2)
  sun.position.set(-6, 5, 1.5)
  sun.target.position.set(0, 0.5, 0)
  sun.castShadow = true
  sun.shadow.mapSize.set(2048, 2048)
  const cam = sun.shadow.camera
  cam.left = -6
  cam.right = 6
  cam.top = 6
  cam.bottom = -6
  cam.near = 0.5
  cam.far = 25
  cam.updateProjectionMatrix()
  sun.shadow.bias = -0.0004
  sun.shadow.normalBias = 0.02
  sun.shadow.radius = 4
  return { lights: [hemi, sun], targets: [sun.target] }
}

/** Night: violet ambient, coloured point lights and two ceiling spots. */
function buildNightRig(look) {
  const ambient = new THREE.AmbientLight('#2a1f4d', 0.8)
  const points = [
    [-1.4, 1.7, -1.9, look.accentA, 6],
    [2.6, 1.6, -0.8, look.accentB, 5],
    [-2.8, 2.2, 1.6, look.violet, 5],
    [0.6, 1.2, 1.9, look.accentA, 3],
  ].map(([x, y, z, color, intensity]) => {
    const p = new THREE.PointLight(color, intensity, 7, 2)
    p.position.set(x, y, z)
    return p
  })
  const deckTarget = new THREE.Object3D()
  deckTarget.position.set(DECK.x, DECK.y, DECK.z)
  const binTarget = new THREE.Object3D()
  binTarget.position.set(BIN.x, BIN.h / 2, BIN.z)
  const spotDeck = makeSpot(look.accentB, 16, DECK.x, DECK.z, deckTarget)
  const spotBin = makeSpot(look.violet, 16, BIN.x, BIN.z, binTarget)
  return {
    lights: [ambient, ...points, spotDeck, spotBin],
    targets: [deckTarget, binTarget],
  }
}

/* ----------------------------- components -------------------------- */

function Tube({ position, size, color }) {
  return (
    <mesh position={position}>
      <boxGeometry args={size} />
      <meshBasicMaterial color={color} toneMapped={false} />
    </mesh>
  )
}

function LightBeam({ x, z, material, seed }) {
  const dust = useMemo(() => dustPositions(seed), [seed])
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, BEAM_TOP / 2, 0]} material={material}>
        <cylinderGeometry args={[BEAM_TOP_R, BEAM_BOTTOM_R, BEAM_TOP, 40, 1, true]} />
      </mesh>
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[dust, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.025}
          color="#ffffff"
          transparent
          opacity={0.6}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          sizeAttenuation
        />
      </points>
    </group>
  )
}

function Poster({ z, texture, frameColor }) {
  // Group sits on the left wall; local +z points into the room (+x).
  return (
    <group position={[ROOM.minX, 1.65, z]} rotation-y={Math.PI / 2}>
      <mesh position={[0, 0, 0.006]}>
        <planeGeometry args={[0.66, 0.91]} />
        <meshStandardMaterial color={frameColor} roughness={0.8} />
      </mesh>
      <mesh position={[0, 0, 0.012]}>
        <planeGeometry args={[0.6, 0.85]} />
        <meshStandardMaterial map={texture} roughness={0.7} />
      </mesh>
    </group>
  )
}

export default function Room({ look }) {
  const night = look.night
  const res = useMemo(() => buildAssets(look), [look])
  const rig = useMemo(() => (night ? buildNightRig(look) : buildDayRig(look)), [look, night])
  const neon = useMemo(
    () => ({
      pink: boost(look.accentA, 3),
      cyan: boost(look.accentB, 3),
    }),
    [look],
  )
  const signTint = useMemo(() => new THREE.Color(1.05, 1.05, 1.05), [])
  const windowFrame = night ? '#221838' : '#f7ecd6'
  const height = ROOM.height
  const roomW = ROOM.maxX - ROOM.minX
  const roomD = ROOM.maxZ - ROOM.minZ

  useEffect(() => {
    return () => {
      Object.values(res).forEach((r) => r.dispose())
    }
  }, [res])

  return (
    <group>
      {/* Lights and their targets (targets must be in the scene for shadows and spots). */}
      {rig.lights.map((light, i) => (
        <primitive key={`light-${i}`} object={light} />
      ))}
      {rig.targets.map((target, i) => (
        <primitive key={`target-${i}`} object={target} />
      ))}

      {/* Floor */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[roomW, roomD]} />
        {night ? (
          <MeshReflectorMaterial
            map={res.floor}
            color={look.floor}
            blur={[300, 100]}
            resolution={512}
            mixBlur={1}
            mixStrength={1.2}
            roughness={0.6}
            metalness={0.4}
          />
        ) : (
          <meshStandardMaterial map={res.floor} roughness={0.9} metalness={0} />
        )}
      </mesh>

      {/* Back wall */}
      <mesh position={[0, height / 2, ROOM.minZ]} receiveShadow>
        <planeGeometry args={[roomW, height]} />
        <meshStandardMaterial map={res.wall} roughness={night ? 0.5 : 0.9} metalness={0} />
      </mesh>

      {/* Left wall */}
      <mesh position={[ROOM.minX, height / 2, 0]} rotation-y={Math.PI / 2} receiveShadow>
        <planeGeometry args={[roomD, height]} />
        <meshStandardMaterial map={res.wall} roughness={night ? 0.5 : 0.9} metalness={0} />
      </mesh>

      {/* Right wall */}
      <mesh position={[ROOM.maxX, height / 2, 0]} rotation-y={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[roomD, height]} />
        <meshStandardMaterial map={res.wall} roughness={night ? 0.5 : 0.9} metalness={0} />
      </mesh>

      {/* Ceiling (no front wall: the room is open to the street side) */}
      <mesh position={[0, height, 0]} rotation-x={Math.PI / 2}>
        <planeGeometry args={[roomW, roomD]} />
        <meshStandardMaterial color={night ? look.wallLower : look.wall} roughness={0.95} />
      </mesh>

      {/* Window on the left wall */}
      <mesh position={[WINDOW.x + 0.005, WINDOW.y, WINDOW.z]} rotation-y={Math.PI / 2}>
        <planeGeometry args={[WINDOW.w, WINDOW.h]} />
        <meshBasicMaterial map={res.window} toneMapped={false} />
      </mesh>
      {/* Frame: outer border, centre bars, sill */}
      <mesh position={[WINDOW.x + 0.03, WINDOW.y + WINDOW.h / 2 + 0.04, WINDOW.z]}>
        <boxGeometry args={[0.08, 0.08, WINDOW.w + 0.16]} />
        <meshStandardMaterial color={windowFrame} roughness={0.7} />
      </mesh>
      <mesh position={[WINDOW.x + 0.03, WINDOW.y - WINDOW.h / 2 - 0.04, WINDOW.z]}>
        <boxGeometry args={[0.08, 0.08, WINDOW.w + 0.16]} />
        <meshStandardMaterial color={windowFrame} roughness={0.7} />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh
          key={`frame-side-${side}`}
          position={[WINDOW.x + 0.03, WINDOW.y, WINDOW.z + side * (WINDOW.w / 2 + 0.04)]}
        >
          <boxGeometry args={[0.08, WINDOW.h, 0.08]} />
          <meshStandardMaterial color={windowFrame} roughness={0.7} />
        </mesh>
      ))}
      <mesh position={[WINDOW.x + 0.03, WINDOW.y, WINDOW.z]}>
        <boxGeometry args={[0.05, WINDOW.h, 0.04]} />
        <meshStandardMaterial color={windowFrame} roughness={0.7} />
      </mesh>
      <mesh position={[WINDOW.x + 0.03, WINDOW.y, WINDOW.z]}>
        <boxGeometry args={[0.05, 0.04, WINDOW.w]} />
        <meshStandardMaterial color={windowFrame} roughness={0.7} />
      </mesh>
      <mesh position={[WINDOW.x + 0.1, WINDOW.y - WINDOW.h / 2 - 0.1, WINDOW.z]}>
        <boxGeometry args={[0.16, 0.05, WINDOW.w + 0.3]} />
        <meshStandardMaterial color={windowFrame} roughness={0.6} />
      </mesh>

      {/* Shop sign on the back wall */}
      {night && (
        <mesh position={[SIGN.x, SIGN.y, SIGN.z - 0.035]}>
          <boxGeometry args={[SIGN.w + 0.25, SIGN.h + 0.2, 0.05]} />
          <meshBasicMaterial color="#07040f" toneMapped={false} />
        </mesh>
      )}
      <mesh position={[SIGN.x, SIGN.y, SIGN.z]}>
        <planeGeometry args={[SIGN.w, SIGN.h]} />
        {night ? (
          <meshBasicMaterial
            map={res.sign}
            transparent
            toneMapped={false}
            color={signTint}
          />
        ) : (
          <meshStandardMaterial map={res.sign} roughness={0.8} metalness={0} />
        )}
      </mesh>

      {/* Bargain bin: open-top box, top edge at BIN.h */}
      <group position={[BIN.x, 0, BIN.z]}>
        <mesh position={[-(BIN.w / 2 - 0.025), BIN.h / 2, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.05, BIN.h, BIN.d]} />
          <meshStandardMaterial color={look.wood} roughness={0.8} />
        </mesh>
        <mesh position={[BIN.w / 2 - 0.025, BIN.h / 2, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.05, BIN.h, BIN.d]} />
          <meshStandardMaterial color={look.wood} roughness={0.8} />
        </mesh>
        <mesh position={[0, BIN.h / 2, -(BIN.d / 2 - 0.025)]} castShadow receiveShadow>
          <boxGeometry args={[BIN.w, BIN.h, 0.05]} />
          <meshStandardMaterial color={look.wood} roughness={0.8} />
        </mesh>
        <mesh position={[0, BIN.h / 2, BIN.d / 2 - 0.025]} castShadow receiveShadow>
          <boxGeometry args={[BIN.w, BIN.h, 0.05]} />
          <meshStandardMaterial color={look.wood} roughness={0.8} />
        </mesh>
        <mesh position={[0, 0.025, 0]} receiveShadow>
          <boxGeometry args={[BIN.w - 0.05, 0.05, BIN.d - 0.05]} />
          <meshStandardMaterial color={look.woodDark} roughness={0.9} />
        </mesh>
        {/* "BARGAIN BIN" card on the front face */}
        <mesh position={[0, BIN.h * 0.72, BIN.d / 2 + 0.005]}>
          <planeGeometry args={[0.9, 0.26]} />
          <meshBasicMaterial map={res.card} toneMapped={false} />
        </mesh>
      </group>

      {/* Two original posters on the left wall */}
      <Poster z={-1.9} texture={res.posterA} frameColor={night ? '#0a0716' : look.woodDark} />
      <Poster z={2.0} texture={res.posterB} frameColor={night ? '#0a0716' : look.woodDark} />

      {night && (
        <>
          {/* Neon along the top of the back and left walls */}
          <Tube
            position={[0, height - 0.16, ROOM.minZ + 0.05]}
            size={[roomW - 0.3, 0.05, 0.05]}
            color={neon.pink}
          />
          <Tube
            position={[ROOM.minX + 0.05, height - 0.16, 0]}
            size={[0.05, 0.05, roomD - 0.3]}
            color={neon.cyan}
          />

          {/* Neon along shelf board fronts */}
          {SHELF.boardYs.map((y, i) => (
            <Tube
              key={`shelf-tube-${y}`}
              position={[SHELF_CX, y + 0.02, SHELF_FRONT_Z]}
              size={[SHELF.x1 - SHELF.x0, 0.03, 0.03]}
              color={i % 2 ? neon.cyan : neon.pink}
            />
          ))}

          {/* Neon along the counter front edge */}
          <Tube
            position={[COUNTER.x, COUNTER.topY - 0.04, COUNTER_FRONT_Z + 0.02]}
            size={[COUNTER.w - 0.1, 0.03, 0.03]}
            color={neon.pink}
          />

          {/* Ceiling spot fixtures and their light beams (beams end below the sign) */}
          <mesh position={[DECK.x, height - 0.05, DECK.z]}>
            <cylinderGeometry args={[0.12, 0.12, 0.1, 16]} />
            <meshStandardMaterial color="#14101f" roughness={0.6} />
          </mesh>
          <mesh position={[BIN.x, height - 0.05, BIN.z]}>
            <cylinderGeometry args={[0.12, 0.12, 0.1, 16]} />
            <meshStandardMaterial color="#14101f" roughness={0.6} />
          </mesh>
          <LightBeam x={DECK.x} z={DECK.z} material={res.beamCyan} seed={3} />
          <LightBeam x={BIN.x} z={BIN.z} material={res.beamViolet} seed={9} />
        </>
      )}
    </group>
  )
}
