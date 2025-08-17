<img width="1454" height="518" alt="image" src="https://github.com/user-attachments/assets/650bde34-dff7-441e-a846-47745b00e48a" />

# Documentación de Base de Datos

## Resumen

SkillsForge utiliza **MongoDB** como base de datos principal, aprovechando su flexibilidad para manejar documentos con estructuras variables y su capacidad de escalamiento horizontal.

## Diseño del Esquema

### Colección: `talleres`

Almacena toda la información de los talleres de formación, incluyendo las inscripciones como documentos embebidos.

```json
{
  "_id": ObjectId("..."),
  "nombre": "Introducción a Python",
  "descripcion": "Curso básico de programación en Python para principiantes",
  "fecha": "2024-03-15",
  "hora": "10:00",
  "lugar": "Aula 101 - Edificio Tecnología",
  "categoria": "tecnologia",
  "tipo": "curso técnico",
  "instructor": "Ana García Pérez",
  "rating": 4.8,
  "cupo": 25,
  "creado_en": "2024-01-15T10:30:00.000Z",
  "actualizado_en": "2024-02-01T14:20:00.000Z",
  "inscripciones": [
    {
      "estudiante_id": "65a1b2c3d4e5f6789012345",
      "nombre": "Juan Pérez",
      "email": "juan.perez@email.com",
      "registrado_en": "2024-02-10T09:15:00.000Z"
    },
    {
      "estudiante_id": "65a1b2c3d4e5f6789012346", 
      "nombre": "María González",
      "email": "maria.gonzalez@email.com",
      "registrado_en": "2024-02-12T16:45:00.000Z"
    }
  ]
}
```

#### Campos de la Colección `talleres`

| Campo | Tipo | Descripción | Requerido | Validación |
|-------|------|-------------|-----------|------------|
| `_id` | ObjectId | Identificador único del taller | Sí | Auto-generado |
| `nombre` | String | Nombre del taller | Sí | 1-200 caracteres |
| `descripcion` | String | Descripción detallada | Sí | 1-1000 caracteres |
| `fecha` | String | Fecha en formato YYYY-MM-DD | Sí | Formato ISO date |
| `hora` | String | Hora en formato HH:MM | Sí | Formato 24h |
| `lugar` | String | Ubicación física del taller | Sí | 1-200 caracteres |
| `categoria` | String | Categoría del taller | Sí | Enum predefinido |
| `tipo` | String | Tipo de actividad | Sí | Texto libre |
| `instructor` | String | Nombre del instructor | No | 0-200 caracteres |
| `rating` | Number | Calificación promedio | No | 0.0 - 5.0 |
| `cupo` | Number | Capacidad máxima | Sí | Entero >= 0 |
| `creado_en` | String | Timestamp de creación | Sí | ISO datetime |
| `actualizado_en` | String | Timestamp de última actualización | No | ISO datetime |
| `inscripciones` | Array | Lista de estudiantes inscritos | No | Array de objetos |

#### Subcampos de `inscripciones`

| Campo | Tipo | Descripción | Requerido |
|-------|------|-------------|-----------|
| `estudiante_id` | String | ID del estudiante inscrito | Sí |
| `nombre` | String | Nombre del estudiante | Sí |
| `email` | String | Email del estudiante | Sí |
| `registrado_en` | String | Timestamp de inscripción | Sí |

### Colección: `estudiantes`

Almacena la información de los usuarios estudiantes registrados en el sistema.

```json
{
  "_id": ObjectId("65a1b2c3d4e5f6789012345"),
  "nombre": "Juan Pérez López",
  "email": "juan.perez@email.com",
  "hash": "$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.s5uDjO",
  "creado_en": "2024-01-10T08:30:00.000Z"
}
```

#### Campos de la Colección `estudiantes`

| Campo | Tipo | Descripción | Requerido | Validación |
|-------|------|-------------|-----------|------------|
| `_id` | ObjectId | Identificador único del estudiante | Sí | Auto-generado |
| `nombre` | String | Nombre completo | Sí | 2-200 caracteres |
| `email` | String | Email único del estudiante | Sí | Formato email válido |
| `hash` | String | Hash de la contraseña (bcrypt) | Sí | Hash bcrypt |
| `creado_en` | String | Timestamp de registro | Sí | ISO datetime |

## Índices de Base de Datos

### Índices en `talleres`

```javascript
// Índice compuesto para búsquedas por fecha y hora
db.talleres.createIndex({"fecha": 1, "hora": 1})

// Índice para filtros por categoría
db.talleres.createIndex({"categoria": 1})

// Índice para búsquedas de texto
db.talleres.createIndex({
  "nombre": "text",
  "descripcion": "text", 
  "instructor": "text",
  "lugar": "text"
})

// Índice para ordenamiento por rating
db.talleres.createIndex({"rating": -1})

// Índice para ordenamiento por fecha de creación
db.talleres.createIndex({"creado_en": -1})
```

### Índices en `estudiantes`

```javascript
// Índice único para email (evita duplicados)
db.estudiantes.createIndex({"email": 1}, {unique: true})

// Índice para ordenamiento por fecha de registro
db.estudiantes.createIndex({"creado_en": -1})

// Índice para búsquedas por nombre
db.estudiantes.createIndex({"nombre": "text"})
```

