import { writable, type Writable } from 'svelte/store'
import type {
  SceneType,
  Preset,
  Settings,
  Char,
  FirstScene,
  StoryCard,
  Session,
  Lorebook
} from './interfaces'
import { Api, CardType, SortOrder, SortType } from './interfaces'
import { defaultImage } from '$lib'
import type { Command } from '@tauri-apps/api/shell'

const defaultScenes: SceneType[] = []

export const dialogues = writable(defaultScenes)

export const defaultPreset: Preset = {
  title: '',
  image: '',
  api: Api.OpenAi,
  streaming: false,
  visualizeMode: 'text',
  visualizeRegexp: '\\[.*?Location: *(.*?)\\]',
  visualizePrompt:
    "Add a visual summary at the end of the output. It's crucial to include details about <char>'s look, clothing, stance, and nearby setting. The description should be short phrases inside <Visual> and </Visual>. For example: <Visual>blonde hair, shirt, pants, sitting on a chair</Visual>",
  // This prompt is copied from https://arca.live/b/characterai/81890153
  summarizePrompt:
    'This is part of the history of the last conversation between <char>(<char_gender>) and <user>(<user_gender>). Summarize, condense, approximately timestamp the content of the messages exchanged between <char> and <user>, focusing on concrete events and direct information from their conversation. Remove or simplify any content that appears to be redundant or repetitive. Use abbreviations, common language shortcuts. Lastly, add "<Preiviously on <char> and <user>\'s story>" at the beginning of the output, and "</Previously>" at the end of the output. If any of these phrases are in the middle of the input you receive, delete them. They should only appear once, at the end of the output.',

  narratorMode: false,
  openAi: {
    apiUrl: 'https://api.openai.com/v1',
    model: '',
    frequencyPenalty: 0.4,
    presencePenalty: 0.4,
    temperature: 0.75,
    maxTokens: 300,
    contextSize: 4096
  },

  // oobabooga
  oobabooga: {
    apiUrl: 'http://localhost:5000/v1',
    model: 'gpt-3.5-turbo',
    mode: 'instruct',
    instructionTemplate: 'Default',
    preset: 'Default',
    temperature: 1.0,
    temperature_last: false,
    dynamic_temperature: false,
    dynatemp_low: 1,
    dynatemp_high: 1,
    dynatemp_exponent: 1,
    top_p: 1.0,
    min_p: 0,
    top_k: 0,
    repetition_penalty: 1.0,
    presence_penalty: 0.0,
    frequency_penalty: 0.0,
    repetition_penalty_range: 1024,
    typical_p: 1.0,
    tfs: 1.0,
    top_a: 0.0,
    epsilon_cutoff: 0,
    eta_cutoff: 0,
    guidance_scale: 1.0,
    penalty_alpha: 0,
    mirostat_mode: 0,
    mirostat_tau: 5,
    mirostat_eta: 0.1,
    do_sample: true,
    encoder_repetition_penalty: 1,
    no_repeat_ngram_size: 0,
    min_length: 0,
    num_beams: 1,
    length_penalty: 1,
    early_stopping: false,
    seed: -1,
    max_tokens: 512,
    truncation_length: 8192,
    ban_eos_token: false,
    add_bos_token: true,
    skip_special_tokens: true,
    continue_: false
  },

  koboldAi: {
    apiUrl: 'http://localhost:5001/api',
    maxLength: 100,
    temperature: 0.7,
    topK: 100,
    topP: 0.92,
    typical: 1.0,
    tfs: 1.0,
    topA: 0.0,
    minP: 0.0,
    repPen: 1.0,
    repPenRange: 256,
    presencePenalty: 0.0,
    samplerSeed: -1,
    samplerOrder: [6, 0, 1, 3, 4, 2, 5],
    useDefaultBadwordsIds: false,
    dynatempRange: 0.0,
    dynatempExponent: 1.0,
    mirostat: 0,
    mirostatTau: 5,
    mirostatEta: 0.1,
    maxContextLength: 2048,
    systemPrefix: '### Instruction:\n',
    userPrefix: '### Input:\n',
    assistantPrefix: '### Response:\n\n'
  },

  infermatic: {
    apiUrl: 'https://api.totalgpt.ai/v1',
    model: ''
  },

  prompts: []
}

