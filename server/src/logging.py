from fastapi import APIRouter, status
from pydantic import BaseModel
import logging

router = APIRouter(prefix="/api")


class LogMessage(BaseModel):
    path: str
    level: str
    msg: str


directory = "data"


@router.post("/log", status_code=status.HTTP_204_NO_CONTENT)
async def log(param: LogMessage):
    print(param.level)
    logging.basicConfig(filename=f"{directory}/{param.path}.log", level=logging.DEBUG)
    log_level = getattr(logging, param.level)
    logging.log(log_level, param.msg)
