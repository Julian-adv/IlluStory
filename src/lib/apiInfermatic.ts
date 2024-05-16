import { get } from 'svelte/store'
import { apiUrl, assistantRole, generateMessagesCheck, generatePromptCheck } from './api'
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
  const { prompt, tokens } = await generatePromptCheck(
    preset,
    prologues,
    dialogues,
    memories,
    session,
    summary
  )
  const userName = get(user).name
  const stopping_strings = [
    `\nJulien:`,
    `\nStellar:`,
    '<|eot_id|>',
    '<|start_header_id|>user<|end_header_id|>',
    '<|start_header_id|>assistant<|end_header_id|>',
    '<|start_header_id|>system<|end_header_id|>'
  ]
  preset.infermatic.max_new_tokens = preset.infermatic.max_tokens
  preset.infermatic.n_predict = preset.infermatic.max_tokens
  preset.infermatic.typical = preset.infermatic.typical_p
  preset.infermatic.sampler_seed = preset.infermatic.seed
  preset.infermatic.rep_pen = preset.infermatic.repetition_penalty
  preset.infermatic.rep_pen_range = preset.infermatic.repetition_penalty_range
  preset.infermatic.repeat_last_n = preset.infermatic.repetition_penalty_range
  preset.infermatic.tfs_z = preset.infermatic.tfs
  preset.infermatic.mirostat = preset.infermatic.mirostat_mode
  preset.infermatic.ignore_eos = preset.infermatic.ban_eos_token
  const request = {
    ...preset.infermatic,
    stream: true,
    prompt: prompt,
    stopping_strings: stopping_strings,
    stop: stopping_strings
  }
  tcLog('INFO', 'request:', JSON.stringify(request, null, 2))
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
