import { writable } from "svelte/store";
import { Api } from "./interfaces";
import type { SceneType, Story } from "./interfaces";

export const openAiApiKey = writable('');
export const openAiModel = writable('');

const defaultScenes:SceneType[] = [];

export const initialScenes = writable(defaultScenes);
export const additionalScenes = writable(defaultScenes);

export const startStoryId = writable(0);

const defaultStory: Story = {
  title: '',
  image: '',
  api: Api.OpenAi,
  temperature: 0.75,
  maxTokens: 300,
  contextSize: 4096,
  // open ai
  model: '',
  frequencyPenalty: 0.4,
  presencePenalty: 0.4,
  // oobabooga
  topP: 0.9,
  typicalP: 1.0,
  repetitionPenalty: 1.1,
  topK: 0,
  penaltyAlpha: 0,
  lengthPenalty: 1,

  prompts: []
}

export const story = writable(defaultStory);

export const charName = writable('Jane Doe');
export const userName = writable('John Doe');

export const storyPath = writable('');
export const sessionPath = writable('');

export const zeroUsage = {prompt_tokens: 0, completion_tokens: 0, total_tokens: 0};
export const usage = writable(zeroUsage);

export const currentTab = writable('/');