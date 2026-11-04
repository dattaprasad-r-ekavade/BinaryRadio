// @ts-nocheck — react-three-fiber scene component; typed migration tracked with the other audio/visual refs
import { useEffect, useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { useCursor } from '@react-three/drei'
import * as THREE from 'three'
import { SHELF, CASSETTE, BIN } from './shopLayout'
import { groupTracksIntoSections, bargainBinTracks } from '../utils/shelving'
import { useCassetteTexture } from './useCassetteTexture'

const NO_TRACKS = []
const NO_IDS = []

const UPRIGHT = { w: 0.05, h: 2.1, d: 0.36 }
const BOARD_Z = SHELF.z + 0.12
const SHELF_CENTRE_X = (SHELF.x0 + SHELF.x1) / 2
const SHELF_WIDTH = SHELF.x1 - SHELF.x0
const FRONT_Z = BOARD_Z + SHELF.depth / 2 // front face of the boards
const CARD = { w: 0.9, h: 0.22 }
const BAY_PAD = 0.1 // gap between an upright and the first tape in a bay
const SHELF_TAPE_Z = SHELF.z + 0.1 // tapes stand a little in front of the back board edge
const LAYER_GAP = 0.01 // space between a front layer of tapes and the one behind
const MAX_LAYERS = 2 // tapes stand two deep in a bay before spilling to the next bay

const PULL_OUT = 0.06 // how far a hovered or picked tape slides forward on the shelf
const TILT_UP = 0.35 // extra tilt (radians) that brings the top of a pulled tape toward the viewer
const BIN_LIFT = 0.04 // how far a hovered or picked tape lifts out of the bin
const BIN_COLS = 4
const BIN_SPACING_X = 0.26
const BIN_SPACING_Z = 0.2
const DAMP = 12 // easing speed for hover animation

/**
 * Position of the `index`-th tape in a bay. Tapes fill each row left to right,
 * rows bottom to top, and then the next layer forward. Layer 0 stands on the
 * back half of the board; further layers stand in front of it.
 */
function bayTapePosition(bay, index) {
  const left = SHELF.uprightXs[bay] + UPRIGHT.w / 2
  const right = SHELF.uprightXs[bay + 1] - UPRIGHT.w / 2
  const usable = right - left - BAY_PAD * 2
  const cols = Math.max(1, Math.floor((usable - CASSETTE.w) / CASSETTE.spacing) + 1)
  const perLayer = cols * SHELF.tapeRows.length

  const layer = Math.floor(index / perLayer)
  const within = index % perLayer
  const row = Math.floor(within / cols)
  const col = within % cols
  return {
    x: left + BAY_PAD + CASSETTE.w / 2 + col * CASSETTE.spacing,
    y: SHELF.tapeRows[row] + CASSETTE.h / 2 + 0.01,
    z: SHELF_TAPE_Z + layer * (CASSETTE.d + LAYER_GAP),
    perLayer,
  }
}

/**
 * Assign every track a shelf position. Section i fills bay i. When a bay is
 * full, the next tapes go into the next bay with room, so no track is dropped.
 * The last bay has no limit and keeps stacking layers forward.
 */
function layoutShelf(sections) {
  const bays = SHELF.uprightXs.length - 1
  const lastBay = bays - 1
  const used = new Array(bays).fill(0)
  const capacity = (bay) => {
    if (bay === lastBay) return Infinity
    return bayTapePosition(bay, 0).perLayer * MAX_LAYERS
  }

  const items = []
  sections.forEach((section, sectionIndex) => {
    for (const track of section.tracks) {
      let bay = sectionIndex
      while (bay < lastBay && used[bay] >= capacity(bay)) bay++
      items.push({ track, bay, base: bayTapePosition(bay, used[bay]) })
      used[bay]++
    }
  })

  // A bay that fits in one layer: spread its tapes over every row and centre
  // each row, so a small library fills the shelf instead of leaving the top
  // rows empty.
  for (let bay = 0; bay < bays; bay++) {
    const inBay = items.filter((it) => it.bay === bay)
    const { perLayer } = bayTapePosition(bay, 0)
    if (!inBay.length || inBay.length > perLayer) continue
    const rows = SHELF.tapeRows.length
    const perRow = Math.ceil(inBay.length / rows)
    const centre = (SHELF.uprightXs[bay] + SHELF.uprightXs[bay + 1]) / 2
    // Fill eye level first: middle row, then top, then bottom.
    const rowOrder = rows === 3 ? [1, 2, 0] : [...Array(rows).keys()]
    inBay.forEach((it, i) => {
      const r = Math.floor(i / perRow)
      const inRow = Math.min(perRow, inBay.length - r * perRow)
      const col = i % perRow
      it.base = {
        ...it.base,
        x: centre + (col - (inRow - 1) / 2) * CASSETTE.spacing,
        y: SHELF.tapeRows[rowOrder[r]] + CASSETTE.h / 2 + 0.01,
        z: SHELF_TAPE_Z,
      }
    })
  }
  return items
}

/** Bargain bin: tapes lie face-up in a grid over the bin's open top. */
function binPosition(index) {
  const col = index % BIN_COLS
  const row = Math.floor(index / BIN_COLS)
  return {
    x: BIN.x + (col - (BIN_COLS - 1) / 2) * BIN_SPACING_X,
    y: BIN.h + CASSETTE.d / 2 + 0.002,
    z: BIN.z + (row - 0.5) * BIN_SPACING_Z,
    // Slight, deterministic turn so the tapes do not look gridded.
    yaw: ((index * 5) % 7 - 3) * 0.08,
  }
}

function makeCanvas(width, height) {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  return canvas
}

/** Section card: a board above a bay with the mood name on it. */
function makeSectionCardTexture(label, look, accent) {
  const canvas = makeCanvas(512, 128)
  const ctx = canvas.getContext('2d')
  const night = !!look.night
  const border = night ? accent : look.ink

  ctx.fillStyle = look.cardBg
  ctx.fillRect(0, 0, 512, 128)

  ctx.strokeStyle = border
  ctx.lineWidth = 8
  if (night) {
    ctx.shadowColor = accent
    ctx.shadowBlur = 14
  }
  ctx.strokeRect(10, 10, 492, 108)
  ctx.shadowBlur = 0

  // Shrink long labels so they stay inside the border.
  const maxWidth = 450
  let size = 60
  ctx.font = `bold ${size}px monospace`
  const measured = ctx.measureText(label).width
  if (measured > maxWidth) size = Math.floor((60 * maxWidth) / measured)
  ctx.font = `bold ${size}px monospace`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillStyle = night ? accent : look.cardText
  if (night) {
    ctx.shadowColor = accent
    ctx.shadowBlur = 10
  }
  ctx.fillText(label, 256, 66)

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 8
  return texture
}

/** Small star sticker, shared by every favourite tape. */
function makeStarTexture() {
  const canvas = makeCanvas(64, 64)
  const ctx = canvas.getContext('2d')
  ctx.beginPath()
  for (let i = 0; i < 10; i++) {
    const angle = -Math.PI / 2 + (i * Math.PI) / 5
    const radius = i % 2 === 0 ? 27 : 12
    const x = 32 + Math.cos(angle) * radius
    const y = 32 + Math.sin(angle) * radius
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
  ctx.closePath()
  ctx.fillStyle = '#ffd23f'
  ctx.fill()
  ctx.lineWidth = 4
  ctx.strokeStyle = '#7a4b00'
  ctx.stroke()

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

/**
 * Materials for one case: dark sides and a front that uses the cassette
 * texture. Created per case and disposed with it.
 */
function useCaseMaterials(texture, look) {
  const materials = useMemo(() => {
    const side = new THREE.MeshStandardMaterial({
      color: look.night ? '#1a1426' : '#3b3430',
      roughness: 0.6,
    })
    const front = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: look.night ? 0.35 : 0.7,
    })
    // BoxGeometry face order: +x, -x, +y, -y, +z (front), -z.
    return [side, side, side, side, front, side]
  }, [texture, look])

  useEffect(
    () => () => {
      new Set(materials).forEach((m) => m.dispose())
    },
    [materials],
  )
  return materials
}

/**
 * One cassette. `bin` tapes lie flat and lift when hovered. Shelf tapes slide
 * forward and tilt up when hovered or picked. Clicking calls onPick(track).
 */
function Cassette({ track, look, base, bin = false, pulled = false, loaded = false, favorite = false, starTex, onPick, onHover }) {
  const group = useRef(null)
  const [hovered, setHovered] = useState(false)
  useCursor(hovered)

  const texture = useCassetteTexture(track, look)
  const materials = useCaseMaterials(texture, look)

  // Eased values, so hover and pick animate smoothly.
  const anim = useRef({ lift: 0, tilt: bin ? 0 : CASSETTE.tilt })
  const lifted = hovered || pulled

  useFrame((_, dt) => {
    const a = anim.current
    const g = group.current
    if (!g) return
    if (bin) {
      a.lift = THREE.MathUtils.damp(a.lift, lifted ? BIN_LIFT : 0, DAMP, dt)
      g.position.set(base.x, base.y + a.lift, base.z)
      // Lay flat (face up), then turn around the vertical axis.
      g.rotation.set(-Math.PI / 2, base.yaw, 0, 'YXZ')
    } else {
      const tilt = lifted ? CASSETTE.tilt + TILT_UP : CASSETTE.tilt
      a.lift = THREE.MathUtils.damp(a.lift, lifted ? PULL_OUT : 0, DAMP, dt)
      a.tilt = THREE.MathUtils.damp(a.tilt, tilt, DAMP, dt)
      g.position.set(base.x, base.y, base.z + a.lift)
      g.rotation.set(a.tilt, 0, 0, 'XYZ')
    }
  })

  const marker = useMemo(() => {
    if (!loaded || bin) return null
    // The marker sits on the shelf board in front of the tape. Its position is
    // fixed, so it does not move when the tape is pulled out.
    const boardY = base.y - CASSETTE.h / 2 - 0.01
    return { y: boardY + 0.005, z: base.z + 0.05 }
  }, [loaded, bin, base])

  return (
    <>
      <group ref={group}>
        <mesh
          material={materials}
          onPointerOver={(e) => {
            e.stopPropagation()
            setHovered(true)
            onHover?.(track)
          }}
          onPointerOut={() => {
            setHovered(false)
            onHover?.(null)
          }}
          onClick={(e) => {
            e.stopPropagation()
            onPick?.(track)
          }}
        >
          <boxGeometry args={[CASSETTE.w, CASSETTE.h, CASSETTE.d]} />
        </mesh>
        {favorite && (
          // Star sticker in the top-right corner of the front face.
          <mesh position={[CASSETTE.w / 2 - 0.03, CASSETTE.h / 2 - 0.03, CASSETTE.d / 2 + 0.002]}>
            <planeGeometry args={[0.045, 0.045]} />
            <meshBasicMaterial map={starTex} transparent alphaTest={0.4} toneMapped={false} />
          </mesh>
        )}
      </group>

      {marker && (
        <mesh position={[base.x, marker.y, marker.z]} rotation={[-Math.PI / 2, 0, 0]}>
          {look.night ? (
            <>
              <planeGeometry args={[0.14, 0.03]} />
              <meshStandardMaterial
                color={look.accentB}
                emissive={look.accentB}
                emissiveIntensity={2}
                toneMapped={false}
              />
            </>
          ) : (
            <>
              {/* Paper tag */}
              <planeGeometry args={[0.09, 0.035]} />
              <meshStandardMaterial color={look.cardBg} roughness={0.9} />
            </>
          )}
        </mesh>
      )}
    </>
  )
}

/** The shelf unit, the mood sections and the bargain bin, with their tapes. */
export default function Shelves({ look, tracks = NO_TRACKS, favorites = NO_IDS, loadedId, pickedId, onPick, onHover }) {
  const sections = useMemo(() => groupTracksIntoSections(tracks), [tracks])
  const shelfItems = useMemo(() => layoutShelf(sections), [sections])
  const binTracks = useMemo(() => bargainBinTracks(tracks, 8), [tracks])
  const favouriteIds = useMemo(() => new Set(favorites), [favorites])

  const starTex = useMemo(() => makeStarTexture(), [])
  useEffect(() => () => starTex.dispose(), [starTex])

  // One card per section, neon colours alternating in Neon Night.
  const cardTextures = useMemo(
    () =>
      sections.map((section, i) =>
        makeSectionCardTexture(section.label, look, i % 2 === 0 ? look.accentA : look.accentB),
      ),
    [sections, look],
  )
  useEffect(() => () => cardTextures.forEach((t) => t.dispose()), [cardTextures])

  const woodRoughness = look.night ? 0.5 : 0.8

  return (
    <group>
      {SHELF.boardYs.map((y) => (
        <mesh key={`board-${y}`} position={[SHELF_CENTRE_X, y, BOARD_Z]}>
          <boxGeometry args={[SHELF_WIDTH, 0.04, SHELF.depth]} />
          <meshStandardMaterial color={look.wood} roughness={woodRoughness} />
        </mesh>
      ))}

      {SHELF.uprightXs.map((x) => (
        <mesh key={`upright-${x}`} position={[x, UPRIGHT.h / 2, BOARD_Z]}>
          <boxGeometry args={[UPRIGHT.w, UPRIGHT.h, UPRIGHT.d]} />
          <meshStandardMaterial color={look.woodDark} roughness={woodRoughness} />
        </mesh>
      ))}

      {sections.map((section, i) => {
        const cardX = (SHELF.uprightXs[i] + SHELF.uprightXs[i + 1]) / 2
        const tex = cardTextures[i]
        return (
          <mesh key={`card-${section.tag}`} position={[cardX, SHELF.sectionCardY, FRONT_Z + 0.01]}>
            <planeGeometry args={[CARD.w, CARD.h]} />
            {look.night ? (
              <meshBasicMaterial map={tex} toneMapped={false} />
            ) : (
              <meshStandardMaterial map={tex} roughness={0.9} />
            )}
          </mesh>
        )
      })}

      {shelfItems.map(({ track, base }) => (
        <Cassette
          key={track.id}
          track={track}
          look={look}
          base={base}
          pulled={track.id === pickedId}
          loaded={track.id === loadedId}
          favorite={favouriteIds.has(track.id)}
          starTex={starTex}
          onPick={onPick}
          onHover={onHover}
        />
      ))}

      {binTracks.map((track, i) => (
        <Cassette
          key={`bin-${track.id}`}
          track={track}
          look={look}
          base={binPosition(i)}
          bin
          pulled={track.id === pickedId}
          favorite={favouriteIds.has(track.id)}
          starTex={starTex}
          onPick={onPick}
          onHover={onHover}
        />
      ))}
    </group>
  )
}
