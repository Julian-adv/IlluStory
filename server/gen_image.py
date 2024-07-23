from fastapi import APIRouter
from pydantic import BaseModel
import websocket  # NOTE: websocket-client (https://github.com/websocket-client/websocket-client)
import uuid
import json
import urllib.request
import urllib.parse
import base64
import random
from my_logging import print_log
from requests_toolbelt.multipart.encoder import MultipartEncoder

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
    ip_weight: float
    name: str


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
    print_log("working", end="")
    while True:
        out = ws.recv()
        if isinstance(out, str):
            print(".", end="", flush=True)
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

    print("done")
    return output_images


prompt_text = """
{
  "3": {
    "inputs": {
      "seed": 365447695490082,
      "steps": 40,
      "cfg": 4,
      "sampler_name": "euler",
      "scheduler": "normal",
      "denoise": 1,
      "model": [
        "37",
        0
      ],
      "positive": [
        "50",
        2
      ],
      "negative": [
        "7",
        0
      ],
      "latent_image": [
        "42",
        0
      ]
    },
    "class_type": "KSampler"
  },
  "4": {
    "inputs": {
      "ckpt_name": "sdxl.fp16.safetensors"
    },
    "class_type": "CheckpointLoaderSimple"
  },
  "7": {
    "inputs": {
      "text": "",
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
      "vae_name": "fixFP16ErrorsSDXLLowerMemoryUse_v10.safetensors"
    },
    "class_type": "VAELoader"
  },
  "12": {
    "inputs": {
      "preset": "FACEID PLUS V2",
      "lora_strength": 0.6,
      "provider": "CPU",
      "model": [
        "50",
        0
      ]
    },
    "class_type": "IPAdapterUnifiedLoaderFaceID"
  },
  "14": {
    "inputs": {
      "image": "Stellar (1).png",
      "upload": "image"
    },
    "class_type": "LoadImage"
  },
  "22": {
    "inputs": {
      "guide_size": 768,
      "guide_size_for": false,
      "max_size": 1024,
      "seed": 774163909736209,
      "steps": 10,
      "cfg": 4,
      "sampler_name": "euler",
      "scheduler": "normal",
      "denoise": 0.35,
      "feather": 5,
      "noise_mask": true,
      "force_inpaint": false,
      "bbox_threshold": 0.4,
      "bbox_dilation": 10,
      "bbox_crop_factor": 1.5,
      "sam_detection_hint": "center-1",
      "sam_dilation": 10,
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
        "37",
        0
      ],
      "clip": [
        "50",
        1
      ],
      "vae": [
        "11",
        0
      ],
      "positive": [
        "50",
        2
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
  },
  "37": {
    "inputs": {
      "weight": 0,
      "weight_type": "linear",
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
        "51",
        0
      ]
    },
    "class_type": "IPAdapterAdvanced"
  },
  "42": {
    "inputs": {
      "width": 1024,
      "height": 1280,
      "batch_size": 1
    },
    "class_type": "EmptyLatentImage"
  },
  "50": {
    "inputs": {
      "wildcard_text": "",
      "populated_text": "",
      "mode": true,
      "Select to add LoRA": "Select the LoRA to add to the text",
      "Select to add Wildcard": "Select the Wildcard to add to the text",
      "seed": 768380842095243,
      "model": [
        "4",
        0
      ],
      "clip": [
        "4",
        1
      ]
    },
    "class_type": "ImpactWildcardEncode"
  },
  "51": {
    "inputs": {
      "x": 0,
      "y": 0,
      "size": 512,
      "image": [
        "14",
        0
      ]
    },
    "class_type": "Image Crop Square Location"
  }
}
"""


@router.post("/comfy")
async def comfy(req: ComfyReq):
    prompt = json.loads(prompt_text)

    prompt["4"]["inputs"]["ckpt_name"] = req.model
    prompt["50"]["inputs"]["wildcard_text"] = req.prompt
    prompt["7"]["inputs"]["text"] = req.negative_prompt
    print_log("image prompt", req.prompt)
    print_log("size", f"{req.width}x{req.height}")

    # set the seed for our KSampler node
    prompt["3"]["inputs"]["seed"] = random.randint(1, 1000000000000000)
    prompt["42"]["inputs"]["width"] = req.width
    prompt["42"]["inputs"]["height"] = req.height

    prompt["22"]["inputs"]["seed"] = random.randint(1, 1000000000000000)

    prompt["3"]["inputs"]["steps"] = req.steps
    # prompt["22"]["inputs"]["steps"] = req.steps

    prompt["3"]["inputs"]["cfg"] = req.cfg
    # prompt["22"]["inputs"]["cfg"] = req.cfg

    prompt["37"]["inputs"]["weight"] = req.ip_weight

    prompt["14"]["inputs"]["image"] = req.name

    ws = websocket.WebSocket()
    ws.connect("ws://{}/ws?clientId={}".format(req.server_address, client_id))
    images = get_images(ws, prompt)
    for node_id in images:
        for image_data in images[node_id]:
            base64_bytes = base64.b64encode(image_data)
            base64_string = base64_bytes.decode("utf-8")
            return {"image": base64_string}


class ComfyUploadReq(BaseModel):
    server_address: str
    name: str
    image: str


@router.post("/upload")
async def upload_image(param: ComfyUploadReq):
    upload_url = f"http://{param.server_address}/upload/image"
    image = base64.b64decode(param.image[22:])
    data = MultipartEncoder(
        fields={
            "image": (
                param.name,
                image,
                "image/png",
            ),
            "overwrite": "true",
            "type": "input",
        }
    )
    req = urllib.request.Request(
        upload_url, data=data, headers={"Content-Type": data.content_type}
    )
    response = json.loads(urllib.request.urlopen(req).read())
    print_log("upload image", response)
    return {"name": response["name"]}
