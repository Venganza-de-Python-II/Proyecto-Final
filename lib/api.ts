/**
 * Configuración de la URL base de la API
 * Utiliza la variable de entorno NEXT_PUBLIC_API_URL si está definida,
 * de lo contrario usa http://localhost:5001 como valor por defecto
 */
const API_BASE =
  (typeof process !== "undefined" && (process as any).env?.NEXT_PUBLIC_API_URL) ||
  "http://localhost:5001"

/**
 * Opciones para las peticiones HTTP a la API
 */
type Opciones = {
  /** Método HTTP a utilizar (por defecto GET) */
  metodo?: "GET" | "POST" | "PUT" | "DELETE"
  /** Cuerpo de la petición (se serializa a JSON automáticamente) */
  cuerpo?: any
  /** Token de autenticación JWT (puede ser null) */
  token?: string | null
  /** Encabezados adicionales (opcional) */
  headers?: Record<string, string>
}

/**
 * Realiza una petición HTTP a la API con manejo integral:
 * - Parseo del cuerpo exactamente una vez (evita "body stream already read")
 * - Reintentos por errores de red transitorios
 * - Reintentos por rate limiting (HTTP 429) con backoff exponencial
 * - Refresh automático de token al recibir 401 por expiración
 * - Limpieza y evento global si el refresh falla
 * - Mensajes de error amigables para el usuario final
 *
 * @param ruta Ruta del endpoint (ej: "/workshops")
 * @param opciones Configuración de la petición
 * @param intento Contador interno de reintentos
 * @returns Datos deserializados (JSON) o texto plano si no es JSON
 * @throws Error con información adicional (status, backend, _debug)
 */
