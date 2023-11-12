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
import { tcOpen, tcReadTextFile } from './tauriCompat'

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
  if (afterSlot.trim() !== '') {
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
  changeApi(preset.api)
  return preset
}

export async function importPreset(json: string): Promise<Preset> {
  const tempPreset = JSON.parse(json)
  const preset = structuredClone(defaultPreset)
  preset.prompts = []
  preset.title = tempPreset.name
  preset.api = tempPreset.aiModel === 'textgen_webui' ? Api.Oobabooga : Api.OpenAi
  preset.openAi.temperature = tempPreset.temperature / 100.0
  preset.openAi.contextSize = tempPreset.maxContext
  preset.openAi.maxTokens = tempPreset.maxResponse
  preset.openAi.frequencyPenalty = tempPreset.frequencyPenalty / 100.0
  preset.openAi.presencePenalty = tempPreset.PresensePenalty / 100.0
  if (tempPreset.aiModel.startsWith('gpt')) {
    preset.openAi.model = tempPreset.aiModel
  }
  if (tempPreset.textgenWebUIStreamURL) {
    preset.oobabooga.apiUrl = tempPreset.textgenWebUIBlockingURL
  }
  preset.oobabooga.maxTokens = Number(tempPreset.ooba.max_new_tokens)
  preset.oobabooga.doSample = tempPreset.ooba.do_sample
  preset.oobabooga.temperature = tempPreset.ooba.temperature
  preset.oobabooga.topP = tempPreset.ooba.top_p
  preset.oobabooga.typicalP = tempPreset.ooba.typical_p
  preset.oobabooga.repetitionPenalty = tempPreset.ooba.repetition_penalty
  preset.oobabooga.encoderRepetitionPenalty = tempPreset.ooba.encoder_repetition_penalty
  preset.oobabooga.topK = tempPreset.ooba.top_k
  preset.oobabooga.minLength = tempPreset.ooba.min_length
  preset.oobabooga.noRepeatNgramSize = tempPreset.ooba.no_repeat_ngram_size
  preset.oobabooga.numBeams = tempPreset.ooba.num_beams
  preset.oobabooga.penaltyAlpha = tempPreset.ooba.penalty_alpha
  preset.oobabooga.lengthPenalty = tempPreset.ooba.length_penalty
  preset.oobabooga.earlyStopping = tempPreset.ooba.early_stopping
  preset.oobabooga.seed = tempPreset.ooba.seed
  preset.oobabooga.addBosToken = tempPreset.ooba.add_bos_token
  preset.oobabooga.truncationLength = tempPreset.ooba.truncation_length
  preset.oobabooga.banEosToken = tempPreset.ooba.ban_eos_token
  preset.oobabooga.skipSpecialTokens = tempPreset.ooba.skip_special_tokens
  preset.oobabooga.topA = tempPreset.ooba.top_a
  preset.oobabooga.tfs = tempPreset.ooba.tfs
  preset.oobabooga.userPrefix = tempPreset.ooba.formating.userPrefix
  preset.oobabooga.assistantPrefix = tempPreset.ooba.formating.assistantPrefix
  preset.oobabooga.systemPrefix = tempPreset.ooba.formating.systemPrefix
  sceneId = 0
  if (tempPreset.promptTemplate) {
    for (const prompt of tempPreset.promptTemplate) {
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
    if (tempPreset.formatingOrder) {
      for (const promptType of tempPreset.formatingOrder) {
        switch (promptType) {
          case 'main':
            if (tempPreset.mainPrompt) {
              convertMainPrompt(preset, tempPreset.mainPrompt)
            }
            break
          case 'personaPrompt':
            preset.prompts.push({ id: sceneId++, content: '', role: userSetting })
            break
          case 'description':
            preset.prompts.push({ id: sceneId++, content: '', role: charSetting })
            break
          case 'jailbreak':
            if (tempPreset.jailbreak) {
              convertMainPrompt(preset, tempPreset.jailbreak)
            }
            break
          case 'authorNote':
            if (tempPreset.authorNote) {
              convertMainPrompt(preset, tempPreset.authorNote)
            }
            break
          case 'lorebook':
            if (tempPreset.lorebook) {
              convertMainPrompt(preset, tempPreset.lorebook)
            }
            break
          case 'globalNote':
            if (tempPreset.globalNote) {
              convertMainPrompt(preset, tempPreset.globalNote)
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

export async function loadPresetDialog(): Promise<[Preset | null, string]> {
  const selected = await tcOpen({ filters: [{ name: '*', extensions: [presetExt] }] })
  if (selected) {
    const preset = await loadPreset(selected)
    return [preset, selected]
  }
  return [null, '']
}

export async function importPresetDialog(): Promise<Preset | null> {
  const json = await tcOpen({ mode: 'text', filters: [{ name: '*', extensions: ['json'] }] })
  if (json) {
    const preset = await importPreset(json)
    return preset
  }
  return null
}
