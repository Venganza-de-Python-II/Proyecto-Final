![463499167-e110a332-88a7-4987-bbe1-ed323f1583e2](https://github.com/user-attachments/assets/76234eda-7a55-46cd-af29-62a72ee0f02d)

# 🔨 SkillsForge - Sistema de Gestión de Talleres

**SkillsForge** es una plataforma integral para la gestión y participación en talleres de formación profesional. Desarrollado con **Next.js** (frontend) y **Flask** (backend) con **MongoDB** como base de datos.

> 🎯 **Prototipo de Prueba**

## 📋 Tabla de Contenidos

- [🎯 Cumplimiento de Lineamientos](#-cumplimiento-de-lineamientos)
- [✨ Características](#-características)
- [🛠️ Tecnologías](#️-tecnologías)
- [🚀 Instalación](#-instalación)
- [⚙️ Configuración](#️-configuración)
- [📖 Uso](#-uso)
- [🛡️ Seguridad y Rate Limiting](#️-seguridad-y-rate-limiting)
- [🔌 API Endpoints](#-api-endpoints)
- [📁 Estructura del Proyecto](#-estructura-del-proyecto)
- [🚀 Despliegue](#-despliegue)
- [🔧 Solución de Problemas](#-solución-de-problemas)
- [📑 Documentación Técnica](docs/documentacion-tecnica.md)
- [🏗️ Arquitectura](docs/arquitectura.md)
- [🗄️ Base de Datos](docs/base-de-datos.md)
- [🔐 Seguridad y Rate Limiting](docs/seguridad-y-rate-limiting.md)
- [🔌 API Documentacion](docs/api-specification.md)
- [🚀 Despliegue](docs/despliegue.md)
- [📝 Requisitos Solicitados / Distribucion](docs/requisitos.md)

## 🎯 Cumplimiento de Lineamientos

#### ✅ **Gestión de Talleres de Formación Profesional**

| Requisito | Estado | Implementación | Código |
|-----------|--------|----------------|--------|
| **Ver lista de talleres** | ✅ Completo | Lista con nombre, fecha, hora, lugar y tipo | [`app/estudiantes/talleres/page.tsx`](app/estudiantes/talleres/page.tsx#L45-L75) |
| **Registrar un taller** (admin) | ✅ Completo | Formulario con todos los campos requeridos | [`components/formulario-taller.tsx`](components/formulario-taller.tsx#L25-L180) |
| **Modificar un taller** (admin) | ✅ Completo | Edición completa con validaciones | [`app/admin/page.tsx`](app/admin/page.tsx#L45-L65) |
| **Cancelar un taller** (admin) | ✅ Completo | Eliminación con confirmación | [`app/admin/page.tsx`](app/admin/page.tsx#L67-L75) |
| **Registrarse a un taller** (estudiante) | ✅ Completo | Inscripción con control de cupos | [`components/boton-inscripcion.tsx`](components/boton-inscripcion.tsx#L30-L65) |

#### ✅ **API RESTful - Endpoints Implementados**

| Endpoint | Método | Estado | Implementación | Código |
|----------|--------|--------|----------------|--------|
| `/workshops` | GET | ✅ Completo | Obtener todos los talleres | [`backend/app.py`](backend/app.py#L543-L604) |
| `/workshops/{id}` | GET | ✅ Completo | Obtener taller específico | [`backend/app.py`](backend/app.py#L605-L615) |
| `/workshops` | POST | ✅ Completo | Crear nuevo taller (admin) | [`backend/app.py`](backend/app.py#L616-L659) |
| `/workshops/{id}` | PUT | ✅ Completo | Modificar taller (admin) | [`backend/app.py`](backend/app.py#L660-L702) |
| `/workshops/{id}` | DELETE | ✅ Completo | Eliminar taller (admin) | [`backend/app.py`](backend/app.py#L703-L713) |
| `/workshops/{id}/register` | POST | ✅ Completo | Registrar estudiante | [`backend/app.py`](backend/app.py#L714-L748) |

#### ✅ **Interfaz Web - Componentes Funcionales**

| Componente | Estado | Descripción | Código |
|------------|--------|-------------|--------|
| **Portal Estudiantes** | ✅ Completo | Ver talleres y registrarse | [`app/estudiantes/talleres/page.tsx`](app/estudiantes/talleres/page.tsx) |
| **Panel Administradores** | ✅ Completo | Gestión completa de talleres | [`app/admin/page.tsx`](app/admin/page.tsx) |
| **Formularios React** | ✅ Completo | Crear/editar talleres | [`components/formulario-taller.tsx`](components/formulario-taller.tsx) |
| **Tablas React** | ✅ Completo | Listado de talleres | [`components/tabla-talleres.tsx`](components/tabla-talleres.tsx) |

### 🛠️ **Tecnologías Requeridas - Implementación**

| Tecnología | Estado | Versión | Implementación |
|------------|--------|---------|----------------|
| **Backend: Flask** | ✅ Completo | 3.0.3 | [`backend/app.py`](backend/app.py) |
| **Frontend: React** | ✅ Completo | Next.js 15 | [`app/`](app/) |
| **Base de datos: MongoDB** | ✅ Completo | 6.0 | [`docker-compose.yml`](docker-compose.yml#L4-L12) |
| **Autenticación: JWT** | ✅ Completo | PyJWT 2.9.0 | [`backend/app.py`](backend/app.py#L200-L350) |
| **Docker** | ✅ Completo | Docker Compose | [`docker-compose.yml`](docker-compose.yml) |
| **PyMongo** | ✅ Completo | 4.8.0 | [`backend/requirements.txt`](backend/requirements.txt#L2) |

### 🧪 **Extras Implementados**

| Extra | Estado | Descripción | Código | Comando |
|-------|--------|-------------|--------|---------|
| **Documentación Técnica** | ✅ Completo | Arquitectura, BD y despliegue | [`docs/documentacion-tecnica.md`](docs/documentacion-tecnica.md) | - |
| **Rate Limiting** | ✅ Completo | Protección anti-spam | [`backend/app.py:35-55`](backend/app.py#L35-L55) | - |
| **Refresh Tokens** | ✅ Completo | Renovación automática de tokens | [`backend/app.py:470-550`](backend/app.py#L470-L550) | - |

### 🔍 **Validación de Cumplimiento**

#### ✅ **Códigos de Estado HTTP Correctos**
- **200 OK**: Operaciones exitosas - [`backend/app.py:604`](backend/app.py#L604)
- **201 Created**: Recursos creados - [`backend/app.py:659`](backend/app.py#L659)
- **400 Bad Request**: Datos inválidos - [`backend/app.py:625`](backend/app.py#L625)
- **401 Unauthorized**: No autenticado - [`backend/app.py:210`](backend/app.py#L210)
- **403 Forbidden**: Sin permisos - [`backend/app.py:215`](backend/app.py#L215)
- **404 Not Found**: Recurso no encontrado - [`backend/app.py:880`](backend/app.py#L880)
- **409 Conflict**: Conflicto de recursos - [`backend/app.py:740`](backend/app.py#L740)
- **429 Too Many Requests**: Rate limit - [`backend/app.py:860`](backend/app.py#L860)

#### ✅ **Respuestas en JSON**
Todas las respuestas de la API están en formato JSON - [`backend/app.py:15`](backend/app.py#L15)

#### ✅ **Autenticación JWT con Roles**
- Administradores: [`backend/app.py:200-230`](backend/app.py#L200-L230)
- Estudiantes: [`backend/app.py:232-280`](backend/app.py#L232-L280)
- Refresh Tokens: [`backend/app.py:470-550`](backend/app.py#L470-L550)

### 🚀 **Funcionalidades Adicionales Implementadas**

#### ✅ **Tokens**
- **Backend**: Generación y validación - [`backend/app.py:470-550`](backend/app.py#L470-L550)
- **Cliente API**: Retry inteligente - [`lib/api.ts:80-120`](lib/api.ts#L80-L120)

#### ✅ **Rate Limiting**
- **Configuración**: Redis + Flask-Limiter - [`backend/app.py:35-55`](backend/app.py#L35-L55)
- **Límites por Endpoint**: Diferentes límites según uso - [`backend/app.py:543+`](backend/app.py#L543)
- **Manejo de Errores**: Respuestas 429 con retry-after - [`backend/app.py:860-870`](backend/app.py#L860-L870)

#### ✅ **Seguridad**
- **Headers de Seguridad**: X-Frame-Options, X-XSS-Protection - [`backend/app.py:850-860`](backend/app.py#L850-L860)
- **Validación de Entrada**: Sanitización y validación - [`backend/app.py:620-640`](backend/app.py#L620-L640)

#### ✅ **Cliente API Inteligente**
- **Retry Automático**: En rate limits y errores de red - [`lib/api.ts:45-80`](lib/api.ts#L45-L80)
- **Manejo de Tokens**: Renovación automática - [`lib/api.ts:120-150`](lib/api.ts#L120-L150)
- **Timeout Configurable**: Prevención de requests colgados - [`lib/api.ts:25-45`](lib/api.ts#L25-L45)

## ✨ Características

### 🎯 Cumplimiento de Requisitos Funcionales

#### ✅ Gestión de Talleres de Formación Profesional
- **Ver lista de talleres**: Lista completa con nombre, fecha, hora, lugar y tipo de actividad
- **Registrar un taller** (solo administradores): Crear talleres con todos los campos requeridos
- **Modificar un taller** (solo administradores): Editar detalles de talleres existentes
- **Cancelar un taller** (solo administradores): Eliminar talleres que no se realizarán
- **Registrarse a un taller** (solo estudiantes): Inscripción con validación de cupos

#### ✅ API RESTful Completa
- `GET /workshops` → Obtener todos los talleres disponibles
- `GET /workshops/{id}` → Obtener detalles de un taller específico
- `POST /workshops` → Crear un nuevo taller (solo administradores)
- `PUT /workshops/{id}` → Modificar un taller existente (solo administradores)
- `DELETE /workshops/{id}` → Eliminar un taller (solo administradores)
- `POST /workshops/{id}/register` → Registrar a un estudiante en un taller

#### ✅ Interfaz Web Funcional
- **Interfaz para estudiantes**: Ver talleres y registrarse
- **Panel para administradores**: Gestionar creación, edición y cancelación
- **Formularios y tablas**: Implementados con React y componentes reutilizables

### 🚀 Funcionalidades Implementadas

#### Para Estudiantes
- 📝 **Registro y autenticación** con validación de email
- 🔍 **Búsqueda y filtrado** avanzado por categoría, fecha y texto
- 📅 **Inscripción a talleres** con control de cupos en tiempo real
- 📊 **Panel personal** para gestionar inscripciones activas
- ❌ **Cancelación de inscripciones** con actualización automática

#### Para Administradores
- 🔐 **Panel de administración** con autenticación JWT segura
- ➕ **CRUD completo de talleres** (crear, leer, actualizar, eliminar)
- 👥 **Gestión de estudiantes** y visualización de inscripciones
- 📈 **Estadísticas del sistema** en tiempo real
- 📋 **Control de cupos** y validaciones de negocio

### 🛡️ Características de Seguridad y Rendimiento
- 🔒 **Autenticación JWT** con roles diferenciados (admin/estudiante)
- 🛡️ **Rate limiting** inteligente por endpoint y IP
- 🔄 **Cliente API robusto** con retry automático y manejo de errores
- 📱 **Diseño responsive** optimizado para móviles y desktop
- 🎨 **Interfaz moderna** con componentes accesibles
- 🐳 **Containerización completa** con Docker Compose
- 🗃️ **Base de datos optimizada** con índices y consultas eficientes

### 🧪 Extras Implementados
- 📚 **Documentación**: Arquitectura, base de datos y despliegue detallados
- 🔧 **Rate limiting**: Protección contra spam y ataques
- 🚀 **Cliente API inteligente**: Manejo automático de tokens y errores

## 🗄️ Diseño de Base de Datos

### Diagrama Entidad-Relación

```mermaid
erDiagram
    TALLERES {
        ObjectId _id PK "Clave primaria"
        string nombre "Nombre del taller"
        string descripcion "Descripción detallada"
        string fecha "Fecha en formato YYYY-MM-DD"
        string hora "Hora en formato HH:MM"
        string lugar "Ubicación física"
        string categoria "Categoría del taller"
        string tipo "Tipo de actividad"
        string instructor "Nombre del instructor"
        float rating "Calificación 0.0-5.0"
        int cupo "Capacidad máxima"
        string creado_en "Timestamp ISO 8601"
        string actualizado_en "Timestamp ISO 8601"
        array inscripciones "Subdocumentos embebidos"
    }
    
    ESTUDIANTES {
        ObjectId _id PK "Clave primaria"
        string nombre "Nombre completo"
        string email UK "Email único"
        string hash "Hash bcrypt contraseña"
        string creado_en "Timestamp ISO 8601"
    }
    
    INSCRIPCIONES {
        string estudiante_id FK "Referencia a ESTUDIANTES._id"
        string nombre "Nombre del estudiante (desnormalizado)"
        string email "Email del estudiante (desnormalizado)"
        string registrado_en "Timestamp de inscripción"
    }
    
    TALLERES ||--o{ INSCRIPCIONES : "contiene"
    ESTUDIANTES ||--o{ INSCRIPCIONES : "se_inscribe_en"
```

### Estructura Detallada de Colecciones

#### 📚 Colección: `talleres`

| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| `_id` | ObjectId | **PK**, Auto-generado | Identificador único del taller |
| `nombre` | String | Requerido, 1-200 chars | Nombre descriptivo del taller |
| `descripcion` | String | Requerido, 1-1000 chars | Descripción detallada del contenido |
| `fecha` | String | Requerido, formato YYYY-MM-DD | Fecha de realización |
| `hora` | String | Requerido, formato HH:MM | Hora de inicio |
| `lugar` | String | Requerido, 1-100 chars | Ubicación física o virtual |
| `categoria` | String | Requerido | tecnologia, emprendimiento, habilidades-blandas |
| `tipo` | String | Requerido | curso técnico, capacitacion, programa |
| `instructor` | String | Opcional, 1-100 chars | Nombre del instructor asignado |
| `rating` | Float | Opcional, 0.0-5.0 | Calificación promedio del taller |
| `cupo` | Integer | Requerido, ≥ 0 | Capacidad máxima de estudiantes |
| `creado_en` | String | Auto-generado, ISO 8601 | Timestamp de creación |
| `actualizado_en` | String | Auto-actualizado, ISO 8601 | Timestamp de última modificación |
| `inscripciones` | Array | Subdocumentos embebidos | Lista de estudiantes inscritos |

#### 👥 Colección: `estudiantes`

| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| `_id` | ObjectId | **PK**, Auto-generado | Identificador único del estudiante |
| `nombre` | String | Requerido, 1-100 chars | Nombre completo del estudiante |
| `email` | String | **UK**, Requerido, formato email | Correo electrónico único |
| `hash` | String | Requerido, bcrypt | Hash seguro de la contraseña |
| `creado_en` | String | Auto-generado, ISO 8601 | Timestamp de registro |

#### 📝 Subdocumento: `inscripciones` (embebido en talleres)

| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| `estudiante_id` | String | **FK** → estudiantes._id | Referencia al estudiante |
| `nombre` | String | Desnormalizado | Nombre del estudiante (cache) |
| `email` | String | Desnormalizado | Email del estudiante (cache) |
| `registrado_en` | String | Auto-generado, ISO 8601 | Timestamp de inscripción |

### Índices de Base de Datos

#### 🔍 Índices Implementados

```javascript
// Índices para optimización de consultas
db.talleres.createIndex({ "fecha": 1, "hora": 1 })        // Búsquedas por fecha/hora
db.talleres.createIndex({ "categoria": 1 })               // Filtros por categoría  
db.talleres.createIndex({ "rating": -1 })                 // Ordenamiento por rating
db.talleres.createIndex({ "creado_en": -1 })             // Talleres más recientes

db.estudiantes.createIndex({ "email": 1 }, { unique: true })  // Email único
db.estudiantes.createIndex({ "creado_en": -1 })              // Estudiantes más recientes
```

#### 📊 Rendimiento de Consultas

| Consulta | Índice Utilizado | Complejidad |
|----------|------------------|-------------|
| Listar talleres por fecha | `fecha_1_hora_1` | O(log n) |
| Filtrar por categoría | `categoria_1` | O(log n) |
| Talleres mejor valorados | `rating_-1` | O(log n) |
| Buscar estudiante por email | `email_1` | O(log n) |
| Verificar inscripción | Scan del array | O(m) donde m = inscripciones |

### Relaciones y Integridad

#### 🔗 Tipos de Relaciones

1. **Talleres ↔ Estudiantes**: Relación **Many-to-Many**
   - Implementada mediante subdocumentos embebidos
   - Desnormalización intencional para optimizar consultas
   - Referencia por `estudiante_id` para mantener integridad

2. **Integridad Referencial**:
   - **Cascada en eliminación**: Al eliminar estudiante, se remueven sus inscripciones
   - **Validación de existencia**: Verificación de estudiante antes de inscripción
   - **Control de cupos**: Validación de capacidad antes de permitir inscripción

#### 📐 Decisiones de Diseño

**¿Por qué subdocumentos embebidos?**
- ✅ **Rendimiento**: Una sola consulta obtiene taller + inscripciones
- ✅ **Atomicidad**: Inscripción y actualización de cupo en una operación
- ✅ **Simplicidad**: No requiere JOINs complejos
- ❌ **Limitación**: Máximo 16MB por documento (no problemático con cupos típicos)

**¿Por qué desnormalización?**
- ✅ **Velocidad**: Evita consultas adicionales para mostrar nombres
- ✅ **Consistencia**: Datos históricos se mantienen aunque cambie el estudiante
- ❌ **Redundancia**: Duplicación controlada de datos

### Ejemplo de Documentos

#### 📄 Documento de Taller Completo

```json
{
  "_id": ObjectId("507f1f77bcf86cd799439011"),
  "nombre": "Introducción a Python",
  "descripcion": "Curso básico de programación en Python para principiantes",
  "fecha": "2024-03-15",
  "hora": "10:00",
  "lugar": "Aula 101",
  "categoria": "tecnologia",
  "tipo": "curso técnico",
  "instructor": "Ana García",
  "rating": 4.8,
  "cupo": 25,
  "creado_en": "2024-01-15T10:30:00.000Z",
  "actualizado_en": "2024-01-16T14:20:00.000Z",
  "inscripciones": [
    {
      "estudiante_id": "507f1f77bcf86cd799439012",
      "nombre": "Juan Pérez",
      "email": "juan@email.com",
      "registrado_en": "2024-01-16T09:15:00.000Z"
    },
    {
      "estudiante_id": "507f1f77bcf86cd799439013", 
      "nombre": "María López",
      "email": "maria@email.com",
      "registrado_en": "2024-01-16T11:30:00.000Z"
    }
  ]
}
```

#### 👤 Documento de Estudiante

```json
{
  "_id": ObjectId("507f1f77bcf86cd799439012"),
  "nombre": "Juan Pérez",
  "email": "juan@email.com",
  "hash": "$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.s5uDfS",
  "creado_en": "2024-01-15T08:00:00.000Z"
}
```

## 🛠️ Tecnologías

### Frontend
- **Next.js 15** - Framework React con App Router
- **TypeScript** - Tipado estático
- **Tailwind CSS** - Framework CSS utilitario
- **Radix UI** - Componentes accesibles
- **React Hook Form** - Gestión de formularios
- **Zod** - Validación de esquemas

### Backend
- **Flask 3.0** - Framework web Python
- **MongoDB** - Base de datos NoSQL
- **Redis** - Cache y rate limiting
- **PyMongo** - Driver MongoDB para Python
- **PyJWT** - Manejo de tokens JWT
- **Flask-CORS** - Soporte CORS
- **Flask-Limiter** - Rate limiting
- **Werkzeug** - Utilidades de seguridad

### DevOps
- **Docker & Docker Compose** - Containerización
- **Mongo Express** - Interfaz web para MongoDB

## 🚀 Instalación

### Prerrequisitos
- **Node.js** 18+ y **npm/pnpm**
- **Docker** y **Docker Compose**
- **Python** 3.9+ (para desarrollo local del backend)

### Instalación Rápida con Docker

1. **Clonar el repositorio**
```bash
git clone https://github.com/Venganza-de-Python-II/Proyecto-Final
cd proyecto-final
```

2. **Levantar servicios con Docker**
```bash
docker compose up -d --build
```

3. **Instalar dependencias del frontend**
```bash
npm install
# o
pnpm install
```

4. **Iniciar el frontend**
```bash
npm run dev
# o
pnpm dev
```

### Instalación para Desarrollo

#### Backend (Desarrollo Local)
```bash
cd backend
python -m venv venv
source venv/bin/activate  # En Windows: venv\Scripts\activate
pip install -r requirements.txt

# Configurar variables de entorno
export FLASK_ENV=development
export JWT_SECRET=tu-secreto-jwt
export ADMIN_USER=admin
export ADMIN_PASSWORD=admin123
export MONGO_URI=mongodb://admin:admin123@localhost:27017/?authSource=admin
export MONGO_DB_NAME=talleresdb

python app.py
```

#### Frontend
```bash
npm install
npm run dev
```

## ⚙️ Configuración

### Variables de Entorno

#### Backend (`backend/.env`)
```env
FLASK_ENV=development
JWT_SECRET=supersecreto-cambiar-en-produccion
ADMIN_USER=admin
ADMIN_PASSWORD=admin123
MONGO_URI=mongodb://admin:admin123@localhost:27017/?authSource=admin
MONGO_DB_NAME=talleresdb
CORS_ORIGINS=*
```

#### Frontend (`.env.local`)
```env
NEXT_PUBLIC_API_URL=http://localhost:5001
```

### Puertos por Defecto
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5001
- **MongoDB**: localhost:27017
- **Redis**: localhost:6379
- **Mongo Express**: http://localhost:8081

## 📖 Uso

### Acceso al Sistema

#### Como Estudiante
1. Ir a http://localhost:3000
2. Registrarse en `/estudiantes/registro`
3. Iniciar sesión en `/estudiantes/login`
4. Explorar talleres en `/estudiantes/talleres`
5. Ver inscripciones en `/estudiantes/mis-registros`

#### Como Administrador
1. Ir a http://localhost:3000/admin/login
2. Usar credenciales: `admin` / `admin123`
3. Gestionar talleres y estudiantes desde el panel

### Flujo de Trabajo Típico

1. **Administrador crea talleres** con información detallada
2. **Estudiantes se registran** en el sistema
3. **Estudiantes buscan y se inscriben** a talleres
4. **Administrador monitorea** inscripciones y estadísticas

## 🛡️ Seguridad y Rate Limiting

### Funcionalidades de Seguridad

- **Rate Limiting**: Límites por IP y endpoint para prevenir spam
- **Authorization Headers**: Validación de tokens JWT en formato Bearer
- **Headers de Seguridad**: X-Content-Type-Options, X-Frame-Options, etc.
- **Validación de Tokens**: Verificación de expiración e integridad
- **Retry Automático**: Manejo inteligente de rate limits

### Límites de Rate Limiting

| Endpoint | Límite | Descripción |
|----------|--------|-------------|
| `/auth/login` | 5/min | Login de administrador |
| `/auth/estudiantes/login` | 10/min | Login de estudiante |
| `/auth/estudiantes/registro` | 3/min | Registro de estudiante |
| `/workshops` | 60/min | Listar talleres |
| `/workshops/{id}` | 30/min | Ver taller específico |
| `/workshops/{id}/register` | 10/min | Inscribirse/desinscribirse |
| `/stats` | 20/min | Estadísticas |
| `/health` | 60/min | Health check |
| **Global** | 100/hora | Límite por IP |

### Headers de Autenticación

```http
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

### Configuración de Seguridad

```env
# Rate Limiting
REDIS_URL=redis://localhost:6379
RATELIMIT_DEFAULT=100 per hour
```

## 🔌 API Endpoints

### Autenticación

#### Administrador
```http
POST /auth/login
Content-Type: application/json

{
  "usuario": "admin",
  "contrasena": "admin123"
}
```

#### Estudiantes
```http
# Registro
POST /auth/estudiantes/registro
Content-Type: application/json

{
  "nombre": "Juan Pérez",
  "email": "juan@email.com",
  "contrasena": "password123"
}

# Login
POST /auth/estudiantes/login
Content-Type: application/json

{
  "email": "juan@email.com",
  "contrasena": "password123"
}

# Perfil
GET /auth/estudiantes/me
Authorization: Bearer <token>
```

### Talleres

```http
# Listar talleres (público)
GET /workshops?q=python&categoria=tecnologia&limit=10

# Obtener taller específico
GET /workshops/{id}

# Crear taller (admin)
POST /workshops
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "nombre": "Introducción a Python",
  "descripcion": "Curso básico de Python",
  "fecha": "2024-03-15",
  "hora": "10:00",
  "lugar": "Aula 101",
  "categoria": "tecnologia",
  "tipo": "curso técnico",
  "instructor": "Ana García",
  "cupo": 25
}

# Actualizar taller (admin)
PUT /workshops/{id}
Authorization: Bearer <admin-token>

# Eliminar taller (admin)
DELETE /workshops/{id}
Authorization: Bearer <admin-token>
```

### Inscripciones

```http
# Inscribirse a taller
POST /workshops/{id}/register
Authorization: Bearer <student-token>

# Cancelar inscripción
DELETE /workshops/{id}/register
Authorization: Bearer <student-token>

# Ver mis inscripciones
GET /registrations/me
Authorization: Bearer <student-token>
```

### Utilidades

```http
# Estadísticas del sistema
GET /stats

# Categorías disponibles
GET /categories

# Estado de salud
GET /health

# Especificación OpenAPI
GET /openapi.json
```

## 📁 Estructura del Proyecto

```
talleres-formacion-pro/
├── app/                          # Páginas Next.js (App Router)
│   ├── admin/                    # Panel de administración
│   ├── estudiantes/              # Páginas de estudiantes
│   ├── globals.css               # Estilos globales
│   ├── layout.tsx                # Layout principal
│   └── page.tsx                  # Página de inicio
├── backend/                      # API Flask
│   ├── app.py                    # Aplicación principal
│   ├── config.py                 # Configuración
│   ├── Dockerfile                # Imagen Docker
│   └── requirements.txt          # Dependencias Python
├── components/                   # Componentes React
│   ├── ui/                       # Componentes base (Radix UI)
│   ├── boton-inscripcion.tsx     # Botón de inscripción
│   ├── filtros-talleres.tsx      # Filtros de búsqueda
│   ├── formulario-taller.tsx     # Formulario de talleres
│   ├── navbar.tsx                # Barra de navegación
│   └── tabla-talleres.tsx        # Tabla de talleres
├── hooks/                        # Hooks personalizados
├── lib/                          # Utilidades
│   ├── api.ts                    # Cliente API
│   └── utils.ts                  # Funciones utilitarias
├── public/                       # Archivos estáticos
├── docker-compose.yml            # Configuración Docker
├── package.json                  # Dependencias Node.js
├── types.ts                      # Tipos TypeScript
└── README.md                     # Este archivo
```

## 🐳 Despliegue

### Desarrollo Local
```bash
# Levantar todos los servicios
docker compose up -d --build

# Ver logs
docker compose logs -f

# Parar servicios
docker compose down
```

### Producción

#### Variables de Entorno de Producción
```env
FLASK_ENV=production
JWT_SECRET=clave-super-secreta-de-produccion
ADMIN_PASSWORD=contraseña-segura
MONGO_URI=mongodb://usuario:password@host:puerto/database
CORS_ORIGINS=https://tu-dominio.com
```

#### Docker en Producción
```bash
# Construir imágenes
docker compose -f docker-compose.prod.yml build

# Desplegar
docker compose -f docker-compose.prod.yml up -d

# Configurar proxy reverso (nginx)
# Configurar SSL/TLS
# Configurar backups de MongoDB
```

## 🔧 Solución de Problemas

### Problemas Comunes

#### Puertos Ocupados

**Síntomas**: Error "port already in use" o "EADDRINUSE"

**Solución automática**:
```bash
# Opción 1: Script de setup (incluye limpieza)
./scripts/setup.sh      # Linux/Mac
scripts\setup.bat       # Windows

# Opción 2: Script específico de limpieza
./scripts/cleanup-ports.sh    # Linux/Mac
scripts\cleanup-ports.bat    # Windows
```

**Solución manual**:

**Windows**:
```cmd
# Ver procesos usando puertos
netstat -ano | findstr :5001
netstat -ano | findstr :3000

# Matar proceso por PID
taskkill /PID <PID> /F
```

**Linux/Mac**:
```bash
# Ver procesos usando puertos  
lsof -ti:5001
lsof -ti:3000

# Matar procesos
kill -9 $(lsof -ti:5001)
kill -9 $(lsof -ti:3000)
```

**Puertos utilizados por SkillsForge**:
- **3000**: Frontend Next.js
- **5001**: API Flask
- **27017**: MongoDB
- **6379**: Redis
- **8081**: Mongo Express (admin)

#### Error de Conexión a MongoDB
```bash
# Verificar que MongoDB esté corriendo
docker ps | grep mongo

# Reiniciar servicios
docker compose restart mongo api

# Ver logs de MongoDB
docker compose logs mongo
```

#### Error de CORS
- Verificar que `CORS_ORIGINS` esté configurado correctamente
- En desarrollo usar `CORS_ORIGINS=*`
- En producción especificar dominios exactos

#### Puerto 5000 en Uso
El proyecto usa el puerto 5001 por defecto. Si necesitas cambiarlo:
```yaml
# docker-compose.yml
ports:
  - "PUERTO_DESEADO:5000"
```

#### Problemas de Autenticación
- Verificar que `JWT_SECRET` sea consistente
- Comprobar que los tokens no hayan expirado (8 horas por defecto)
- Verificar headers de autorización: `Bearer <token>`

### Logs y Debugging

```bash
# Ver logs del backend
docker compose logs -f api

# Ver logs de MongoDB
docker compose logs -f mongo

# Acceder al contenedor del backend
docker exec -it api-talleres bash

# Verificar base de datos
# Ir a http://localhost:8081 (Mongo Express)
```

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 👥 Grupo

<table>
  <tr>
    <td>
      <strong>✅ Base de Datos (MongoDB)</strong><br>
      <ul>
        <li>Alec</li>
        <li>Gil</li>
        <li>Carlos Callejas</li>
      </ul>
    </td>
    <td>
      <strong>✅ Diagramas de Base de Datos</strong><br>
      <ul>
        <li>Aaron</li>
        <li>Raul</li>
      </ul>
    </td>
    <td>
      <strong>✅ Frontend</strong><br>
      <ul>
        <li>Ana</li>
        <li>Sofia</li>
        <li>Daniela</li>
      </ul>
    </td>
  </tr>
  <tr>
    <td>
      <strong>✅ Backend</strong><br>
      <ul>
        <li>Franklin</li>
        <li>Euris</li>
        <li>Stewart</li>
      </ul>
    </td>
    <td>
      <strong>✅ Docker</strong><br>
      <ul>
        <li>Diego</li>
      </ul>
    </td>
    <td>
      <strong>✅ Documentación del Código</strong><br>
      <ul>
        <li>Alonso</li>
        <li>Abel</li>
      </ul>
    </td>
  </tr>
  <tr>
    <td>
      <strong>✅ README.md</strong><br>
      <ul>
        <li>Veronica</li>
        <li>Carlos Contreras</li>
      </ul>
    </td>
    <td>
      <strong>✅ Autenticación con JWT</strong><br>
      <ul>
        <li>Daniel</li>
        <li>Esteban</li>
        <li>Emilio</li>
      </ul>
    </td>
  </tr>
</table>

## 🙏 Agradecimientos

- Radix UI por los componentes accesibles
- Tailwind CSS por el framework CSS
- Flask y Next.js por los frameworks base
