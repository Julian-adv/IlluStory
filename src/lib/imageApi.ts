import type { Settings } from "./interfaces"

export async function generateImage(settings: Settings, prompt: string): Promise<string> {
  const uri = settings.sdURL + "/sdapi/v1/txt2img"
  const responseFromSD = await fetch(uri, {
    body: JSON.stringify({
        "width": settings.imageWidth,
        "height": settings.imageHeight,
        "seed": -1,
        "steps": settings.steps,
        "cfg_scale": settings.cfgScale,
        "prompt": `${settings.prompt},${prompt}`,
        "negative_prompt": settings.negativePrompt,
        'sampler_name': settings.sampler,
        "enable_hr": settings.enableHires,
        "denoising_strength": settings.denoisingStrength,
        "hr_scale": settings.hiresScale,
        "hr_upscaler": settings.hiresUpscaler,
        "alwayson_scripts": {
            "adetailer": {
                "args": [
                    settings.enableADetailer,
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
    const dataFromSD = await responseFromSD.json()
    return `data:image/png;base64,${dataFromSD.images[0]}`
  } else {
    return ''
  }
}
