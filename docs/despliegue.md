<img width="1454" height="518" alt="image" src="https://github.com/user-attachments/assets/a6304fe6-63a1-455b-bc81-23a16523f569" />

# Guía de Despliegue - SkillsForge

## Resumen

Esta guía cubre el despliegue completo del sistema SkillsForge en diferentes entornos, desde desarrollo local hasta producción, incluyendo configuración de Docker, variables de entorno y mejores prácticas de seguridad.

## Arquitectura de Despliegue

```mermaid
graph TB
    subgraph "Producción"
        LB[Load Balancer/Nginx]
        subgraph "Frontend"
            F1[Next.js App 1]
            F2[Next.js App 2]
        end
        subgraph "Backend"
            B1[Flask API 1]
            B2[Flask API 2]
        end
        subgraph "Base de Datos"
            DB1[(MongoDB Primary)]
            DB2[(MongoDB Secondary)]
        end
    end
    
    subgraph "Monitoreo"
        MON[Prometheus/Grafana]
        LOG[ELK Stack]
    end
    
    LB --> F1
    LB --> F2
    F1 --> B1
    F2 --> B2
    B1 --> DB1
    B2 --> DB1
    DB1 --> DB2
    
    B1 --> MON
    B2 --> MON
    B1 --> LOG
    B2 --> LOG
```

## Entornos de Despliegue

### 1. Desarrollo Local

#### Prerrequisitos
- Docker Desktop 4.0+
- Node.js 18+
- Git

#### Configuración Rápida
```bash
# Clonar repositorio
git clone https://github.com/Venganza-de-Python-II/Proyecto-Final
cd proyecto-final

# Levantar servicios backend
docker compose up -d --build

# Instalar dependencias frontend
npm install

# Iniciar frontend en desarrollo
npm run dev
```

#### Variables de Entorno - Desarrollo
```bash
# .env.local (Frontend)
NEXT_PUBLIC_API_URL=http://localhost:5001

# backend/.env (Backend)
FLASK_ENV=development
JWT_SECRET=dev-secret-key
ADMIN_USER=admin
ADMIN_PASSWORD=admin123
MONGO_URI=mongodb://admin:admin123@localhost:27017/?authSource=admin
MONGO_DB_NAME=talleresdb
CORS_ORIGINS=http://localhost:3000
```

### 2. Staging/Testing

#### Docker Compose para Staging
```yaml
# docker-compose.staging.yml
version: "3.9"
services:
  mongo:
    image: mongo:6
    container_name: mongo-staging
    restart: always
    environment:
      MONGO_INITDB_ROOT_USERNAME: ${MONGO_USER}
      MONGO_INITDB_ROOT_PASSWORD: ${MONGO_PASSWORD}
    ports:
      - "27017:27017"
    volumes:
      - mongo_staging_data:/data/db
      - ./mongo-init:/docker-entrypoint-initdb.d
    networks:
      - skillforge-network

  api:
    build:
      context: ./backend
      dockerfile: Dockerfile.staging
    container_name: api-staging
    restart: always
    environment:
      FLASK_ENV: staging
      JWT_SECRET: ${JWT_SECRET}
      ADMIN_USER: ${ADMIN_USER}
      ADMIN_PASSWORD: ${ADMIN_PASSWORD}
      MONGO_URI: mongodb://${MONGO_USER}:${MONGO_PASSWORD}@mongo:27017/?authSource=admin
      MONGO_DB_NAME: talleresdb_staging
      CORS_ORIGINS: ${FRONTEND_URL}
    depends_on:
      - mongo
    ports:
      - "5001:5000"
    networks:
      - skillforge-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:5000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  frontend:
    build:
      context: .
      dockerfile: Dockerfile.frontend
    container_name: frontend-staging
    restart: always
    environment:
      NEXT_PUBLIC_API_URL: ${API_URL}
    ports:
      - "3000:3000"
    depends_on:
      - api
    networks:
      - skillforge-network

volumes:
  mongo_staging_data:

networks:
  skillforge-network:
    driver: bridge
```

