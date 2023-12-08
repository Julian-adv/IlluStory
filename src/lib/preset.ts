import { Api, type Preset, type SceneType } from './interfaces'
import { presetExt } from './fs'
import { defaultPreset } from './store'
import {
  assistantRole,
  assocMemory,
  authorNote,
  changeApi,
  charSetting,
  chatHistory,
  endTag,
  globalNote,
  lorebookRole,
  systemRole,
  userRole,
  userSetting
} from './api'
import { tcOpen, tcReadBinaryFile, tcReadTextFile } from './tauriCompat'
import { decompressSync } from 'fflate'
import { decode } from 'msgpackr'

interface RisuPrompt {
  text: string
  role: string
  innerFormat: string
  rangeStart: number
  rangeEnd: string
}

let sceneId = 0

function convertRole(risuRole: string) {
  switch (risuRole) {
    case 'user':
      return userRole
    case 'bot':
      return assistantRole
    case 'system':
      return systemRole
    default:
      return systemRole
  }
}

function convertCharSetting(preset: Preset, prompt: RisuPrompt, role: string) {
  const [beforeSlot, afterSlot] = prompt.innerFormat.split('{{slot}}')
  const scene: SceneType = {
    id: sceneId++,
    content: beforeSlot,
    role: convertRole(prompt.role)
  }
  preset.prompts.push(scene)
  const scene2: SceneType = {
    id: sceneId++,
    content: '',
    role: role
  }
  preset.prompts.push(scene2)
  if (afterSlot && afterSlot.trim() !== '') {
    const scene3: SceneType = {
      id: sceneId++,
      content: afterSlot,
      role: endTag
    }
    preset.prompts.push(scene3)
  }
}

function convertChat(preset: Preset, start: number, end: string) {
  const scene: SceneType = {
    id: sceneId++,
    content: '',
    role: chatHistory,
    rangeStart: start,
    rangeEnd: end
  }
  preset.prompts.push(scene)
}

function convertMemory(preset: Preset, prompt: RisuPrompt) {
  if (prompt.innerFormat) {
    const [beforeSlot, afterSlot] = prompt.innerFormat.split('{{slot}}')
    const scene: SceneType = {
      id: sceneId++,
      content: beforeSlot,
      role: assocMemory,
      rangeStart: 5
    }
    preset.prompts.push(scene)
    if (afterSlot.trim() !== '') {
      const scene2: SceneType = {
        id: sceneId++,
        content: afterSlot,
        role: endTag
      }
      preset.prompts.push(scene2)
    }
  } else {
    preset.prompts.push({ id: sceneId++, content: '', role: assocMemory, rangeStart: 5 })
  }
}

function convertNormal(preset: Preset, prompt: RisuPrompt, role?: string) {
  const scene: SceneType = {
    id: sceneId++,
    content: prompt.text ?? '',
    role: role ? role : convertRole(prompt.role)
  }
  preset.prompts.push(scene)
}

function splitWithTokens(input: string): string[] {
  const regexp = /(@@@system\n|@@@user\n|@@@assistant\n)/

  const segments = []
  let match

  while (input && (match = regexp.exec(input)) !== null) {
    segments.push(input.slice(0, match.index))
    segments.push(match[0])
    input = input.slice(match.index + match[0].length)
  }

  segments.push(input)

  return segments.filter(segment => segment.trim() !== '')
}

function convertMainPrompt(preset: Preset, prompt: string) {
  const segments = splitWithTokens(prompt)
  for (let i = 0; i < segments.length; ) {
    let role
    switch (segments[i]) {
      case '@@@system\n':
        role = systemRole
        i++
        break
      case '@@@assistant\n':
        role = assistantRole
        i++
        break
      case '@@@user\n':
        role = userRole
        i++
        break
      default:
        role = systemRole
        break
    }
    preset.prompts.push({ id: sceneId++, content: segments[i], role: role })
    i++
  }
}

export async function loadPreset(path: string): Promise<Preset> {
  const json = await tcReadTextFile(path)
  const preset = JSON.parse(json)
  if (!preset.koboldAi) {
    preset.koboldAi = defaultPreset.koboldAi
  }
  if (!preset.koboldAi.samplerOrder) {
    preset.koboldAi.samplerOrder = []
  }
  changeApi(preset.api)
  return preset
}

