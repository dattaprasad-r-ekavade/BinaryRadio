// @ts-nocheck — react-three-fiber scene component; typed migration tracked with the other audio/visual refs
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing'

/**
 * Post effects per look. Neon Night gets bloom (only the brightest parts
 * glow), light film grain and a vignette. Cosy Day gets only a soft vignette.
 */
export default function Effects({ look }) {
  if (look.night) {
    return (
      <EffectComposer key={look.id} disableNormalPass>
        <Bloom mipmapBlur luminanceThreshold={0.85} intensity={0.9} radius={0.6} />
        <Vignette offset={0.3} darkness={0.6} />
      </EffectComposer>
    )
  }
  return (
    <EffectComposer key={look.id} disableNormalPass>
      <Vignette offset={0.35} darkness={0.35} />
    </EffectComposer>
  )
}
