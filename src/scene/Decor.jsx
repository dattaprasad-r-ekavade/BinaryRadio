// @ts-nocheck — react-three-fiber scene component; typed migration tracked with the other audio/visual refs
import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { DOOR, ROOM, WINDOW } from './shopLayout'

/**
 * Furnishing that makes the shop read as a full, lived-in room: a rug, a
 * "new arrivals" wall rack, a window bench, plants, pendant lamps, posters
 * and a door on the front wall. Decorative only (no interaction).
 */

function canvasTexture(w, h, draw) {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  draw(c.getContext('2d'), w, h)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 8
  return t
}

function makeRug(look) {
  return canvasTexture(512, 320, (g, w, h) => {
    const night = look.night
    g.fillStyle = night ? '#2a1450' : '#b5523b'
    g.fillRect(0, 0, w, h)
    g.strokeStyle = night ? '#ff2fb4' : '#f1dcb8'
    g.lineWidth = 14
    g.strokeRect(20, 20, w - 40, h - 40)
    g.lineWidth = 5
    g.strokeStyle = night ? '#22e6ff' : '#e9b36a'
    g.strokeRect(46, 46, w - 92, h - 92)
    // diamonds down the middle
    g.fillStyle = night ? '#8a5cff' : '#e9b36a'
    for (let i = 0; i < 5; i++) {
      const x = 110 + i * 73
      g.beginPath()
      g.moveTo(x, h / 2 - 34)
      g.lineTo(x + 26, h / 2)
      g.lineTo(x, h / 2 + 34)
      g.lineTo(x - 26, h / 2)
      g.closePath()
      g.fill()
    }
  })
}

function makePoster(seed, look) {
  return canvasTexture(256, 360, (g, w, h) => {
    const palettes = look.night
      ? [
          ['#ff2fb4', '#1a0b38', '#22e6ff'],
          ['#22e6ff', '#120a2a', '#ffcf6b'],
          ['#8a5cff', '#0d0718', '#ff8fe0'],
        ]
      : [
          ['#e07a5f', '#3d405b', '#f2cc8f'],
          ['#81b29a', '#f4f1de', '#e07a5f'],
          ['#f2cc8f', '#264653', '#e76f51'],
        ]
    const [a, b, c] = palettes[seed % palettes.length]
    g.fillStyle = b
    g.fillRect(0, 0, w, h)
    if (seed % 3 === 0) {
      // sun over stripes
      g.fillStyle = a
      g.beginPath()
      g.arc(w / 2, h * 0.42, 70, 0, Math.PI * 2)
      g.fill()
      g.fillStyle = b
      for (let y = h * 0.42; y < h * 0.42 + 70; y += 14) g.fillRect(40, y, w - 80, 6)
    } else if (seed % 3 === 1) {
      // cassette outline
      g.strokeStyle = a
      g.lineWidth = 10
      g.strokeRect(40, 110, w - 80, 120)
      g.beginPath()
      g.arc(95, 170, 22, 0, Math.PI * 2)
      g.arc(w - 95, 170, 22, 0, Math.PI * 2)
      g.stroke()
    } else {
      // waveform
      g.strokeStyle = a
      g.lineWidth = 8
      g.beginPath()
      for (let x = 20; x <= w - 20; x += 4) g.lineTo(x, h * 0.45 + Math.sin(x / 14) * 46 * Math.sin(x / 70))
      g.stroke()
    }
    g.fillStyle = c
    g.font = 'bold 30px monospace'
    g.textAlign = 'center'
    g.fillText(['LIVE TONIGHT', 'NEW TAPES', 'PLAY LOUD'][seed % 3], w / 2, h - 44)
  })
}

function makeDoor(look) {
  return canvasTexture(256, 512, (g, w, h) => {
    g.fillStyle = look.night ? '#1d1233' : '#7a4a2a'
    g.fillRect(0, 0, w, h)
    g.fillStyle = look.night ? '#0b0716' : '#9fd3ff'
    g.fillRect(36, 40, w - 72, 210) // glass
    g.strokeStyle = look.night ? '#ff2fb4' : '#5a341c'
    g.lineWidth = 10
    g.strokeRect(36, 40, w - 72, 210)
    g.strokeRect(36, 290, w - 72, 180)
    g.fillStyle = look.night ? '#ff2fb4' : '#c8553d'
    g.fillRect(48, 120, w - 96, 52)
    g.fillStyle = look.night ? '#05030b' : '#fff4dc'
    g.font = 'bold 40px monospace'
    g.textAlign = 'center'
    g.textBaseline = 'middle'
    g.fillText('OPEN', w / 2, 148)
    g.fillStyle = look.night ? '#ffcf6b' : '#e9b36a'
    g.beginPath()
    g.arc(w - 46, 300, 10, 0, Math.PI * 2)
    g.fill()
  })
}