## Consultas Comunes

### 1. Búsqueda de Talleres con Filtros

```javascript
// Búsqueda con múltiples filtros
db.talleres.find({
  $and: [
    {
      $or: [
        {"nombre": {$regex: "python", $options: "i"}},
        {"descripcion": {$regex: "python", $options: "i"}}
      ]
    },
    {"categoria": "tecnologia"},
    {"fecha": {$gte: "2024-03-01", $lte: "2024-03-31"}}
  ]
}).sort({"fecha": 1, "hora": 1}).limit(10)
```

### 2. Talleres con Cupos Disponibles

```javascript
// Agregación para calcular cupos disponibles
db.talleres.aggregate([
  {
    $addFields: {
      "inscripciones_count": {$size: {$ifNull: ["$inscripciones", []}}},
      "cupos_disponibles": {
        $subtract: ["$cupo", {$size: {$ifNull: ["$inscripciones", []]}}]
      }
    }
  },
  {
    $match: {
      "cupos_disponibles": {$gt: 0}
    }
  }
])
```

### 3. Estadísticas del Sistema

```javascript
// Contar total de talleres
db.talleres.countDocuments({})

// Contar total de estudiantes
db.estudiantes.countDocuments({})

// Contar total de inscripciones
db.talleres.aggregate([
  {
    $project: {
      "inscripciones_count": {$size: {$ifNull: ["$inscripciones", []]}}
    }
  },
  {
    $group: {
      "_id": null,
      "total_inscripciones": {$sum: "$inscripciones_count"}
    }
  }
])
```

### 4. Talleres por Categoría

```javascript
// Obtener categorías únicas
db.talleres.distinct("categoria")

// Contar talleres por categoría
db.talleres.aggregate([
  {
    $group: {
      "_id": "$categoria",
      "count": {$sum: 1}
    }
  },
  {
    $sort: {"count": -1}
  }
])
```

### 5. Inscripciones de un Estudiante

```javascript
// Talleres donde está inscrito un estudiante específico
db.talleres.find({
  "inscripciones.estudiante_id": "65a1b2c3d4e5f6789012345"
}).sort({"fecha": 1, "hora": 1})
```

## Operaciones de Mantenimiento

### 1. Backup de Base de Datos

```bash
# Backup completo
mongodump --host localhost:27017 --db talleresdb --out /backup/$(date +%Y%m%d)

# Backup de colección específica
mongodump --host localhost:27017 --db talleresdb --collection talleres --out /backup/talleres_$(date +%Y%m%d)
```

### 2. Restauración

```bash
# Restaurar base de datos completa
mongorestore --host localhost:27017 --db talleresdb /backup/20240315/talleresdb/

# Restaurar colección específica
mongorestore --host localhost:27017 --db talleresdb --collection talleres /backup/talleres_20240315/talleresdb/talleres.bson
```

### 3. Limpieza de Datos

```javascript
// Eliminar talleres antiguos (más de 1 año)
const oneYearAgo = new Date();
oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

db.talleres.deleteMany({
  "fecha": {$lt: oneYearAgo.toISOString().split('T')[0]}
})

// Limpiar inscripciones de estudiantes eliminados
db.talleres.updateMany(
  {},
  {
    $pull: {
      "inscripciones": {
        "estudiante_id": {$in: ["id1", "id2", "id3"]} // IDs de estudiantes eliminados
      }
    }
  }
)
```

### 4. Optimización de Rendimiento

```javascript
// Analizar uso de índices
db.talleres.explain("executionStats").find({"categoria": "tecnologia"})

// Estadísticas de colección
db.talleres.stats()

// Reindexar colección
db.talleres.reIndex()
```

## Validación de Datos

### Esquema de Validación MongoDB

```javascript
// Validación para colección talleres
db.createCollection("talleres", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["nombre", "descripcion", "fecha", "hora", "lugar", "categoria", "cupo"],
      properties: {
        nombre: {
          bsonType: "string",
          minLength: 1,
          maxLength: 200
        },
        descripcion: {
          bsonType: "string", 
          minLength: 1,
          maxLength: 1000
        },
        fecha: {
          bsonType: "string",
          pattern: "^[0-9]{4}-[0-9]{2}-[0-9]{2}$"
        },
        hora: {
          bsonType: "string",
          pattern: "^[0-9]{2}:[0-9]{2}$"
        },
        categoria: {
          bsonType: "string",
          enum: ["tecnologia", "habilidades-blandas", "idiomas", "certificaciones"]
        },
        cupo: {
          bsonType: "int",
          minimum: 0
        },
        rating: {
          bsonType: "double",
          minimum: 0,
          maximum: 5
        }
      }
    }
  }
})

// Validación para colección estudiantes
db.createCollection("estudiantes", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["nombre", "email", "hash"],
      properties: {
        nombre: {
          bsonType: "string",
          minLength: 2,
          maxLength: 200
        },
        email: {
          bsonType: "string",
          pattern: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$"
        },
        hash: {
          bsonType: "string",
          minLength: 50
        }
      }
    }
  }
})
```

