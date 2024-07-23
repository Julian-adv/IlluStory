import uvicorn
import sys
import signal
import webbrowser
import threading
import time
import os

current_dir = os.path.dirname(__file__)

sys.path.append(current_dir)


def open_browser():
    time.sleep(2)
    webbrowser.open("http://127.0.0.1:8001")


def signal_handler(sig, frame):
    print("Stopping server...")
    sys.exit(0)


def run_server():
    # Start the browser opening in a separate thread
    threading.Thread(target=open_browser, daemon=True).start()

    print("INFO: IlluStory running on http://127.0.0.1:8001 (Press CTRL+C to quit)")
    uvicorn.run("app:app", host="127.0.0.1", port=8001, log_level="info", reload=True)


if __name__ == "__main__":
    run_server()
