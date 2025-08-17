<img width="1454" height="518" alt="image" src="https://github.com/user-attachments/assets/b2f17080-af80-409f-88ca-64fa8c1f1620" />

# Especificación de API - SkillForge

## Información General

- **URL Base**: `http://localhost:5001`
- **Versión**: 1.0.0
- **Formato**: JSON
- **Autenticación**: JWT Bearer Token
- **CORS**: Configurado para desarrollo y producción

## Autenticación

### Tipos de Usuario

1. **Administrador**: Acceso completo al sistema
2. **Estudiante**: Acceso a talleres e inscripciones propias
3. **Público**: Acceso de solo lectura a talleres

### Formato de Token JWT

```json
{
  "sub": "user_id",
  "rol": "admin|estudiante", 
  "email": "user@email.com",
  "nombre": "Nombre Usuario",
  "exp": 1640995200
}
```

### Headers de Autenticación

```http
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

## Endpoints de Autenticación

### POST /auth/login
Autenticación de administrador

**Request:**
```http
POST /auth/login
Content-Type: application/json

{
  "usuario": "admin",
  "contrasena": "admin123"
}
```

**Response 200:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expira_en": 1640995200
}
```

**Response 401:**
```json
{
  "mensaje": "Credenciales inválidas"
}
```

### POST /auth/estudiantes/registro
Registro de nuevo estudiante

**Request:**
```http
POST /auth/estudiantes/registro
Content-Type: application/json

{
  "nombre": "Juan Pérez",
  "email": "juan@email.com", 
  "contrasena": "password123"
}
```

**Response 201:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "estudiante": {
    "_id": "65a1b2c3d4e5f6789012345",
    "nombre": "Juan Pérez",
    "email": "juan@email.com",
    "creado_en": "2024-01-15T10:30:00.000Z"
  }
}
```

**Response 400:**
```json
{
  "mensaje": "Nombre, email y contraseña son requeridos"
}
```

**Response 409:**
```json
{
  "mensaje": "El email ya está registrado"
}
```

### POST /auth/estudiantes/login
Autenticación de estudiante

**Request:**
```http
POST /auth/estudiantes/login
Content-Type: application/json

{
  "email": "juan@email.com",
  "contrasena": "password123"
}
```

**Response 200:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "estudiante": {
    "_id": "65a1b2c3d4e5f6789012345",
    "nombre": "Juan Pérez", 
    "email": "juan@email.com",
    "creado_en": "2024-01-15T10:30:00.000Z"
  }
}
```

### GET /auth/estudiantes/me
Obtener perfil del estudiante autenticado

**Request:**
```http
GET /auth/estudiantes/me
Authorization: Bearer <student_token>
```

**Response 200:**
```json
{
  "_id": "65a1b2c3d4e5f6789012345",
  "nombre": "Juan Pérez",
  "email": "juan@email.com", 
  "creado_en": "2024-01-15T10:30:00.000Z"
}
```

## Endpoints de Talleres

### GET /workshops
Listar talleres con filtros opcionales

**Parámetros de Query:**
- `q` (string): Búsqueda de texto en nombre, descripción, lugar, instructor
- `categoria` (string): Filtrar por categoría específica
- `fechaDesde` (string): Fecha mínima (YYYY-MM-DD)
- `fechaHasta` (string): Fecha máxima (YYYY-MM-DD)  
- `sort` (string): Campo de ordenamiento (`fecha`, `rating`, `creado_en`)
- `order` (string): Dirección (`asc`, `desc`)
- `limit` (number): Límite de resultados

**Request:**
```http
GET /workshops?q=python&categoria=tecnologia&sort=fecha&order=asc&limit=10
```

**Response 200:**
```json
[
  {
    "_id": "65a1b2c3d4e5f6789012347",
    "nombre": "Introducción a Python",
    "descripcion": "Curso básico de programación en Python",
    "fecha": "2024-03-15",
    "hora": "10:00",
    "lugar": "Aula 101",
    "categoria": "tecnologia", 
    "tipo": "curso técnico",
    "instructor": "Ana García",
    "rating": 4.8,
    "cupo": 25,
    "cupos_disponibles": 18,
    "creado_en": "2024-01-15T10:30:00.000Z",
    "actualizado_en": null,
    "inscripciones": [
      {
        "estudiante_id": "65a1b2c3d4e5f6789012345",
        "nombre": "Juan Pérez",
        "email": "juan@email.com",
        "registrado_en": "2024-02-10T09:15:00.000Z"
      }
    ]
  }
]
```

### GET /workshops/{id}
Obtener detalles de un taller específico

