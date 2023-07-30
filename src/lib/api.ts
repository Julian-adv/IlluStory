import { Api } from '$lib/interfaces';
import { sendChatOobabooga } from './apiOobabooga';
import { sendChatOpenAi } from './apiOpenAi';

export const charSetting = 'set_char';
export const userSetting = 'set_user';
export const startStory = 'start_story';

export const roles = [
  { value: "system", name: "System" },
  { value: "assistant", name: "Assistant" },
  { value: "user", name: "User" },
  { value: charSetting, name: 'Char setting' },
  { value: userSetting, name: 'User setting' },
  { value: startStory, name: "Start story" },
];

export let sendChat = sendChatOpenAi;

export function changeApi(api: Api) {
  switch (api) {
    case Api.OpenAi:
      sendChat = sendChatOpenAi;
      break;
    case Api.Oobabooga:
      sendChat = sendChatOobabooga;
      break;
  }
}
