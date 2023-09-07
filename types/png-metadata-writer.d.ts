declare module 'png-metadata-writer' {
  export function readMetadata(buffer: Uint8Array): {
    tEXt: { chara: string }
    pHYs: { x: number; y: number; units: RESOLUTION_UNITS }
    [string]: true
  }
}
