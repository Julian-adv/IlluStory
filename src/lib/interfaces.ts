export interface SceneType {
  id: number
  role: string
  content: string
  name?: string
  image?: string
}

export interface Prompt {
  id: number;
  role: string;
  content: string;
}

export enum Api {
  OpenAi = 'openAi',
  Oobabooga = 'oobabooga'
}

export interface Story {
  title: string;
  api: Api;
  model: string;
  temperature: number;
  frequencyPenalty: number;
  presencePenalty: number;
  maxTokens: number;
  prompts: Prompt[]
}