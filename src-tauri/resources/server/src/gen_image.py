from fastapi import APIRouter
from pydantic import BaseModel
import websocket  # NOTE: websocket-client (https://github.com/websocket-client/websocket-client)
import uuid
import json
import urllib.request
import urllib.parse
import base64
import random

router = APIRouter(prefix="/api/gen_image")


class ComfyReq(BaseModel):
    server_address: str
    model: str
    width: int
    height: int
    prompt: str
    negative_prompt: str
    steps: int
    cfg: float


# This is an example that uses the websockets api and the SaveImageWebsocket node to get images directly without
# them being saved to disk


server_address = "127.0.0.1:8188"
client_id = str(uuid.uuid4())


def queue_prompt(prompt):
    p = {"prompt": prompt, "client_id": client_id}
    data = json.dumps(p).encode("utf-8")
    req = urllib.request.Request("http://{}/prompt".format(server_address), data=data)
    return json.loads(urllib.request.urlopen(req).read())


def get_image(filename, subfolder, folder_type):
    data = {"filename": filename, "subfolder": subfolder, "type": folder_type}
    url_values = urllib.parse.urlencode(data)
    with urllib.request.urlopen(
        "http://{}/view?{}".format(server_address, url_values)
    ) as response:
        return response.read()


def get_history(prompt_id):
    with urllib.request.urlopen(
        "http://{}/history/{}".format(server_address, prompt_id)
    ) as response:
        return json.loads(response.read())


def get_images(ws, prompt):
    prompt_id = queue_prompt(prompt)["prompt_id"]
    output_images = {}
    current_node = ""
    while True:
        out = ws.recv()
        if isinstance(out, str):
            print(out)
            message = json.loads(out)
            if message["type"] == "executing":
                data = message["data"]
                if data["prompt_id"] == prompt_id:
                    if data["node"] is None:
                        break  # Execution is done
                    else:
                        current_node = data["node"]
        else:
            if current_node == "35":
                images_output = output_images.get(current_node, [])
                images_output.append(out[8:])
                output_images[current_node] = images_output

    return output_images


