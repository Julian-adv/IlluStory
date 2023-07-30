// import { WebSocket } from "vite";
import { get } from "svelte/store";
import type { SceneType, Story, Usage } from "./interfaces";
import { zeroUsage, charName, userName } from "./store";
import { newSceneId } from "$lib";

function history(scenes: SceneType[]) {
  let dialogs = scenes.map((scene) => {
    return scene.content
  })
  dialogs = dialogs.slice(0, -1);
  // return { 'internal': dialogs, 'visible': dialogs }
  return { 'internal': [], 'visible': [] };
}

export async function sendChatOobabooga(story: Story, scenes: SceneType[], received: (text: string) => void): Promise<[SceneType[], Usage]> {
  const conn = new WebSocket('ws://localhost:5005/api/v1/chat-stream');

  conn.onopen = () => {
    console.log('on open');
    const request = {
      'user_input': scenes[scenes.length - 1].content,
      'max_new_tokens': story.maxTokens,
      'history': history(scenes),
      'mode': 'instruct',                     // Valid options: 'chat', 'chat-instruct', 'instruct'
      'character': get(charName),
      'instruction_template': 'Vicuna-v1.1',  // Will get autodetected if unset
      // 'context_instruct': '',              // Optional
      'your_name': get(userName),

      'regenerate': false,
      '_continue': false,
      'stop_at_newline': false,
      'chat_generation_attempts': 1,
      'chat-instruct_command': 'Continue the chat dialogue below. Write a single reply for the character "<|character|>".\n\n<|prompt|>',

      // Generation params. If 'preset' is set to different than 'None', the values
      // in presets/preset-name.yaml are used instead of the individual numbers.
      'preset': 'None',
      'do_sample': true,
      'temperature': 0.7,  // story.temperature,
      'top_p': 0.1,
      'typical_p': 1,
      'epsilon_cutoff': 0,  // In units of 1e-4
      'eta_cutoff': 0,      // In units of 1e-4
      'tfs': 1,
      'top_a': 0,
      'repetition_penalty': 1.18, // story.frequencyPenalty,
      'repetition_penalty_range': 0,
      'top_k': 40,
      'min_length': 0,
      'no_repeat_ngram_size': 0,
      'num_beams': 1,
      'penalty_alpha': 0,
      'length_penalty': 1,
      'early_stopping': false,
      'mirostat_mode': 0,
      'mirostat_tau': 5,
      'mirostat_eta': 0.1,

      'seed': -1,
      'add_bos_token': true,
      'truncation_length': 2048,
      'ban_eos_token': false,
      'skip_special_tokens': true,
      'stopping_strings': []
    }
    conn.send(JSON.stringify(request))
  }
  
  conn.onmessage = (event) => {
    // console.log('on message', event)
    const resp = JSON.parse(event.data);
    switch (resp.event) {
      case 'text_stream':
        // console.log(resp);
        // console.log(resp.history.visible[resp.history.visible.length - 1][1])
        received(resp.history.visible[resp.history.visible.length - 1][1]);
        break;
      case 'stream_end':
        conn.close();
        console.log('close')
        break;
    }
  }
  
  conn.onerror = (error) => {
    console.log('on error', error)
  }
  
  conn.onclose = () => {
    console.log('on close')
  }

  const newScene: SceneType = {
    id: newSceneId(scenes),
    role: 'assistant',
    content: ''
  }
  scenes = [...scenes, newScene];
  console.log(scenes)
  return [scenes, zeroUsage]
}