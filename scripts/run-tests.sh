#!/bin/bash

# Script para ejecutar pruebas de SkillForge
# Uso: ./scripts/run-tests.sh [opciones]

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para mostrar ayuda
show_help() {
    echo "Uso: $0 [OPCIONES]"
    echo ""
    echo "Opciones:"
    echo "  -h, --help          Mostrar esta ayuda"
    echo "  -c, --coverage      Ejecutar con reporte de cobertura"
    echo "  -v, --verbose       Modo verbose"
    echo "  -f, --fast          Ejecutar solo pruebas rápidas"
    echo "  -s, --specific FILE Ejecutar archivo específico de pruebas"
    echo "  --html              Generar reporte HTML de cobertura"
    echo "  --setup             Configurar entorno de pruebas"
    echo ""
    echo "Ejemplos:"
    echo "  $0                           # Ejecutar todas las pruebas"
    echo "  $0 -c                        # Ejecutar con cobertura"
    echo "  $0 -s test_auth.py          # Ejecutar solo pruebas de auth"
    echo "  $0 -c --html                # Generar reporte HTML"
}

# Función para verificar prerrequisitos
check_prerequisites() {
    echo -e "${BLUE}🔍 Verificando prerrequisitos...${NC}"
    
    # Verificar que estamos en el directorio correcto
    if [ ! -f "backend/app.py" ]; then
        echo -e "${RED}❌ Error: Ejecutar desde el directorio raíz del proyecto${NC}"
        exit 1
    fi
    
    # Verificar Docker
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}❌ Docker no está instalado${NC}"
        exit 1
    fi
    
    # Verificar que MongoDB esté corriendo
    if ! docker ps | grep -q mongo; then
        echo -e "${YELLOW}⚠️  MongoDB no está corriendo. Iniciando...${NC}"
        docker compose up -d mongo
        sleep 5
    fi
    
    echo -e "${GREEN}✅ Prerrequisitos verificados${NC}"
}

# Función para configurar entorno de pruebas
setup_test_environment() {
    echo -e "${BLUE}⚙️  Configurando entorno de pruebas...${NC}"
    
    cd backend
    
    # Crear entorno virtual si no existe
    if [ ! -d "venv" ]; then
        echo -e "${YELLOW}📦 Creando entorno virtual...${NC}"
        python -m venv venv
    fi
    
    # Activar entorno virtual
    source venv/bin/activate 2>/dev/null || source venv/Scripts/activate
    
    # Instalar dependencias de pruebas
    echo -e "${YELLOW}📦 Instalando dependencias de pruebas...${NC}"
    pip install -r requirements-test.txt
    
    cd ..
    
    echo -e "${GREEN}✅ Entorno configurado${NC}"
}

# Función para ejecutar pruebas
run_tests() {
    local coverage_flag=""
    local verbose_flag=""
    local fast_flag=""
    local specific_file=""
    local html_flag=""
    
    # Procesar argumentos
    while [[ $# -gt 0 ]]; do
        case $1 in
            -c|--coverage)
                coverage_flag="--cov=. --cov-report=term-missing"
                shift
                ;;
            -v|--verbose)
                verbose_flag="-v"
                shift
                ;;
            -f|--fast)
                fast_flag='-m "not slow"'
                shift
                ;;
            -s|--specific)
                specific_file="$2"
                shift 2
                ;;
            --html)
                html_flag="--cov-report=html"
                shift
                ;;
            *)
                echo -e "${RED}❌ Opción desconocida: $1${NC}"
                show_help
                exit 1
                ;;
        esac
    done
    
    cd backend
    
    # Activar entorno virtual
    source venv/bin/activate 2>/dev/null || source venv/Scripts/activate
    
    # Configurar variables de entorno para pruebas
    export FLASK_ENV=testing
    export JWT_SECRET=test-secret-key
    export ADMIN_USER=admin
    export ADMIN_PASSWORD=admin123
    export MONGO_URI=mongodb://admin:admin123@localhost:27017/?authSource=admin
    export MONGO_DB_NAME=talleresdb_test
    export CORS_ORIGINS=*
    
    # Construir comando pytest
    local pytest_cmd="pytest"
    
    if [ -n "$verbose_flag" ]; then
        pytest_cmd="$pytest_cmd $verbose_flag"
    fi
    
    if [ -n "$coverage_flag" ]; then
        pytest_cmd="$pytest_cmd $coverage_flag"
    fi
    
    if [ -n "$html_flag" ]; then
        pytest_cmd="$pytest_cmd $html_flag"
    fi
    
    if [ -n "$fast_flag" ]; then
        pytest_cmd="$pytest_cmd $fast_flag"
    fi
    
    if [ -n "$specific_file" ]; then
        pytest_cmd="$pytest_cmd tests/$specific_file"
    fi
    
    echo -e "${BLUE}🧪 Ejecutando pruebas...${NC}"
    echo -e "${YELLOW}Comando: $pytest_cmd${NC}"
    
    # Ejecutar pruebas
    if eval $pytest_cmd; then
        echo -e "${GREEN}✅ Todas las pruebas pasaron${NC}"
        
        # Mostrar ubicación del reporte HTML si se generó
        if [ -n "$html_flag" ]; then
            echo -e "${BLUE}📊 Reporte HTML generado en: backend/htmlcov/index.html${NC}"
        fi
        
        return 0
    else
        echo -e "${RED}❌ Algunas pruebas fallaron${NC}"
        return 1
    fi
}

# Función para limpiar archivos temporales
cleanup() {
    echo -e "${BLUE}🧹 Limpiando archivos temporales...${NC}"
    
    cd backend
    
    # Limpiar caché de pytest
    rm -rf .pytest_cache
    rm -rf __pycache__
    find . -name "*.pyc" -delete
    find . -name "__pycache__" -type d -exec rm -rf {} + 2>/dev/null || true
    
    # Limpiar reportes de cobertura antiguos
    rm -rf htmlcov
    rm -f .coverage
    
    cd ..
    
    echo -e "${GREEN}✅ Limpieza completada${NC}"
}

# Función principal
main() {
    echo -e "${BLUE}🚀 SkillForge - Ejecutor de Pruebas${NC}"
    echo "=================================="
    
    # Procesar argumentos de ayuda y setup
    case "${1:-}" in
        -h|--help)
            show_help
            exit 0
            ;;
        --setup)
            check_prerequisites
            setup_test_environment
            exit 0
            ;;
        --clean)
            cleanup
            exit 0
            ;;
    esac
    
    # Verificar prerrequisitos
    check_prerequisites
    
    # Configurar entorno si es necesario
    if [ ! -d "backend/venv" ] || [ ! -f "backend/venv/bin/activate" ] && [ ! -f "backend/venv/Scripts/activate" ]; then
        setup_test_environment
    fi
    
    # Ejecutar pruebas
    if run_tests "$@"; then
        echo -e "${GREEN}🎉 Ejecución de pruebas completada exitosamente${NC}"
        exit 0
    else
        echo -e "${RED}💥 Ejecución de pruebas falló${NC}"
        exit 1
    fi
}

# Trap para limpiar en caso de interrupción
trap 'echo -e "\n${YELLOW}⚠️  Ejecución interrumpida${NC}"; exit 130' INT

# Ejecutar función principal con todos los argumentos
main "$@"