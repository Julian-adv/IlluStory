from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware

from src import fs
from src import fonts
from src import request
from src import image
from src import memory

app = FastAPI()


origins = [
    "http://localhost:5173",
]

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
app.include_router(image.router)
app.include_router(memory.router)
