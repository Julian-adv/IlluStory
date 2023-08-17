export interface SceneType {
  id: number
  role: string
  content: string
  name?: string
  image?: string
  done?: boolean
}

export interface Message {
  role: string;
  content: string;
}

export enum Api {
  OpenAi = 'openAi',
  Oobabooga = 'oobabooga'
}

export interface Story {
  title: string;
  image: string;
  api: Api;
  apiUrl: string;
  temperature: number;
  maxTokens: number;
  contextSize: number;
  summarizePrompt: string;
  // openAI
  model: string;
  frequencyPenalty: number;
  presencePenalty: number;
  // oobabooga
  topP: number;
  typicalP: number;
  topK: number;
  repetitionPenalty: number;
  penaltyAlpha: number;
  lengthPenalty: number;

  prompts: SceneType[]
}

export interface Usage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

export interface StoryCard {
  name: string;
  path: string;
  modifiedAt: Date;
  image: string;
}

export type StringDictionary = {
  [key: string]: string;
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
  generateImage: boolean
  sdURL: string
  enableADetailer: boolean
  imageWidth: number
  imageHeight: number
  steps: number
  cfgScale: number
  prompt: string
  negativePrompt: string
  sampler: string
  enableHires: boolean
  denoisingStrength: number
  hiresScale: number
  hiresUpscaler: string
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
  gender: string
  visual: string
  description: string
}

export enum FileType {
  Story = 1,
  Session,
  Char,
  All
}