import { writable } from "svelte/store"
import { Api } from "./interfaces"
import type { SceneType, Story, StringDictionary } from "./interfaces"
export const openAiApiKey = writable('')
export const openAiModel = writable('')

const defaultScenes:SceneType[] = []

export const initialScenes = writable(defaultScenes)
export const additionalScenes = writable(defaultScenes)

// export const startStoryId = writable(0);

const defaultStory: Story = {
  title: '',
  image: '',
  api: Api.OpenAi,
  apiUrl: 'https://api.openai.com/v1',
  temperature: 0.75,
  maxTokens: 300,
  contextSize: 4096,
  // This prompt is copied from https://arca.live/b/characterai/81890153
  // summarizePrompt: "This is part of the history of the last conversation between <char>(<char_gender>) and <user>(<user_gender>). Summarize, condense, approximately timestamp the content of the messages exchanged between <char> and <user>, focusing on concrete events and direct information from their conversation. Remove or simplify any content that appears to be redundant or repetitive. Use abbreviations, common language shortcuts. Lastly, add \"<Preiviously on <char> and <user>'s story>\" at the beginning of the output, and \"</Previously>\" at the end of the output. If any of these phrases are in the middle of the input you receive, delete them. They should only appear once, at the end of the output. Next, add a visual summary of what's going on. It is important to include details about character's appearance, clothing, posture, and surroundings in the visual summary. The description should be written in short phrases within \"<Visual>\" and \"</Visual>\", for example \"<Visual>blonde hair, big breasts, long legs, school uniform, lying in bed</Visual>\"",
  summarizePrompt: "This is part of the history of the last conversation between <char>(<char_gender>) and <user>(<user_gender>). Summarize, condense, approximately timestamp the content of the messages exchanged between <char> and <user>, focusing on concrete events and direct information from their conversation. Remove or simplify any content that appears to be redundant or repetitive. Use abbreviations, common language shortcuts. Lastly, add \"<Preiviously on <char> and <user>'s story>\" at the beginning of the output, and \"</Previously>\" at the end of the output. If any of these phrases are in the middle of the input you receive, delete them. They should only appear once, at the end of the output.",
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

export const story = writable(defaultStory)

export const storyPath = writable('')
export const sessionPath = writable('')

export const zeroUsage = {prompt_tokens: 0, completion_tokens: 0, total_tokens: 0}
export const usage = writable(zeroUsage)

export const currentTab = writable('/')

export const firstSceneIndex = writable(0)
export const summarySceneIndex = writable(0)
export const summarizePrompt = writable('')

const dict: StringDictionary = {}
export const replaceDict = writable(dict)