from fastapi import APIRouter
from fastapi.responses import FileResponse
import os

router = APIRouter(prefix="/api")

directory = "data/sessions"


@router.get("/sessions/{dir}/{name}")
def get_image(dir: str, name: str):
    print(f"{dir}/{name}")
    path = os.path.join(directory, dir, name)
    path = path.replace("\\", "/")
    try:
        return FileResponse(path)
    except Exception as e:
        print(f"Error occurred: {e}")
        return {"error": f"{e}"}
