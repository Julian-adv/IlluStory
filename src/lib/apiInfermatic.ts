import { get } from 'svelte/store'
import { apiUrl, generateMessagesCheck, generatePromptCheck } from './api'
import type { Char, ChatResult, Preset, Session } from './interfaces'
import type { Prompt, SceneType } from './promptInterface'
import { settings } from './store'
import { tcGet, tcLog } from './tauriCompat'
import { newScene } from '$lib'

export async function sendChatInfermatic(
  preset: Preset,
  prompts: Prompt[],
  dialogues: SceneType[],
  char: Char,
  user: Char,
  memories: string,
  session: Session
): Promise<ChatResult | null> {
  const _url = new URL(preset.infermatic.apiUrl + apiUrl(false))
  const { messages } = await generateMessagesCheck(
    preset,
    prompts,
    dialogues,
    char,
    user,
    memories,
    session
  )
  const _dummy = messages
  return null
}

export async function sendChatInfermaticStream(
  preset: Preset,
  prompts: Prompt[],
  dialogues: SceneType[],
  char: Char,
  user: Char,
  memories: string,
  session: Session,
  continueGen: boolean,
  received: (text: string) => void,
  closedCallback: () => void
): Promise<ChatResult | null> {
  const url = preset.infermatic.apiUrl + apiUrl(true)
  const { prompt, tokens } = await generatePromptCheck(
    preset,
    prompts,
    dialogues,
    char,
    user,
    memories,
    session
  )
  const userName = user.name
  const charName = char.name
  const stopping_strings = [
    `\n${userName}:`,
    `\n${charName}:`,
    '<|eot_id|>',
    '<|start_header_id|>user<|end_header_id|>',
    '<|start_header_id|>assistant<|end_header_id|>',
    '<|start_header_id|>system<|end_header_id|>'
  ]
  const request = {
    ...preset.infermatic.body,
    stream: true,
    prompt: prompt,
    stop: stopping_strings
  }
  tcLog('request', JSON.stringify(request, null, 2))
  const respFromInfermatic = await fetch(url, {
    body: JSON.stringify(request),
    headers: {
      Authorization: 'Bearer ' + get(settings).infermaticAiApiKey,
      'Content-Type': 'application/json'
    },
    method: 'POST',
    signal: null
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
            if (json.choices[0].text) {
              received(json.choices[0].text)
            }
          }
        }
      }
      return reader?.read().then(processText)
    })
    return {
      scene: newScene(0, 'assistant', char.name, '', false),
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
