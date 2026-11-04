// STUB — replaced by the Room agent.
import { ROOM } from './shopLayout'
export default function Room({ look }) {
  return (
    <group>
      <ambientLight intensity={1} />
      <mesh rotation-x={-Math.PI / 2} position={[0, 0, 0]}>
        <planeGeometry args={[ROOM.maxX - ROOM.minX, ROOM.maxZ - ROOM.minZ]} />
        <meshStandardMaterial color={look.floor} />
      </mesh>
    </group>
  )
}
