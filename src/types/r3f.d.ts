// react-three-fiber 8 augments the global JSX namespace, but @types/react 19
// moved intrinsic elements to React.JSX. Register three.js elements there too.
import type { ThreeElements } from '@react-three/fiber'

declare module 'react' {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements extends ThreeElements {}
  }
}
