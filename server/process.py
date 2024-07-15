from fastapi import APIRouter
import os
import psutil

router = APIRouter(
    prefix="/api/process"
)

@router.post("/kill")
async def kill():
    parent = psutil.Process(os.getpid())
    for child in parent.children(recursive=True):
        child.kill()
    parent.kill()
    return {"ok": True, "message": f"{parent}"}