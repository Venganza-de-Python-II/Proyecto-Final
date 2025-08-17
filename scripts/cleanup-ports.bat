@echo off
REM Script específico para limpiar puertos de SkillsForge

echo 🧹 SkillsForge - Limpieza de Puertos
echo =====================================

REM Mostrar puertos en uso
echo 📊 Puertos actualmente en uso:
echo.
netstat -ano | findstr ":3000 :5001 :27017 :6379 :8081" | sort

echo.
echo 🔧 Limpiando puertos de SkillsForge...
echo.

REM Función para limpiar puerto con información detallada
call :cleanup_port_detailed 3000 "Frontend Next.js"
call :cleanup_port_detailed 5001 "API Flask"
call :cleanup_port_detailed 27017 "MongoDB"
call :cleanup_port_detailed 6379 "Redis"
call :cleanup_port_detailed 8081 "Mongo Express"

echo.
echo ✅ Limpieza completada!
echo.
echo 📋 Estado final de puertos:
netstat -ano | findstr ":3000 :5001 :27017 :6379 :8081" | sort
if %errorlevel% neq 0 (
    echo ✅ Todos los puertos de SkillsForge están libres
)

echo.
echo 🚀 Ahora puedes ejecutar:
echo    docker-compose up -d
echo    npm run dev
echo.
pause
goto :eof

:cleanup_port_detailed
set port=%1
set service=%2

echo Verificando puerto %port% (%service%)...

REM Obtener información del proceso
for /f "tokens=2,5" %%a in ('netstat -ano ^| findstr :%port%') do (
    set "pid=%%b"
    set "address=%%a"
)

if defined pid (
    echo   ⚠️  Puerto %port% ocupado por PID %pid%
    
    REM Obtener nombre del proceso
    for /f "tokens=1" %%p in ('tasklist /FI "PID eq %pid%" /FO CSV /NH 2^>nul ^| findstr /V "INFO:"') do (
        set "process_name=%%p"
        set process_name=!process_name:"=!
    )
    
    if defined process_name (
        echo   📋 Proceso: !process_name!
    )
    
    echo   🔄 Terminando proceso...
    taskkill /PID %pid% /F >nul 2>&1
    
    if %errorlevel% equ 0 (
        echo   ✅ Puerto %port% liberado exitosamente
    ) else (
        echo   ❌ No se pudo liberar el puerto %port%
    )
) else (
    echo   ✅ Puerto %port% ya está libre
)

echo.
set "pid="
set "address="
set "process_name="
goto :eof