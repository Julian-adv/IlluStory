import { get } from 'svelte/store'
import type { Preset, SceneType, Message, ChatResult } from './interfaces'
import { settings, zeroUsage } from './store'
import {
  assistantRole,
  charSetting,
  chatHistory,
  endTag,
  startStory,
  systemRole,
  userRole,
  userSetting
} from './api'
import { getStartEndIndex } from '$lib'

function convertRole(role: string) {
  switch (role) {
    case systemRole:
    case charSetting:
    case endTag:
      return systemRole
    case assistantRole:
      return assistantRole
    case userRole:
    case userSetting:
      return userRole
    default:
      return systemRole
  }
}

function generateMessages(
  preset: Preset,
  prologues: SceneType[],
  dialogues: SceneType[],
  summary: boolean,
  sendStartIndex: number
) {
  const messages: Message[] = []
  if (summary) {
    messages.push({ role: systemRole, content: preset.summarizePrompt })
    for (const scene of dialogues.slice(sendStartIndex)) {
      messages.push({ role: scene.role, content: scene.content })
    }
  } else {
    let sentChatHistory = false
    for (const scene of prologues) {
      switch (scene.role) {
        case startStory:
          break
        case chatHistory: {
          const { start, end } = getStartEndIndex(scene, dialogues, sendStartIndex)
          for (const mesg of dialogues.slice(start, end)) {
            messages.push({ role: mesg.role, content: mesg.textContent ?? mesg.content })
          }
          sentChatHistory = true
          break
        }
        default:
          messages.push({ role: convertRole(scene.role), content: scene.content })
      }
    }
    if (!sentChatHistory) {
      for (const scene of dialogues.slice(sendStartIndex)) {
        messages.push({ role: scene.role, content: scene.content })
      }
    }
  }
  return messages
}

function generatePrompt(
  preset: Preset,
  prologues: SceneType[],
  dialogues: SceneType[],
  summary: boolean,
  sendStartIndex: number
) {
  let prompt = ''
  if (summary) {
    prompt += preset.summarizePrompt + '\n'
    for (const scene of dialogues.slice(sendStartIndex)) {
      prompt += scene.content + '\n'
    }
  } else {
    let sentChatHistory = false
    for (const scene of prologues) {
      switch (scene.role) {
        case startStory:
          break
        case chatHistory: {
          const { start, end } = getStartEndIndex(scene, dialogues, sendStartIndex)
          for (const mesg of dialogues.slice(start, end)) {
            prompt += mesg.content + '\n'
          }
          sentChatHistory = true
          break
        }
        default:
          prompt += scene.content + '\n'
      }
    }
    if (!sentChatHistory) {
      for (const scene of dialogues.slice(sendStartIndex)) {
        prompt += scene.content + '\n'
      }
    }
  }
  return prompt
}

function apiUrl(instructModel: boolean) {
  if (instructModel) {
    return '/completions'
  } else {
    return '/chat/completions'
  }
}

export async function sendChatOpenAi(
  preset: Preset,
  prologues: SceneType[],
  dialogues: SceneType[],
  summary: boolean,
  sendStartIndex: number
): Promise<ChatResult | null> {
  const instructModel = preset.openAi.model.includes('instruct')
  const uri = preset.openAi.apiUrl + apiUrl(instructModel)
  const url = new URL(uri)
  // console.log('messages', messages)
  const commonReq = {
    model: preset.openAi.model,
    temperature: preset.openAi.temperature,
    frequency_penalty: preset.openAi.frequencyPenalty,
    presence_penalty: preset.openAi.presencePenalty,
    max_tokens: preset.openAi.maxTokens,
    stream: false
  }
  let request
  if (instructModel) {
    request = {
      ...commonReq,
      prompt: generatePrompt(preset, prologues, dialogues, summary, sendStartIndex)
    }
  } else {
    request = {
      ...commonReq,
      messages: generateMessages(preset, prologues, dialogues, summary, sendStartIndex)
    }
  }
  console.log('request', request)
  const respFromGPT = await fetch(url, {
    body: JSON.stringify(request),
    headers: {
      Authorization: 'Bearer ' + get(settings).openAiApiKey,
      'Content-Type': 'application/json'
    },
    method: 'POST',
    signal: null
  })
  const dataFromGPT = await respFromGPT.json()
  console.log('dataFromGPT', dataFromGPT)
  if (respFromGPT.ok && respFromGPT.status >= 200 && respFromGPT.status < 300) {
    let addedScene: SceneType
    if (instructModel) {
      addedScene = {
        id: 0,
        role: assistantRole,
        content: dataFromGPT.choices[0].text
      }
    } else {
      addedScene = dataFromGPT.choices[0].message
      addedScene.id = 0
    }
    return { addedScene, usage: dataFromGPT.usage ?? zeroUsage }
  } else {
    return null
  }
}
