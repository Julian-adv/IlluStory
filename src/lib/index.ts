import type { SceneType } from "./interfaces";

export const helperClassVisible = "text-stone-700";
export const helperClassHidden = "text-stone-400";
export const linkClassVisible = "text-sky-600";

export function newSceneId(scenes:SceneType[]):number {
  return scenes[scenes.length - 1].id + 1;
}