**Request:**
```http
GET /workshops/65a1b2c3d4e5f6789012347
```

**Response 200:**
```json
{
  "_id": "65a1b2c3d4e5f6789012347",
  "nombre": "Introducción a Python",
  "descripcion": "Curso básico de programación en Python para principiantes. Aprenderás variables, estructuras de control, funciones y más.",
  "fecha": "2024-03-15",
  "hora": "10:00", 
  "lugar": "Aula 101 - Edificio Tecnología",
  "categoria": "tecnologia",
  "tipo": "curso técnico",
  "instructor": "Ana García Pérez",
  "rating": 4.8,
  "cupo": 25,
  "cupos_disponibles": 18,
  "creado_en": "2024-01-15T10:30:00.000Z",
  "actualizado_en": "2024-02-01T14:20:00.000Z",
  "inscripciones": [...]
}
```

**Response 404:**
```json
{
  "mensaje": "Taller no encontrado"
}
```

### POST /workshops
Crear nuevo taller (solo administradores)

**Request:**
```http
POST /workshops
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "nombre": "JavaScript Avanzado",
  "descripcion": "Conceptos avanzados de JavaScript: closures, promises, async/await",
  "fecha": "2024-04-20",
  "hora": "14:00",
  "lugar": "Laboratorio 3",
  "categoria": "tecnologia",
  "tipo": "curso técnico", 
  "instructor": "Carlos Ruiz",
  "rating": 4.5,
  "cupo": 20
}
```

**Response 201:**
```json
{
  "_id": "65a1b2c3d4e5f6789012348",
  "nombre": "JavaScript Avanzado",
  "descripcion": "Conceptos avanzados de JavaScript: closures, promises, async/await",
  "fecha": "2024-04-20",
  "hora": "14:00",
  "lugar": "Laboratorio 3", 
  "categoria": "tecnologia",
  "tipo": "curso técnico",
  "instructor": "Carlos Ruiz",
  "rating": 4.5,
  "cupo": 20,
  "cupos_disponibles": 20,
  "creado_en": "2024-02-15T11:45:00.000Z",
  "actualizado_en": null,
  "inscripciones": []
}
```

**Response 400:**
```json
{
  "mensaje": "Campos faltantes",
  "campos": ["nombre", "descripcion", "fecha"]
}
```

### PUT /workshops/{id}
Actualizar taller existente (solo administradores)

**Request:**
```http
PUT /workshops/65a1b2c3d4e5f6789012348
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "nombre": "JavaScript Avanzado - Actualizado",
  "cupo": 30,
  "rating": 4.7
}
```

**Response 200:**
```json
{
  "_id": "65a1b2c3d4e5f6789012348",
  "nombre": "JavaScript Avanzado - Actualizado",
  "descripcion": "Conceptos avanzados de JavaScript: closures, promises, async/await",
  "fecha": "2024-04-20",
  "hora": "14:00",
  "lugar": "Laboratorio 3",
  "categoria": "tecnologia", 
  "tipo": "curso técnico",
  "instructor": "Carlos Ruiz",
  "rating": 4.7,
  "cupo": 30,
  "cupos_disponibles": 30,
  "creado_en": "2024-02-15T11:45:00.000Z",
  "actualizado_en": "2024-02-20T16:30:00.000Z",
  "inscripciones": []
}
```

### DELETE /workshops/{id}
Eliminar taller (solo administradores)

**Request:**
```http
DELETE /workshops/65a1b2c3d4e5f6789012348
Authorization: Bearer <admin_token>
```

**Response 200:**
```json
{
  "mensaje": "Taller eliminado"
}
```

## Endpoints de Inscripciones

### POST /workshops/{id}/register
Inscribirse a un taller (solo estudiantes)

**Request:**
```http
POST /workshops/65a1b2c3d4e5f6789012347/register
Authorization: Bearer <student_token>
```

**Response 201:**
```json
{
  "_id": "65a1b2c3d4e5f6789012347",
  "nombre": "Introducción a Python",
  "descripcion": "Curso básico de programación en Python",
  "fecha": "2024-03-15",
  "hora": "10:00",
  "lugar": "Aula 101",
  "categoria": "tecnologia",
  "tipo": "curso técnico", 
  "instructor": "Ana García",
  "rating": 4.8,
  "cupo": 25,
  "cupos_disponibles": 17,
  "creado_en": "2024-01-15T10:30:00.000Z",
  "actualizado_en": null,
  "inscripciones": [
    {
      "estudiante_id": "65a1b2c3d4e5f6789012345",
      "nombre": "Juan Pérez",
      "email": "juan@email.com", 
      "registrado_en": "2024-02-20T10:15:00.000Z"
    }
  ]
}
```

