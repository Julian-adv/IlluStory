from fastapi import APIRouter
import subprocess

router = APIRouter(
    prefix="/api/fonts",
)


@router.get("/list")
async def list_fonts():
    result = ""
    try:
        result = subprocess.run(
            ["src/font_list/target/release/font_list.exe"],
            capture_output=True,
            text=True,
            check=True,
        )
    except subprocess.CalledProcessError as e:
        print(f"Error occurred: {e}")
    except FileNotFoundError as e:
        print(f"Error occurred: {e}")
    return {"fonts": result.stdout.split("\n")}
