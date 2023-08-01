export interface SceneType {
  id: number
  role: string
  content: string
  name?: string
  image?: string
  done?: boolean
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
  // openAI
  model: string;
  temperature: number;
  frequencyPenalty: number;
  presencePenalty: number;
  maxTokens: number;
  // oobabooga
  topP: number;
  typicalP: number;
  topK: number;
  repetitionPenalty: number;
  penaltyAlpha: number;
  lengthPenalty: number;
  prompts: Prompt[]
}

export interface Usage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

export interface StoryCard {
  name: string;
  image: string;
}