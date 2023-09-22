import { writable } from 'svelte/store'
import type {
  SceneType,
  Preset,
  Settings,
  Char,
  FirstScene,
  StoryCard,
  Session
} from './interfaces'
import { Api, CardType, SortOrder, SortType } from './interfaces'
import { defaultImage } from '$lib'

const defaultScenes: SceneType[] = []

export const prologues = writable(defaultScenes)
export const dialogues = writable(defaultScenes)

export const defaultPreset: Preset = {
  title: '',
  image: '',
  api: Api.OpenAi,
  visualizePrompt:
    "Add a visual summary at the end of the output. It's crucial to include details about <char>'s look, clothing, stance, and nearby setting. The description should be short phrases inside <Visual> and </Visual>. For example: <Visual>blonde hair, shirt, pants, sitting on a chair</Visual>",
  // This prompt is copied from https://arca.live/b/characterai/81890153
  summarizePrompt:
    'This is part of the history of the last conversation between <char>(<char_gender>) and <user>(<user_gender>). Summarize, condense, approximately timestamp the content of the messages exchanged between <char> and <user>, focusing on concrete events and direct information from their conversation. Remove or simplify any content that appears to be redundant or repetitive. Use abbreviations, common language shortcuts. Lastly, add "<Preiviously on <char> and <user>\'s story>" at the beginning of the output, and "</Previously>" at the end of the output. If any of these phrases are in the middle of the input you receive, delete them. They should only appear once, at the end of the output.',

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
    apiUrl: 'http://localhost:5000/api/v1/generate',
    preset: 'tfs-with-top-a',
    maxTokens: 300,
    temperature: 0.7,
    topK: 0,
    topP: 1.0,
    typicalP: 1.0,
    tfs: 0.95,
    topA: 0.2,
    repetitionPenalty: 1.15,
    repetitionPenaltyRange: 0,
    encoderRepetitionPenalty: 1,
    noRepeatNgramSize: 0,
    minLength: 0,
    doSample: true,
    mirostatMode: 0,
    mirostatTau: 5,
    mirostatEta: 0.1,
    penaltyAlpha: 0,
    numBeams: 1,
    lengthPenalty: 1,
    earlyStopping: false,
    truncationLength: 8192,
    addBosToken: true,
    banEosToken: false,
    skipSpecialTokens: true,
    seed: -1,
    contextSize: 8192,
    systemPrefix: '### Instruction:\n',
    userPrefix: '### Input:\n',
    assistantPrefix: '### Response:\n\n'
  },

  prompts: []
}

export const preset = writable(defaultPreset)
export const presetPath = writable('')

export const defaultSession: Session = {
  presetCard: '',
  userCard: '',
  charCards: [],
  lastSpeaker: 0,
  sceneCard: '',
  scenes: []
}

export const session = writable(defaultSession)
export const sessionPath = writable('')

export const zeroUsage = { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 }
export const usage = writable(zeroUsage)

export const summarySceneIndex = writable(0)
export const summarizePrompt = writable('')

export const defaultSettings: Settings = {
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
  imageSource: 'full_desc',
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
  history: [],
  maxHistory: 500
}

export const settings = writable(defaultSettings)

export const emptyChar: Char = {
  image: '',
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
