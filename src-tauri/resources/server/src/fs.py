from fastapi import APIRouter
from pydantic import BaseModel
from datetime import datetime
from typing import List, Dict, Union
import os
import shutil
import base64
import stat


router = APIRouter(
    prefix="/api/fs",
)


class Path(BaseModel):
    path: str


class PathText(BaseModel):
    path: str
    text: str


class CopyFile(BaseModel):
    src: str
    dest: str


directory = "data"
resource_directory = "../src-tauri"


@router.post("/exists")
async def exists(path: Path):
    path = os.path.join(directory, path.path)
    result = {"exists": os.path.exists(path)}
    return result


@router.get("/appDataDir")
async def app_data_dir():
    return {"path": ""}


@router.post("/createDir")
async def create_dir(path: Path):
    path = os.path.join(directory, path.path)
    path = path.replace("\\", "/")
    print(path)
    os.makedirs(path, exist_ok=True)
    return {"success": True}


@router.post("/resolveResource")
async def resolve_resource(path: Path):
    path = os.path.join(resource_directory, path.path)
    path = path.replace("\\", "/")
    print(path)
    return {"path": path}


@router.post("/copyFile")
async def copy_file(path: CopyFile):
    dest_path = os.path.join(directory, path.dest)
    dest_path = dest_path.replace("\\", "/")
    print(path)
    shutil.copyfile(path.src, dest_path)
    return {"success": True}


@router.post("/readTextFile")
async def read_text_file(path: Path):
    path = os.path.join(directory, path.path)
    path = path.replace("\\", "/")
    print(path)
    try:
        with open(path, "r") as f:
            result = {"text": f.read()}
        return result
    except Exception as e:
        print(f"Error occurred: {e}")
        return {"text": ""}


@router.post("/readBinaryFile")
async def read_binary_file(path: Path):
    path = os.path.join(directory, path.path)
    path = path.replace("\\", "/")
    print(path)
    try:
        with open(path, "rb") as f:
            data = f.read()
        return {"data": data}
    except Exception as e:
        print(f"Error occurred: {e}")
        return {"data": ""}


@router.post("/writeTextFile")
async def write_text_file(content: PathText):
    path = os.path.join(directory, content.path)
    path = path.replace("\\", "/")
    print(path)
    try:
        with open(path, "w") as f:
            f.write(content.text)
        return {"success": True}
    except Exception as e:
        print(f"Error occurred: {e}")
        return {"success": False}


@router.post("/writeBinaryFile")
async def write_binary_file(content: PathText):
    path = os.path.join(directory, content.path)
    path = path.replace("\\", "/")
    print(path)
    try:
        text = content.text.split(",")[1]
        data = base64.b64decode(text)
        with open(path, "wb") as f:
            f.write(data)
        return {"success": True}
    except Exception as e:
        print(f"Error occurred: {e}")
        return {"success": False}


def scan_dir(
    path: str,
) -> List[Union[Dict[str, str], Dict[str, Union[str, List[Dict[str, str]]]]]]:
    result = []
    prefix = directory + "/"
    for entry in os.scandir(path):
        stat_info = entry.stat()
        entry_info = {
            "name": entry.name,
            "path": entry.path.replace("\\", "/").replace(prefix, "", 1),
            "modifiedAt": stat_info.st_mtime,
        }

        if entry.is_file():
            result.append(entry_info)
        elif entry.is_dir():
            entry_info["children"] = scan_dir(entry.path)
            result.append(entry_info)
    return result


@router.post("/readDir")
async def read_dir(path: Path):
    path = os.path.join(directory, path.path)
    path = path.replace("\\", "/")
    print(path)
    try:
        entries = scan_dir(path)
        for entry in entries:
            print(entry)
        return {"entries": entries}
    except Exception as e:
        print(f"Error occurred: {e}.")
        return {"entries": []}


@router.post("/metadata")
async def metadata(path: Path):
    path = os.path.join(directory, path.path)
    path = path.replace("\\", "/")
    print(path)
    try:
        info = os.stat(path)
        return {"modifiedAt": info.st_mtime, "isDir": stat.S_ISDIR(info.st_mode)}
    except Exception as e:
        print(f"Error occurred: {e}.")
        return {"modifiedAt": 0, "isDir": False}


@router.post("/listFonts")
async def list_fonts():
    path = os.path.join(directory, "fonts")
    result = {"fonts": os.listdir(path)}
    return result