**Response 409:**
```json
{
  "mensaje": "Cupo lleno"
}
```

**Response 409:**
```json
{
  "mensaje": "Ya estás inscrito en este taller"
}
```

### DELETE /workshops/{id}/register
Cancelar inscripción a un taller (solo estudiantes)

**Request:**
```http
DELETE /workshops/65a1b2c3d4e5f6789012347/register
Authorization: Bearer <student_token>
```

**Response 200:**
```json
{
  "_id": "65a1b2c3d4e5f6789012347",
  "nombre": "Introducción a Python",
  "descripcion": "Curso básico de programación en Python",
  "fecha": "2024-03-15",
  "hora": "10:00",
  "lugar": "Aula 101",
  "categoria": "tecnologia",
  "tipo": "curso técnico",
  "instructor": "Ana García", 
  "rating": 4.8,
  "cupo": 25,
  "cupos_disponibles": 18,
  "creado_en": "2024-01-15T10:30:00.000Z",
  "actualizado_en": null,
  "inscripciones": []
}
```

### GET /registrations/me
Obtener inscripciones del estudiante autenticado

**Request:**
```http
GET /registrations/me
Authorization: Bearer <student_token>
```

**Response 200:**
```json
[
  {
    "_id": "65a1b2c3d4e5f6789012347",
    "nombre": "Introducción a Python",
    "descripcion": "Curso básico de programación en Python",
    "fecha": "2024-03-15",
    "hora": "10:00",
    "lugar": "Aula 101",
    "categoria": "tecnologia",
    "tipo": "curso técnico",
    "instructor": "Ana García",
    "rating": 4.8,
    "cupo": 25,
    "cupos_disponibles": 17,
    "creado_en": "2024-01-15T10:30:00.000Z",
    "actualizado_en": null,
    "inscripciones": [
      {
        "estudiante_id": "65a1b2c3d4e5f6789012345",
        "nombre": "Juan Pérez",
        "email": "juan@email.com",
        "registrado_en": "2024-02-20T10:15:00.000Z"
      }
    ]
  }
]
```

## Endpoints de Gestión de Estudiantes

### GET /students
Listar estudiantes (solo administradores)

**Parámetros de Query:**
- `q` (string): Búsqueda por nombre o email

**Request:**
```http
GET /students?q=juan
Authorization: Bearer <admin_token>
```

**Response 200:**
```json
[
  {
    "_id": "65a1b2c3d4e5f6789012345",
    "nombre": "Juan Pérez",
    "email": "juan@email.com",
    "creado_en": "2024-01-15T10:30:00.000Z"
  }
]
```

### GET /students/{id}
Obtener detalles de un estudiante (solo administradores)

**Request:**
```http
GET /students/65a1b2c3d4e5f6789012345
Authorization: Bearer <admin_token>
```

**Response 200:**
```json
{
  "_id": "65a1b2c3d4e5f6789012345",
  "nombre": "Juan Pérez López",
  "email": "juan@email.com",
  "creado_en": "2024-01-15T10:30:00.000Z"
}
```

### PUT /students/{id}
Actualizar información de estudiante (solo administradores)

**Request:**
```http
PUT /students/65a1b2c3d4e5f6789012345
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "nombre": "Juan Carlos Pérez",
  "email": "juan.carlos@email.com"
}
```

**Response 200:**
```json
{
  "_id": "65a1b2c3d4e5f6789012345",
  "nombre": "Juan Carlos Pérez",
  "email": "juan.carlos@email.com", 
  "creado_en": "2024-01-15T10:30:00.000Z"
}
```

### DELETE /students/{id}
Eliminar estudiante (solo administradores)

**Request:**
```http
DELETE /students/65a1b2c3d4e5f6789012345
Authorization: Bearer <admin_token>
```

**Response 200:**
```json
{
  "mensaje": "Estudiante eliminado"
}
```

## Endpoints Utilitarios

### GET /stats
Obtener estadísticas del sistema

**Request:**
```http
GET /stats
```

**Response 200:**
```json
{
  "talleres": 45,
  "estudiantes": 128,
  "registros": 267
}
```

### GET /categories
Obtener categorías de talleres disponibles

**Request:**
```http
GET /categories
```

**Response 200:**
```json
[
  "certificaciones",
  "habilidades-blandas", 
  "idiomas",
  "tecnologia"
]
```

### GET /health
Verificación de salud del sistema

**Request:**
```http
GET /health
```

**Response 200:**
```json
{
  "ok": true
}
```

### GET /openapi.json
Especificación OpenAPI del sistema

