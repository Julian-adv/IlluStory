import type { Lorebook } from './interfaces'
import { tcReadTextFile } from './tauriCompat'

export async function loadLorebook(path: string): Promise<Lorebook> {
  const json = await tcReadTextFile(path)
  const lorebook = JSON.parse(json)
  return lorebook
}
