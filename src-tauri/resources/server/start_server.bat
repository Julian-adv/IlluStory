@echo off
set DIR=%~dp0system
set CUR_DIR=%~dp0

set PATH=C:\Windows\system32;C:\Windows;%DIR%\git\bin;%DIR%\python;%DIR%\python\Scripts
set PY_LIBS=%DIR%\python;%DIR%\python\Lib;%DIR%\python\Lib\site-packages
set PY_PIP=%DIR%\python\Scripts
set PIP_INSTALLER_LOCATION=%DIR%\python\get-pip.py
set LOG_FILE=%CUR_DIR%..\..\Data\illustory.log

if not defined PYTHON (set PYTHON=python)

mkdir %CUR_DIR%..\..\Data 2>NUL

%PYTHON% -mpip --help
if %ERRORLEVEL% == 0 goto :run_server
if "%PIP_INSTALLER_LOCATION%" == "" goto :show_log
%PYTHON% "%PIP_INSTALLER_LOCATION%"
if %ERRORLEVEL% == 0 goto :run_server
echo Couldn't install pip
goto :show_log

:run_server
cd %CUR_DIR%
%PYTHON% -m pip install -r requirements.txt
uvicorn.exe main:app --port 8001 --log-level critical --reload

:show_log

echo.
echo exit code: %errorlevel%

for /f %%i in ("%LOG_FILE%") do set size=%%~zi
if %size% equ 0 goto :endofscript
echo.
type %LOG_FILE%

:endofscript

echo.
echo Launch unsuccessful. Exiting.
