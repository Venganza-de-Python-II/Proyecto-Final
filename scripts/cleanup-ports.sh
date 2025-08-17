#!/bin/bash

# Script específico para limpiar puertos de SkillsForge

echo "🧹 SkillsForge - Limpieza de Puertos"
echo "====================================="

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para mostrar puertos en uso
show_ports() {
    echo -e "${BLUE}📊 Puertos actualmente en uso:${NC}"
    echo
    
    for port in 3000 5001 27017 6379 8081; do
        if lsof -ti:$port >/dev/null 2>&1; then
            pid=$(lsof -ti:$port)
            process=$(ps -p $pid -o comm= 2>/dev/null || echo "unknown")
            echo -e "  Puerto $port: ${RED}OCUPADO${NC} (PID: $pid, Proceso: $process)"
        else
            echo -e "  Puerto $port: ${GREEN}LIBRE${NC}"
        fi
    done
    echo
}

# Función para limpiar puerto específico
cleanup_port_detailed() {
    local port=$1
    local service=$2
    
    echo -e "${BLUE}Verificando puerto $port ($service)...${NC}"
    
    local pids=$(lsof -ti:$port 2>/dev/null)
    
    if [ ! -z "$pids" ]; then
        echo -e "  ${YELLOW}⚠️  Puerto $port ocupado por PID(s): $pids${NC}"
        
        # Mostrar información de procesos
        for pid in $pids; do
            local process=$(ps -p $pid -o comm= 2>/dev/null || echo "unknown")
            local cmd=$(ps -p $pid -o args= 2>/dev/null | cut -c1-50 || echo "unknown")
            echo -e "  📋 PID $pid: $process ($cmd...)"
        done
        
        echo -e "  🔄 Terminando proceso(s)..."
        echo $pids | xargs kill -9 2>/dev/null
        
        sleep 1
        
        # Verificar si se liberó
        if ! lsof -ti:$port >/dev/null 2>&1; then
            echo -e "  ${GREEN}✅ Puerto $port liberado exitosamente${NC}"
        else
            echo -e "  ${RED}❌ No se pudo liberar el puerto $port${NC}"
        fi
    else
        echo -e "  ${GREEN}✅ Puerto $port ya está libre${NC}"
    fi
    
    echo
}

# Mostrar estado inicial
show_ports

echo -e "${BLUE}🔧 Limpiando puertos de SkillsForge...${NC}"
echo

# Limpiar cada puerto
cleanup_port_detailed 3000 "Frontend Next.js"
cleanup_port_detailed 5001 "API Flask"
cleanup_port_detailed 27017 "MongoDB"
cleanup_port_detailed 6379 "Redis"
cleanup_port_detailed 8081 "Mongo Express"

echo -e "${GREEN}✅ Limpieza completada!${NC}"
echo

# Mostrar estado final
echo -e "${BLUE}📋 Estado final de puertos:${NC}"
show_ports

echo -e "${GREEN}🚀 Ahora puedes ejecutar:${NC}"
echo "   docker-compose up -d"
echo "   npm run dev"
echo