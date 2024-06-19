import { Api, type Message, type Preset, type SceneType, type Session } from './interfaces'
import { loadModelsOobabooga, sendChatOobabooga, sendChatOobaboogaStream } from './apiOobabooga'
import { loadModelsOpenAi, sendChatOpenAi, sendChatOpenAiStream } from './apiOpenAi'
import { isWithinTokenLimit } from 'gpt-tokenizer'
import llamaTokenizer from 'llama-tokenizer-js'
import { loadModelsKoboldAi, sendChatKoboldAi, sendChatKoboldAiStream } from './apiKoboldAi'
import { getStartEndIndex } from '$lib'
import { get } from 'svelte/store'
import { sessionPath, settings, lorebook } from './store'
import { basenameOf } from './fs'
import { tcSaveMemory } from './tauriCompat'
import { loadModelsInfermatic, sendChatInfermatic, sendChatInfermaticStream } from './apiInfermatic'

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
export const lorebookRole = 'lorebook'
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
  { value: lorebookRole, name: 'Lorebook' },
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
    case Api.Infermatic:
      sendChat = sendChatInfermatic
      sendChatStream = sendChatInfermaticStream
      countTokensApi = countTokensLlama
  }
}

function systemPrefix(preset: Preset) {
  switch (preset.api) {
    case Api.KoboldAi:
    case Api.Infermatic:
      return preset.systemPrefix
    default:
      return ''
  }
}

function systemPostfix(preset: Preset) {
  switch (preset.api) {
    case Api.KoboldAi:
    case Api.Infermatic:
      return preset.systemPostfix
    default:
      return ''
  }
}

function assistantPrefix(preset: Preset) {
  switch (preset.api) {
    case Api.KoboldAi:
    case Api.Infermatic:
      return preset.assistantPrefix
    default:
      return ''
  }
}

function assistantPostfix(preset: Preset) {
  switch (preset.api) {
    case Api.KoboldAi:
    case Api.Infermatic:
      return preset.assistantPostfix
    default:
      return ''
  }
}

function userPrefix(preset: Preset) {
  switch (preset.api) {
    case Api.KoboldAi:
    case Api.Infermatic:
      return preset.userPrefix
    default:
      return ''
  }
}

function userPostfix(preset: Preset) {
  switch (preset.api) {
    case Api.KoboldAi:
    case Api.Infermatic:
      return preset.userPostfix
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

function addRolePostfix(preset: Preset, scene: SceneType, dialogues: SceneType[]) {
  const oneInstruction = get(settings).oneInstruction
  const last =
    dialogues[dialogues.length - 1] === scene ||
    (preset.streaming && dialogues[dialogues.length - 2] === scene)
  if ((oneInstruction && last && scene.role === userRole) || !oneInstruction) {
    switch (scene.role) {
      case systemRole:
        return systemPostfix(preset)
      case assistantRole:
        return assistantPostfix(preset)
      case userRole:
        return userPostfix(preset)
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
      case lorebookRole:
        for (const rule of get(lorebook).rules) {
          if (rule.triggered) {
            prompt += addRolePrefix(preset, scene, dialogues) + scene.textContent + '\n'
            prompt += rule.textContent
          }
        }
        break
      default:
        prompt +=
          addRolePrefix(preset, scene, dialogues) +
          scene.textContent +
          addRolePostfix(preset, scene, dialogues) +
          '\n'
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
      return tokens + preset.oobabooga.max_tokens > preset.oobabooga.truncation_length
    case Api.KoboldAi:
      return tokens + preset.koboldAi.maxLength > preset.koboldAi.maxContextLength
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
  while (session.startIndex < dialogues.length || dialogues.length === 0) {
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

function convertRole(role: string) {
  switch (role) {
    case systemRole:
    case charSetting:
    case userSetting:
    case endTag:
      return systemRole
    case assistantRole:
      return assistantRole
    case userRole:
      return userRole
    default:
      return systemRole
  }
}

export function generateMessages(
  preset: Preset,
  prologues: SceneType[],
  dialogues: SceneType[],
  memories: string,
  summary: boolean
) {
  const messages: Message[] = []
  if (summary) {
    messages.push({ role: systemRole, content: preset.summarizePrompt })
    for (const scene of dialogues) {
      messages.push({ role: scene.role, content: scene.content })
    }
  } else {
    let sentChatHistory = false
    for (let i = 0; i < prologues.length; i++) {
      const scene = prologues[i]
      switch (scene.role) {
        case startStory:
          break
        case chatHistory: {
          const { start, end } = getStartEndIndex(scene, dialogues, preset.streaming)
          for (const mesg of dialogues.slice(start, end)) {
            messages.push({ role: mesg.role, content: mesg.textContent ?? mesg.content })
          }
          sentChatHistory = true
          break
        }
        case assocMemory: {
          if (memories) {
            messages.push({ role: systemRole, content: scene.textContent + '\n' + memories })
            const nextScene = prologues[i + 1]
            if (nextScene.role === endTag) {
              messages.push({ role: systemRole, content: nextScene.textContent ?? '' })
              i++
            }
          } else {
            if (prologues[i + 1].role === endTag) {
              i++
            }
          }
          break
        }
        case lorebookRole: {
          for (const rule of get(lorebook).rules) {
            if (rule.triggered) {
              if (scene.textContent) {
                messages.push({ role: systemRole, content: scene.textContent })
              }
              messages.push({ role: systemRole, content: rule.textContent })
            }
          }
          break
        }
        default:
          messages.push({
            role: convertRole(scene.role),
            content: scene.textContent ?? scene.content
          })
      }
    }
    if (!sentChatHistory) {
      for (const scene of dialogues) {
        messages.push({ role: scene.role, content: scene.content })
      }
    }
  }
  return messages
}

export async function generateMessagesCheck(
  preset: Preset,
  prologues: SceneType[],
  dialogues: SceneType[],
  memories: string,
  session: Session,
  summary: boolean
) {
  let messages: Message[] = []
  let tokens = 0
  while (session.startIndex < dialogues.length || dialogues.length === 0) {
    messages = generateMessages(
      preset,
      prologues,
      dialogues.slice(session.startIndex),
      memories,
      summary
    )
    tokens = 0
    for (const mesg of messages) {
      tokens += countTokensApi(mesg.content)
    }
    if (tokensOver(preset, tokens)) {
      await saveMemory(dialogues[session.startIndex])
      session.startIndex++
    } else {
      break
    }
  }
  return { messages, tokens }
}

export function apiUrl(instructModel: boolean) {
  if (instructModel) {
    return '/completions'
  } else {
    return '/chat/completions'
  }
}

export function loadModels(preset: Preset) {
  switch (preset.api) {
    case Api.OpenAi:
      return loadModelsOpenAi(preset)
    case Api.Oobabooga:
      return loadModelsOobabooga(preset)
    case Api.KoboldAi:
      return loadModelsKoboldAi(preset)
    case Api.Infermatic:
      return loadModelsInfermatic(preset)
  }
}