export const preset = writable(defaultPreset)
export const presetPath = writable('')

export const defaultSession: Session = {
  presetCard: '',
  userCard: '',
  charCards: [],
  nextSpeaker: 'auto',
  sceneCard: '',
  lorebookCard: '',
  startIndex: 0,
  scenes: [],
  lorebookTriggers: []
}

export const session = writable(defaultSession)
export const sessionPath = writable('')

export const zeroUsage = { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 }
export const usage = writable(zeroUsage)

export const summarizePrompt = writable('')

export const maxMemory = 10
const defaultMemory: SceneType[] = []

export const memory = writable(defaultMemory)

export const defaultSettings: Settings = {
  dataDir: '',
  openAiApiKey: '',
  sortOrder: SortOrder.Ascending,
  sortType: SortType.Name,
  convertMarkdown: true,
  dialogSettings: {
    bold: true,
    italic: false,
    color: '#0f0f0f'
  },
  descriptionSettings: {
    bold: false,
    italic: true,
    color: '#0f0f0f'
  },
  userNameSettings: {
    bold: true,
    italic: false,
    color: '#0f0f0f'
  },
  charNameSettings: {
    bold: true,
    italic: false,
    color: '#0f0f0f'
  },
  fontFamily: 'Geogia',
  fontSize: 12,
  sdURL: 'http://localhost:7860',
  imageSizes: '512x768, 768x512, 1024x512',
  steps: 30,
  cfgScale: 7.0,
  prompt: '(masterpiece, best quality, realistic, finely detailed)',
  negativePrompt: '(worst quality, low quality, normal quality)',
  sampler: 'DPM++ SDE Karras',
  enableHires: false,
  denoisingStrength: 0.4,
  hiresScale: 2.0,
  hiresUpscaler: 'Latent',
  enableADetailer: true,
  blurBackground: true,
  deeplApiKey: '',
  aiLang: 'EN-US',
  userLang: '',
  translateOutput: false,
  translateInput: false,
  oneInstruction: true,
  embeddings: 'chromadb'
}

export const settings = writable(defaultSettings)

export const emptyChar: Char = {
  image: '',
  iconX: 0,
  iconY: 0,
  iconSize: 80,
  partSize: 512,
  name: '',
  title: '',
  gender: '',
  visual: '',
  description: ''
}

export const curChar = writable(emptyChar)
export const curCharPath = writable('')
export const chars = writable([emptyChar])
export const charPaths = writable([''])
export const user = writable(emptyChar)
export const userPath = writable('')

export const replaceDict = writable({})

export const emptyScene: FirstScene = {
  title: '',
  image: '',
  scenes: []
}

export const curScene = writable(emptyScene)
export const curScenePath = writable('')

export const emptyCard: StoryCard = {
  type: CardType.Preset,
  name: 'Card',
  title: '',
  path: '',
  image: defaultImage,
  modifiedAt: new Date()
}

export const presetCard = writable(emptyCard)
export const userCard = writable(emptyCard)
export const charCards = writable([emptyCard])
export const sceneCard = writable(emptyCard)
export const lorebookCard = writable(emptyCard)

export const fileDialog = writable({ open: false, ext: '', value: '', title: '' })

export const command: Writable<Command | null> = writable(null)

export const defaultLorebook: Lorebook = {
  title: '',
  image: '',
  rules: []
}

export const lorebook = writable(defaultLorebook)

export const lorebookPath = writable('')

const defaultHistory: string[] = []

export const inputHistory = writable(defaultHistory)
