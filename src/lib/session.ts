import { readTextFile } from '@tauri-apps/api/fs'
import { saveObjQuietly, sessionExt } from './fs'
import type { SceneType, Session } from './interfaces'
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

export async function saveSessionAuto(path: string, session: Session, dialogues: SceneType[]) {
  session.scenes = dialogues.map(scene => {
    return { id: scene.id, role: scene.role, content: scene.content }
  })
  await saveObjQuietly(path, session)
}
