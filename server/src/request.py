from fastapi import APIRouter
from pydantic import BaseModel
import requests

router = APIRouter(prefix="/api/request")


class UrlBody(BaseModel):
    url: str
    body: dict


@router.post("/post")
async def proxy(req: UrlBody):
    try:
        response = requests.post(req.url, json=req.body)
        json = response.json()
    except Exception as e:
        print(f"Failed to post data: {e}")
    return {"ok": True, "data": response.json()}
