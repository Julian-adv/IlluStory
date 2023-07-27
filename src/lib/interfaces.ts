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

export interface Story {
  title: string;
  model: string;
  temperature: number;
  frequencyPenalty: number;
  presencePenalty: number;
  maxTokens: number;
  prompts: Prompt[]
}