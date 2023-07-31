<script lang="ts">
  import type { SceneType } from "$lib/interfaces";
  import { afterUpdate, onMount } from "svelte";
  import Markdown from "../Markdown.svelte";
  import { startStoryId, story } from "$lib/store";

  type ImageInfo = {
    image: string;
    prompt: string
  }

  export let scene: SceneType;
  let content: string;
  let showImage = false;
  let imageFromSD = Promise.resolve({ image: '', prompt: ''});
  let waitingImage = false;
  let imageSize = 512/window.devicePixelRatio;
  let oldContent:string;
  let ignoreUpdate = true;

  function extractImagePrompt(scene: SceneType): [string, string] {
    const matches = scene.content.match(/\[\[([^\]]+)\]\]/g) || [];
    const extractedContents = matches.map(str => str.slice(2, -2));
    const cleanedInput = scene.content.replace(/\[\[([^\]]+)\]\]/g, '*$&*').trim();
    return [cleanedInput, extractedContents.join(',')];
  }

  export function generateImageIfNeeded(scene:SceneType) {
    const [cleanedContent, imagePrompt] = extractImagePrompt(scene);
    showImage = scene.role !== 'user' && imagePrompt !== '';
    if (showImage && !waitingImage && !scene.image) {
      content = cleanedContent;
      console.log('generateImage')
      imageFromSD = generateImage(imagePrompt)
        .then(result => {
          scene.image = result.image;
          return result;
        });
    }
  }

  onMount(() => {
    if (scene.id < $startStoryId) {
      return;
    }
    content = scene.content;
    console.log('onMount scene', scene.id);
    ignoreUpdate = true;
    generateImageIfNeeded(scene);
  });

  afterUpdate(() => {
    if (scene.content === content || scene.id < $startStoryId || ignoreUpdate) {
      ignoreUpdate = false;
      return;
    }
    if (scene.done) {
      console.log('scene done', scene.id);
      generateImageIfNeeded(scene);
    } else {
      content = scene.content;
      console.log('afterUpdate scene', scene.id);
    }
  });

  async function generateImage(prompt: string): Promise<ImageInfo> {
    console.log('image prompt', prompt)
    const uri = "http://localhost:7860/sdapi/v1/txt2img"
    waitingImage = true;
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

    if (responseFromSD.ok) {
      let dataFromSD = await responseFromSD.json()
      console.log(dataFromSD)
      const info = JSON.parse(dataFromSD.info)
      console.log(info.prompt)
      waitingImage = false;
      return { image: `data:image/png;base64,${dataFromSD.images[0]}`, prompt: info.prompt };
    } else {
      console.log('responseFromSD not ok', responseFromSD)
      waitingImage = false;
      return { image: '', prompt: '' };
    }
  }

</script>

{#if scene.id >= $startStoryId}
  <div class="block max-w-3xl">
    {#if showImage}
      {#await imageFromSD}
        <div class="placeholder float-left mr-5 flex justify-center items-center bg-stone-300" style="--imageSize: {imageSize}px;"><div>⏳</div></div>
      {:then image}
        <img src={image.image} alt="scene #{scene.id}" title={image.prompt} class="float-left mr-5 placeholder rounded-lg" style="--imageSize: {imageSize}px;">
      {/await}
    {/if}
      <!-- <span class='role'>{scene.role}:</span> -->
    <Markdown value={content} />
  </div>
  <div class="clear-both p-2"></div>
{:else}
  <div></div>
{/if}

<style>
  .placeholder {
    width: var(--imageSize);
    height: var(--imageSize);
  }
</style>