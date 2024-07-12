import uvicorn
import sys
import os

current_dir = os.path.dirname(__file__)

sys.path.append(os.path.join(current_dir, "src"))

if __name__ == "__main__":
    try:
        print("INFO: IlluStory running on http://127.0.0.1:8001 (Press CTRL+C to quit)")
        uvicorn.run(
            "app:app", host="127.0.0.1", port=8001, log_level="warning", reload=True
        )
    except KeyboardInterrupt:
        print("Server shut down")
        sys.exit(0)
