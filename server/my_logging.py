from fastapi import APIRouter, status
from pydantic import BaseModel
from colorama import Fore, Style
import logging

router = APIRouter(prefix="/api")


class LogMessage(BaseModel):
    path: str
    level: str
    kind: str
    msg: str


def print_log(level: str, *args, end="\n"):
    msg = " ".join(str(arg) for arg in args)
    print(f"{Fore.YELLOW}{level}{Style.RESET_ALL}: {msg}", end=end)


@router.post("/log")
async def log(param: LogMessage):
    print_log(param.kind, param.msg)
    logging.basicConfig(filename=param.path, level=logging.DEBUG)
    log_level = getattr(logging, param.level)
    logging.log(log_level, param.msg)
    return {"ok": True}