#### Variables de Entorno - Staging
```bash
# .env.staging
MONGO_USER=skillforge_user
MONGO_PASSWORD=secure_staging_password
JWT_SECRET=staging-jwt-secret-key-very-long
ADMIN_USER=admin
ADMIN_PASSWORD=secure_admin_password
FRONTEND_URL=https://staging.skillforge.com
API_URL=https://api-staging.skillforge.com
```

### 3. Producción

#### Dockerfile Optimizado para Producción

**Backend Dockerfile:**
```dockerfile
# backend/Dockerfile.prod
FROM python:3.11-slim

# Instalar dependencias del sistema
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Crear usuario no-root
RUN useradd --create-home --shell /bin/bash app

# Establecer directorio de trabajo
WORKDIR /app

# Copiar requirements y instalar dependencias
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar código de aplicación
COPY . .

# Cambiar a usuario no-root
RUN chown -R app:app /app
USER app

# Exponer puerto
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:5000/health || exit 1

# Comando de inicio
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "--workers", "4", "--timeout", "120", "app:app"]
```

**Frontend Dockerfile:**
```dockerfile
# Dockerfile.frontend.prod
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]
```

#### Docker Compose para Producción
```yaml
# docker-compose.prod.yml
version: "3.9"
services:
  mongo:
    image: mongo:6
    container_name: mongo-prod
    restart: always
    environment:
      MONGO_INITDB_ROOT_USERNAME: ${MONGO_USER}
      MONGO_INITDB_ROOT_PASSWORD: ${MONGO_PASSWORD}
    volumes:
      - mongo_prod_data:/data/db
      - ./backup:/backup
      - ./mongo-config:/etc/mongo
    networks:
      - skillforge-network
    command: mongod --config /etc/mongo/mongod.conf
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

  api:
    build:
      context: ./backend
      dockerfile: Dockerfile.prod
    container_name: api-prod
    restart: always
    environment:
      FLASK_ENV: production
      JWT_SECRET: ${JWT_SECRET}
      ADMIN_USER: ${ADMIN_USER}
      ADMIN_PASSWORD: ${ADMIN_PASSWORD}
      MONGO_URI: mongodb://${MONGO_USER}:${MONGO_PASSWORD}@mongo:27017/?authSource=admin
      MONGO_DB_NAME: talleresdb
      CORS_ORIGINS: ${FRONTEND_URL}
    depends_on:
      - mongo
    networks:
      - skillforge-network
    deploy:
      replicas: 2
      resources:
        limits:
          cpus: '0.5'
          memory: 512M
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

  frontend:
    build:
      context: .
      dockerfile: Dockerfile.frontend.prod
    container_name: frontend-prod
    restart: always
    environment:
      NEXT_PUBLIC_API_URL: ${API_URL}
    depends_on:
      - api
    networks:
      - skillforge-network
    deploy:
      replicas: 2
      resources:
        limits:
          cpus: '0.3'
          memory: 256M

  nginx:
    image: nginx:alpine
    container_name: nginx-prod
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./nginx/ssl:/etc/nginx/ssl
      - ./nginx/logs:/var/log/nginx
    depends_on:
      - frontend
      - api
    networks:
      - skillforge-network

volumes:
  mongo_prod_data:

networks:
  skillforge-network:
    driver: bridge
```

