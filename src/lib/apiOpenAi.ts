import { get } from 'svelte/store'
import type { Preset, SceneType, Usage, Message } from './interfaces'
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
            messages.push({ role: mesg.role, content: mesg.content })
          }
          sentChatHistory = true
          break
        }
        default:
          messages.push({ role: convertRole(scene.role), content: scene.content })
      }
      if (!sentChatHistory) {
        for (const scene of dialogues.slice(sendStartIndex)) {
          messages.push({ role: scene.role, content: scene.content })
        }
      }
    }
  }

  return messages
}

export async function sendChatOpenAi(
  preset: Preset,
  prologues: SceneType[],
  dialogues: SceneType[],
  summary: boolean,
  sendStartIndex: number
): Promise<[SceneType | null, Usage]> {
  const uri = preset.openAi.apiUrl + '/chat/completions'
  // const uri = "https://api.openai.com/v1/chat/completions"
  // const uri = "http://localhost:8000/v1/chat/completions"
  const url = new URL(uri)
  const messages = generateMessages(preset, prologues, dialogues, summary, sendStartIndex)
  // console.log('messages', messages)
  const respFromGPT = await fetch(url, {
    body: JSON.stringify({
      model: preset.openAi.model,
      // model: "vicuna-13b-v1.5-16k",
      temperature: preset.openAi.temperature.toFixed,
      frequency_penalty: preset.openAi.frequencyPenalty.toFixed,
      presence_penalty: preset.openAi.presencePenalty.toFixed,
      max_tokens: preset.openAi.maxTokens.toFixed,
      stream: false,
      messages: messages
    }),
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
    const gptScene: SceneType = dataFromGPT.choices[0].message
    gptScene.id = 0
    return [gptScene, dataFromGPT.usage ?? zeroUsage]
  } else {
    return [null, zeroUsage]
  }
}
