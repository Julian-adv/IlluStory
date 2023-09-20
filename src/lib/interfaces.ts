export interface ImageSize {
  width: number
  height: number
}

export interface SceneType {
  id: number
  role: string
  content: string

  name?: string
  textContent?: string
  visualContent?: string
  translatedContent?: string
  image?: string
  imageSize?: ImageSize
  rangeStart?: number
  rangeEnd?: string
  done?: boolean
}

export interface Message {
  role: string
  content: string
}

export enum Api {
  OpenAi = 'openAi',
  Oobabooga = 'oobabooga'
}

export interface OpenAiParam {
  apiUrl: string
  model: string
  temperature: number
  frequencyPenalty: number
  presencePenalty: number
  maxTokens: number
  contextSize: number
}

export interface OobaboogaParam {
  apiUrl: string
  maxTokens: number
  temperature: number
  topP: number
  topK: number
  typicalP: number
  tfs: number
  topA: number
  repetitionPenalty: number
  encoderRepetitionPenalty: number
  noRepeatNgramSize: number
  minLength: number
  seed: number
  doSample: boolean
  penaltyAlpha: number
  numBeams: number
  lengthPenalty: number
  earlyStopping: boolean
  truncationLength: number
  banEosToken: boolean
  addBosToken: boolean
  skipSpecialTokens: boolean
  contextSize: number
  systemPrefix: string
  userPrefix: string
  assistantPrefix: string
}

export interface Preset {
  title: string
  image: string
  api: Api
  visualizePrompt: string
  summarizePrompt: string
  openAi: OpenAiParam
  oobabooga: OobaboogaParam

  prompts: SceneType[]
}

export interface Usage {
  prompt_tokens: number
  completion_tokens: number
  total_tokens: number
}

export enum CardType {
  Preset = 0,
  Char,
  Scene,
  Session
}

export interface StoryCard {
  type: CardType
  name: string
  title: string
  path: string
  modifiedAt: Date
  image: string
}

export type StringDictionary = {
  [key: string]: string
}

export interface TextSettings {
  bold: boolean
  italic: boolean
  color: string
}

export interface Settings {
  openAiApiKey: string
  sortOrder: SortOrder
  sortType: SortType
  convertMarkdown: boolean
  dialogSettings: TextSettings
  descriptionSettings: TextSettings
  userNameSettings: TextSettings
  charNameSettings: TextSettings
  fontFamily: string
  fontSize: number
  imageSource: string
  sdURL: string
  enableADetailer: boolean
  imageSizes: string
  steps: number
  cfgScale: number
  prompt: string
  negativePrompt: string
  sampler: string
  enableHires: boolean
  denoisingStrength: number
  hiresScale: number
  hiresUpscaler: string
  blurBackground: boolean
  deeplApiKey: string
  aiLang: string
  userLang: string
  translateOutput: boolean
  translateInput: boolean
  history: string[]
  maxHistory: number
}

export enum SortType {
  Name = 'Name',
  Date = 'Modified Date'
}

export enum SortOrder {
  Ascending = 1,
  Descending
}

export interface SelectItem {
  name: string
  value: string
}

export interface Char {
  image: string
  name: string
  title: string
  gender: string
  visual: string
  description: string
}

export enum FileType {
  Preset = 1,
  Session,
  Char,
  Scene,
  All
}

export interface FirstScene {
  title: string
  image: string
  scenes: SceneType[]
}

export interface Session {
  presetCard: string
  userCard: string
  charCards: string[]
  sceneCard: string
  scenes: SceneType[]
}
