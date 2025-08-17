/**
 * Tipos de datos para el sistema de gestión de talleres
 */

/**
 * Representa una inscripción de un estudiante a un taller
 */
export type Inscripcion = {
  /** ID único del estudiante inscrito */
  estudiante_id?: string
  /** Nombre completo del estudiante */
  nombre: string
  /** Correo electrónico del estudiante */
  email: string
  /** Fecha y hora de registro en formato ISO */
  registrado_en?: string
}

/**
 * Representa un taller o curso disponible en el sistema
 */
export type Taller = {
  /** ID único del taller en MongoDB */
  _id: string
  /** Nombre descriptivo del taller */
  nombre: string
  /** Descripción detallada del contenido */
  descripcion: string
  /** Fecha de realización en formato YYYY-MM-DD */
  fecha: string
  /** Hora de inicio en formato HH:MM */
  hora: string
  /** Ubicación física o virtual del taller */
  lugar: string
  /** Categoría temática (ej: tecnologia, habilidades-blandas) */
  categoria: string
  /** Tipo de actividad (ej: curso técnico, capacitación) */
  tipo: string
  /** Nombre del instructor a cargo (opcional) */
  instructor?: string
  /** Calificación promedio del taller (0-5) */
  rating?: number
  /** Capacidad máxima de estudiantes */
  cupo: number
  /** Cupos disponibles calculados dinámicamente */
  cupos_disponibles?: number
  /** Fecha de creación del registro */
  creado_en?: string | null
  /** Fecha de última actualización */
  actualizado_en?: string | null
  /** Lista de estudiantes inscritos */
  inscripciones?: Inscripcion[]
}

/**
 * Representa un estudiante registrado en el sistema
 */
export type Estudiante = {
  /** ID único del estudiante en MongoDB */
  _id: string
  /** Nombre completo del estudiante */
  nombre: string
  /** Correo electrónico único */
  email: string
  /** Fecha de registro en el sistema */
  creado_en?: string
}