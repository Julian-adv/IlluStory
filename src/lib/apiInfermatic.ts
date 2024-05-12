import { get } from 'svelte/store'
import { apiUrl, assistantRole, generateMessagesCheck } from './api'
import type { ChatResult, Preset, SceneType, Session } from './interfaces'
import { settings, user } from './store'
import { tcGet, tcLog } from './tauriCompat'

export async function sendChatInfermatic(
  preset: Preset,
  prologues: SceneType[],
  dialogues: SceneType[],
  memories: string,
  session: Session,
  summary: boolean
): Promise<ChatResult | null> {
  const url = new URL(preset.infermatic.apiUrl + apiUrl(false))
  url
  const { messages } = await generateMessagesCheck(
    preset,
    prologues,
    dialogues,
    memories,
    session,
    summary
  )
  messages
  const userName = get(user).name
  userName
  return null
}

export async function sendChatInfermaticStream(
  preset: Preset,
  prologues: SceneType[],
  dialogues: SceneType[],
  memories: string,
  session: Session,
  summary: boolean,
  continueGen: boolean,
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
    ...preset.infermatic,
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
  const respFromInfermatic = await fetch(url, {
    body: JSON.stringify(request),
    headers: {
      'Content-Type': 'application/json'
    },
    method: 'POST'
  })
  if (
    respFromInfermatic.ok &&
    respFromInfermatic.status >= 200 &&
    respFromInfermatic.status < 300
  ) {
    const reader = respFromInfermatic.body?.getReader()
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

export async function loadModelsInfermatic(preset: Preset) {
  if (preset.infermatic.apiUrl) {
    try {
      const response = await tcGet(preset.infermatic.apiUrl + '/models', {
        Authorization: 'Bearer ' + get(settings).infermaticAiApiKey
      })
      return response.data.data.map((model: { id: string }) => {
        return { value: model.id, name: model.id }
      })
    } catch (e) {
      console.log('ERROR', e)
    }
  }
  return [{ value: 'unknown', name: 'Unknown' }]
}
