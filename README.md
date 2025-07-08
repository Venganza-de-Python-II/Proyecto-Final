![image](https://github.com/user-attachments/assets/e110a332-88a7-4987-bbe1-ed323f1583e2)

# 🤖 Proyecto: Gestión de Talleres de Formación Profesional

## 🎯 Objetivo

Desarrollar una aplicación web para gestionar talleres de formación profesional. La aplicación permitirá a estudiantes y administradores gestionar cursos técnicos, capacitaciones prácticas y programas de actualización profesional. Además, se implementará una **API RESTful** para interactuar con los datos de los talleres. El trabajo será realizado en grupos y se debe entregar un prototipo funcional.

---

## 💌 Requisitos funcionales

### 🔹 Gestión de Talleres de Formación Profesional

* ✅ Ver lista de talleres
  ➔ Mostrar una lista de talleres programados con nombre, fecha, hora, lugar y tipo de actividad.

* ✅ Registrar un taller (solo administradores)
  ➔ Crear un nuevo taller con nombre, descripción, fecha, hora, lugar y categoría (tecnología, emprendimiento, habilidades blandas).

* ✅ Modificar un taller (solo administradores)
  ➔ Editar los detalles de un taller ya registrado.

* ✅ Cancelar un taller (solo administradores)
  ➔ Eliminar un taller que ya no se realizará.

* ✅ Registrarse a un taller (solo estudiantes)
  ➔ Inscripción de estudiantes para participar en los talleres de su elección.

![image](https://github.com/user-attachments/assets/a3c659ea-1d68-495f-b938-eb8b9f158a9a)

---

### 🔹 API RESTful

| Método | Endpoint                 | Descripción                                          |
| ------ | ------------------------ | ---------------------------------------------------- |
| GET    | /workshops               | Obtener todos los talleres disponibles               |
| GET    | /workshops/{id}          | Obtener detalles de un taller específico             |
| POST   | /workshops               | Crear un nuevo taller (solo administradores)         |
| PUT    | /workshops/{id}          | Modificar un taller existente (solo administradores) |
| DELETE | /workshops/{id}          | Eliminar un taller (solo administradores)            |
| POST   | /workshops/{id}/register | Registrar a un estudiante en un taller               |

✅ La API debe ser implementada usando **Flask**, devolver datos en **JSON** y manejar correctamente los códigos de estado HTTP.

---

### 🔹 Interfaz Web

* 👩‍🎓 **Para estudiantes**: ver talleres y registrarse.
* 👨‍💼 **Para administradores**: gestionar la creación, edición y cancelación de talleres.
* ✅ Implementar formularios y tablas con HTML, CSS y JavaScript (opcional: Bootstrap o React).

---

## 🧑‍🤝‍🧑 Trabajo en Grupo

* Dividir tareas entre backend, frontend, base de datos y documentación.
* Usar **Git** para el control de versiones y colaboración.
* Recomendada la creación de **Pull Requests** y revisión de código.

---

## 🧪 Extras Opcionales

* ✅ **Pruebas unitarias (+15 pts)**: validar al menos los endpoints principales.
* 📚 **Documentación técnica detallada (+15 pts)**: descripción de arquitectura, base de datos y flujo de desarrollo.

---

## 🛠️ Instrucciones adicionales

**Tecnologías sugeridas**:

* Backend: Flask (con Flask-RESTful o similar)
* Frontend: HTML, CSS, JS (opcional: Bootstrap o React)
* Base de datos: PostgreSQL, MongoDB o MySQL
* Autenticación: Opcional con JWT o sesiones para admins

**Documentación requerida**:

* `README.md`: instalación, ejecución y uso de la aplicación
* Documentación técnica: estructura del proyecto, diseño de base de datos, arquitectura de la API, instrucciones de despliegue

---

## 👋 Distribución de Tareas

### ✅ Base de Datos

* Alec
* Gil
* Carlos 2

### ✅ Diagramas de base de datos

* Aaron

### ✅ Frontend

* Ana
* Sofia
* Daniela

### ✅ Backend

* Franklin
* Euris
* Stewart

### ✅ Docker

* Diego

### ✅ Documentación del Código

* Alonso
* Abel

### ✅ API RESTful

* Franklin

### ✅ JWT Autenticación

* Franklin

### ✅ Readme.md

* Veronica
* Carlos Contreras

### ✅ Autenticación con JWT

* Daniel
* Esteban

### ⚠️ Faltan por asignar

* Raul
* Emilio
