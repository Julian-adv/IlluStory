from fastapi import APIRouter
from pydantic import BaseModel
import requests
from .logging import print_log

router = APIRouter(prefix="/api/request")


class UrlBody(BaseModel):
    url: str
    body: dict
    headers: dict


@router.post("/post")
async def proxy(req: UrlBody):
    try:
        print_log("DEBUG", "req.url = " + req.url)
        response = requests.post(req.url, json=req.body, headers=req.headers)
        json = response.json()
        return {"ok": True, "data": json}
    except Exception as e:
        print_log("ERROR", f"Failed to post data: {e}")
        return {"ok": False, "data": {}}


@router.post("/get")
async def getProxy(req: UrlBody):
    try:
        print("req.url = " + req.url)
        response = requests.get(req.url, headers=req.headers)
        json = response.json()
        return {"ok": True, "data": json}
    except Exception as e:
        print(f"Failed to get data: {e}")
        return {"ok": False, "data": {}}
