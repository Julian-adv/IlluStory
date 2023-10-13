import { Api, type Preset, type SceneType } from './interfaces'
import { sendChatOobabooga, sendChatOobaboogaStream } from './apiOobabooga'
import { sendChatOpenAi, sendChatOpenAiStream } from './apiOpenAi'
import { isWithinTokenLimit } from 'gpt-tokenizer'
import llamaTokenizer from 'llama-tokenizer-js'
import { sendChatKoboldAi, sendChatKoboldAiStream } from './apiKoboldAi'
import { getStartEndIndex } from '$lib'
import { get } from 'svelte/store'
import { memory, settings } from './store'

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

function addRolePrefix(preset: Preset, scene: SceneType) {
  if (get(settings).oneInstruction) {
    return ''
  }
  switch (scene.role) {
    case systemRole:
      return preset.oobabooga.systemPrefix
    case assistantRole:
      return preset.oobabooga.assistantPrefix
    case userRole:
      return preset.oobabooga.userPrefix
    default:
      return ''
  }
}

export function generatePrompt(
  preset: Preset,
  prologues: SceneType[],
  dialogues: SceneType[],
  sendStartIndex: number,
  summary = false
) {
  let prompt = ''
  const oneInstruction = get(settings).oneInstruction
  if (oneInstruction) {
    prompt += preset.oobabooga.systemPrefix
  }
  let sentChatHistory = false
  for (const scene of prologues) {
    switch (scene.role) {
      case startStory:
        break
      case chatHistory: {
        const { start, end } = getStartEndIndex(scene, dialogues, sendStartIndex)
        for (const mesg of dialogues.slice(start, end)) {
          prompt += addRolePrefix(preset, mesg) + mesg.textContent + '\n'
        }
        sentChatHistory = true
        break
      }
      case assocMemory: {
        let memoryPrompt = ''
        let i = 1
        for (const mesg of get(memory)) {
          if (mesg.content) {
            memoryPrompt += `<Memory fragment ${i++}>\n`
            memoryPrompt += addRolePrefix(preset, mesg) + mesg.content + '\n'
          }
        }
        if (memoryPrompt) {
          prompt += addRolePrefix(preset, scene) + scene.textContent + '\n'
          prompt += memoryPrompt
        }
        break
      }
      default:
        prompt += addRolePrefix(preset, scene) + scene.textContent + '\n'
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
        prompt += addRolePrefix(preset, scene) + scene.textContent + '\n'
      }
    }
    if (summary) {
      prompt += '</Story>\n'
    }
  }
  if (oneInstruction || summary) {
    prompt += preset.oobabooga.assistantPrefix
  }
  return prompt
}
