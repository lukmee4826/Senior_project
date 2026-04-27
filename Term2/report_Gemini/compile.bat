@echo off
:: ============================================================
::  Compile LaTeX Report (XeLaTeX + BibTeX)
::  Double-click this file to compile
:: ============================================================
setlocal

set MIKTEX=C:\Users\Lukme\AppData\Local\Programs\MiKTeX\miktex\bin\x64
set MAIN=main

echo [1/4] XeLaTeX pass 1 ...
"%MIKTEX%\xelatex.exe" -interaction=nonstopmode -synctex=1 %MAIN%.tex
if errorlevel 1 goto error

echo [2/4] BibTeX ...
"%MIKTEX%\bibtex.exe" %MAIN%
if errorlevel 1 (
    echo    BibTeX warning - continuing...
)

echo [3/4] XeLaTeX pass 2 ...
"%MIKTEX%\xelatex.exe" -interaction=nonstopmode -synctex=1 %MAIN%.tex
if errorlevel 1 goto error

echo [4/4] XeLaTeX pass 3 (final) ...
"%MIKTEX%\xelatex.exe" -interaction=nonstopmode -synctex=1 %MAIN%.tex
if errorlevel 1 goto error

echo.
echo ============================================================
echo  SUCCESS: main.pdf created
echo ============================================================
start main.pdf
goto end

:error
echo.
echo ============================================================
echo  ERROR: Compile failed. Check main.log for details.
echo ============================================================
pause
goto end

:end
endlocal
