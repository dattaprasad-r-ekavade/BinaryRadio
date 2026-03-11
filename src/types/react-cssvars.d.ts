import 'react'

declare module 'react' {
  interface CSSProperties {
    '--cc'?: string
    '--ca'?: string
    '--i'?: number | string
  }
}
