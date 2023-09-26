import { get } from 'svelte/store'
import type { SceneType, Preset, Usage, ChatResult } from './interfaces'
import { user } from './store'
import { assistantRole, chatHistory, countTokensApi, startStory, systemRole, userRole } from './api'
import { getStartEndIndex } from '$lib'

function addRolePrefix(preset: Preset, scene: SceneType) {
  switch (scene.role) {
    case systemRole:
      return preset.oobabooga.systemPrefix
    case assistantRole:
      return preset.oobabooga.assistantPrefix
    case userRole:
      return preset.oobabooga.userPrefix
    default:
      return ''
  }
}

function generatePrompt(
  preset: Preset,
  prologues: SceneType[],
  dialogues: SceneType[],
  sendStartIndex: number
) {
  let prompt = ''
  let sentChatHistory = false
  for (const scene of prologues) {
    switch (scene.role) {
      case startStory:
        break
      case chatHistory: {
        const { start, end } = getStartEndIndex(scene, dialogues, sendStartIndex)
        for (const mesg of dialogues.slice(start, end)) {
          prompt += addRolePrefix(preset, mesg) + mesg.textContent + '\n'
        }
        sentChatHistory = true
        break
      }
      default:
        prompt += addRolePrefix(preset, scene) + scene.textContent + '\n'
    }
  }
  if (!sentChatHistory) {
    for (const scene of dialogues) {
      prompt += addRolePrefix(preset, scene) + scene.textContent + '\n'
    }
  }
  return prompt
}

export async function sendChatOobabooga(
  preset: Preset,
  prologues: SceneType[],
  dialogues: SceneType[],
  summary: boolean,
  sendStartIndex: number
): Promise<ChatResult | null> {
  const uri = 'http://localhost:5000/api/v1/generate'
  const url = new URL(uri)
  let prompt = ''
  if (summary) {
    prompt += preset.oobabooga.systemPrefix
    prompt += preset.summarizePrompt + '\n'
    prompt += generatePrompt(preset, [], dialogues, sendStartIndex)
  } else {
    prompt += generatePrompt(preset, prologues, dialogues, sendStartIndex)
  }
  prompt += preset.oobabooga.assistantPrefix
  console.log('prompt:', prompt)
  const usage: Usage = { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 }
  usage.prompt_tokens = countTokensApi(prompt)
  const userName = get(user).name

  const respFromOoga = await fetch(url, {
    body: JSON.stringify({
      max_new_tokens: preset.oobabooga.maxTokens,
      temperature: preset.oobabooga.temperature,
      top_k: preset.oobabooga.topK,
      top_p: preset.oobabooga.topP,
      typical_p: preset.oobabooga.typicalP,
      tfs: preset.oobabooga.tfs,
      top_a: preset.oobabooga.topA,
      repetition_penalty: preset.oobabooga.repetitionPenalty,
      repetition_penalty_range: preset.oobabooga.repetitionPenaltyRange,
      encoder_repetition_penalty: preset.oobabooga.encoderRepetitionPenalty,
      no_repeat_ngram_size: preset.oobabooga.noRepeatNgramSize,
      min_length: preset.oobabooga.minLength,
      do_sample: preset.oobabooga.doSample,
      mirostat_mode: preset.oobabooga.mirostatMode,
      mirostat_tau: preset.oobabooga.mirostatTau,
      mirostat_eta: preset.oobabooga.mirostatEta,
      penalty_alpha: preset.oobabooga.penaltyAlpha,
      num_beams: preset.oobabooga.numBeams,
      length_penalty: preset.oobabooga.lengthPenalty,
      early_stopping: preset.oobabooga.earlyStopping,
      truncation_length: preset.oobabooga.truncationLength,
      add_bos_token: preset.oobabooga.addBosToken,
      ban_eos_token: preset.oobabooga.banEosToken,
      skip_special_tokens: preset.oobabooga.skipSpecialTokens,
      seed: preset.oobabooga.seed,
      stopping_strings: [
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
  const dataFromOoga = await respFromOoga.json()
  console.log('dataFromOoga', dataFromOoga)
  if (respFromOoga.ok && respFromOoga.status >= 200 && respFromOoga.status < 300) {
    const scene: SceneType = {
      id: 0,
      role: assistantRole,
      content: dataFromOoga.results[0].text,
      done: true
    }
    usage.completion_tokens = countTokensApi(dataFromOoga.results[0].text)
    usage.total_tokens = usage.prompt_tokens + usage.completion_tokens
    return { scene, usage }
  } else {
    return null
  }
}

export async function sendChatOobaboogaStream(
  preset: Preset,
  prologues: SceneType[],
  dialogues: SceneType[],
  summary: boolean,
  sendStartIndex: number,
  received: (text: string) => void,
  closedCallback: () => void
): Promise<ChatResult | null> {
  const conn = new WebSocket('ws://localhost:5005/api/v1/stream')
  const userName = get(user).name

  let prompt = ''
  prompt += generatePrompt(preset, prologues, dialogues, sendStartIndex)
  prompt += preset.oobabooga.assistantPrefix
  console.log('prompt:', prompt)
  const usage: Usage = { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 }
  usage.prompt_tokens = countTokensApi(prompt)
  conn.onopen = () => {
    const request = {
      max_new_tokens: preset.oobabooga.maxTokens,
      temperature: preset.oobabooga.temperature,
      top_k: preset.oobabooga.topK,
      top_p: preset.oobabooga.topP,
      typical_p: preset.oobabooga.typicalP,
      tfs: preset.oobabooga.tfs,
      top_a: preset.oobabooga.topA,
      repetition_penalty: preset.oobabooga.repetitionPenalty,
      repetition_penalty_range: preset.oobabooga.repetitionPenaltyRange,
      encoder_repetition_penalty: preset.oobabooga.encoderRepetitionPenalty,
      no_repeat_ngram_size: preset.oobabooga.noRepeatNgramSize,
      min_length: preset.oobabooga.minLength,
      do_sample: preset.oobabooga.doSample,
      mirostat_mode: preset.oobabooga.mirostatMode,
      mirostat_tau: preset.oobabooga.mirostatTau,
      mirostat_eta: preset.oobabooga.mirostatEta,
      penalty_alpha: preset.oobabooga.penaltyAlpha,
      num_beams: preset.oobabooga.numBeams,
      length_penalty: preset.oobabooga.lengthPenalty,
      early_stopping: preset.oobabooga.earlyStopping,
      truncation_length: preset.oobabooga.truncationLength,
      add_bos_token: preset.oobabooga.addBosToken,
      ban_eos_token: preset.oobabooga.banEosToken,
      skip_special_tokesn: preset.oobabooga.skipSpecialTokens,
      seed: preset.oobabooga.seed,
      stopping_strings: [
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
    }
    conn.send(JSON.stringify(request))
  }

  conn.onmessage = event => {
    // console.log('on message', event)
    const resp = JSON.parse(event.data)
    switch (resp.event) {
      case 'text_stream':
        // console.log(resp);
        // console.log(resp.history.visible[resp.history.visible.length - 1][1])
        received(resp.text)
        break
      case 'stream_end':
        conn.close()
        closedCallback()
        break
    }
  }

  conn.onerror = error => {
    console.log('on error', error)
  }

  conn.onclose = () => {
    console.log('on close')
  }

  const scene: SceneType = {
    id: 0,
    role: assistantRole,
    content: ''
  }
  return { scene, usage }
}
