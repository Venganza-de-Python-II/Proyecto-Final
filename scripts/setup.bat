@echo off
REM Script de configuración inicial para Windows
REM Sistema de Gestión de Talleres

echo 🚀 Configurando Sistema de Gestión de Talleres...

REM Verificar Docker
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker no está instalado. Por favor instala Docker Desktop primero.
    pause
    exit /b 1
)

docker-compose --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker Compose no está instalado. Por favor instala Docker Compose primero.
    pause
    exit /b 1
)

REM Verificar Node.js
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js no está instalado. Por favor instala Node.js 18+ primero.
    pause
    exit /b 1
)

echo ✅ Dependencias verificadas

REM Limpiar puertos ocupados
echo 🧹 Limpiando puertos ocupados...

REM Función para limpiar puerto específico
call :cleanup_port 5001 "API Flask"
call :cleanup_port 3000 "Frontend Next.js"
call :cleanup_port 27017 "MongoDB"
call :cleanup_port 6379 "Redis"
call :cleanup_port 8081 "Mongo Express"

echo ✅ Puertos limpiados
goto :continue_setup

:cleanup_port
set port=%1
set service=%2
netstat -ano | findstr :%port% >nul 2>&1
if %errorlevel% equ 0 (
    echo ⚠️  Puerto %port% (%service%) ocupado, liberando...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :%port%') do (
        taskkill /PID %%a /F >nul 2>&1
    )
    timeout /t 1 /nobreak >nul
) else (
    echo ✅ Puerto %port% (%service%) disponible
)
goto :eof

:continue_setup

REM Crear archivo .env si no existe
if not exist .env.local (
    echo 📝 Creando archivo .env.local...
    echo NEXT_PUBLIC_API_URL=http://localhost:5001 > .env.local
    echo NEXT_PUBLIC_API_KEY= >> .env.local
    echo ✅ Archivo .env.local creado
)

REM Instalar dependencias del frontend
echo 📦 Instalando dependencias del frontend...
npm install

REM Levantar servicios de base de datos
echo 🐳 Iniciando servicios de base de datos...
docker-compose up -d mongo redis

REM Esperar a que MongoDB esté listo
echo ⏳ Esperando a que MongoDB esté listo...
timeout /t 10 /nobreak >nul

echo.
echo 🎉 ¡Configuración completada!
echo.
echo Para iniciar el sistema:
echo 1. Backend: docker-compose up -d api
echo 2. Frontend: npm run dev
echo.
echo URLs disponibles:
echo - Frontend: http://localhost:3000
echo - API: http://localhost:5001
echo - MongoDB Admin: http://localhost:8081
echo.
echo Credenciales por defecto:
echo - Admin: usuario=admin, contraseña=admin123
echo.
echo Para ejecutar pruebas: pytest backend/test_api.py -v
echo.
pause