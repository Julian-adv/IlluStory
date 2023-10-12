import { get } from 'svelte/store'
import type { SceneType, Preset, Usage, ChatResult } from './interfaces'
import { user } from './store'
import { assistantRole, countTokensApi, generatePrompt } from './api'

export async function sendChatKoboldAi(
  preset: Preset,
  prologues: SceneType[],
  dialogues: SceneType[],
  summary: boolean,
  sendStartIndex: number
): Promise<ChatResult | null> {
  const uri = preset.koboldAi.apiUrl + '/v1/generate'
  const url = new URL(uri)
  let prompt = ''
  if (summary) {
    prompt += preset.koboldAi.systemPrefix
    prompt += preset.summarizePrompt + '\n'
    prompt += generatePrompt(preset, [], dialogues, sendStartIndex)
  } else {
    prompt += generatePrompt(preset, prologues, dialogues, sendStartIndex)
  }
  prompt += preset.koboldAi.assistantPrefix
  console.log('prompt:', prompt)
  const usage: Usage = { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 }
  usage.prompt_tokens = countTokensApi(prompt)
  const userName = get(user).name

  const respFromKobold = await fetch(url, {
    body: JSON.stringify({
      max_context_length: preset.koboldAi.contextSize,
      max_length: preset.koboldAi.maxTokens,
      rep_pen: preset.koboldAi.repetitionPenalty,
      rep_pen_range: preset.koboldAi.repetitionPenaltyRange,
      rep_pen_slope: preset.koboldAi.repetitionPenaltySlope,
      sampler_seed: preset.koboldAi.seed,
      temperature: preset.koboldAi.temperature,
      tfs: preset.koboldAi.tfs,
      top_a: preset.koboldAi.topA,
      top_k: preset.koboldAi.topK,
      top_p: preset.koboldAi.topP,
      typical: preset.koboldAi.typicalP,
      mirostat_mode: preset.koboldAi.mirostatMode,
      mirostat_tau: preset.koboldAi.mirostatTau,
      mirostat_eta: preset.koboldAi.mirostatEta,
      stop_sequence: [
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
      prompt: prompt
    }),
    headers: {},
    method: 'POST',
    signal: null
  })

  const dataFromKobold = await respFromKobold.json()
  console.log('dataFromKobold', dataFromKobold)
  if (respFromKobold.ok && respFromKobold.status >= 200 && respFromKobold.status < 300) {
    const scene: SceneType = {
      id: 0,
      role: assistantRole,
      content: dataFromKobold.results[0].text,
      done: true
    }
    usage.completion_tokens = countTokensApi(dataFromKobold.results[0].text)
    usage.total_tokens = usage.prompt_tokens + usage.completion_tokens
    return { scene, usage }
  } else {
    return null
  }
}

export async function sendChatKoboldAiStream(
  preset: Preset,
  prologues: SceneType[],
  dialogues: SceneType[],
  summary: boolean,
  sendStartIndex: number,
  received: (text: string) => void,
  closedCallback: () => void
): Promise<ChatResult | null> {
  const uri = preset.koboldAi.apiUrl + '/extra/generate/stream'
  const url = new URL(uri)

  let prompt = ''
  prompt += generatePrompt(preset, prologues, dialogues, sendStartIndex)
  console.log('prompt:', prompt)
  const promptTokens = countTokensApi(prompt)
  const userName = get(user).name

  const respFromKobold = await fetch(url, {
    body: JSON.stringify({
      max_context_length: preset.koboldAi.contextSize,
      max_length: preset.koboldAi.maxTokens,
      rep_pen: preset.koboldAi.repetitionPenalty,
      rep_pen_range: preset.koboldAi.repetitionPenaltyRange,
      rep_pen_slope: preset.koboldAi.repetitionPenaltySlope,
      sampler_seed: preset.koboldAi.seed,
      temperature: preset.koboldAi.temperature,
      tfs: preset.koboldAi.tfs,
      top_a: preset.koboldAi.topA,
      top_k: preset.koboldAi.topK,
      top_p: preset.koboldAi.topP,
      typical: preset.koboldAi.typicalP,
      mirostat_mode: preset.koboldAi.mirostatMode,
      mirostat_tau: preset.koboldAi.mirostatTau,
      mirostat_eta: preset.koboldAi.mirostatEta,
      stop_sequence: [
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
      ],
      prompt: prompt
    }),
    headers: {},
    method: 'POST',
    signal: null
  })
  if (respFromKobold.ok && respFromKobold.status >= 200 && respFromKobold.status < 300) {
    const reader = respFromKobold.body?.getReader()
    const decoder = new TextDecoder()
    reader?.read().then(async function processText({ value }): Promise<void> {
      const str = decoder.decode(value)
      if (!str) {
        closedCallback()
        return
      }
      const strs = str.split('\n')
      for (const str of strs) {
        if (str.startsWith('data: ')) {
          const text = str.slice(6)
          const json = JSON.parse(text)
          if (json.token) {
            received(json.token)
          }
        }
      }
      return reader?.read().then(processText)
    })
    const scene = {
      id: 0,
      role: assistantRole,
      content: '',
      done: false
    }
    return {
      scene,
      usage: { prompt_tokens: promptTokens, completion_tokens: 0, total_tokens: promptTokens }
    }
  } else {
    return null
  }
}