export async function apiFetch(ruta: string, opciones: Opciones = {}, intento: number = 0): Promise<any> {
  const {
    metodo = "GET",
    cuerpo,
    token,
    headers: extraHeaders = {}
  } = opciones

  const headers: Record<string, string> = {
    "Accept": "application/json",
    "Content-Type": "application/json",
    ...extraHeaders
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`
  }

  let res: Response
  try {
    res = await fetch(`${API_BASE}${ruta}`, {
      method: metodo,
      headers,
      body: cuerpo !== undefined ? JSON.stringify(cuerpo) : undefined
    })
  } catch (e: any) {
    // Reintento por fallo de red (DNS, desconexión, timeout)
    if (intento < 2) {
      console.warn(`Error de red. Reintentando (${intento + 1}/3)...`)
      await esperar(1000 * (intento + 1))
      return apiFetch(ruta, opciones, intento + 1)
    }
    const err = new Error("No se pudo conectar con el servidor.")
    ;(err as any).cause = e
    throw err
  }

  // Parsear respuesta una sola vez (JSON si corresponde, si no texto)
  const contentType = res.headers.get("content-type") || ""
  let parsed: any = null
  let rawText: string | null = null
  if (contentType.includes("application/json")) {
    try {
      parsed = await res.json()
    } catch {
      parsed = null
    }
  } else {
    try {
      rawText = await res.text()
    } catch {
      rawText = null
    }
  }

  // Rate limiting (429) con backoff exponencial (máx 3 intentos)
  if (res.status === 429 && intento < 3) {
    const retryAfter = res.headers.get("Retry-After") || parsed?.reintentar_en || parsed?.retry_after
    const esperaMs = calcularEsperaRateLimit(intento, retryAfter)
    console.warn(`Rate limit alcanzado. Reintentando en ${esperaMs}ms (intento ${intento + 1}/3)`)
    await esperar(esperaMs)
    return apiFetch(ruta, opciones, intento + 1)
  }

  // Refresh de token en 401 (solo si indica expiración y un único intento de refresh)
  if (res.status === 401) {
    const mensaje = (parsed?.mensaje || parsed?.message || "").toLowerCase()
    const expiro = mensaje.includes("expir") || mensaje.includes("inválido") || mensaje.includes("invalid")
    if (expiro && intento < 1) {
      const refreshed = await intentarRefreshToken()
      if (refreshed) {
        return apiFetch(ruta, opciones, intento + 1)
      }
      // Limpieza y notificación global
      limpiarTokenAdmin()
      limpiarTokenEstudiante()
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("auth:token-expired"))
      }
    }
  }

  // Manejo de errores HTTP no exitosos
  if (!res.ok) {
    const status = res.status
    const backend =
      parsed?.mensaje ||
      parsed?.message ||
      parsed?.error ||
      rawText ||
      `HTTP ${status}`

    const publico = mapearMensajePublico(status, backend)
    const error = new Error(publico)
    ;(error as any).status = status
    ;(error as any).backend = backend
    ;(error as any)._debug = { ruta, status, intento }
    throw error
  }

  // Devolver contenido
  return parsed !== null ? parsed : rawText
}

/**
 * Devuelve un mensaje genérico para mostrar al usuario final según el código HTTP
 */
function mapearMensajePublico(status: number, backend: string): string {
  if (status === 400) return "Solicitud inválida."
  if (status === 401) return "Credenciales inválidas."
  if (status === 403) return "Acceso no autorizado."
  if (status === 404) return "Recurso no encontrado."
  if (status === 409) return "Conflicto en la solicitud."
  if (status === 422) return "Datos no válidos."
  if (status === 429) return "Demasiadas solicitudes. Intenta más tarde."
  if (status >= 500) return "Error interno del servidor."
  return backend || "Error desconocido."
}

/**
 * Calcula tiempo de espera para reintentos por rate limiting (backoff exponencial + Retry-After)
 */
function calcularEsperaRateLimit(intento: number, retryAfter?: string | null): number {
  let base = 1000 * Math.pow(2, intento) // 1s, 2s, 4s
  if (retryAfter) {
    const num = parseInt(retryAfter, 10)
    if (!isNaN(num)) {
      if (retryAfter.includes("min")) base = Math.max(base, num * 60000)
      else base = Math.max(base, num * 1000)
    }
  }
  return base
}

/**
 * Espera asíncrona en milisegundos
 */
function esperar(ms: number) {
  return new Promise(r => setTimeout(r, ms))
}

/**
 * Obtiene el token de administrador desde localStorage
 */
export function obtenerTokenAdmin(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem("token_admin")
}

/**
 * Guarda el token de administrador
 */
export function guardarTokenAdmin(token: string) {
  if (typeof window === "undefined") return
  localStorage.setItem("token_admin", token)
}

/**
 * Elimina tokens (access y refresh) de administrador
 */
export function limpiarTokenAdmin() {
  if (typeof window === "undefined") return
  localStorage.removeItem("token_admin")
  localStorage.removeItem("refresh_token_admin")
}

/**
 * Obtiene el refresh token de administrador
 */
export function obtenerRefreshTokenAdmin(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem("refresh_token_admin")
}

/**
 * Guarda el refresh token de administrador
 */
export function guardarRefreshTokenAdmin(refreshToken: string) {
  if (typeof window === "undefined") return
  localStorage.setItem("refresh_token_admin", refreshToken)
}

/**
 * Obtiene el token de estudiante desde localStorage
 */
export function obtenerTokenEstudiante(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem("token_estudiante")
}

/**
 * Guarda el token de estudiante
 */
export function guardarTokenEstudiante(token: string) {
  if (typeof window === "undefined") return
  localStorage.setItem("token_estudiante", token)
}

/**
 * Elimina tokens (access y refresh) de estudiante
 */
export function limpiarTokenEstudiante() {
  if (typeof window === "undefined") return
  localStorage.removeItem("token_estudiante")
  localStorage.removeItem("refresh_token_estudiante")
}

/**
 * Obtiene el refresh token de estudiante
 */
export function obtenerRefreshTokenEstudiante(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem("refresh_token_estudiante")
}

/**
 * Guarda el refresh token de estudiante
 */
export function guardarRefreshTokenEstudiante(refreshToken: string) {
  if (typeof window === "undefined") return
  localStorage.setItem("refresh_token_estudiante", refreshToken)
}

/**
 * Intenta refrescar el token (estudiante primero, luego admin)
 */
async function intentarRefreshToken(): Promise<boolean> {
  try {
    let refresh = obtenerRefreshTokenEstudiante()
    if (refresh && await refreshGenerico(refresh, "estudiante")) return true
    refresh = obtenerRefreshTokenAdmin()
    if (refresh && await refreshGenerico(refresh, "admin")) return true
    return false
  } catch (e) {
    console.error("Error refrescando token:", e)
    return false
  }
}

/**
 * Lógica de refresh para un tipo de usuario
 */
async function refreshGenerico(refreshToken: string, tipo: "admin" | "estudiante"): Promise<boolean> {
  const resp = await fetch(`${API_BASE}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: refreshToken })
  })
  if (!resp.ok) return false
  let data: any
  try {
    data = await resp.json()
  } catch {
    return false
  }
  if (!data?.token) return false
  if (tipo === "admin") {
    guardarTokenAdmin(data.token)
    if (data.refresh_token) guardarRefreshTokenAdmin(data.refresh_token)
  } else {
    guardarTokenEstudiante(data.token)
    if (data.refresh_token) guardarRefreshTokenEstudiante(data.refresh_token)
  }
  return true
}

/**
 * Obtiene las estadísticas públicas
 */
export async function obtenerStatsPublicas() {
  return apiFetch("/stats")
}

/**
 * Obtiene la lista de categorías
 */
export async function obtenerCategorias() {
  return apiFetch("/categories")
}

/**
 * URL base exportada
 */
export const API_BASE_URL = API_BASE
