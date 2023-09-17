import { readTextFile } from '@tauri-apps/api/fs'
import { sessionExt } from './fs'
import type { Session } from './interfaces'
import { open } from '@tauri-apps/api/dialog'

export async function loadSession(path: string) {
  const json = await readTextFile(path)
  const session = JSON.parse(json) as Session
  return session
}

export async function loadSessionDialog(): Promise<[Session | null, string]> {
  const selected = await open({ filters: [{ name: '*', extensions: ['json', sessionExt] }] })
  if (typeof selected === 'string') {
    return [await loadSession(selected), selected]
  }
  return [null, '']
}
