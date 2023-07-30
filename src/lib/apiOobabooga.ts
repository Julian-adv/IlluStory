// import { WebSocket } from "vite";
import type { SceneType, Story } from "./interfaces";
import { zeroUsage } from "./store";

export async function sendChatOobabooga(story: Story, scenes: SceneType[]) {
  const conn = new WebSocket('ws://localhost:5005/api/v1/stream');

  conn.onopen = () => {
    console.log('on open');
  }
  
  conn.onmessage = (event) => {
    console.log('on message', event)
  }
  
  conn.onerror = (error) => {
    console.log('on error', error)
  }
  
  conn.onclose = () => {
    console.log('on close')
  }

  return [scenes, zeroUsage]
}