function makeRackSign(look) {
  return canvasTexture(512, 112, (g, w, h) => {
    g.fillStyle = look.night ? '#0d0718' : '#fffaf0'
    g.fillRect(0, 0, w, h)
    g.strokeStyle = look.night ? '#ffcf6b' : '#2a1a10'
    g.lineWidth = 8
    g.strokeRect(6, 6, w - 12, h - 12)
    g.fillStyle = look.night ? '#ffcf6b' : '#2a1a10'
    g.font = 'bold 58px monospace'
    g.textAlign = 'center'
    g.textBaseline = 'middle'
    g.fillText('NEW ARRIVALS', w / 2, h / 2 + 3)
  })
}

function Plant({ position, scale = 1, look }) {
  const leaf = look.night ? '#2fd39a' : '#5f8f4e'
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0.2, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.2, 0.16, 0.4, 20]} />
        <meshStandardMaterial color={look.night ? '#3b2766' : '#c8553d'} roughness={0.8} />
      </mesh>
      {[
        [0, 0.75, 0, 0.32],
        [0.14, 0.62, 0.08, 0.24],
        [-0.13, 0.66, -0.06, 0.26],
        [0.02, 1.0, 0.02, 0.22],
      ].map(([x, y, z, r], i) => (
        <mesh key={i} position={[x, y, z]} castShadow>
          <icosahedronGeometry args={[r, 1]} />
          <meshStandardMaterial color={leaf} roughness={0.7} flatShading />
        </mesh>
      ))}
    </group>
  )
}

function PendantLamp({ x, z, look }) {
  const glow = look.night ? '#ffcf6b' : '#fff1c9'
  return (
    <group position={[x, ROOM.height, z]}>
      <mesh position={[0, -0.3, 0]}>
        <cylinderGeometry args={[0.008, 0.008, 0.6, 6]} />
        <meshStandardMaterial color="#222" />
      </mesh>
      <mesh position={[0, -0.68, 0]} castShadow>
        <coneGeometry args={[0.24, 0.22, 24, 1, true]} />
        <meshStandardMaterial color={look.night ? '#2a1b4a' : '#7fa07a'} side={THREE.DoubleSide} roughness={0.6} />
      </mesh>
      <mesh position={[0, -0.75, 0]}>
        <sphereGeometry args={[0.07, 16, 12]} />
        <meshBasicMaterial color={glow} toneMapped={false} />
      </mesh>
      <pointLight position={[0, -0.82, 0]} color={glow} intensity={look.night ? 1.2 : 0.8} distance={3.2} decay={2} />
    </group>
  )
}

