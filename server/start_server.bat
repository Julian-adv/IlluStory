@echo off
python -m venv illustory
call .\illustory\Scripts\activate
pip install -r requirements.txt
uvicorn.exe main:app --reload
