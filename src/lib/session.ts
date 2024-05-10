import { saveObjQuietly, sessionExt } from './fs'
import type { Char, Lorebook, SceneType, Session, StringDictionary } from './interfaces'
import { charSetting, systemRole, userSetting } from './api'
import { tcConvertImageSrc, tcOpen, tcReadTextFile } from './tauriCompat'

export async function loadSession(path: string) {
  const json = await tcReadTextFile(path)
  const session = JSON.parse(json) as Session
  if (!session.nextSpeaker || typeof session.nextSpeaker === 'number') {
    session.nextSpeaker = 'auto'
  }
  if (!session.lorebookTriggers) {
    session.lorebookTriggers = []
  }
  session.scenes.forEach(scene => {
    scene.done = true
    if (scene.image) {
      const img = new Image()
      img.onload = function () {
        scene.imageSize = {
          width: (this as HTMLImageElement).width,
          height: (this as HTMLImageElement).height
        }
      }
      img.src = tcConvertImageSrc(scene.image)
    }
  })
  return session
}

export async function loadSessionDialog(): Promise<[Session | null, string]> {
  const selected = await tcOpen({ filters: [{ name: '*', extensions: [sessionExt] }] })
  if (typeof selected === 'string') {
    return [await loadSession(selected), selected]
  }
  return [null, '']
}

export function prepareForSave(session: Session, dialogues: SceneType[], lorebook: Lorebook) {
  session.scenes = dialogues.map(scene => {
    return {
      id: scene.id,
      role: scene.role,
      content: scene.content,
      image: scene.image,
      name: scene.name
    }
  })
  session.lorebookTriggers = lorebook.rules.map(rule => {
    return { id: rule.id, triggered: rule.triggered }
  })
  return session
}

export async function saveSessionAuto(
  path: string,
  session: Session,
  dialogues: SceneType[],
  lorebook: Lorebook
) {
  await saveObjQuietly(path, prepareForSave(session, dialogues, lorebook))
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

function replaceCharSetting(tag: string | undefined, char: Char) {
  if (tag) {
    return `<${tag}>\nName: ${char.name}\nTitle: ${char.title}\nGender: ${char.gender}\nDescription: ${char.description}\n</${tag}>\n`
  } else {
    return `Name: ${char.name}\nTitle: ${char.title}\nGender: ${char.gender}\nDescription: ${char.description}\n`
  }
}

function generateCharSetting(tag: string | undefined, char: Char, user: Char) {
  const charDesc = replaceCharSetting(tag, char)
  const dict = makeReplaceDict(char, user)
  return replaceName(charDesc, dict)
}

export function replaceChars(prompts: SceneType[], chars: Char[], speaker: Char, user: Char) {
  const newPrompts: SceneType[] = []
  for (const prompt of prompts) {
    if (prompt.role === charSetting) {
      if (prompt.allChars) {
        for (const char of chars) {
          const content = generateCharSetting(prompt.tag, char, user)
          const role = systemRole
          newPrompts.push({ ...prompt, role, content })
        }
      } else {
        const content = generateCharSetting(prompt.tag, speaker, user)
        newPrompts.push({ ...prompt, content })
      }
    } else if (prompt.role === userSetting) {
      const content = replaceCharSetting(prompt.tag, user)
      newPrompts.push({ ...prompt, content })
    } else {
      newPrompts.push(prompt)
    }
  }
  return newPrompts
}

export function makeReplaceDict(char: Char, user: Char) {
  const dict: StringDictionary = {}
  dict['char'] = char.name
  dict['char_gender'] = char.gender
  dict['user'] = user.name
  dict['user_gender'] = user.gender
  return dict
}
