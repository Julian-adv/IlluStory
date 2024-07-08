import type { SceneType, Preset, ChatResult, Session, OobaboogaParam, Char } from './interfaces'
import { defaultPreset, zeroUsage } from './store'
import { apiUrl, assistantRole, generateMessagesCheck } from './api'
import { tcLog } from './tauriCompat'

export async function sendChatOobabooga(
  preset: Preset,
  prompts: SceneType[],
  dialogues: SceneType[],
  char: Char,
  user: Char,
  memories: string,
  session: Session
): Promise<ChatResult | null> {
  const uri = preset.oobabooga.apiUrl + apiUrl(false)
  const url = new URL(uri)
  const { messages } = await generateMessagesCheck(
    preset,
    prompts,
    dialogues,
    char,
    user,
    memories,
    session
  )
  const userName = user.name
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

type PartialOobaboogaParam = {
  [key: string]: string | number | boolean | undefined
}

const bigOPreset = {
  temperature: 0.87,
  top_p: 0.99,
  typical_p: 0.68,
  tfs: 0.68,
  repetition_penalty: 1.01,
  top_k: 85
}

const contrastiveSearchPreset = {
  do_sample: false,
  top_k: 4,
  penalty_alpha: 0.3
}

const debugDeterministicPreset = {
  do_sample: false,
  top_k: 1
}

const divineIntellectPreset = {
  temperature: 1.31,
  top_p: 0.14,
  repetition_penalty: 1.17,
  top_k: 49
}

const llamaPrecisePreset = {
  temperature: 0.7,
  top_p: 0.1,
  repetition_penalty: 1.18,
  top_k: 40
}

const midnightEnigmaPreset = {
  temperature: 0.98,
  top_p: 0.37,
  repetition_penalty: 1.18,
  top_k: 100
}

const nullPreset = {
  temperature: 1
}

const shortwavePreset = {
  temperature: 1.53,
  top_p: 0.64,
  repetition_penalty: 1.07,
  top_k: 33
}

const simple1Preset = {
  temperature: 0.7,
  top_p: 0.9,
  repetition_penalty: 1.15,
  top_k: 20
}

const yaraPreset = {
  temperature: 0.82,
  top_p: 0.21,
  repetition_penalty: 1.19,
  top_k: 72
}

interface StringMap {
  [key: string]: any
}

export const nameToPreset: StringMap = {
  'Big O': bigOPreset,
  'Contrastive Search': contrastiveSearchPreset,
  'Debug-deterministic': debugDeterministicPreset,
  Default: defaultPreset.oobabooga,
  'Divine Intellect': divineIntellectPreset,
  'LLaMA-Precise': llamaPrecisePreset,
  'Midnight Enigma': midnightEnigmaPreset,
  'Null preset': nullPreset,
  Shortwave: shortwavePreset,
  'simple-1': simple1Preset,
  Yara: yaraPreset
}

function modifiedParameters(preset: OobaboogaParam): Partial<OobaboogaParam> {
  const modified: PartialOobaboogaParam = {}
  const paramPreset = nameToPreset[preset.preset]
  const original = {
    ...defaultPreset.oobabooga,
    ...paramPreset
  }

  for (const key in preset) {
    if (Object.prototype.hasOwnProperty.call(preset, key)) {
      const skey = key as keyof OobaboogaParam
      if (Object.prototype.hasOwnProperty.call(original, key)) {
        if (preset[skey] !== original[skey]) {
          modified[skey] = preset[skey]
        }
      }
    }
  }
  modified.truncation_length = preset.truncation_length
  modified.max_tokens = preset.max_tokens
  if (preset.preset !== 'Default') {
    modified.preset = preset.preset
  }
  return modified
}

export async function sendChatOobaboogaStream(
  preset: Preset,
  prompts: SceneType[],
  dialogues: SceneType[],
  char: Char,
  user: Char,
  memories: string,
  session: Session,
  continueGen: boolean,
  received: (text: string) => void,
  closedCallback: () => void
): Promise<ChatResult | null> {
  const uri = preset.oobabooga.apiUrl + apiUrl(false)
  const url = new URL(uri)
  const { messages, tokens } = await generateMessagesCheck(
    preset,
    prompts,
    dialogues,
    char,
    user,
    memories,
    session
  )
  const modified = modifiedParameters(preset.oobabooga)
  if (continueGen) {
    modified.continue_ = true
    modified.truncation_length = (modified.truncation_length ?? 512) * 2
  }
  const userName = user.name
  const request = {
    ...modified,
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

export async function loadModelsOobabooga(preset: Preset) {
  if (preset.oobabooga.apiUrl) {
    try {
      const response = await fetch(preset.oobabooga.apiUrl + '/models', { method: 'GET' })
      const json = await response.json()
      return json.data.map((model: { id: string }) => {
        return { value: model.id, name: model.id }
      })
    } catch (e) {
      console.log('ERROR', e)
    }
  }
  return [{ value: 'unknown', name: 'Unknown' }]
}
