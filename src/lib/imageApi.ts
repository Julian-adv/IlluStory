import type { Settings } from './interfaces'
import { tcGetComfyImage, tcLog, tcPost } from './tauriCompat'

export async function generateImageAutomatic1111(
  settings: Settings,
  width: number,
  height: number,
  prompt: string
): Promise<string> {
  try {
    const responseFromSD = await tcPost(settings.sdURL + '/sdapi/v1/txt2img', {
      width: width,
      height: height,
      seed: -1,
      steps: settings.steps,
      cfg_scale: settings.cfgScale,
      prompt: `${settings.prompt},${prompt}`,
      negative_prompt: settings.negativePrompt,
      sampler_name: settings.sampler,
      enable_hr: settings.enableHires,
      denoising_strength: settings.denoisingStrength,
      hr_scale: settings.hiresScale,
      hr_upscaler: settings.hiresUpscaler,
      alwayson_scripts: {
        adetailer: {
          args: [
            settings.enableADetailer,
            {
              ad_model: 'face_yolov8n.pt',
              ad_prompt: '',
              ad_negative_prompt: '',
              ad_confidence: 0.3,
              ad_mask_min_ratio: 0,
              ad_mask_max_ratio: 1,
              ad_x_offset: 0,
              ad_y_offset: 0,
              ad_dilate_erode: 4,
              ad_mask_merge_invert: 'None',
              ad_mask_blur: 4,
              ad_denoising_strength: 0.4,
              ad_inpaint_only_masked: true,
              ad_inpaint_only_masked_padding: 32,
              ad_use_inpaint_width_height: false,
              ad_inpaint_width: 512,
              ad_inpaint_height: 512,
              ad_use_steps: false,
              ad_steps: 28,
              ad_use_cfg_scale: false,
              ad_cfg_scale: 7,
              ad_use_noise_multiplier: false,
              ad_noise_multiplier: 1,
              ad_restore_face: false,
              ad_controlnet_model: 'None',
              ad_controlnet_module: 'inpaint_global_harmonious',
              ad_controlnet_weight: 1,
              ad_controlnet_guidance_start: 0,
              ad_controlnet_guidance_end: 1,
              is_api: true
            },
            {
              ad_model: 'None',
              ad_prompt: '',
              ad_negative_prompt: '',
              ad_confidence: 0.3,
              ad_mask_min_ratio: 0,
              ad_mask_max_ratio: 1,
              ad_x_offset: 0,
              ad_y_offset: 0,
              ad_dilate_erode: 4,
              ad_mask_merge_invert: 'None',
              ad_mask_blur: 4,
              ad_denoising_strength: 0.4,
              ad_inpaint_only_masked: true,
              ad_inpaint_only_masked_padding: 32,
              ad_use_inpaint_width_height: false,
              ad_inpaint_width: 512,
              ad_inpaint_height: 512,
              ad_use_steps: false,
              ad_steps: 28,
              ad_use_cfg_scale: false,
              ad_cfg_scale: 7,
              ad_use_noise_multiplier: false,
              ad_noise_multiplier: 1,
              ad_restore_face: false,
              ad_controlnet_model: 'None',
              ad_controlnet_module: 'inpaint_global_harmonious',
              ad_controlnet_weight: 1,
              ad_controlnet_guidance_start: 0,
              ad_controlnet_guidance_end: 1,
              is_api: true
            }
          ]
        }
      }
    })

    if (responseFromSD.ok) {
      return `data:image/png;base64,${responseFromSD.data.images[0]}`
    } else {
      tcLog('ERROR', 'responseFromSD', JSON.stringify(responseFromSD))
      return ''
    }
  } catch (error) {
    tcLog('ERROR', 'generateImage: ', String(error))
    return ''
  }
}

export async function generateImage(
  settings: Settings,
  width: number,
  height: number,
  prompt: string,
  ipWeight: number,
  name: string
): Promise<string> {
  const result = await tcGetComfyImage(
    settings.sdURL,
    settings.model,
    width,
    height,
    settings.prompt + ',' + prompt,
    settings.negativePrompt,
    settings.steps,
    settings.cfgScale,
    ipWeight,
    name
  )
  return `data:image/png;base64,${result.image}`
}
