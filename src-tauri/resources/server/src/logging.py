from fastapi import APIRouter, status
from pydantic import BaseModel
from colorama import Fore, Style
import logging

router = APIRouter(prefix="/api")


class LogMessage(BaseModel):
    path: str
    level: str
    msg: str


def print_log(level: str, *args):
    msg = " ".join(str(arg) for arg in args)
    print(f"{Fore.YELLOW}{level}{Style.RESET_ALL}: {msg}")


@router.post("/log")
async def log(param: LogMessage):
    print_log(param.level, param.msg)
    logging.basicConfig(filename=param.path, level=logging.DEBUG)
    log_level = getattr(logging, param.level)
    logging.log(log_level, param.msg)
    return {"ok": True}
