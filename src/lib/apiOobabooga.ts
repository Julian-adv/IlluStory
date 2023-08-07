import { get } from "svelte/store"
import type { SceneType, Story, Usage } from "./interfaces"
import { replaceDict, zeroUsage } from "./store"
import { countTokensApi } from "./api"

export async function sendChatOobabooga(story:Story, initScenes: SceneType[], addedScenes: SceneType[], summary: boolean, firstSceneIndex: number, sendStartIndex: number): Promise<[SceneType|null, Usage]> {
  const uri = "http://localhost:5000/api/v1/generate"
  const url = new URL(uri)
  let prompt = ''
  if (summary) {
    prompt += story.summarizePrompt + '\n'
    initScenes.slice(firstSceneIndex).forEach(scene => {
      prompt += scene.content + '\n'
    })
  } else {
    initScenes.forEach(scene => {
      prompt += scene.content + '\n'
    })
  }
  addedScenes.slice(sendStartIndex).forEach(scene => {
    prompt += scene.content + '\n'
  })
  const usage: Usage = { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 }
  usage.prompt_tokens = countTokensApi(prompt)
  const userName = get(replaceDict)['user']

  const respFromOoga = await fetch(url, {
    body: JSON.stringify({
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
        `\n${userName}:`,
        `\n${userName} `
      ],
      "seed": -1,
      "add_bos_token": true,
      "prompt": prompt
    }),
    headers: {},
    method: "POST",
    signal: null
  })
  const dataFromOoga = await respFromOoga.json()
  console.log('dataFromOoga', dataFromOoga)
  if (respFromOoga.ok && respFromOoga.status >= 200 && respFromOoga.status < 300) {
    const newScene: SceneType = {
      id: 0,
      role: 'assistant',
      content: dataFromOoga.results[0].text
    }
    usage.completion_tokens = countTokensApi(dataFromOoga.results[0].text)
    usage.total_tokens = usage.prompt_tokens + usage.completion_tokens
    return [newScene, usage]
  } else {
    return [null, usage]
  }
}

export async function sendChatOobaboogaStream(story: Story, scenes: SceneType[], received: (text: string) => void,
                                        closedCallback: () => void): Promise<[SceneType[], Usage]> {
  const conn = new WebSocket('ws://localhost:5005/api/v1/stream')
  const userName = get(replaceDict)['user']
  
  conn.onopen = () => {
    let prompt = ''
    scenes.forEach((scene) => {
      prompt += scene.content + '\n'
    })
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
        `\n${userName}:`
      ],
      "seed": -1,
      "add_bos_token": true,
      "prompt": prompt
    }
    conn.send(JSON.stringify(request))
  }
  
  conn.onmessage = (event) => {
    // console.log('on message', event)
    const resp = JSON.parse(event.data)
    switch (resp.event) {
      case 'text_stream':
        // console.log(resp);
        // console.log(resp.history.visible[resp.history.visible.length - 1][1])
        received(resp.text)
        break
      case 'stream_end':
        conn.close()
        closedCallback()
        break
    }
  }
  
  conn.onerror = (error) => {
    console.log('on error', error)
  }
  
  conn.onclose = () => {
    console.log('on close')
  }

  const newScene: SceneType = {
    id: 0,
    role: 'assistant',
    content: ''
  }
  scenes = [...scenes, newScene]
  return [scenes, zeroUsage]
}