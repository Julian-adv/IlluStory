import { writable } from "svelte/store";
import type { SceneType } from "./interfaces";

export const openAiApiKey = writable('');
export const openAiModel = writable('');

const scene: SceneType = {
  id: 0,
  role: 'system',
  content: ''
}

export const scenes = writable([scene]);

export const hiddenScenes = writable(0);