#### Configuración Nginx
```nginx
# nginx/nginx.conf
events {
    worker_connections 1024;
}

http {
    upstream frontend {
        server frontend-prod:3000;
    }
    
    upstream api {
        server api-prod:5000;
    }

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=frontend:10m rate=30r/s;

    server {
        listen 80;
        server_name skillforge.com www.skillforge.com;
        return 301 https://$server_name$request_uri;
    }

    server {
        listen 443 ssl http2;
        server_name skillforge.com www.skillforge.com;

        ssl_certificate /etc/nginx/ssl/skillforge.crt;
        ssl_certificate_key /etc/nginx/ssl/skillforge.key;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;

        # Security headers
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header Referrer-Policy "no-referrer-when-downgrade" always;
        add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

        # API routes
        location /api/ {
            limit_req zone=api burst=20 nodelay;
            proxy_pass http://api/;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Frontend routes
        location / {
            limit_req zone=frontend burst=50 nodelay;
            proxy_pass http://frontend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Static files caching
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
}
```

## Variables de Entorno de Producción

### Configuración Segura
```bash
# .env.prod (NO COMMITEAR)
# Base de datos
MONGO_USER=skillforge_prod_user
MONGO_PASSWORD=ultra_secure_password_2024!
MONGO_DB_NAME=talleresdb

# JWT y autenticación
JWT_SECRET=super-secret-jwt-key-production-256-bits-long
ADMIN_USER=admin
ADMIN_PASSWORD=ultra_secure_admin_password_2024!

# URLs
FRONTEND_URL=https://skillforge.com
API_URL=https://api.skillforge.com

# Configuración Flask
FLASK_ENV=production
FLASK_DEBUG=False

# CORS
CORS_ORIGINS=https://skillforge.com,https://www.skillforge.com

# Logging
LOG_LEVEL=INFO
LOG_FILE=/app/logs/app.log
```

### Gestión de Secretos
```bash
# Usando Docker Secrets
echo "ultra_secure_password_2024!" | docker secret create mongo_password -
echo "super-secret-jwt-key-production" | docker secret create jwt_secret -

# En docker-compose.yml
services:
  api:
    secrets:
      - mongo_password
      - jwt_secret
    environment:
      MONGO_PASSWORD_FILE: /run/secrets/mongo_password
      JWT_SECRET_FILE: /run/secrets/jwt_secret

secrets:
  mongo_password:
    external: true
  jwt_secret:
    external: true
```

## Procedimientos de Despliegue

### 1. Despliegue Inicial

```bash
#!/bin/bash
# deploy-initial.sh

set -e

echo "🚀 Iniciando despliegue inicial de SkillForge..."

# Verificar prerrequisitos
command -v docker >/dev/null 2>&1 || { echo "Docker no está instalado" >&2; exit 1; }
command -v docker-compose >/dev/null 2>&1 || { echo "Docker Compose no está instalado" >&2; exit 1; }

# Crear directorios necesarios
mkdir -p logs backup nginx/ssl nginx/logs mongo-config

# Generar certificados SSL (desarrollo)
if [ ! -f nginx/ssl/skillforge.crt ]; then
    echo "📜 Generando certificados SSL..."
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout nginx/ssl/skillforge.key \
        -out nginx/ssl/skillforge.crt \
        -subj "/C=ES/ST=Madrid/L=Madrid/O=SkillForge/CN=skillforge.com"
fi

# Configurar variables de entorno
if [ ! -f .env.prod ]; then
    echo "⚙️  Configurando variables de entorno..."
    cp .env.example .env.prod
    echo "❗ IMPORTANTE: Edita .env.prod con valores de producción"
    exit 1
fi

# Construir y desplegar
echo "🏗️  Construyendo imágenes..."
docker-compose -f docker-compose.prod.yml build

echo "🚀 Desplegando servicios..."
docker-compose -f docker-compose.prod.yml up -d

# Verificar salud de servicios
echo "🔍 Verificando servicios..."
sleep 30

if curl -f http://localhost/health; then
    echo "✅ Despliegue exitoso!"
else
    echo "❌ Error en el despliegue"
    docker-compose -f docker-compose.prod.yml logs
    exit 1
fi

echo "🎉 SkillForge desplegado exitosamente!"
echo "🌐 Frontend: https://skillforge.com"
echo "🔌 API: https://api.skillforge.com"
```

