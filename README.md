# SoulAI

SoulAi is a program for chatting with LLMs. Still in development.

## Installation

* Install [Automatic1111's Web UI](https://github.com/AUTOMATIC1111/stable-diffusion-webui) first.
* Run Automatic1111's Web UI with --api --cors-allow-origins option.
```
set COMMANDLINE_ARGS=--xformers --api --autolaunch --cors-allow-origins=http://localhost:5173
```

* Clone this repository, run:
```
npm install
npm run tauri dev
```

* Enter your OpenAI API Key in settings.