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
  image: string;
}

export type StringDictionary = {
  [key: string]: string;
}