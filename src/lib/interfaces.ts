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
  tag?: string
  allChars?: boolean
}

export interface Message {
  role: string
  content: string
}

export enum Api {
  OpenAi = 'openAi',
  Oobabooga = 'oobabooga',
  KoboldAi = 'koboldAi'
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
  preset: string
  maxTokens: number
  temperature: number
  topP: number
  topK: number
  typicalP: number
  tfs: number
  topA: number
  repetitionPenalty: number
  repetitionPenaltyRange: number
  encoderRepetitionPenalty: number
  noRepeatNgramSize: number
  minLength: number
  seed: number
  doSample: boolean
  mirostatMode: number
  mirostatTau: number
  mirostatEta: number
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

export interface KoboldAiParam {
  apiUrl: string
  preset: string
  maxTokens: number
  temperature: number
  topP: number
  topK: number
  typicalP: number
  tfs: number
  topA: number
  minP: number
  repetitionPenalty: number
  repetitionPenaltyRange: number
  samplerOrder: number[]
  seed: number
  mirostatMode: number
  mirostatTau: number
  mirostatEta: number
  contextSize: number
  systemPrefix: string
  userPrefix: string
  assistantPrefix: string
}

export interface Preset {
  title: string
  image: string
  api: Api
  streaming: boolean
  visualizeMode: 'none' | 'regexp' | 'text' | 'generate'
  visualizeRegexp: string
  visualizePrompt: string
  summarizePrompt: string
  openAi: OpenAiParam
  oobabooga: OobaboogaParam
  koboldAi: KoboldAiParam

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
  Session,
  Json,
  Dir,
  Lorebook
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
  dataDir: string
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
  oneInstruction: boolean
  embeddings: string
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

export interface Trigger {
  id: string
  triggered: boolean
}

export interface Session {
  presetCard: string
  userCard: string
  charCards: string[]
  nextSpeaker: number
  sceneCard: string
  lorebookCard: string
  startIndex: number
  scenes: SceneType[]
  lorebookTriggers: Trigger[]
}

export interface ChatResult {
  scene: SceneType
  usage: Usage
}

export interface SceneResult {
  showImage: boolean
  imageFromSD: Promise<string>
  imageSize: ImageSize
}

export interface Rule {
  id: string
  triggered: boolean
  condition: string
  answer: string
  content: string
  textContent: string
}

export interface Lorebook {
  title: string
  image: string
  rules: Rule[]
}
