<script lang="ts">
  import type { SceneType } from "$lib/interfaces";
    import { onMount } from "svelte";
  import Markdown from "./Markdown.svelte";

  export let scene: SceneType;
  let content: string;
  let imageFromSD: Promise<string|undefined>;

  onMount(() => {
    [content, imageFromSD] = extractAndRemoveBracketsContent(scene);
  })

  function extractAndRemoveBracketsContent(scene: SceneType): [string, Promise<string|undefined>] {
    const matches = scene.content.match(/\[\[([^\]]+)\]\]/g) || [];
    const extractedContents = matches.map(str => str.slice(2, -2));
    const cleanedInput = scene.content.replace(/\[\[([^\]]+)\]\]/g, '').trim();
    const image = generateImage(extractedContents.join(','))

    return [cleanedInput, image];
  }

  async function generateImage(prompt: string) {
    const uri = "http://localhost:7860/sdapi/v1/txt2img"
    const responseFromSD = await fetch(uri, {
      body: JSON.stringify({
          "width": 512,
          "height": 512,
          "seed": -1,
          "steps": 30,
          "cfg_scale": 7.0,
          "prompt": `(masterpiece,best quality, intricate details:1.4),${prompt}`,
          "negative_prompt": "(worst quality, low quality, normal quality:1.4)",
          'sampler_name': "DPM++ SDE Karras",
          "enable_hr": false,
          "denoising_strength": 0.4,
          "hr_scale": 2.0,
          "hr_upscaler": "4x-UltraSharp",
          "alwayson_scripts": {
              "adetailer": {
                  "args": [
                      true,
                      {'ad_model': 'face_yolov8n.pt', 'ad_prompt': '', 'ad_negative_prompt': '',
                        'ad_confidence': 0.3, 'ad_mask_min_ratio': 0, 'ad_mask_max_ratio': 1,
                        'ad_x_offset': 0, 'ad_y_offset': 0, 'ad_dilate_erode': 4,
                        'ad_mask_merge_invert': 'None', 'ad_mask_blur': 4, 'ad_denoising_strength': 0.4, 
                        'ad_inpaint_only_masked': true, 'ad_inpaint_only_masked_padding': 32, 
                        'ad_use_inpaint_width_height': false, 'ad_inpaint_width': 512, 
                        'ad_inpaint_height': 512, 'ad_use_steps': false, 'ad_steps': 28, 
                        'ad_use_cfg_scale': false, 'ad_cfg_scale': 7, 'ad_use_noise_multiplier': false, 
                        'ad_noise_multiplier': 1, 'ad_restore_face': false, 'ad_controlnet_model': 'None', 
                        'ad_controlnet_module': 'inpaint_global_harmonious', 'ad_controlnet_weight': 1, 
                        'ad_controlnet_guidance_start': 0, 'ad_controlnet_guidance_end': 1, 'is_api': true},
                      {'ad_model': 'None', 'ad_prompt': '', 'ad_negative_prompt': '', 'ad_confidence': 0.3, 
                        'ad_mask_min_ratio': 0, 'ad_mask_max_ratio': 1, 'ad_x_offset': 0, 'ad_y_offset': 0, 
                        'ad_dilate_erode': 4, 'ad_mask_merge_invert': 'None', 'ad_mask_blur': 4, 
                        'ad_denoising_strength': 0.4, 'ad_inpaint_only_masked': true, 
                        'ad_inpaint_only_masked_padding': 32, 'ad_use_inpaint_width_height': false, 
                        'ad_inpaint_width': 512, 'ad_inpaint_height': 512, 'ad_use_steps': false, 
                        'ad_steps': 28, 'ad_use_cfg_scale': false, 'ad_cfg_scale': 7, 
                        'ad_use_noise_multiplier': false, 'ad_noise_multiplier': 1, 'ad_restore_face': false,
                        'ad_controlnet_model': 'None', 'ad_controlnet_module': 'inpaint_global_harmonious', 
                        'ad_controlnet_weight': 1, 'ad_controlnet_guidance_start': 0, 'ad_controlnet_guidance_end': 1, 
                        'is_api': true}
                  ]
              }
          }
      }),
      headers:{
          'Content-Type': 'application/json',
      },
      method: "POST"
    })   

    if (responseFromSD.ok){
      let dataFromSD = await responseFromSD.json()
      console.log(dataFromSD)
      return `data:image/png;base64,${dataFromSD.images[0]}`
    } else {
      alert(JSON.stringify(responseFromSD.body))
      return undefined   
    }
  }
</script>

{#if scene.id > 0}
  <div class='dialogue'>
    <span class='role'>{scene.role}:</span>
    <Markdown markdown={content} />
  </div>
  {#await imageFromSD}
    <img src='loading.gif' alt='waiting' width="64" height="64">
  {:then image} 
    <img src={image} alt="scene #{scene.id}">
  {/await}
{:else}
  <div></div>
{/if}

<style>
  .role {
    color: #c4c2c2;
    font-size: 6pt;
  }

  .dialogue {
    margin-block-start: 0px;
  }
</style>