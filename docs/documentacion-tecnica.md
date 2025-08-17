<img width="1454" height="518" alt="image" src="https://github.com/user-attachments/assets/c07ba9b8-f095-4006-9a1e-676f4406275f" />

# Documentación Técnica - Sistema de Gestión de Talleres

## 📋 Índice

1. [Arquitectura del Sistema](#arquitectura-del-sistema)
2. [Diseño de Base de Datos](#diseño-de-base-de-datos)
3. [Arquitectura de la API](#arquitectura-de-la-api)
4. [Estructura del Proyecto](#estructura-del-proyecto)
5. [Flujo de Desarrollo](#flujo-de-desarrollo)
6. [Instrucciones de Despliegue](#instrucciones-de-despliegue)
7. [Seguridad y Rate Limiting](#seguridad-y-rate-limiting)
8. [Pruebas](#pruebas)

## 🏗️ Arquitectura del Sistema

### Arquitectura General

El sistema sigue una arquitectura de **3 capas** con separación clara de responsabilidades:

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (Next.js)                      │
│  ┌─────────────────┐ ┌─────────────────┐ ┌──────────────┐  │
│  │   Estudiantes   │ │  Administradores │ │  Componentes │  │
│  │     Pages       │ │      Pages       │ │   Reutiliz.  │  │
│  └─────────────────┘ └─────────────────┘ └──────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │ HTTP/REST
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND (Flask)                         │
│  ┌─────────────────┐ ┌─────────────────┐ ┌──────────────┐  │
│  │   Controllers   │ │   Middleware    │ │  Auth & Rate │  │
│  │   (Endpoints)   │ │   (Security)    │ │   Limiting   │  │
│  └─────────────────┘ └─────────────────┘ └──────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │ PyMongo
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                 PERSISTENCIA (MongoDB + Redis)             │
│  ┌─────────────────┐ ┌─────────────────┐ ┌──────────────┐  │
│  │    Talleres     │ │   Estudiantes   │ │ Rate Limiting│  │
│  │   Collection    │ │   Collection    │ │    (Redis)   │  │
│  └─────────────────┘ └─────────────────┘ └──────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Tecnologías por Capa

#### Frontend
- **Next.js 15**: Framework React con App Router
- **TypeScript**: Tipado estático
- **Tailwind CSS**: Estilos utilitarios
- **Radix UI**: Componentes accesibles
- **React Hook Form + Zod**: Validación de formularios

#### Backend
- **Flask 3.0**: Framework web minimalista
- **PyMongo**: Driver oficial de MongoDB
- **PyJWT**: Manejo de tokens JWT
- **Flask-Limiter**: Rate limiting
- **Flask-CORS**: Soporte CORS

#### Base de Datos
- **MongoDB**: Base de datos NoSQL principal
- **Redis**: Cache y rate limiting
- **Docker**: Containerización

## 🗄️ Diseño de Base de Datos

### Esquema de Datos

#### Colección: `talleres`

```javascript
{
  "_id": ObjectId("..."),
  "nombre": "Introducción a Python",
  "descripcion": "Curso básico de programación en Python",
  "fecha": "2024-03-15",           // YYYY-MM-DD
  "hora": "10:00",                 // HH:MM
  "lugar": "Aula 101",
  "categoria": "tecnologia",        // tecnologia, emprendimiento, habilidades-blandas
  "tipo": "curso técnico",         // curso técnico, capacitacion, programa
  "instructor": "Ana García",
  "rating": 4.8,                   // 0.0 - 5.0
  "cupo": 25,                      // Número entero
  "creado_en": "2024-01-15T10:30:00.000Z",
  "actualizado_en": "2024-01-16T14:20:00.000Z",
  "inscripciones": [
    {
      "estudiante_id": "507f1f77bcf86cd799439011",
      "nombre": "Juan Pérez",
      "email": "juan@email.com",
      "registrado_en": "2024-01-16T09:15:00.000Z"
    }
  ]
}
```

#### Colección: `estudiantes`

```javascript
{
  "_id": ObjectId("507f1f77bcf86cd799439011"),
  "nombre": "Juan Pérez",
  "email": "juan@email.com",        // Único (índice)
  "hash": "$2b$12$...",            // Hash bcrypt de la contraseña
  "creado_en": "2024-01-15T08:00:00.000Z"
}
```

### Índices de Base de Datos

```javascript
// Optimización de consultas principales
db.talleres.createIndex({ "fecha": 1, "hora": 1 })           // Búsquedas por fecha/hora
db.talleres.createIndex({ "categoria": 1 })                  // Filtros por categoría
db.talleres.createIndex({ "rating": -1 })                    // Ordenamiento por rating
db.talleres.createIndex({ "creado_en": -1 })                // Talleres más recientes
db.talleres.createIndex({ "inscripciones.estudiante_id": 1 }) // Búsqueda de inscripciones

db.estudiantes.createIndex({ "email": 1 }, { unique: true }) // Email único (constraint)
db.estudiantes.createIndex({ "creado_en": -1 })             // Estudiantes más recientes

// Índices compuestos para consultas complejas
db.talleres.createIndex({ "categoria": 1, "fecha": 1, "rating": -1 }) // Filtro + ordenamiento
```

### Análisis de Rendimiento

| Operación | Índice Utilizado | Complejidad | Observaciones |
|-----------|------------------|-------------|---------------|
| Listar talleres por fecha | `fecha_1_hora_1` | O(log n) | Muy eficiente |
| Filtrar por categoría | `categoria_1` | O(log n) | Óptimo para filtros |
| Buscar por email | `email_1` | O(log n) | Único, muy rápido |
| Talleres de un estudiante | `inscripciones.estudiante_id_1` | O(log n + m) | m = inscripciones |
| Búsqueda de texto | Full scan | O(n) | Considerar text index |

### Relaciones

- **Talleres ↔ Estudiantes**: Relación Many-to-Many embebida
- Los estudiantes se almacenan como subdocumentos en `talleres.inscripciones`
- Desnormalización intencional para optimizar consultas de talleres

## 🔌 Arquitectura de la API

### Principios de Diseño

1. **RESTful**: Endpoints siguiendo convenciones REST
2. **Stateless**: Sin estado en el servidor (JWT)
3. **Idempotente**: Operaciones seguras para retry
4. **Versionado**: Preparado para futuras versiones

### Endpoints Principales

#### Talleres (Workshops)

| Método | Endpoint | Descripción | Auth | Rate Limit |
|--------|----------|-------------|------|------------|
| `GET` | `/workshops` | Listar talleres con filtros | Público | 60/min |
| `GET` | `/workshops/{id}` | Obtener taller específico | Público | 30/min |
| `POST` | `/workshops` | Crear nuevo taller | Admin | 10/min |
| `PUT` | `/workshops/{id}` | Actualizar taller | Admin | 10/min |
| `DELETE` | `/workshops/{id}` | Eliminar taller | Admin | 5/min |
| `POST` | `/workshops/{id}/register` | Inscribirse a taller | Estudiante | 10/min |
| `DELETE` | `/workshops/{id}/register` | Cancelar inscripción | Estudiante | 10/min |

#### Autenticación

| Método | Endpoint | Descripción | Rate Limit |
|--------|----------|-------------|------------|
| `POST` | `/auth/login` | Login administrador | 5/min |
| `POST` | `/auth/estudiantes/registro` | Registro estudiante | 3/min |
| `POST` | `/auth/estudiantes/login` | Login estudiante | 10/min |
| `GET` | `/auth/estudiantes/me` | Perfil estudiante | 30/min |

#### Utilidades

| Método | Endpoint | Descripción | Rate Limit |
|--------|----------|-------------|------------|
| `GET` | `/stats` | Estadísticas del sistema | 20/min |
| `GET` | `/categories` | Categorías disponibles | 30/min |
| `GET` | `/health` | Estado de salud | 60/min |
| `GET` | `/openapi.json` | Especificación OpenAPI | 10/min |

### Códigos de Estado HTTP

- **200 OK**: Operación exitosa
- **201 Created**: Recurso creado
- **400 Bad Request**: Datos inválidos
- **401 Unauthorized**: No autenticado
- **403 Forbidden**: Sin permisos
- **404 Not Found**: Recurso no encontrado
- **409 Conflict**: Conflicto (ej: cupo lleno)
- **429 Too Many Requests**: Rate limit excedido
- **500 Internal Server Error**: Error del servidor

### Formato de Respuestas

#### Respuesta Exitosa
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "nombre": "Introducción a Python",
  "descripcion": "Curso básico...",
  "fecha": "2024-03-15",
  "hora": "10:00",
  "cupos_disponibles": 15
}
```

#### Respuesta de Error
```json
{
  "mensaje": "Descripción del error",
  "campos": ["campo1", "campo2"],  // Opcional: campos faltantes
  "reintentar_en": "60 segundos"   // Opcional: para rate limiting
}
```

## 📁 Estructura del Proyecto

```
talleres-formacion-pro/
├── app/                          # Frontend Next.js (App Router)
│   ├── admin/                    # Panel de administración
│   │   ├── estudiantes/          # Gestión de estudiantes
│   │   ├── login/               # Login de admin
│   │   └── page.tsx             # Dashboard admin
│   ├── estudiantes/             # Portal de estudiantes
│   │   ├── login/               # Login estudiante
│   │   ├── registro/            # Registro estudiante
│   │   ├── talleres/            # Catálogo de talleres
│   │   └── mis-registros/       # Inscripciones del estudiante
│   ├── globals.css              # Estilos globales
│   ├── layout.tsx               # Layout principal
│   └── page.tsx                 # Página de inicio
├── backend/                     # API Flask
│   ├── app.py                   # Aplicación principal
│   ├── config.py                # Configuración
│   ├── Dockerfile               # Imagen Docker
│   └── requirements.txt         # Dependencias Python
├── components/                  # Componentes React reutilizables
│   ├── ui/                      # Componentes base (Radix UI)
│   ├── boton-inscripcion.tsx    # Botón de inscripción
│   ├── filtros-talleres.tsx     # Filtros de búsqueda
│   ├── formulario-taller.tsx    # Formulario CRUD talleres
│   ├── navbar.tsx               # Barra de navegación
│   └── tabla-talleres.tsx       # Lista/grid de talleres
├── hooks/                       # Hooks personalizados
│   └── use-toast.ts             # Hook de notificaciones
├── lib/                         # Utilidades y configuración
│   ├── api.ts                   # Cliente API con rate limiting
│   └── utils.ts                 # Funciones utilitarias
├── docs/                        # Documentación
│   ├── documentacion-tecnica.md # Este archivo
│   └── seguridad-y-rate-limiting.md
├── public/                      # Archivos estáticos
├── types.ts                     # Tipos TypeScript globales
├── docker-compose.yml           # Orquestación de servicios
├── package.json                 # Dependencias Node.js
└── README.md                    # Documentación principal
```

### Patrones de Arquitectura

#### Frontend
- **Component-Based**: Componentes reutilizables
- **Custom Hooks**: Lógica compartida
- **API Layer**: Abstracción de peticiones HTTP
- **Type Safety**: TypeScript en toda la aplicación

#### Backend
- **Factory Pattern**: Creación de la app Flask
- **Decorator Pattern**: Middleware de autenticación
- **Repository Pattern**: Abstracción de datos (implícito)
- **Error Handling**: Manejo centralizado de errores

## 🔄 Flujo de Desarrollo

### Flujo de Trabajo Git

```bash
# 1. Crear rama de feature
git checkout -b feature/nueva-funcionalidad

# 2. Desarrollar y commitear
git add .
git commit -m "feat: agregar nueva funcionalidad"

# 3. Push y Pull Request
git push origin feature/nueva-funcionalidad
# Crear PR en GitHub/GitLab

# 4. Merge a main después de review
git checkout main
git pull origin main
```

### Convenciones de Código

#### Commits (Conventional Commits)
- `feat:` Nueva funcionalidad
- `fix:` Corrección de bug
- `docs:` Documentación
- `style:` Formato de código
- `refactor:` Refactorización
- `test:` Pruebas
- `chore:` Tareas de mantenimiento

#### Naming Conventions
- **Archivos**: kebab-case (`formulario-taller.tsx`)
- **Componentes**: PascalCase (`FormularioTaller`)
- **Variables**: camelCase (`nombreTaller`)
- **Constantes**: UPPER_SNAKE_CASE (`API_BASE_URL`)

### Entorno de Desarrollo

```bash
# 1. Clonar repositorio
git clone https://github.com/Venganza-de-Python-II/Proyecto-Final
cd proyecto-final

# 2. Levantar servicios backend
docker-compose up -d mongo redis

# 3. Instalar dependencias backend
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# 4. Ejecutar backend en desarrollo
python app.py

# 5. Instalar dependencias frontend
cd ..
npm install

# 6. Ejecutar frontend en desarrollo
npm run dev
```

## 🚀 Instrucciones de Despliegue

### Desarrollo Local

```bash
# Opción 1: Docker Compose (Recomendado)
docker-compose up -d --build

# Opción 2: Servicios separados
# Terminal 1: Backend
cd backend && python app.py

# Terminal 2: Frontend
npm run dev

# Terminal 3: Base de datos
docker run -d -p 27017:27017 -p 6379:6379 mongo redis
```

### Producción

#### 1. Preparación del Servidor

```bash
# Instalar Docker y Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Instalar Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

#### 2. Variables de Entorno de Producción

```bash
# .env.production
FLASK_ENV=production
JWT_SECRET=clave-super-secreta-de-produccion-cambiar
ADMIN_USER=admin
ADMIN_PASSWORD=contraseña-muy-segura
MONGO_URI=mongodb://usuario:password@mongo:27017/talleresdb?authSource=admin
REDIS_URL=redis://redis:6379
CORS_ORIGINS=https://tu-dominio.com,https://www.tu-dominio.com
API_KEYS=api-key-1,api-key-2,api-key-3
RATELIMIT_DEFAULT=1000 per hour
```

#### 3. Docker Compose de Producción

```yaml
# docker-compose.prod.yml
version: "3.9"
services:
  mongo:
    image: mongo:6
    restart: always
    environment:
      MONGO_INITDB_ROOT_USERNAME: ${MONGO_USER}
      MONGO_INITDB_ROOT_PASSWORD: ${MONGO_PASSWORD}
    volumes:
      - mongo_data:/data/db
    networks:
      - backend

  redis:
    image: redis:7-alpine
    restart: always
    volumes:
      - redis_data:/data
    networks:
      - backend

  api:
    build: ./backend
    restart: always
    env_file: .env.production
    depends_on:
      - mongo
      - redis
    networks:
      - backend
      - frontend

  nginx:
    image: nginx:alpine
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/ssl
    depends_on:
      - api
    networks:
      - frontend

networks:
  backend:
  frontend:

volumes:
  mongo_data:
  redis_data:
```

#### 4. Configuración Nginx

```nginx
# nginx.conf
events {
    worker_connections 1024;
}

http {
    upstream api {
        server api:5000;
    }

    server {
        listen 80;
        server_name tu-dominio.com;
        return 301 https://$server_name$request_uri;
    }

    server {
        listen 443 ssl;
        server_name tu-dominio.com;

        ssl_certificate /etc/ssl/cert.pem;
        ssl_certificate_key /etc/ssl/key.pem;

        location /api/ {
            proxy_pass http://api/;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        location / {
            root /usr/share/nginx/html;
            try_files $uri $uri/ /index.html;
        }
    }
}
```

#### 5. Despliegue

```bash
# 1. Clonar en servidor
git clone https://github.com/Venganza-de-Python-II/Proyecto-Final
cd proyecto-final

# 2. Configurar variables de entorno
cp .env.example .env.production
nano .env.production

# 3. Construir y desplegar
docker-compose -f docker-compose.prod.yml up -d --build

# 4. Verificar servicios
docker-compose -f docker-compose.prod.yml ps
docker-compose -f docker-compose.prod.yml logs -f
```

#### 6. Monitoreo y Mantenimiento

```bash
# Logs en tiempo real
docker-compose logs -f api

# Backup de MongoDB
docker exec mongo mongodump --out /backup

# Actualización
git pull origin main
docker-compose -f docker-compose.prod.yml up -d --build

# Limpieza de imágenes antiguas
docker system prune -a
```

## 🛡️ Seguridad y Rate Limiting

### Medidas de Seguridad Implementadas

1. **Autenticación JWT**: Tokens con expiración de 8 horas
2. **Rate Limiting**: Límites por IP y endpoint
3. **Headers de Seguridad**: X-Frame-Options, X-XSS-Protection, etc.
4. **Validación de Entrada**: Sanitización de datos
5. **CORS Configurado**: Orígenes permitidos específicos
6. **API Keys Opcionales**: Capa adicional de autenticación

### Configuración de Rate Limiting

```python
# Límites por endpoint
@limiter.limit("5 per minute")  # Login admin
@limiter.limit("10 per minute") # Login estudiante
@limiter.limit("3 per minute")  # Registro
@limiter.limit("60 per minute") # Consultas públicas
```

### Mejores Prácticas de Seguridad

1. **Contraseñas**: Hash con bcrypt (factor 12)
2. **Tokens**: Secreto JWT fuerte y rotación regular
3. **Base de Datos**: Usuario específico con permisos mínimos
4. **HTTPS**: Obligatorio en producción
5. **Logs**: Monitoreo de intentos de acceso sospechosos

## 🔧 Troubleshooting

### Problemas Comunes

#### 1. Error de Conexión a MongoDB
```bash
# Verificar estado
docker-compose ps mongo

# Ver logs
docker-compose logs mongo

# Reiniciar servicio
docker-compose restart mongo
```

#### 2. Rate Limiting Muy Restrictivo
```python
# Ajustar en config.py
RATELIMIT_DEFAULT = "1000 per hour"  # Aumentar límite

# O deshabilitar temporalmente
@limiter.exempt  # Añadir a endpoint específico
```

#### 3. Problemas de CORS
```python
# Verificar configuración
CORS_ORIGINS = "http://localhost:3000,https://tu-dominio.com"
```

#### 4. Tokens JWT Expirados
```javascript
// Frontend: manejar renovación automática
if (error.message.includes('expirada')) {
  // Redirigir a login
  window.location.href = '/login';
}
```

### Logs Útiles

```bash
# Backend Flask
docker-compose logs -f api

# MongoDB
docker-compose logs -f mongo

# Redis
docker-compose logs -f redis

# Todos los servicios
docker-compose logs -f
```

## 📈 Escalabilidad

### Optimizaciones Actuales

1. **Base de Datos**: Índices optimizados
2. **API**: Rate limiting para proteger recursos
3. **Frontend**: Componentes reutilizables
4. **Cache**: Redis para rate limiting

### Mejoras a Considerar en el Futuro

1. **Horizontal Scaling**: Load balancer + múltiples instancias
2. **Database Sharding**: Particionamiento de datos
3. **CDN**: Contenido estático distribuido
5. **Queue System**: Procesamiento asíncrono

---

**Versión**: 1.0.0  
**Última actualización**: Agosto 2025



