@echo off
setlocal enabledelayedexpansion

echo ##################################################
echo #                                                #
echo #             AreaGPT Baslatici                  #
echo #                                                #
echo ##################################################
echo.

:: Node.js kontrolu
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [HATA] Node.js yuklu degil!
    echo Lutfen https://nodejs.org/ adresinden Node.js'i indirin ve kurun.
    pause
    exit /b
)

:: node_modules kontrolu
if not exist "node_modules" (
    echo [BILGI] Gerekli paketler yukleniyor (Bu biraz zaman alabilir)...
    call npm install
    if %errorlevel% neq 0 (
        echo [HATA] Paketler yuklenirken bir sorun olustu.
        pause
        exit /b
    )
)

echo [BILGI] Uygulama baslatiliyor...
echo.
echo Uygulama acildiginda tarayicinizdan http://localhost:3000 adresine gidin.
echo.

:: Uygulamayi baslat
call npm run dev

pause
