import { get } from 'svelte/store'
import type { SceneType, Preset, ChatResult, Session } from './interfaces'
import { user, zeroUsage } from './store'
import { apiUrl, assistantRole, generateMessagesCheck } from './api'
import { tcLog } from './tauriCompat'

export async function sendChatOobabooga(
  preset: Preset,
  prologues: SceneType[],
  dialogues: SceneType[],
  memories: string,
  session: Session,
  summary: boolean
): Promise<ChatResult | null> {
  const uri = preset.oobabooga.apiUrl + apiUrl(false)
  const url = new URL(uri)
  const { messages } = await generateMessagesCheck(
    preset,
    prologues,
    dialogues,
    memories,
    session,
    summary
  )
  const userName = get(user).name
  const request = {
    ...preset.oobabooga,
    // continue_: false,
    // name1: name1,
    // name2: name2,
    stop: [
      '### INPUT',
      '### Input',
      '### User',
      '### USER',
      '### INSTRUCTION',
      '### Instruction',
      '\n```',
      '\nUser:',
      '\nuser:',
      '\n<|user|>',
      `\n${userName}:`,
      `\n${userName} `
    ],
    messages: messages
  }
  tcLog('INFO', 'request:', JSON.stringify(request, null, 2))
  const respFromOoga = await fetch(url, {
    body: JSON.stringify(request),
    headers: {
      'Content-Type': 'application/json'
    },
    method: 'POST',
    signal: null
  })
  const dataFromOoga = await respFromOoga.json()
  tcLog('INFO', 'dataFromOoga', dataFromOoga.results[0].text)
  if (respFromOoga.ok && respFromOoga.status >= 200 && respFromOoga.status < 300) {
    const scene: SceneType = dataFromOoga.choices[0].message
    scene.id = 0
    scene.done = true
    return { scene, usage: dataFromOoga.usage ?? zeroUsage }
  } else {
    return null
  }
}

export async function sendChatOobaboogaStream(
  preset: Preset,
  prologues: SceneType[],
  dialogues: SceneType[],
  memories: string,
  session: Session,
  summary: boolean,
  received: (text: string) => void,
  closedCallback: () => void
): Promise<ChatResult | null> {
  const uri = preset.oobabooga.apiUrl + apiUrl(false)
  const url = new URL(uri)
  const { messages, tokens } = await generateMessagesCheck(
    preset,
    prologues,
    dialogues,
    memories,
    session,
    summary
  )
  const userName = get(user).name
  const request = {
    ...preset.oobabooga,
    stream: true,
    messages: messages,
    stop: [
      '### INPUT',
      '### Input',
      '### User',
      '### USER',
      '### INSTRUCTION',
      '### Instruction',
      '### Response',
      '\n```',
      '\nUser:',
      '\nuser:',
      '\n<|user|>',
      `\n${userName}:`,
      `\n${userName} `
    ]
  }
  tcLog('INFO', 'prompt:', JSON.stringify(request, null, 2))
  const respFromOoga = await fetch(url, {
    body: JSON.stringify(request),
    headers: {
      'Content-Type': 'application/json'
    },
    method: 'POST',
    signal: null
  })
  if (respFromOoga.ok && respFromOoga.status >= 200 && respFromOoga.status < 300) {
    const reader = respFromOoga.body?.getReader()
    const decoder = new TextDecoder()
    reader?.read().then(async function processText({ value }): Promise<void> {
      if (value === undefined) {
        closedCallback()
        return
      }
      const str = decoder.decode(value)
      const strs = str.split('\n')
      for (const str of strs) {
        if (str.startsWith('data: ')) {
          const text = str.slice(6)
          if (text === '[DONE]') {
            closedCallback()
            return
          } else {
            const json = JSON.parse(text)
            if (json.choices[0].delta.content) {
              received(json.choices[0].delta.content)
            }
          }
        }
      }
      return reader?.read().then(processText)
    })
    const scene = {
      id: 0,
      role: assistantRole,
      content: ''
    }
    return {
      scene,
      usage: { prompt_tokens: tokens, completion_tokens: 0, total_tokens: tokens }
    }
  } else {
    return null
  }
}
