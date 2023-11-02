import { Api, type Preset, type SceneType, type Session } from './interfaces'
import { sendChatOobabooga, sendChatOobaboogaStream } from './apiOobabooga'
import { sendChatOpenAi, sendChatOpenAiStream } from './apiOpenAi'
import { isWithinTokenLimit } from 'gpt-tokenizer'
import llamaTokenizer from 'llama-tokenizer-js'
import { sendChatKoboldAi, sendChatKoboldAiStream } from './apiKoboldAi'
import { getStartEndIndex } from '$lib'
import { get } from 'svelte/store'
import { sessionPath, settings } from './store'
import { basenameOf } from './fs'
import { tcSaveMemory } from './tauriCompat'

export const systemRole = 'system'
export const assistantRole = 'assistant'
export const userRole = 'user'
export const charSetting = 'set_char'
export const userSetting = 'set_user'
export const endTag = 'end_tag'
export const startStory = 'start_story'
export const chatHistory = 'chat_history'
export const authorNote = 'author_note'
export const globalNote = 'global_note'
export const loreBook = 'lore_book'
export const firstScene = 'first_scene'
export const assocMemory = 'assoc_memory'

export const roles = [
  { value: systemRole, name: 'System' },
  { value: assistantRole, name: 'Assistant' },
  { value: userRole, name: 'User' },
  { value: '-', name: '-' },
  { value: charSetting, name: 'Char setting' },
  { value: userSetting, name: 'User setting' },
  { value: endTag, name: 'End tag' },
  { value: chatHistory, name: 'Chat history' },
  { value: authorNote, name: 'Author note' },
  { value: globalNote, name: 'Global note' },
  { value: loreBook, name: 'Lore book' },
  { value: firstScene, name: 'First scene' },
  { value: assocMemory, name: 'Assoc Memory' }
]

export const chatRoles = [
  { value: systemRole, name: 'System' },
  { value: assistantRole, name: 'Assistant' },
  { value: userRole, name: 'User' }
]

export let sendChat = sendChatOobabooga
export let sendChatStream = sendChatOobaboogaStream
const tokenLimit = 4096

function countTokensGpt(str: string): number {
  if (str) {
    return isWithinTokenLimit(str, tokenLimit) || 0
  }
  return 0
}

function countTokensLlama(str: string) {
  return llamaTokenizer.encode(str).length
}

export let countTokensApi = countTokensGpt

export function changeApi(api: Api) {
  switch (api) {
    case Api.OpenAi:
      sendChat = sendChatOpenAi
      sendChatStream = sendChatOpenAiStream
      countTokensApi = countTokensGpt
      break
    case Api.Oobabooga:
      sendChat = sendChatOobabooga
      sendChatStream = sendChatOobaboogaStream
      countTokensApi = countTokensLlama
      break
    case Api.KoboldAi:
      sendChat = sendChatKoboldAi
      sendChatStream = sendChatKoboldAiStream
      countTokensApi = countTokensLlama
      break
  }
}

function systemPrefix(preset: Preset) {
  switch (preset.api) {
    case Api.Oobabooga:
      return preset.oobabooga.systemPrefix
    case Api.KoboldAi:
      return preset.koboldAi.systemPrefix
    default:
      return ''
  }
}

function assistantPrefix(preset: Preset) {
  switch (preset.api) {
    case Api.Oobabooga:
      return preset.oobabooga.assistantPrefix
    case Api.KoboldAi:
      return preset.koboldAi.assistantPrefix
    default:
      return ''
  }
}

function userPrefix(preset: Preset) {
  switch (preset.api) {
    case Api.Oobabooga:
      return preset.oobabooga.userPrefix
    case Api.KoboldAi:
      return preset.koboldAi.userPrefix
    default:
      return ''
  }
}

function addRolePrefix(preset: Preset, scene: SceneType, dialogues: SceneType[]) {
  const oneInstruction = get(settings).oneInstruction
  const last =
    dialogues[dialogues.length - 1] === scene ||
    (preset.streaming && dialogues[dialogues.length - 2] === scene)
  if ((oneInstruction && last && scene.role === userRole) || !oneInstruction) {
    switch (scene.role) {
      case systemRole:
        return systemPrefix(preset)
      case assistantRole:
        return assistantPrefix(preset)
      case userRole:
        return userPrefix(preset)
      default:
        return ''
    }
  }
  return ''
}

export function generatePrompt(
  preset: Preset,
  prologues: SceneType[],
  dialogues: SceneType[],
  memories: string,
  summary = false
) {
  let prompt = ''
  const oneInstruction = get(settings).oneInstruction
  if (oneInstruction) {
    prompt += systemPrefix(preset)
  }
  let sentChatHistory = false
  for (const scene of prologues) {
    switch (scene.role) {
      case startStory:
        break
      case chatHistory: {
        const { start, end } = getStartEndIndex(scene, dialogues, preset.streaming)
        for (const mesg of dialogues.slice(start, end)) {
          prompt += addRolePrefix(preset, mesg, dialogues) + mesg.textContent + '\n'
        }
        sentChatHistory = true
        break
      }
      case assocMemory: {
        if (memories) {
          prompt += addRolePrefix(preset, scene, dialogues) + scene.textContent + '\n'
          prompt += memories
        }
        break
      }
      default:
        prompt += addRolePrefix(preset, scene, dialogues) + scene.textContent + '\n'
    }
  }
  if (!sentChatHistory) {
    if (summary) {
      prompt += '<Story>\n'
    }
    for (const scene of dialogues) {
      if (summary) {
        prompt += scene.textContent + '\n'
      } else {
        prompt += addRolePrefix(preset, scene, dialogues) + scene.textContent + '\n'
      }
    }
    if (summary) {
      prompt += '</Story>\n'
    }
  }
  if (oneInstruction || summary) {
    prompt += assistantPrefix(preset)
  }
  return prompt
}

export function tokensOver(preset: Preset, tokens: number) {
  switch (preset.api) {
    case Api.OpenAi:
      return tokens + preset.openAi.maxTokens > preset.openAi.contextSize
    case Api.Oobabooga:
      return tokens + preset.oobabooga.maxTokens > preset.oobabooga.contextSize
    case Api.KoboldAi:
      return tokens + preset.koboldAi.maxTokens > preset.koboldAi.contextSize
  }
  return false
}

export async function saveMemory(scene: SceneType) {
  const collection = basenameOf(get(sessionPath))
  const meta = { image: scene.image, role: scene.role }
  await tcSaveMemory(collection, scene.content, meta, String(scene.id))
}

export async function generatePromptCheck(
  preset: Preset,
  prologues: SceneType[],
  dialogues: SceneType[],
  memories: string,
  session: Session,
  summary = false
) {
  let prompt = ''
  let tokens = 0
  while (session.startIndex < dialogues.length) {
    prompt = generatePrompt(
      preset,
      prologues,
      dialogues.slice(session.startIndex),
      memories,
      summary
    )
    tokens = countTokensApi(prompt)
    if (tokensOver(preset, tokens)) {
      await saveMemory(dialogues[session.startIndex])
      session.startIndex++
    } else {
      break
    }
  }
  return { prompt, tokens }
}