**Request:**
```http
GET /openapi.json
```

**Response 200:**
```json
{
  "openapi": "3.0.0",
  "info": {
    "title": "API Talleres",
    "version": "1.0.0"
  },
  "paths": {
    "/workshops": {"get": {}, "post": {}},
    "/workshops/{id}": {"get": {}, "put": {}, "delete": {}},
    "...": "..."
  }
}
```

### GET /
Información general de la API

**Request:**
```http
GET /
```

**Response 200:**
```json
{
  "message": "API Talleres - Backend funcionando",
  "version": "1.0.0",
  "endpoints": {
    "health": "/health",
    "workshops": "/workshops", 
    "auth": "/auth/login",
    "stats": "/stats",
    "categories": "/categories",
    "openapi": "/openapi.json"
  }
}
```

## Códigos de Estado HTTP

### Códigos de Éxito
- **200 OK**: Operación exitosa
- **201 Created**: Recurso creado exitosamente

### Códigos de Error del Cliente
- **400 Bad Request**: Datos de entrada inválidos
- **401 Unauthorized**: Autenticación requerida o token inválido
- **403 Forbidden**: Permisos insuficientes
- **404 Not Found**: Recurso no encontrado
- **409 Conflict**: Conflicto (email duplicado, cupo lleno, etc.)

### Códigos de Error del Servidor
- **500 Internal Server Error**: Error interno del servidor

## Formato de Errores

Todos los errores siguen el mismo formato:

```json
{
  "mensaje": "Descripción del error",
  "campos": ["campo1", "campo2"],  // Opcional: campos con errores
  "codigo": "ERROR_CODE"           // Opcional: código de error específico
}
```

### Ejemplos de Errores Comunes

**Campos faltantes:**
```json
{
  "mensaje": "Campos faltantes",
  "campos": ["nombre", "email"]
}
```

**Token expirado:**
```json
{
  "mensaje": "Sesión expirada"
}
```

**Recurso no encontrado:**
```json
{
  "mensaje": "Taller no encontrado"
}
```

**Conflicto de datos:**
```json
{
  "mensaje": "El email ya está registrado"
}
```

## Límites y Restricciones

### Límites de Rate Limiting
- **Público**: 100 requests/minuto
- **Autenticado**: 1000 requests/minuto
- **Admin**: Sin límite

### Límites de Datos
- **Tamaño máximo de request**: 1MB
- **Longitud máxima de strings**: 1000 caracteres
- **Límite de resultados por defecto**: 50 items

### Restricciones de Negocio
- **Cupo mínimo de taller**: 1 persona
- **Cupo máximo de taller**: 1000 personas
- **Inscripciones por estudiante**: Sin límite
- **Duración de token JWT**: 8 horas

## Versionado de API

La API actualmente está en la versión 1.0.0. Futuras versiones mantendrán compatibilidad hacia atrás o se indicará claramente en la URL:

- **v1**: `/api/v1/workshops` (actual: sin prefijo)
- **v2**: `/api/v2/workshops` (futuro)

## Ejemplos de Uso con cURL

### Registro y Login de Estudiante
```bash
# Registro
curl -X POST http://localhost:5001/auth/estudiantes/registro \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "María González",
    "email": "maria@email.com",
    "contrasena": "password123"
  }'

# Login
curl -X POST http://localhost:5001/auth/estudiantes/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "maria@email.com", 
    "contrasena": "password123"
  }'
```

### Búsqueda de Talleres
```bash
# Buscar talleres de tecnología
curl "http://localhost:5001/workshops?categoria=tecnologia&limit=5"

# Buscar talleres con texto
curl "http://localhost:5001/workshops?q=python&sort=rating&order=desc"
```

### Inscripción a Taller
```bash
# Inscribirse (requiere token de estudiante)
curl -X POST http://localhost:5001/workshops/65a1b2c3d4e5f6789012347/register \
  -H "Authorization: Bearer <student_token>"

# Ver mis inscripciones
curl http://localhost:5001/registrations/me \
  -H "Authorization: Bearer <student_token>"
```

### Gestión de Talleres (Admin)
```bash
# Login admin
curl -X POST http://localhost:5001/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "usuario": "admin",
    "contrasena": "admin123"
  }'

# Crear taller
curl -X POST http://localhost:5001/workshops \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "React Hooks",
    "descripcion": "Aprende React Hooks desde cero",
    "fecha": "2024-05-15",
    "hora": "16:00",
    "lugar": "Aula Virtual",
    "categoria": "tecnologia",
    "tipo": "curso técnico",
    "cupo": 30
  }'

```