prompt_text = """
{
  "3": {
    "inputs": {
      "seed": 365447695490082,
      "steps": 10,
      "cfg": 4,
      "sampler_name": "dpmpp_2m_sde_gpu",
      "scheduler": "karras",
      "denoise": 1,
      "model": [
        "13",
        0
      ],
      "positive": [
        "6",
        0
      ],
      "negative": [
        "7",
        0
      ],
      "latent_image": [
        "5",
        0
      ]
    },
    "class_type": "KSampler"
  },
  "4": {
    "inputs": {
      "ckpt_name": "ARAZmixPony033.fp16.safetensors"
    },
    "class_type": "CheckpointLoaderSimple"
  },
  "5": {
    "inputs": {
      "width": 1024,
      "height": 1280,
      "batch_size": 1
    },
    "class_type": "EmptyLatentImage"
  },
  "6": {
    "inputs": {
      "text": "score_9,score_8,score_7, 8k uhd resolution,beautiful girl",
      "clip": [
        "4",
        1
      ]
    },
    "class_type": "CLIPTextEncode"
  },
  "7": {
    "inputs": {
      "text": "embedding:zPDXL2-neg,bad anatomy",
      "clip": [
        "4",
        1
      ]
    },
    "class_type": "CLIPTextEncode"
  },
  "8": {
    "inputs": {
      "samples": [
        "3",
        0
      ],
      "vae": [
        "11",
        0
      ]
    },
    "class_type": "VAEDecode"
  },
  "11": {
    "inputs": {
      "vae_name": "sdxl_vae.safetensors"
    },
    "class_type": "VAELoader"
  },
  "12": {
    "inputs": {
      "preset": "FACEID PLUS V2",
      "lora_strength": 0.6,
      "provider": "CPU",
      "model": [
        "4",
        0
      ]
    },
    "class_type": "IPAdapterUnifiedLoaderFaceID"
  },
  "13": {
    "inputs": {
      "weight": 0.8,
      "weight_type": "ease in-out",
      "combine_embeds": "concat",
      "start_at": 0,
      "end_at": 1,
      "embeds_scaling": "V only",
      "model": [
        "12",
        0
      ],
      "ipadapter": [
        "12",
        1
      ],
      "image": [
        "15",
        0
      ]
    },
    "class_type": "IPAdapterAdvanced"
  },
  "14": {
    "inputs": {
      "image": "Stellar.png",
      "upload": "image"
    },
    "class_type": "LoadImage"
  },
  "15": {
    "inputs": {
      "crop_padding_factor": 0.25,
      "cascade_xml": "lbpcascade_animeface.xml",
      "image": [
        "14",
        0
      ]
    },
    "class_type": "Image Crop Face"
  },
  "22": {
    "inputs": {
      "guide_size": 512,
      "guide_size_for": true,
      "max_size": 1024,
      "seed": 774163909736209,
      "steps": 10,
      "cfg": 4,
      "sampler_name": "dpmpp_2m_sde_gpu",
      "scheduler": "karras",
      "denoise": 0.5,
      "feather": 5,
      "noise_mask": true,
      "force_inpaint": true,
      "bbox_threshold": 0.5,
      "bbox_dilation": 10,
      "bbox_crop_factor": 3,
      "sam_detection_hint": "center-1",
      "sam_dilation": 0,
      "sam_threshold": 0.93,
      "sam_bbox_expansion": 0,
      "sam_mask_hint_threshold": 0.7,
      "sam_mask_hint_use_negative": "False",
      "drop_size": 10,
      "wildcard": "",
      "cycle": 1,
      "inpaint_model": false,
      "noise_mask_feather": 20,
      "image": [
        "8",
        0
      ],
      "model": [
        "4",
        0
      ],
      "clip": [
        "4",
        1
      ],
      "vae": [
        "11",
        0
      ],
      "positive": [
        "6",
        0
      ],
      "negative": [
        "7",
        0
      ],
      "bbox_detector": [
        "25",
        0
      ],
      "sam_model_opt": [
        "32",
        0
      ]
    },
    "class_type": "FaceDetailer"
  },
  "25": {
    "inputs": {
      "model_name": "bbox/face_yolov8m.pt"
    },
    "class_type": "UltralyticsDetectorProvider"
  },
  "32": {
    "inputs": {
      "model_name": "sam_vit_b_01ec64.pth",
      "device_mode": "AUTO"
    },
    "class_type": "SAMLoader"
  },
  "35": {
    "inputs": {
      "images": [
        "22",
        0
      ]
    },
    "class_type": "SaveImageWebsocket"
  }
}
"""


@router.post("/comfy")
async def comfy(req: ComfyReq):
    prompt = json.loads(prompt_text)

    prompt["4"]["inputs"]["ckpt_name"] = req.model
    prompt["6"]["inputs"]["text"] = req.prompt
    prompt["7"]["inputs"]["text"] = req.negative_prompt
    print(f"prompt: {req.prompt}")
    print(f"size: {req.width}x{req.height}")

    # set the seed for our KSampler node
    prompt["3"]["inputs"]["seed"] = random.randint(1, 1000000000000000)
    prompt["5"]["inputs"]["width"] = req.width
    prompt["5"]["inputs"]["height"] = req.height

    prompt["22"]["inputs"]["seed"] = random.randint(1, 1000000000000000)

    prompt["3"]["inputs"]["steps"] = req.steps
    prompt["22"]["inputs"]["steps"] = req.steps

    prompt["3"]["inputs"]["cfg"] = req.cfg
    prompt["22"]["inputs"]["cfg"] = req.cfg

    ws = websocket.WebSocket()
    ws.connect("ws://{}/ws?clientId={}".format(req.server_address, client_id))
    images = get_images(ws, prompt)
    for node_id in images:
        for image_data in images[node_id]:
            base64_bytes = base64.b64encode(image_data)
            base64_string = base64_bytes.decode("utf-8")
            return {"image": base64_string}
