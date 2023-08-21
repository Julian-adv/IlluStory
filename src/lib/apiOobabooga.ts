import { get } from "svelte/store"
import type { SceneType, Story, Usage } from "./interfaces"
import { replaceDict, zeroUsage } from "./store"
import { assistantRole, countTokensApi, systemRole, userRole } from "./api"

function addRolePrefix(story: Story, scene: SceneType) {
  if (scene.role === systemRole) {
    return story.oobabooga.systemPrefix
  } else if (scene.role === assistantRole) {
    return story.oobabooga.assistantPrefix
  } else if (scene.role === userRole) {
    return story.oobabooga.userPrefix
  }
  return ''
}

export async function sendChatOobabooga(story:Story, initScenes: SceneType[], addedScenes: SceneType[], summary: boolean, firstSceneIndex: number, sendStartIndex: number): Promise<[SceneType|null, Usage]> {
  const uri = "http://localhost:5000/api/v1/generate"
  const url = new URL(uri)
  let prompt = ''
  if (summary) {
    prompt += story.oobabooga.systemPrefix
    prompt += story.summarizePrompt + '\n'
    initScenes.slice(firstSceneIndex).forEach(scene => {
      prompt += scene.content + '\n'
    })
    addedScenes.slice(sendStartIndex).forEach(scene => {
      prompt += scene.content + '\n'
    })
  } else {
    initScenes.forEach(scene => {
      prompt += addRolePrefix(story, scene) + scene.content + '\n'
    })
    addedScenes.slice(sendStartIndex).forEach(scene => {
      prompt += addRolePrefix(story, scene) + scene.content + '\n'
    })
  }
  prompt += story.oobabooga.assistantPrefix
  // console.log('prompt:', prompt)
  const usage: Usage = { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 }
  usage.prompt_tokens = countTokensApi(prompt)
  const userName = get(replaceDict)['user']

  const respFromOoga = await fetch(url, {
    body: JSON.stringify({
      "max_new_tokens": story.oobabooga.maxTokens,
      "temperature": story.oobabooga.temperature,
      "top_k": story.oobabooga.topK,
      "top_p": story.oobabooga.topP,
      "typical_p": story.oobabooga.typicalP,
      "top_a": story.oobabooga.topA,
      "repetition_penalty": story.oobabooga.repetitionPenalty,
      "encoder_repetition_penalty": story.oobabooga.encoderRepetitionPenalty,
      "no_repeat_ngram_size": story.oobabooga.noRepeatNgramSize,
      "min_length": story.oobabooga.minLength,
      "do_sample": story.oobabooga.doSample,
      "penalty_alpha": story.oobabooga.penaltyAlpha,
      "num_beams": story.oobabooga.numBeams,
      "length_penalty": story.oobabooga.lengthPenalty,
      "early_stopping": story.oobabooga.earlyStopping,
      "truncation_length": story.oobabooga.truncationLength,
      "add_bos_token": story.oobabooga.addBosToken,
      "ban_eos_token": story.oobabooga.banEosToken,
      "skip_special_tokens": story.oobabooga.skipSpecialTokens,
      "seed": story.oobabooga.seed,
      "stopping_strings": [
        "### INPUT",
        "### Input",
        "### User",
        "### USER",
        "### INSTRUCTION",
        "### Instruction",
        "\nUser:",
        "\nuser:",
        `\n${userName}:`,
        `\n${userName} `
      ],
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
      role: assistantRole,
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
      "max_new_tokens": story.oobabooga.maxTokens,
      "temperature": story.oobabooga.temperature,
      "top_k": story.oobabooga.topK,
      "top_p": story.oobabooga.topP,
      "typical_p": story.oobabooga.typicalP,
      "top_a": story.oobabooga.topA,
      "repetition_penalty": story.oobabooga.repetitionPenalty,
      "encoder_repetition_penalty": story.oobabooga.encoderRepetitionPenalty,
      "no_repeat_ngram_size": story.oobabooga.noRepeatNgramSize,
      "min_length": story.oobabooga.minLength,
      "do_sample": story.oobabooga.doSample,
      "penalty_alpha": story.oobabooga.penaltyAlpha,
      "num_beams": story.oobabooga.numBeams,
      "length_penalty": story.oobabooga.lengthPenalty,
      "early_stopping": story.oobabooga.earlyStopping,
      "truncation_length": story.oobabooga.truncationLength,
      "add_bos_token": story.oobabooga.addBosToken,
      "ban_eos_token": story.oobabooga.banEosToken,
      "skip_special_tokesn": story.oobabooga.skipSpecialTokens,
      "seed": story.oobabooga.seed,
      "stopping_strings": [
        "### INPUT",
        "### Input",
        "### User",
        "### USER",
        "### INSTRUCTION",
        "### Instruction",
        "\nUser:",
        "\nuser:",
        `\n${userName}:`
      ],
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
    role: assistantRole,
    content: ''
  }
  scenes = [...scenes, newScene]
  return [scenes, zeroUsage]
}