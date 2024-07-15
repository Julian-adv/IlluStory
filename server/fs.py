from fastapi import APIRouter
from pydantic import BaseModel
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Union
import os
import shutil
import base64
import stat
from my_logging import print_log


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
    result = {"exists": os.path.exists(path.path)}
    return result


@router.get("/appDataDir")
async def app_data_dir():
    root_dir = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
    data_dir = os.path.join(root_dir, "data")
    print_log("DEBUG", "data dir:", data_dir)
    return {"path": data_dir}


@router.get("/homeDir")
async def home_dir():
    home_directory = os.path.expanduser("~") + "\\"
    print_log("DEBUG", "home dir:", home_directory)
    return {"path": home_directory}


@router.post("/createDir")
async def create_dir(path: Path):
    path = os.path.join(directory, path.path)
    path = path.replace("\\", "/")
    print_log("DEBUG", "create dir:", path)
    os.makedirs(path, exist_ok=True)
    return {"success": True}


@router.post("/resolveResource")
async def resolve_resource(path: Path):
    path = os.path.join(resource_directory, path.path)
    path = path.replace("\\", "/")
    print_log("DEBUG", "resolve resource:", path)
    return {"path": path}


@router.post("/copyFile")
async def copy_file(path: CopyFile):
    dest_path = os.path.join(directory, path.dest)
    dest_path = dest_path.replace("\\", "/")
    print_log("DEBUG", "copy file:", path.src, dest_path)
    shutil.copyfile(path.src, dest_path)
    return {"success": True}


@router.post("/readTextFile")
async def read_text_file(path: Path):
    path = os.path.join(directory, path.path)
    path = path.replace("\\", "/")
    print_log("DEBUG", "read:", path)
    try:
        with open(path, "r") as f:
            result = {"text": f.read()}
        return result
    except Exception as e:
        print_log("ERROR", str(e))
        return {"text": ""}


@router.post("/readBinaryFile")
async def read_binary_file(path: Path):
    path = os.path.join(directory, path.path)
    path = path.replace("\\", "/")
    print_log("DEBUG", "Read binary:", path)
    try:
        with open(path, "rb") as f:
            data = f.read()
        return {"data": data}
    except Exception as e:
        print_log("ERROR", str(e))
        return {"data": ""}


@router.post("/writeTextFile")
async def write_text_file(content: PathText):
    path = os.path.join(directory, content.path)
    path = path.replace("\\", "/")
    print_log("DEBUG", "write:", path)
    try:
        with open(path, "w") as f:
            f.write(content.text)
        return {"success": True}
    except Exception as e:
        print_log("ERROR", str(e))
        return {"success": False}


@router.post("/writeBinaryFile")
async def write_binary_file(content: PathText):
    path = os.path.join(directory, content.path)
    path = path.replace("\\", "/")
    print_log("DEBUG", "write binary:", path)
    try:
        text = content.text.split(",")[1]
        data = base64.b64decode(text)
        with open(path, "wb") as f:
            f.write(data)
        return {"success": True}
    except Exception as e:
        print_log("ERROR", str(e))
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
            "path": entry.path.replace("\\", "/"),
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
    # path = os.path.join(directory, path.path)
    path = path.path.replace("\\", "/")
    print_log("DEBUG", "read directory:", path)
    try:
        entries = scan_dir(path)
        # for entry in entries:
        #     print(entry)
        return {"entries": entries}
    except Exception as e:
        print_log("ERROR", str(e))
        return {"entries": []}


@router.post("/metadata")
async def metadata(path: Path):
    # path = os.path.join(directory, path.path)
    path = path.path.replace("\\", "/")
    print_log("DEBUG", "read meta:", path)
    try:
        info = os.stat(path)
        return {"modifiedAt": info.st_mtime, "isDir": stat.S_ISDIR(info.st_mode)}
    except Exception as e:
        print_log("ERROR", str(e))
        return {"modifiedAt": 0, "isDir": False}


@router.post("/listFonts")
async def list_fonts():
    path = os.path.join(directory, "fonts")
    result = {"fonts": os.listdir(path)}
    return result
