from fastapi import APIRouter
from pydantic import BaseModel
import os
import shutil

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
    os.makedirs(path, exist_ok=True)
    result = {"success": True}
    return result


@router.post("/resolveResource")
async def resolve_resource(path: Path):
    path = os.path.join(resource_directory, path.path)
    path = path.replace("\\", "/")
    result = {"path": path}
    return result


@router.post("/copyFile")
async def copy_file(path: CopyFile):
    dest_path = os.path.join(directory, path.dest)
    dest_path = dest_path.replace("\\", "/")
    shutil.copyfile(path.src, dest_path)
    result = {"success": True}
    return result


@router.post("/readTextFile")
async def read_text_file(path: Path):
    path = os.path.join(directory, path.path)
    try:
        with open(path, "r") as f:
            result = {"text": f.read()}
        return result
    except:
        return {"text": ""}


@router.post("/writeTextFile")
async def write_text_file(content: PathText):
    path = os.path.join(directory, content.path)
    try:
        with open(path, "w") as f:
            f.write(content.text)
        return {"success": True}
    except OSError as e:
        print(f"Error occurred: {e}")
        return {"success": False}


@router.post("/readDir")
async def read_dir(path: Path):
    path = os.path.join(directory, path.path)
    entries = []
    try:
        entries = os.scandir(path)
        for entry in entries:
            print(entry.name)
    except FileNotFoundError:
        print(f"{path} not found.")
    except PermissionError:
        print(f"Permission denied for {path}.")
    return {"entries": entries}


@router.post("/listFonts")
async def list_fonts():
    path = os.path.join(directory, "fonts")
    result = {"fonts": os.listdir(path)}
    return result
