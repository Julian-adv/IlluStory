@echo off
set DIR=%~dp0system
set CUR_DIR=%~dp0

set PATH=C:\Windows\system32;C:\Windows;%DIR%\git\bin;%DIR%\python;%DIR%\python\Scripts
set PYTHONPATH=%DIR%\python;%DIR%\python\Scripts;%DIR%\python\Lib;%DIR%\python\Lib\site-packages
set PY_LIBS=%DIR%\python;%DIR%\python\Lib;%DIR%\python\Lib\site-packages
set PY_PIP=%DIR%\python\Scripts
set SKIP_VENV=1
set PIP_INSTALLER_LOCATION=%DIR%\python\get-pip.py
set TRANSFORMERS_CACHE=%DIR%\transformers-cache

if not defined PYTHON (set PYTHON=python)
if not defined VENV_DIR (set "VENV_DIR=%~dp0%venv")

mkdir tmp 2>NUL

%PYTHON% -mpip --help >tmp/stdout.txt 2>tmp/stderr.txt
if %ERRORLEVEL% == 0 goto :start_venv
if "%PIP_INSTALLER_LOCATION%" == "" goto :show_stdout_stderr
%PYTHON% "%PIP_INSTALLER_LOCATION%" >tmp/stdout.txt 2>tmp/stderr.txt
if %ERRORLEVEL% == 0 goto :start_venv
echo Couldn't install pip
goto :show_stdout_stderr

:start_venv
if ["%VENV_DIR%"] == ["-"] goto :skip_venv
if ["%SKIP_VENV%"] == ["1"] goto :skip_venv

dir "%VENV_DIR%\Scripts\Python.exe" >tmp/stdout.txt 2>tmp/stderr.txt
if %ERRORLEVEL% == 0 goto :activate_venv

for /f "delims=" %%i in ('CALL %PYTHON% -c "import sys; print(sys.executable)"') do set PYTHON_FULLNAME="%%i"
echo Creating venv in directory %VENV_DIR% using python %PYTHON_FULLNAME%
%PYTHON_FULLNAME% -m venv "%VENV_DIR%" >tmp/stdout.txt 2>tmp/stderr.txt
if %ERRORLEVEL% == 0 goto :activate_venv
echo Unable to create venv in directory "%VENV_DIR%"
goto :show_stdout_stderr

:activate_venv
set PYTHON="%VENV_DIR%\Scripts\Python.exe"
echo venv %PYTHON%

:skip_venv
cd %CUR_DIR%
%PYTHON% -m pip install -r requirements.txt
uvicorn.exe main:app --reload
rem %PYTHON% %CUR_DIR%launch.py

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
if %size% equ 0 goto :show_stderr
echo.
echo stderr:
type tmp\stderr.txt

:endofscript

echo.
echo Launch unsuccessful. Exiting.
pause
