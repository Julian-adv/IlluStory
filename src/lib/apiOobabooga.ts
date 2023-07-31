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
  return { 'internal': dialogs, 'visible': dialogs }
  // return { 'internal': [], 'visible': [] };
}

export async function sendChatOobabooga(story: Story, scenes: SceneType[], received: (text: string) => void,
                                        closedCallback: () => void): Promise<[SceneType[], Usage]> {
  const conn = new WebSocket('ws://localhost:5005/api/v1/stream');
  
  conn.onopen = () => {
    let prompt = '';
    scenes.forEach((scene) => {
      prompt += scene.content + '\n';
    });
    const request = {
      "max_new_tokens": story.maxTokens,
      "do_sample": true,
      "temperature": story.temperature,
      "top_p": story.topP,
      "typical_p": story.typicalP,
      "repetition_penalty": story.repetitionPenalty,
      "encoder_repetition_penalty": 1,
      "top_k": story.topK,
      "min_length": 0,
      "no_repeat_ngram_size": 0,
      "num_beams": 1,
      "penalty_alpha": story.penaltyAlpha,
      "length_penalty": story.lengthPenalty,
      "early_stopping": false,
      "truncation_length": story.maxTokens,
      "ban_eos_token": false,
      "stopping_strings": [
        "\nUser:",
        "\nuser:",
        `\n${get(userName)}:`
      ],
      "seed": -1,
      "add_bos_token": true,
      "prompt": prompt
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
        received(resp.text);
        break;
      case 'stream_end':
        conn.close();
        closedCallback();
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