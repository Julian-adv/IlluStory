from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware
from starlette.responses import FileResponse
from fastapi.staticfiles import StaticFiles
import os

from src import fs
from src import fonts
from src import request
from src import image
from src import memory
from src import logging
from src import process
from src import gen_image

app = FastAPI()


origins = ["http://localhost:5173", "http://127.0.0.1:5173", "http://127.0.0.1:8001"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(fs.router)
app.include_router(fonts.router)
app.include_router(request.router)
# app.include_router(image.router)
app.include_router(memory.router)
app.include_router(logging.router)
app.include_router(process.router)
app.include_router(gen_image.router)

if os.path.exists("../../../build/_app"):
    app.mount("/_app", StaticFiles(directory="../../../build/_app"))

app.mount("/static", StaticFiles(directory="../../../../IlluStory/Data"))


@app.get("/")
def index():
    return FileResponse("../../../build/index.html")


@app.get("/play")
def get_play():
    return FileResponse("../../../build/play.html")
