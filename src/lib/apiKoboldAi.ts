import { get } from 'svelte/store'
import type { SceneType, Preset, Usage, ChatResult, Session } from './interfaces'
import { user } from './store'
import { assistantRole, countTokensApi, generatePromptCheck } from './api'
import { tcLog } from './tauriCompat'

export async function sendChatKoboldAi(
  preset: Preset,
  prologues: SceneType[],
  dialogues: SceneType[],
  memories: string,
  session: Session,
  summary: boolean
): Promise<ChatResult | null> {
  const uri = preset.koboldAi.apiUrl + '/v1/generate'
  const url = new URL(uri)
  const { prompt, tokens } = await generatePromptCheck(
    preset,
    prologues,
    dialogues,
    memories,
    session,
    summary
  )
  tcLog('INFO', 'prompt:', prompt)
  const usage: Usage = { prompt_tokens: tokens, completion_tokens: 0, total_tokens: tokens }
  const userName = get(user).name

  const respFromKobold = await fetch(url, {
    body: JSON.stringify({
      max_context_length: preset.koboldAi.maxContextLength,
      max_length: preset.koboldAi.maxLength,
      rep_pen: preset.koboldAi.repPen,
      rep_pen_range: preset.koboldAi.repPenRange,
      presence_penalty: preset.koboldAi.presencePenalty,
      sampler_order: preset.koboldAi.samplerOrder,
      sampler_seed: preset.koboldAi.samplerSeed,
      temperature: preset.koboldAi.temperature,
      tfs: preset.koboldAi.tfs,
      top_a: preset.koboldAi.topA,
      top_k: preset.koboldAi.topK,
      top_p: preset.koboldAi.topP,
      min_p: preset.koboldAi.minP,
      typical: preset.koboldAi.typical,
      use_default_badwordsids: preset.koboldAi.useDefaultBadwordsIds,
      dynatemp_range: preset.koboldAi.dynatempRange,
      dynatemp_exponent: preset.koboldAi.dynatempExponent,
      mirostat: preset.koboldAi.mirostat,
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
  tcLog('INFO', 'dataFromKobold', dataFromKobold)
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
  memories: string,
  session: Session,
  summary: boolean,
  continueGen: boolean,
  received: (text: string) => void,
  closedCallback: () => void
): Promise<ChatResult | null> {
  const uri = preset.koboldAi.apiUrl + '/extra/generate/stream'
  const url = new URL(uri)

  const { prompt, tokens } = await generatePromptCheck(
    preset,
    prologues,
    dialogues,
    memories,
    session
  )
  tcLog('INFO', 'prompt:', prompt)
  const userName = get(user).name

  const respFromKobold = await fetch(url, {
    body: JSON.stringify({
      max_context_length: preset.koboldAi.maxContextLength,
      max_length: preset.koboldAi.maxLength,
      rep_pen: preset.koboldAi.repPen,
      rep_pen_range: preset.koboldAi.repPenRange,
      presence_penalty: preset.koboldAi.presencePenalty,
      sampler_order: preset.koboldAi.samplerOrder,
      sampler_seed: preset.koboldAi.samplerSeed,
      temperature: preset.koboldAi.temperature,
      tfs: preset.koboldAi.tfs,
      top_a: preset.koboldAi.topA,
      top_k: preset.koboldAi.topK,
      top_p: preset.koboldAi.topP,
      min_p: preset.koboldAi.minP,
      typical: preset.koboldAi.typical,
      use_default_badwordsids: preset.koboldAi.useDefaultBadwordsIds,
      dynatemp_range: preset.koboldAi.dynatempRange,
      dynatemp_exponent: preset.koboldAi.dynatempExponent,
      mirostat: preset.koboldAi.mirostat,
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
      usage: { prompt_tokens: tokens, completion_tokens: 0, total_tokens: tokens }
    }
  } else {
    return null
  }
}

export async function loadModelsKoboldAi(_preset: Preset) {
  return [{ value: 'unknown', name: 'Unknown' }]
}