### 2. Despliegue de Actualizaciones

```bash
#!/bin/bash
# deploy-update.sh

set -e

echo "🔄 Actualizando SkillForge..."

# Backup de base de datos
echo "💾 Creando backup..."
./scripts/backup-db.sh

# Pull de cambios
git pull origin main

# Construir nuevas imágenes
echo "🏗️  Construyendo nuevas imágenes..."
docker-compose -f docker-compose.prod.yml build

# Rolling update
echo "🔄 Realizando rolling update..."
docker-compose -f docker-compose.prod.yml up -d --no-deps api
sleep 10
docker-compose -f docker-compose.prod.yml up -d --no-deps frontend

# Verificar salud
echo "🔍 Verificando actualización..."
if curl -f http://localhost/health; then
    echo "✅ Actualización exitosa!"
    # Limpiar imágenes antiguas
    docker image prune -f
else
    echo "❌ Error en la actualización, rollback..."
    # Implementar rollback aquí
    exit 1
fi
```

### 3. Rollback

```bash
#!/bin/bash
# rollback.sh

set -e

BACKUP_TAG=${1:-"latest-stable"}

echo "⏪ Realizando rollback a $BACKUP_TAG..."

# Parar servicios actuales
docker-compose -f docker-compose.prod.yml down

# Restaurar imágenes anteriores
docker tag skillforge-api:$BACKUP_TAG skillforge-api:latest
docker tag skillforge-frontend:$BACKUP_TAG skillforge-frontend:latest

# Restaurar base de datos si es necesario
if [ "$2" = "--restore-db" ]; then
    echo "💾 Restaurando base de datos..."
    ./scripts/restore-db.sh $BACKUP_TAG
fi

# Reiniciar servicios
docker-compose -f docker-compose.prod.yml up -d

echo "✅ Rollback completado"
```

## Backup y Recuperación

### Script de Backup Automatizado
```bash
#!/bin/bash
# scripts/backup-db.sh

set -e

BACKUP_DIR="/backup/mongodb"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=30

echo "💾 Iniciando backup de MongoDB..."

# Crear directorio de backup
mkdir -p $BACKUP_DIR/$DATE

# Ejecutar backup
docker exec mongo-prod mongodump \
    --host localhost:27017 \
    --username $MONGO_USER \
    --password $MONGO_PASSWORD \
    --authenticationDatabase admin \
    --db talleresdb \
    --out /backup/$DATE

# Comprimir backup
tar -czf $BACKUP_DIR/backup_$DATE.tar.gz -C $BACKUP_DIR $DATE

# Limpiar archivos temporales
rm -rf $BACKUP_DIR/$DATE

# Eliminar backups antiguos
find $BACKUP_DIR -name "backup_*.tar.gz" -mtime +$RETENTION_DAYS -delete

# Subir a almacenamiento remoto (opcional)
if [ "$REMOTE_BACKUP" = "true" ]; then
    aws s3 cp $BACKUP_DIR/backup_$DATE.tar.gz s3://skillforge-backups/
fi

echo "✅ Backup completado: backup_$DATE.tar.gz"
```

### Script de Restauración
```bash
#!/bin/bash
# scripts/restore-db.sh

set -e

BACKUP_FILE=${1:-"latest"}
BACKUP_DIR="/backup/mongodb"

if [ "$BACKUP_FILE" = "latest" ]; then
    BACKUP_FILE=$(ls -t $BACKUP_DIR/backup_*.tar.gz | head -1)
else
    BACKUP_FILE="$BACKUP_DIR/backup_$BACKUP_FILE.tar.gz"
fi

echo "🔄 Restaurando desde: $BACKUP_FILE"

# Extraer backup
TEMP_DIR=$(mktemp -d)
tar -xzf $BACKUP_FILE -C $TEMP_DIR

# Parar aplicación
docker-compose -f docker-compose.prod.yml stop api frontend

# Restaurar base de datos
docker exec mongo-prod mongorestore \
    --host localhost:27017 \
    --username $MONGO_USER \
    --password $MONGO_PASSWORD \
    --authenticationDatabase admin \
    --db talleresdb \
    --drop \
    $TEMP_DIR/talleresdb

# Limpiar archivos temporales
rm -rf $TEMP_DIR

# Reiniciar aplicación
docker-compose -f docker-compose.prod.yml start api frontend

echo "✅ Restauración completada"
```

