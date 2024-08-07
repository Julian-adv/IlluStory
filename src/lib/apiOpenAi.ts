import { get } from 'svelte/store'
import type { Preset, ChatResult, Session, Char } from './interfaces'
import type { Prompt, SceneType } from './promptInterface'
import { lorebook, settings, zeroUsage } from './store'
import {
  apiUrl,
  assocMemory,
  chatHistory,
  countTokensApi,
  generateMessagesCheck,
  lorebookRole,
  saveMemory,
  startStory,
  tokensOver
} from './api'
import { getStartEndIndex, newScene } from '$lib'
import { tcLog } from './tauriCompat'
import OpenAI from 'openai'
import { makeReplaceDict, replaceName } from './session'

function generatePrompt(
  preset: Preset,
  prompts: Prompt[],
  dialogues: SceneType[],
  char: Char,
  user: Char,
  memories: string,
  summary: boolean
) {
  let prompt = ''
  if (summary) {
    prompt += preset.summarizePrompt + '\n'
    for (const scene of dialogues) {
      prompt += scene.content + '\n'
    }
  } else {
    const dict = makeReplaceDict(char, user)
    let sentChatHistory = false
    for (const scene of prompts) {
      switch (scene.role) {
        case startStory:
          break
        case chatHistory: {
          const { start, end } = getStartEndIndex(scene, dialogues, preset.streaming)
          for (const mesg of dialogues.slice(start, end)) {
            prompt += mesg.content + '\n'
          }
          sentChatHistory = true
          break
        }
        case assocMemory: {
          if (memories) {
            prompt += scene.content + '\n'
            prompt += memories
          }
          break
        }
        case lorebookRole:
          for (const rule of get(lorebook).rules) {
            if (rule.triggered) {
              prompt += scene.content + '\n'
              prompt += rule.textContent
            }
          }
          break
        default:
          prompt += replaceName(scene.content, dict) + '\n'
      }
    }
    if (!sentChatHistory) {
      for (const scene of dialogues) {
        prompt += scene.content + '\n'
      }
    }
  }
  return prompt
}

async function generateOpenAIPromptCheck(
  preset: Preset,
  prompts: Prompt[],
  dialogues: SceneType[],
  char: Char,
  user: Char,
  memories: string,
  session: Session,
  summary = false
) {
  let prompt = ''
  let tokens = 0
  while (session.startIndex < dialogues.length || dialogues.length === 0) {
    prompt = generatePrompt(
      preset,
      prompts,
      dialogues.slice(session.startIndex),
      char,
      user,
      memories,
      summary
    )
    tokens = countTokensApi(prompt)
    if (tokensOver(preset, tokens)) {
      await saveMemory(dialogues[session.startIndex])
      session.startIndex++
    } else {
      break
    }
  }
  return { prompt, tokens }
}

export async function sendChatOpenAi(
  preset: Preset,
  prompts: Prompt[],
  dialogues: SceneType[],
  char: Char,
  user: Char,
  memories: string,
  session: Session
): Promise<ChatResult | null> {
  const instructModel = preset.openAi.model.includes('instruct')
  const uri = preset.openAi.apiUrl + apiUrl(instructModel)
  const url = new URL(uri)
  const commonReq = {
    model: preset.openAi.model,
    temperature: preset.openAi.temperature,
    frequency_penalty: preset.openAi.frequencyPenalty,
    presence_penalty: preset.openAi.presencePenalty,
    max_tokens: preset.openAi.maxTokens,
    stream: false
  }
  let request
  if (instructModel) {
    const { prompt } = await generateOpenAIPromptCheck(
      preset,
      prompts,
      dialogues,
      char,
      user,
      memories,
      session
    )
    request = {
      ...commonReq,
      prompt: prompt
    }
  } else {
    const { messages } = await generateMessagesCheck(
      preset,
      prompts,
      dialogues,
      char,
      user,
      memories,
      session
    )
    request = {
      ...commonReq,
      messages: messages
    }
  }
  tcLog('request', JSON.stringify(request))
  const respFromGPT = await fetch(url, {
    body: JSON.stringify(request),
    headers: {
      Authorization: 'Bearer ' + get(settings).openAiApiKey,
      'Content-Type': 'application/json'
    },
    method: 'POST',
    signal: null
  })
  const dataFromGPT = await respFromGPT.json()
  tcLog('INFO', 'dataFromGPT', JSON.stringify(dataFromGPT))
  if (respFromGPT.ok && respFromGPT.status >= 200 && respFromGPT.status < 300) {
    let scene: SceneType
    if (instructModel) {
      scene = newScene(0, 'assistant', char.name, dataFromGPT.choices[0].text, true)
    } else {
      scene = dataFromGPT.choices[0].message
      scene.id = 0
    }
    scene.done = true
    return { scene, usage: dataFromGPT.usage ?? zeroUsage }
  } else {
    return null
  }
}

export async function sendChatOpenAiStream(
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
  const instructModel = preset.openAi.model.includes('instruct')
  const uri = preset.openAi.apiUrl + apiUrl(instructModel)
  const url = new URL(uri)
  const commonReq = {
    model: preset.openAi.model,
    temperature: preset.openAi.temperature,
    frequency_penalty: preset.openAi.frequencyPenalty,
    presence_penalty: preset.openAi.presencePenalty,
    max_tokens: preset.openAi.maxTokens,
    stream: true
  }
  let request
  let numTokens = 0
  if (instructModel) {
    const { prompt, tokens } = await generateOpenAIPromptCheck(
      preset,
      prompts,
      dialogues,
      char,
      user,
      memories,
      session
    )
    request = {
      ...commonReq,
      prompt: prompt
    }
    numTokens = tokens
  } else {
    const { messages, tokens } = await generateMessagesCheck(
      preset,
      prompts,
      dialogues,
      char,
      user,
      memories,
      session
    )
    request = {
      ...commonReq,
      messages: messages
    }
    numTokens = tokens
  }
  tcLog('INFO', 'request', JSON.stringify(request, null, 2))
  const respFromGPT = await fetch(url, {
    body: JSON.stringify(request),
    headers: {
      Authorization: 'Bearer ' + get(settings).openAiApiKey,
      'Content-Type': 'application/json'
    },
    method: 'POST',
    signal: null
  })
  if (respFromGPT.ok && respFromGPT.status >= 200 && respFromGPT.status < 300) {
    const reader = respFromGPT.body?.getReader()
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
    return {
      scene: newScene(0, 'assistant', char.name, '', false),
      usage: { prompt_tokens: numTokens, completion_tokens: 0, total_tokens: numTokens }
    }
  } else {
    return null
  }
}

export async function loadModelsOpenAi(preset: Preset) {
  if (preset.openAi.apiUrl) {
    if (preset.openAi.apiUrl.startsWith('https://api.openai.com')) {
      const openai = new OpenAI({
        apiKey: get(settings).openAiApiKey,
        dangerouslyAllowBrowser: true
      })
      const response = await openai.models.list()
      const models = response.data.map(model => {
        return { value: model.id, name: model.id }
      })

      return models
    } else {
      // Open AI compatible API
      try {
        const response = await fetch(preset.openAi.apiUrl + '/models', { method: 'GET' })
        const json = await response.json()
        return json.data.map((model: { id: string }) => {
          return { value: model.id, name: model.id }
        })
      } catch (e) {
        console.log('ERROR', e)
      }
    }
  }
  return [{ value: 'unknown', name: 'Unknown' }]
}
