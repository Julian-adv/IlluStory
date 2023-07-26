export interface SceneType {
  id: number
  role: string
  content: string
  name?: string
  image?: string
}

export interface Story {
  title: string;
  model: string;
  temperature: number;
  frequencyPenalty: number;
  presencePenalty: number;
  maxTokens: number;
  prompts: {
    id: number;
    role: string;
    content: string;
  }[]
}