export default function Decor({ look, tracks = [] }) {
  const tex = useMemo(
    () => ({
      rug: makeRug(look),
      door: makeDoor(look),
      rack: makeRackSign(look),
      posters: [0, 1, 2].map((i) => makePoster(i, look)),
    }),
    [look],
  )
  useEffect(
    () => () => {
      tex.rug.dispose()
      tex.door.dispose()
      tex.rack.dispose()
      tex.posters.forEach((p) => p.dispose())
    },
    [tex],
  )

  const wood = look.wood
  const woodDark = look.woodDark
  const rx = ROOM.maxX - 0.02 // right wall surface
  // Face-out display cassettes on the right-wall rack, coloured like the real tapes.
  const rackTapes = useMemo(() => {
    const out = []
    const src = tracks.length ? tracks : [{ color: '#444', accent: '#888' }]
    let k = 0
    for (const y of [1.05, 1.45, 1.85]) {
      for (let i = 0; i < 6; i++) {
        const t = src[(k * 5 + 3) % src.length]
        out.push({ key: `${y}-${i}`, y, z: -1.55 + i * 0.36, color: t.color, accent: t.accent })
        k++
      }
    }
    return out
  }, [tracks])

  return (
    <group>
      {/* Rug in front of the counter */}
      <mesh rotation-x={-Math.PI / 2} position={[-0.6, 0.004, 2.2]} receiveShadow>
        <planeGeometry args={[3.2, 2.0]} />
        <meshStandardMaterial map={tex.rug} roughness={0.95} />
      </mesh>

      {/* NEW ARRIVALS rack on the right wall */}
      <group>
        <mesh position={[rx - 0.01, 2.25, -0.65]} rotation-y={-Math.PI / 2}>
          <planeGeometry args={[1.3, 0.28]} />
          <meshBasicMaterial map={tex.rack} toneMapped={false} />
        </mesh>
        <mesh position={[rx - 0.03, 1.45, -0.65]} castShadow receiveShadow>
          <boxGeometry args={[0.05, 1.25, 2.35]} />
          <meshStandardMaterial color={woodDark} roughness={0.8} />
        </mesh>
        {[0.95, 1.35, 1.75].map((y) => (
          <mesh key={y} position={[rx - 0.14, y, -0.65]} castShadow receiveShadow>
            <boxGeometry args={[0.2, 0.03, 2.3]} />
            <meshStandardMaterial color={wood} roughness={0.8} />
          </mesh>
        ))}
        {rackTapes.map((t) => (
          <group key={t.key} position={[rx - 0.1, t.y + 0.09, t.z]} rotation={[0, -Math.PI / 2, 0.12]}>
            <mesh castShadow>
              <boxGeometry args={[0.26, 0.165, 0.03]} />
              <meshStandardMaterial color={t.color} roughness={0.6} />
            </mesh>
            <mesh position={[0, 0.055, 0.016]}>
              <planeGeometry args={[0.26, 0.04]} />
              <meshStandardMaterial
                color={t.accent}
                emissive={look.night ? t.accent : '#000'}
                emissiveIntensity={look.night ? 0.6 : 0}
              />
            </mesh>
            <mesh position={[0, -0.01, 0.016]}>
              <planeGeometry args={[0.17, 0.05]} />
              <meshStandardMaterial color="#efe6d4" />
            </mesh>
          </group>
        ))}
      </group>

      {/* Bench under the window */}
      <group position={[ROOM.minX + 0.3, 0, WINDOW.z]}>
        <mesh position={[0, 0.42, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.5, 0.1, 1.7]} />
          <meshStandardMaterial color={wood} roughness={0.8} />
        </mesh>
        <mesh position={[0.02, 0.52, 0]} castShadow>
          <boxGeometry args={[0.42, 0.1, 1.6]} />
          <meshStandardMaterial color={look.night ? '#3b1f5e' : '#7fa07a'} roughness={0.95} />
        </mesh>
        {[-0.7, 0.7].map((z) => (
          <mesh key={z} position={[0, 0.19, z]} castShadow>
            <boxGeometry args={[0.44, 0.38, 0.08]} />
            <meshStandardMaterial color={woodDark} roughness={0.8} />
          </mesh>
        ))}
      </group>

      {/* Plants in the corners */}
      <Plant look={look} position={[ROOM.maxX - 0.45, 0, ROOM.minZ + 0.45]} scale={1.15} />
      <Plant look={look} position={[ROOM.minX + 0.45, 0, ROOM.maxZ - 0.6]} scale={1.0} />
      <Plant look={look} position={[ROOM.maxX - 0.5, 0, 1.6]} scale={0.9} />

      {/* Pendant lamps */}
      <PendantLamp x={-1.5} z={0.6} look={look} />
      <PendantLamp x={-3.0} z={-1.9} look={look} />
      <PendantLamp x={2.6} z={2.2} look={look} />

      {/* Posters on the right wall */}
      {[
        [rx, 1.75, 2.0],
        [rx, 1.75, 3.0],
      ].map(([x, y, z], i) => (
        <mesh key={i} position={[x - 0.005, y, z]} rotation-y={-Math.PI / 2}>
          <planeGeometry args={[0.62, 0.86]} />
          <meshStandardMaterial map={tex.posters[i + 1]} roughness={0.8} />
        </mesh>
      ))}
      {/* and one on the front wall */}
      <mesh position={[-1.6, 1.75, ROOM.maxZ - 0.005]} rotation-y={Math.PI}>
        <planeGeometry args={[0.62, 0.86]} />
        <meshStandardMaterial map={tex.posters[0]} roughness={0.8} />
      </mesh>

      {/* Door on the front wall */}
      <mesh position={[DOOR.x, DOOR.h / 2, ROOM.maxZ - 0.01]} rotation-y={Math.PI}>
        <planeGeometry args={[DOOR.w, DOOR.h]} />
        <meshStandardMaterial map={tex.door} roughness={0.7} />
      </mesh>

      {/* Skirting along the walls so the floor meets the walls cleanly */}
      {[
        [(ROOM.minX + ROOM.maxX) / 2, ROOM.minZ + 0.02, ROOM.maxX - ROOM.minX, 0],
        [(ROOM.minX + ROOM.maxX) / 2, ROOM.maxZ - 0.02, ROOM.maxX - ROOM.minX, 0],
        [ROOM.minX + 0.02, (ROOM.minZ + ROOM.maxZ) / 2, ROOM.maxZ - ROOM.minZ, 1],
        [ROOM.maxX - 0.02, (ROOM.minZ + ROOM.maxZ) / 2, ROOM.maxZ - ROOM.minZ, 1],
      ].map(([x, z, len, side], i) => (
        <mesh key={i} position={[x, 0.06, z]} rotation-y={side ? Math.PI / 2 : 0}>
          <boxGeometry args={[len, 0.12, 0.03]} />
          <meshStandardMaterial color={woodDark} roughness={0.8} />
        </mesh>
      ))}
    </group>
  )
}
