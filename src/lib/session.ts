import { readTextFile } from '@tauri-apps/api/fs'
import { saveObjQuietly, sessionExt } from './fs'
import type { Char, SceneType, Session, StringDictionary } from './interfaces'
import { open } from '@tauri-apps/api/dialog'

export async function loadSession(path: string) {
  const json = await readTextFile(path)
  const session = JSON.parse(json) as Session
  if (!session.lastSpeaker) {
    session.lastSpeaker = 0
  }
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

export function replaceName(scene: SceneType, dict: StringDictionary): SceneType {
  let content = scene.textContent ? scene.textContent : scene.content
  if (content) {
    for (const [key, value] of Object.entries(dict)) {
      const regex = new RegExp(`{{${key}}}`, 'g')
      content = content.replace(regex, value)
      const regex2 = new RegExp(`<${key}>`, 'g')
      content = content.replace(regex2, value)
    }
  }
  return { ...scene, content }
}

export function replaceNames(prompts: SceneType[], dict: StringDictionary) {
  return prompts.map(prompt => replaceName(prompt, dict))
}

export function replaceDict(session: Session, chars: Char[], user: Char) {
  const dict: StringDictionary = {}
  const lastSpeaker = session.lastSpeaker
  dict['char'] = chars[lastSpeaker].name
  dict['char_gender'] = chars[lastSpeaker].gender
  dict['user'] = user.name
  dict['user_gender'] = user.gender
  return dict
}