## Monitoreo y Logging

### Configuración de Prometheus
```yaml
# monitoring/prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'skillforge-api'
    static_configs:
      - targets: ['api-prod:5000']
    metrics_path: '/metrics'
    
  - job_name: 'mongodb'
    static_configs:
      - targets: ['mongo-exporter:9216']

  - job_name: 'nginx'
    static_configs:
      - targets: ['nginx-exporter:9113']
```

### Dashboard de Grafana
```json
{
  "dashboard": {
    "title": "SkillForge Metrics",
    "panels": [
      {
        "title": "API Response Time",
        "type": "graph",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(flask_request_duration_seconds_bucket[5m]))"
          }
        ]
      },
      {
        "title": "Database Connections",
        "type": "graph", 
        "targets": [
          {
            "expr": "mongodb_connections{state=\"current\"}"
          }
        ]
      }
    ]
  }
}
```

### Configuración de Logs
```yaml
# logging/docker-compose.logging.yml
version: "3.9"
services:
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:7.15.0
    environment:
      - discovery.type=single-node
      - "ES_JAVA_OPTS=-Xms512m -Xmx512m"
    volumes:
      - elasticsearch_data:/usr/share/elasticsearch/data

  logstash:
    image: docker.elastic.co/logstash/logstash:7.15.0
    volumes:
      - ./logstash/pipeline:/usr/share/logstash/pipeline
      - ./logs:/logs

  kibana:
    image: docker.elastic.co/kibana/kibana:7.15.0
    ports:
      - "5601:5601"
    environment:
      ELASTICSEARCH_HOSTS: http://elasticsearch:9200

volumes:
  elasticsearch_data:
```

## Seguridad en Producción

### Checklist de Seguridad

#### 1. Configuración de Red
- [ ] Firewall configurado (solo puertos 80, 443, 22)
- [ ] VPN para acceso administrativo
- [ ] Segmentación de red (frontend, backend, database)
- [ ] DDoS protection activado

#### 2. Autenticación y Autorización
- [ ] Contraseñas seguras (mínimo 16 caracteres)
- [ ] JWT secrets únicos y seguros
- [ ] Rotación periódica de secretos
- [ ] 2FA para acceso administrativo

#### 3. Cifrado
- [ ] HTTPS con certificados válidos
- [ ] TLS 1.2+ únicamente
- [ ] Cifrado de base de datos en reposo
- [ ] Cifrado de backups

#### 4. Monitoreo de Seguridad
- [ ] Logs de seguridad centralizados
- [ ] Alertas de intentos de acceso fallidos
- [ ] Monitoreo de vulnerabilidades
- [ ] Escaneo regular de dependencias

### Configuración de Fail2Ban
```ini
# /etc/fail2ban/jail.local
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5

[nginx-http-auth]
enabled = true
filter = nginx-http-auth
logpath = /var/log/nginx/error.log

[nginx-limit-req]
enabled = true
filter = nginx-limit-req
logpath = /var/log/nginx/error.log
maxretry = 10
```

## Escalabilidad

### Escalado Horizontal

#### Load Balancer con HAProxy
```
# haproxy.cfg
global
    daemon

defaults
    mode http
    timeout connect 5000ms
    timeout client 50000ms
    timeout server 50000ms

frontend skillforge_frontend
    bind *:80
    bind *:443 ssl crt /etc/ssl/certs/skillforge.pem
    redirect scheme https if !{ ssl_fc }
    default_backend skillforge_backend

backend skillforge_backend
    balance roundrobin
    option httpchk GET /health
    server api1 api-prod-1:5000 check
    server api2 api-prod-2:5000 check
    server api3 api-prod-3:5000 check
```

