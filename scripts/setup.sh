#!/bin/bash

# Script de configuración inicial para el Sistema de Gestión de Talleres
# Automatiza la instalación y configuración del proyecto

set -e

echo "🚀 Configurando Sistema de Gestión de Talleres..."

# Verificar Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker no está instalado. Por favor instala Docker primero."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose no está instalado. Por favor instala Docker Compose primero."
    exit 1
fi

# Verificar Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js no está instalado. Por favor instala Node.js 18+ primero."
    exit 1
fi

echo "✅ Dependencias verificadas"

# Limpiar puertos ocupados
echo "🧹 Limpiando puertos ocupados..."

# Función para limpiar puerto
cleanup_port() {
    local port=$1
    local pids=$(lsof -ti:$port 2>/dev/null)
    if [ ! -z "$pids" ]; then
        echo "⚠️  Puerto $port ocupado, liberando..."
        echo $pids | xargs kill -9 2>/dev/null || true
        sleep 1
    fi
}

# Limpiar puertos principales
cleanup_port 5001  # API
cleanup_port 3000  # Frontend
cleanup_port 27017 # MongoDB
cleanup_port 6379  # Redis

echo "✅ Puertos limpiados"

# Crear archivo .env si no existe
if [ ! -f .env.local ]; then
    echo "📝 Creando archivo .env.local..."
    cat > .env.local << EOF
NEXT_PUBLIC_API_URL=http://localhost:5001
NEXT_PUBLIC_API_KEY=
EOF
    echo "✅ Archivo .env.local creado"
fi

# Instalar dependencias del frontend
echo "📦 Instalando dependencias del frontend..."
npm install

# Levantar servicios de base de datos
echo "🐳 Iniciando servicios de base de datos..."
docker-compose up -d mongo redis

# Esperar a que MongoDB esté listo
echo "⏳ Esperando a que MongoDB esté listo..."
sleep 10

# Instalar dependencias del backend (opcional)
if command -v python3 &> /dev/null; then
    echo "🐍 Configurando entorno Python (opcional)..."
    cd backend
    if [ ! -d "venv" ]; then
        python3 -m venv venv
    fi
    source venv/bin/activate 2>/dev/null || source venv/Scripts/activate 2>/dev/null || true
    pip install -r requirements.txt
    cd ..
    echo "✅ Entorno Python configurado"
fi

echo ""
echo "🎉 ¡Configuración completada!"
echo ""
echo "Para iniciar el sistema:"
echo "1. Backend: docker-compose up -d api  (o python backend/app.py)"
echo "2. Frontend: npm run dev"
echo ""
echo "URLs disponibles:"
echo "- Frontend: http://localhost:3000"
echo "- API: http://localhost:5001"
echo "- MongoDB Admin: http://localhost:8081"
echo ""
echo "Credenciales por defecto:"
echo "- Admin: usuario=admin, contraseña=admin123"
echo ""
echo "Para ejecutar pruebas: pytest backend/test_api.py -v"