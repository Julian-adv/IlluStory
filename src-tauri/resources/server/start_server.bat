@echo off
set DIR=%~dp0system
set CUR_DIR=%~dp0

set PATH=C:\Windows\system32;C:\Windows;%DIR%\git\bin;%DIR%\python;%DIR%\python\Scripts
set PY_LIBS=%DIR%\python;%DIR%\python\Lib;%DIR%\python\Lib\site-packages
set PY_PIP=%DIR%\python\Scripts
set PIP_INSTALLER_LOCATION=%DIR%\python\get-pip.py
set TRANSFORMERS_CACHE=%DIR%\transformers-cache

if not defined PYTHON (set PYTHON=python)

mkdir tmp 2>NUL

%PYTHON% -mpip --help >tmp/stdout.txt 2>tmp/stderr.txt
if %ERRORLEVEL% == 0 goto :skip_venv
if "%PIP_INSTALLER_LOCATION%" == "" goto :show_stdout_stderr
%PYTHON% "%PIP_INSTALLER_LOCATION%" >tmp/stdout.txt 2>tmp/stderr.txt
if %ERRORLEVEL% == 0 goto :skip_venv
echo Couldn't install pip
goto :show_stdout_stderr

:skip_venv
cd %CUR_DIR%
%PYTHON% -m pip install -r requirements.txt
uvicorn.exe main:app

:show_stdout_stderr

echo.
echo exit code: %errorlevel%

for /f %%i in ("tmp\stdout.txt") do set size=%%~zi
if %size% equ 0 goto :show_stderr
echo.
echo stdout:
type tmp\stdout.txt

:show_stderr
for /f %%i in ("tmp\stderr.txt") do set size=%%~zi
if %size% equ 0 goto :endofscript
echo.
echo stderr:
type tmp\stderr.txt

:endofscript

echo.
echo Launch unsuccessful. Exiting.
pause
