<img width="1454" height="518" alt="image" src="https://github.com/user-attachments/assets/289b76af-f1dd-4043-9531-02e54cf813e3" />

# Seguridad y Rate Limiting

## Descripción General

El sistema incluye medidas de seguridad y protección contra spam mediante rate limiting y validación de headers de autorización.

## Funcionalidades Implementadas

### 1. Rate Limiting

El sistema implementa límites de peticiones por minuto/hora para prevenir abuso:

#### Límites por Endpoint:
- **Autenticación**:
  - Login admin: 5 peticiones/minuto
  - Login estudiante: 10 peticiones/minuto  
  - Registro estudiante: 3 peticiones/minuto

- **Talleres**:
  - Listar talleres: 60 peticiones/minuto
  - Ver taller específico: 30 peticiones/minuto
  - Inscribirse/desinscribirse: 10 peticiones/minuto

- **Utilidades**:
  - Estadísticas: 20 peticiones/minuto
  - Categorías: 30 peticiones/minuto
  - Health check: 60 peticiones/minuto
  - Endpoint raíz: 30 peticiones/minuto

- **Límite global**: 100 peticiones/hora por IP

### 2. Authorization Headers Mejorados

#### Formato del Token:
```
Authorization: Bearer <jwt_token>
```

#### Validaciones:
- Token JWT válido y no expirado
- Rol apropiado (admin/estudiante)
- Validación de integridad del token

### 3. Headers de Seguridad

El sistema añade automáticamente headers de seguridad:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`

## Configuración

### Variables de Entorno

```bash
# Rate Limiting
REDIS_URL=redis://localhost:6379
RATELIMIT_DEFAULT=100 per hour
```

### Docker Compose

El sistema ahora incluye Redis para almacenar los contadores de rate limiting:

```yaml
redis:
  image: redis:7-alpine
  container_name: redis
  restart: always
  ports:
    - "6379:6379"
```

## Uso en el Frontend

### Autenticación con Token

```javascript
// Ejemplo de petición autenticada
const response = await fetch('/api/workshops', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  }
});
```

### Manejo de Rate Limiting

```javascript
// Manejo de error 429 (Too Many Requests)
if (response.status === 429) {
  const error = await response.json();
  console.log(`Rate limit excedido. Reintentar en: ${error.reintentar_en}`);
  // Implementar retry con backoff
}
```

## Respuestas de Error

### Rate Limit Excedido (429)
```json
{
  "mensaje": "Demasiadas peticiones",
  "descripcion": "Has excedido el límite de peticiones permitidas",
  "reintentar_en": "60 segundos"
}
```

### Token Inválido (401)
```json
{
  "mensaje": "Token inválido"
}
```

### Permisos Insuficientes (403)
```json
{
  "mensaje": "Permisos de administrador requeridos"
}
```


