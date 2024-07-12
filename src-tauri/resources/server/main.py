from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware
from starlette.responses import FileResponse
from fastapi.staticfiles import StaticFiles
import os
import sys
from pathlib import Path
import uvicorn

# Get the project root directory
PROJECT_ROOT = Path(__file__).resolve().parents[4]
SRC_DIR = Path(__file__).resolve().parents[0]
BUILD_DIR = Path(__file__).resolve().parents[3] / "build"

print(PROJECT_ROOT)
print(SRC_DIR)

# Add the server directory to sys.path
sys.path.append(str(SRC_DIR))

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

if os.path.exists(str(BUILD_DIR / "_app")):
    app.mount("/_app", StaticFiles(directory=str(BUILD_DIR / "_app")))

# Create 'data' directory if it doesn't exist
data_dir = PROJECT_ROOT / "data"
data_dir.mkdir(exist_ok=True)

# Mount the 'data' directory to '/static'
app.mount("/static", StaticFiles(directory=str(data_dir)))


@app.get("/")
def index():
    return FileResponse(str(BUILD_DIR / "index.html"))


@app.get("/play")
def get_play():
    return FileResponse(str(BUILD_DIR / "play.html"))


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8001)
