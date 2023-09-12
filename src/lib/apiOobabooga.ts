import { get } from 'svelte/store'
import type { SceneType, Preset, Usage } from './interfaces'
import { replaceDict, zeroUsage } from './store'
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
          prompt += addRolePrefix(preset, mesg) + mesg.content + '\n'
        }
        sentChatHistory = true
        break
      }
      default:
        prompt += addRolePrefix(preset, scene) + scene.content + '\n'
    }
  }
  if (!sentChatHistory) {
    for (const scene of dialogues) {
      prompt += addRolePrefix(preset, scene) + scene.content + '\n'
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
): Promise<[SceneType | null, Usage]> {
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
  const userName = get(replaceDict)['user']

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
      encoder_repetition_penalty: preset.oobabooga.encoderRepetitionPenalty,
      no_repeat_ngram_size: preset.oobabooga.noRepeatNgramSize,
      min_length: preset.oobabooga.minLength,
      do_sample: preset.oobabooga.doSample,
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
    const newScene: SceneType = {
      id: 0,
      role: assistantRole,
      content: dataFromOoga.results[0].text
    }
    usage.completion_tokens = countTokensApi(dataFromOoga.results[0].text)
    usage.total_tokens = usage.prompt_tokens + usage.completion_tokens
    return [newScene, usage]
  } else {
    return [null, usage]
  }
}

export async function sendChatOobaboogaStream(
  preset: Preset,
  scenes: SceneType[],
  received: (text: string) => void,
  closedCallback: () => void
): Promise<[SceneType[], Usage]> {
  const conn = new WebSocket('ws://localhost:5005/api/v1/stream')
  const userName = get(replaceDict)['user']

  conn.onopen = () => {
    let prompt = ''
    scenes.forEach(scene => {
      prompt += scene.content + '\n'
    })
    const request = {
      max_new_tokens: preset.oobabooga.maxTokens,
      temperature: preset.oobabooga.temperature,
      top_k: preset.oobabooga.topK,
      top_p: preset.oobabooga.topP,
      typical_p: preset.oobabooga.typicalP,
      top_a: preset.oobabooga.topA,
      repetition_penalty: preset.oobabooga.repetitionPenalty,
      encoder_repetition_penalty: preset.oobabooga.encoderRepetitionPenalty,
      no_repeat_ngram_size: preset.oobabooga.noRepeatNgramSize,
      min_length: preset.oobabooga.minLength,
      do_sample: preset.oobabooga.doSample,
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
        '\nUser:',
        '\nuser:',
        `\n${userName}:`
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

  const newScene: SceneType = {
    id: 0,
    role: assistantRole,
    content: ''
  }
  scenes = [...scenes, newScene]
  return [scenes, zeroUsage]
}
