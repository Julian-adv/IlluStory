import uvicorn
import sys
import signal
import webbrowser
import threading
import time
import os

current_dir = os.path.dirname(__file__)

sys.path.append(os.path.join(current_dir, "src"))

def open_browser():
    time.sleep(2)
    webbrowser.open('http://127.0.0.1:8001')

def signal_handler(sig, frame):
    print("Stopping server...")
    sys.exit(0)

def run_server():
    config = uvicorn.Config("app:app", host="127.0.0.1", port=8001, log_level="warning", reload=True)
    server = uvicorn.Server(config)
    
    # Register the signal handler
    signal.signal(signal.SIGINT, signal_handler)
    
    # Start the browser opening in a separate thread
    threading.Thread(target=open_browser, daemon=True).start()
    
    print("INFO: IlluStory running on http://127.0.0.1:8001 (Press CTRL+C to quit)")
    try:
        server.run()
    except KeyboardInterrupt:
        print("Stopping server...")
    finally:
        print("Server stopped.")

if __name__ == "__main__":
    run_server()