async function importPresetObj(risuPreset: any): Promise<Preset> {
  const preset = structuredClone(defaultPreset)
  preset.prompts = []
  preset.title = risuPreset.name
  preset.api = risuPreset.aiModel === 'textgen_webui' ? Api.Oobabooga : Api.OpenAi
  preset.openAi.temperature = risuPreset.temperature / 100.0
  preset.openAi.contextSize = risuPreset.maxContext
  preset.openAi.maxTokens = risuPreset.maxResponse
  preset.openAi.frequencyPenalty = risuPreset.frequencyPenalty / 100.0
  preset.openAi.presencePenalty = risuPreset.PresensePenalty / 100.0
  if (risuPreset.aiModel.startsWith('gpt')) {
    preset.openAi.model = risuPreset.aiModel
  }
  if (risuPreset.textgenWebUIStreamURL) {
    preset.oobabooga.apiUrl = risuPreset.textgenWebUIBlockingURL
  }
  preset.oobabooga.maxTokens = Number(risuPreset.ooba.max_new_tokens)
  preset.oobabooga.doSample = risuPreset.ooba.do_sample
  preset.oobabooga.temperature = risuPreset.ooba.temperature
  preset.oobabooga.topP = risuPreset.ooba.top_p
  preset.oobabooga.typicalP = risuPreset.ooba.typical_p
  preset.oobabooga.repetitionPenalty = risuPreset.ooba.repetition_penalty
  preset.oobabooga.encoderRepetitionPenalty = risuPreset.ooba.encoder_repetition_penalty
  preset.oobabooga.topK = risuPreset.ooba.top_k
  preset.oobabooga.minLength = risuPreset.ooba.min_length
  preset.oobabooga.noRepeatNgramSize = risuPreset.ooba.no_repeat_ngram_size
  preset.oobabooga.numBeams = risuPreset.ooba.num_beams
  preset.oobabooga.penaltyAlpha = risuPreset.ooba.penalty_alpha
  preset.oobabooga.lengthPenalty = risuPreset.ooba.length_penalty
  preset.oobabooga.earlyStopping = risuPreset.ooba.early_stopping
  preset.oobabooga.seed = risuPreset.ooba.seed
  preset.oobabooga.addBosToken = risuPreset.ooba.add_bos_token
  preset.oobabooga.truncationLength = risuPreset.ooba.truncation_length
  preset.oobabooga.banEosToken = risuPreset.ooba.ban_eos_token
  preset.oobabooga.skipSpecialTokens = risuPreset.ooba.skip_special_tokens
  preset.oobabooga.topA = risuPreset.ooba.top_a
  preset.oobabooga.tfs = risuPreset.ooba.tfs
  preset.oobabooga.userPrefix = risuPreset.ooba.formating.userPrefix
  preset.oobabooga.assistantPrefix = risuPreset.ooba.formating.assistantPrefix
  preset.oobabooga.systemPrefix = risuPreset.ooba.formating.systemPrefix
  sceneId = 0
  if (risuPreset.promptTemplate) {
    for (const prompt of risuPreset.promptTemplate) {
      if (prompt.type === 'description') {
        convertCharSetting(preset, prompt, charSetting)
      } else if (prompt.type === 'persona') {
        convertCharSetting(preset, prompt, userSetting)
      } else if (prompt.type === 'chat') {
        convertChat(preset, prompt.rangeStart, prompt.rangeEnd)
      } else if (prompt.type === 'authornote') {
        convertNormal(preset, prompt, authorNote)
      } else if (prompt.type === 'lorebook') {
        convertNormal(preset, prompt, lorebookRole)
      } else if (prompt.type === 'plain' && prompt.type2 === 'globalNote') {
        convertNormal(preset, prompt, globalNote)
      } else if (prompt.type === 'memory') {
        convertMemory(preset, prompt)
      } else {
        convertNormal(preset, prompt)
      }
    }
  } else {
    if (risuPreset.formatingOrder) {
      for (const promptType of risuPreset.formatingOrder) {
        switch (promptType) {
          case 'main':
            if (risuPreset.mainPrompt) {
              convertMainPrompt(preset, risuPreset.mainPrompt)
            }
            break
          case 'personaPrompt':
            preset.prompts.push({ id: sceneId++, content: '', role: userSetting })
            break
          case 'description':
            preset.prompts.push({ id: sceneId++, content: '', role: charSetting })
            break
          case 'jailbreak':
            if (risuPreset.jailbreak) {
              convertMainPrompt(preset, risuPreset.jailbreak)
            }
            break
          case 'authorNote':
            if (risuPreset.authorNote) {
              convertMainPrompt(preset, risuPreset.authorNote)
            }
            break
          case 'lorebook':
            if (risuPreset.lorebook) {
              convertMainPrompt(preset, risuPreset.lorebook)
            }
            break
          case 'globalNote':
            if (risuPreset.globalNote) {
              convertMainPrompt(preset, risuPreset.globalNote)
            }
            break
          case 'chats':
            convertChat(preset, 0, '-1')
            break
          case 'lastChat':
            convertChat(preset, -1, 'end')
            break
        }
      }
    }
  }
  return preset
}

export async function importPreset(json: string): Promise<Preset> {
  const risuPreset = JSON.parse(json)
  return await importPresetObj(risuPreset)
}

// Copied from https://github.com/kwaroran/RisuAI
export async function decryptBuffer(data: Uint8Array, keys: string) {
  // hash the key to get a fixed length key value
  const keyArray = await window.crypto.subtle.digest('SHA-256', new TextEncoder().encode(keys))

  const key = await window.crypto.subtle.importKey('raw', keyArray, 'AES-GCM', false, [
    'encrypt',
    'decrypt'
  ])

  // use web crypto api to encrypt the data
  const result = await window.crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: new Uint8Array(12)
    },
    key,
    data
  )

  return result
}

async function importBinaryPreset(path: string): Promise<Preset | null> {
  const data = await tcReadBinaryFile(path)
  const decoded = await decode(decompressSync(data))
  console.log(decoded)
  if (decoded.presetVersion === 0 && decoded.type === 'preset') {
    const decrypted = await decryptBuffer(decoded.pres, 'risupreset')
    const decryptedArray = new Uint8Array(decrypted)
    const json = await decode(decryptedArray)
    return importPresetObj(json)
  }
  return null
}

export async function loadPresetDialog(): Promise<[Preset | null, string]> {
  const selected = await tcOpen({ filters: [{ name: '*', extensions: [presetExt] }] })
  if (selected) {
    const preset = await loadPreset(selected)
    return [preset, selected]
  }
  return [null, '']
}

export async function importPresetDialog(): Promise<Preset | null> {
  const path = await tcOpen({ filters: [{ name: '*', extensions: ['json', 'risupreset'] }] })
  if (path && typeof path === 'string') {
    if (path.endsWith('risupreset')) {
      return await importBinaryPreset(path)
    } else if (path.endsWith('json')) {
      const json = await tcReadTextFile(path)
      return await importPreset(json)
    }
  }
  return null
}
