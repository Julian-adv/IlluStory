import { Api } from './interfaces'
import { sendChatOobabooga } from './apiOobabooga'
import { sendChatOpenAi } from './apiOpenAi'
import { isWithinTokenLimit } from 'gpt-tokenizer'
import llamaTokenizer from 'llama-tokenizer-js'

export const charSetting = 'set_char'
export const userSetting = 'set_user'
export const startStory = 'start_story'

export const roles = [
  { value: "system", name: "System" },
  { value: "assistant", name: "Assistant" },
  { value: "user", name: "User" },
  { value: "-", name: "-" },
  { value: charSetting, name: 'Char setting' },
  { value: userSetting, name: 'User setting' },
  { value: startStory, name: "Start story" },
]

export const chatRoles = [
  { value: "system", name: "System" },
  { value: "assistant", name: "Assistant" },
  { value: "user", name: "User" },
]

export let sendChat = sendChatOobabooga
const tokenLimit = 4096

function countTokensGpt(str: string): number {
  return isWithinTokenLimit(str, tokenLimit) || 0
}

function countTokensLlama(str: string) {
  return llamaTokenizer.encode(str).length
}

export let countTokensApi = countTokensGpt

export function changeApi(api: Api) {
  switch (api) {
    case Api.OpenAi:
      sendChat = sendChatOpenAi
      countTokensApi = countTokensGpt
      break
    case Api.Oobabooga:
      sendChat = sendChatOobabooga
      countTokensApi = countTokensLlama
      break
  }
}
