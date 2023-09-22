import { readTextFile } from '@tauri-apps/api/fs'
import { saveObjQuietly, sessionExt } from './fs'
import type { Char, SceneType, Session, StringDictionary } from './interfaces'
import { open } from '@tauri-apps/api/dialog'
import { charSetting, userSetting } from './api'

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

export function replaceName(content: string, dict: StringDictionary): string {
  for (const [key, value] of Object.entries(dict)) {
    const regex = new RegExp(`{{${key}}}`, 'g')
    content = content.replace(regex, value)
    const regex2 = new RegExp(`<${key}>`, 'g')
    content = content.replace(regex2, value)
  }
  return content
}

export function replaceNames(prompts: SceneType[], dict: StringDictionary) {
  return prompts.map(prompt => {
    prompt.textContent = replaceName(prompt.content, dict)
    return prompt
  })
}

function replaceCharSetting(char: Char) {
  return `Name: ${char.name}\nTitle: ${char.title}\nGender: ${char.gender}\nVisual: ${char.visual}\nDescription: ${char.description}\n`
}

export function replaceChar(prompts: SceneType[], char: Char, user: Char) {
  return prompts.map(prompt => {
    let content = prompt.content
    if (prompt.role === charSetting) {
      content = replaceCharSetting(char)
    } else if (prompt.role === userSetting) {
      content = replaceCharSetting(user)
    }
    return { ...prompt, content }
  })
}

export function makeReplaceDict(char: Char, user: Char) {
  const dict: StringDictionary = {}
  dict['char'] = char.name
  dict['char_gender'] = char.gender
  dict['user'] = user.name
  dict['user_gender'] = user.gender
  return dict
}