#### Auto-scaling con Docker Swarm
```yaml
# docker-stack.yml
version: "3.9"
services:
  api:
    image: skillforge-api:latest
    deploy:
      replicas: 3
      update_config:
        parallelism: 1
        delay: 10s
      restart_policy:
        condition: on-failure
      resources:
        limits:
          cpus: '0.5'
          memory: 512M
        reservations:
          cpus: '0.25'
          memory: 256M
    networks:
      - skillforge-network

networks:
  skillforge-network:
    driver: overlay
```

### Optimización de Base de Datos

#### Configuración MongoDB para Producción
```yaml
# mongod.conf
storage:
  dbPath: /data/db
  journal:
    enabled: true
  wiredTiger:
    engineConfig:
      cacheSizeGB: 2

systemLog:
  destination: file
  logAppend: true
  path: /var/log/mongodb/mongod.log

net:
  port: 27017
  bindIp: 0.0.0.0

security:
  authorization: enabled

replication:
  replSetName: "skillforge-rs"

operationProfiling:
  slowOpThresholdMs: 100
  mode: slowOp
```

#### Replica Set Setup
```javascript
// Configurar replica set
rs.initiate({
  _id: "skillforge-rs",
  members: [
    { _id: 0, host: "mongo-primary:27017", priority: 2 },
    { _id: 1, host: "mongo-secondary-1:27017", priority: 1 },
    { _id: 2, host: "mongo-secondary-2:27017", priority: 1 }
  ]
})
```

## Troubleshooting

### Problemas Comunes

#### 1. Contenedor no inicia
```bash
# Verificar logs
docker-compose logs api

# Verificar recursos
docker stats

# Verificar configuración
docker-compose config
```

#### 2. Base de datos no conecta
```bash
# Verificar conectividad
docker exec api-prod ping mongo-prod

# Verificar autenticación
docker exec mongo-prod mongo --eval "db.adminCommand('listCollections')"

# Verificar logs de MongoDB
docker logs mongo-prod
```

#### 3. SSL/TLS Issues
```bash
# Verificar certificados
openssl x509 -in nginx/ssl/skillforge.crt -text -noout

# Probar conexión SSL
openssl s_client -connect skillforge.com:443

# Verificar configuración Nginx
docker exec nginx-prod nginx -t
```

#### 4. Performance Issues
```bash
# Monitorear recursos
docker stats

# Verificar queries lentas MongoDB
docker exec mongo-prod mongo --eval "db.setProfilingLevel(2, {slowms: 100})"

# Analizar logs de acceso
tail -f nginx/logs/access.log | grep "POST\|PUT\|DELETE"
```

### Scripts de Diagnóstico

```bash
#!/bin/bash
# scripts/health-check.sh

echo "🔍 Verificando salud del sistema..."

# Verificar servicios Docker
echo "📦 Estado de contenedores:"
docker-compose -f docker-compose.prod.yml ps

# Verificar conectividad de red
echo "🌐 Conectividad:"
curl -s -o /dev/null -w "%{http_code}" http://localhost/health

# Verificar uso de recursos
echo "💻 Recursos del sistema:"
docker stats --no-stream

# Verificar logs recientes
echo "📋 Logs recientes:"
docker-compose -f docker-compose.prod.yml logs --tail=10

# Verificar base de datos
echo "🗄️  Estado de MongoDB:"
docker exec mongo-prod mongo --eval "db.adminCommand('serverStatus').ok"

echo "✅ Verificación completada"
```


Este documento proporciona una guía completa para el despliegue de SkillForge en diferentes entornos, desde desarrollo hasta producción, incluyendo todas las mejores prácticas de seguridad, monitoreo y escalabilidad.



