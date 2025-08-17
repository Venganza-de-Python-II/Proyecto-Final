"""
SkillsForge - API Backend
========================

API RESTful desarrollada con Flask para la plataforma SkillsForge de gestión 
de talleres de formación profesional. Incluye autenticación JWT, gestión de 
usuarios (estudiantes y administradores), y operaciones CRUD completas.

Características principales:
- Autenticación JWT con refresh tokens
- Rate limiting y protección anti-spam
- Gestión de talleres con control de cupos
- Sistema de inscripciones con validaciones
- API RESTful
- Integración con MongoDB y Redis
- Headers de seguridad automáticos
- Soporte CORS configurado
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from pymongo import MongoClient, ASCENDING, DESCENDING, errors
from bson import ObjectId, Regex
from datetime import datetime, timedelta
import jwt
from functools import wraps
from werkzeug.security import generate_password_hash, check_password_hash
from config import Config
import redis
import hashlib

def crear_app():
    """
    Crea y configura la aplicación Flask
    
    Returns:
        Flask: Instancia configurada de la aplicación
    """
    app = Flask(__name__)
    app.config.from_object(Config)

    # Configuración CORS
    CORS(app, resources={r"/*": {"origins": app.config["CORS_ORIGINS"]}})

    # Configuración de Rate Limiting
    try:
        redis_client = redis.from_url(app.config["REDIS_URL"])
        redis_client.ping()
        print("✅ Conexión a Redis exitosa")
        
        limiter = Limiter(
            app=app,
            key_func=get_remote_address,
            storage_uri=app.config["RATELIMIT_STORAGE_URL"],
            default_limits=[app.config["RATELIMIT_DEFAULT"]]
        )
    except Exception as e:
        print(f"⚠️  Redis no disponible, usando rate limiting en memoria: {e}")
        limiter = Limiter(
            app=app,
            key_func=get_remote_address,
            default_limits=[app.config["RATELIMIT_DEFAULT"]]
        )

    # Configuración y conexión a MongoDB
    try:
        cliente = MongoClient(app.config["MONGO_URI"], serverSelectionTimeoutMS=5000)
        cliente.admin.command('ping')
        print("✅ Conexión a MongoDB exitosa")

        db = cliente[app.config["MONGO_DB_NAME"]]
        col_talleres = db["talleres"]
        col_estudiantes = db["estudiantes"]

        # Creación de índices
        col_talleres.create_index([("fecha", ASCENDING), ("hora", ASCENDING)])
        col_talleres.create_index("categoria")
        try:
            col_estudiantes.create_index("email", unique=True)
        except errors.OperationFailure:
            pass
        print("✅ Índices de base de datos creados exitosamente")

    except Exception as e:
        print(f"❌ Error conectando a MongoDB: {e}")
        print("💡 Asegúrate de que MongoDB esté ejecutándose:")
        print("   - Inicia Docker Desktop")
        print("   - Ejecuta: docker-compose up -d")
        print("   - O ejecuta: docker run -d -p 27017:27017 --name mongodb mongo:latest")
        raise SystemExit("Falló la conexión a MongoDB. Por favor inicia MongoDB e intenta nuevamente.")

    # Funciones utilitarias
    def oid(id_str: str):
        """Convierte string a ObjectId de MongoDB"""
        try:
            return ObjectId(id_str)
        except Exception:
            return None

    def extraer_token_auth():
        """Extrae token JWT del header Authorization"""
        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            return None
        
        try:
            token = auth_header.split(" ", 1)[1].strip()
            return token if token else None
        except IndexError:
            return None

    def generar_cache_key(prefix: str, *args):
        """Genera clave única para cache"""
        key_data = f"{prefix}:{':'.join(str(arg) for arg in args)}"
        return hashlib.md5(key_data.encode()).hexdigest()

    def ahora_iso():
        """Obtiene timestamp actual en formato ISO 8601"""
        return datetime.utcnow().isoformat()

    def serializar_taller(doc):
        """Convierte documento de taller a formato JSON"""
        if not doc:
            return None
        insc = doc.get("inscripciones", [])
        cupo = int(doc.get("cupo", 0))
        cupos_disponibles = max(cupo - len(insc), 0) if cupo >= 0 else 0
        return {
            "_id": str(doc.get("_id")),
            "nombre": doc.get("nombre"),
            "descripcion": doc.get("descripcion"),
            "fecha": doc.get("fecha"),
            "hora": doc.get("hora"),
            "lugar": doc.get("lugar"),
            "categoria": doc.get("categoria"),
            "tipo": doc.get("tipo"),
            "instructor": doc.get("instructor", ""),
            "rating": float(doc.get("rating", 0)) if doc.get("rating") is not None else 0,
            "cupo": cupo,
            "cupos_disponibles": cupos_disponibles,
            "creado_en": doc.get("creado_en"),
            "actualizado_en": doc.get("actualizado_en"),
            "inscripciones": [
                {
                    "estudiante_id": ins.get("estudiante_id"),
                    "nombre": ins.get("nombre"),
                    "email": ins.get("email"),
                    "registrado_en": ins.get("registrado_en"),
                }
                for ins in insc
            ],
        }

    def serializar_estudiante(doc):
        """Convierte documento de estudiante a formato JSON"""
        if not doc:
            return None
        return {
            "_id": str(doc.get("_id")),
            "nombre": doc.get("nombre"),
            "email": doc.get("email"),
            "creado_en": doc.get("creado_en"),
        }

    # Decoradores de autenticación

    def requiere_admin(f):
        """Decorador que requiere autenticación de administrador"""
        @wraps(f)
        def envoltura(*args, **kwargs):
            token = extraer_token_auth()
            if not token:
                return jsonify({"mensaje": "Token de autorización requerido"}), 401
            
            try:
                payload = jwt.decode(token, app.config["JWT_SECRET"], algorithms=["HS256"])
                if payload.get("rol") != "admin":
                    return jsonify({"mensaje": "Permisos de administrador requeridos"}), 403
                request.usuario = payload
            except jwt.ExpiredSignatureError:
                return jsonify({"mensaje": "Sesión expirada"}), 401
            except jwt.InvalidTokenError:
                return jsonify({"mensaje": "Token inválido"}), 401
            except Exception:
                return jsonify({"mensaje": "Error de autenticación"}), 401
            return f(*args, **kwargs)
        return envoltura

    def requiere_estudiante(f):
        """Decorador que requiere autenticación de estudiante"""
        @wraps(f)
        def envoltura(*args, **kwargs):
            
            token = extraer_token_auth()
            if not token:
                return jsonify({"mensaje": "Token de autorización requerido"}), 401
            
            try:
                payload = jwt.decode(token, app.config["JWT_SECRET"], algorithms=["HS256"])
                if payload.get("rol") != "estudiante":
                    return jsonify({"mensaje": "Permisos de estudiante requeridos"}), 403
                
                est_id = payload.get("sub")
                if not est_id:
                    return jsonify({"mensaje": "Token inválido - ID de estudiante faltante"}), 401
                
                _id = oid(est_id)
                if not _id:
                    return jsonify({"mensaje": "Token inválido - ID de estudiante malformado"}), 401
                
                est = col_estudiantes.find_one({"_id": _id})
                if not est:
                    return jsonify({"mensaje": "Estudiante no encontrado"}), 401
                
                request.usuario = {
                    "id": str(est["_id"]),
                    "email": est["email"],
                    "nombre": est.get("nombre", ""),
                    "rol": "estudiante",
                }
            except jwt.ExpiredSignatureError:
                return jsonify({"mensaje": "Sesión expirada"}), 401
            except jwt.InvalidTokenError:
                return jsonify({"mensaje": "Token inválido"}), 401
            except Exception as e:
                return jsonify({"mensaje": "Error de autenticación"}), 401
            return f(*args, **kwargs)
        return envoltura

    # Datos de ejemplo para desarrollo
    try:
        if col_talleres.count_documents({}) == 0:
            ahora = datetime.utcnow()
            ejemplos = [
                {
                    "nombre": "Introducción a Python",
                    "descripcion": "Fundamentos de Python.",
                    "fecha": (ahora.date().isoformat()),
                    "hora": (ahora.strftime("%H:%M")),
                    "lugar": "Aula 101",
                    "categoria": "tecnologia",
                    "tipo": "curso técnico",
                    "instructor": "Ana Pérez",
                    "rating": 4.8,
                    "cupo": 30,
                    "creado_en": ahora_iso(),
                    "actualizado_en": None,
                    "inscripciones": [],
                },
                {
                    "nombre": "Habilidades Blandas",
                    "descripcion": "Comunicación y equipo.",
                    "fecha": (ahora.date().isoformat()),
                    "hora": (ahora.strftime("%H:%M")),
                    "lugar": "Sala Taller 2",
                    "categoria": "habilidades-blandas",
                    "tipo": "capacitacion",
                    "instructor": "Luis Gómez",
                    "rating": 4.6,
                    "cupo": 25,
                    "creado_en": ahora_iso(),
                    "actualizado_en": None,
                    "inscripciones": [],
                },
            ]
            col_talleres.insert_many(ejemplos)
            print("✅ Talleres de ejemplo insertados")
    except Exception as e:
        print(f"⚠️  Advertencia: No se pudieron insertar los datos de ejemplo: {e}")

    @app.get("/")
    @limiter.limit("30 per minute")
    def root():
        """
        Endpoint raíz que proporciona información básica de la API
        
        Returns:
            JSON con información de la API y endpoints disponibles
        """
        return jsonify({
            "message": "SkillsForge API - Backend funcionando",
            "version": "1.0.0",
            "platform": "SkillsForge - Plataforma de Talleres Profesionales",
            "endpoints": {
                "health": "/health",
                "workshops": "/workshops",
                "auth": "/auth/login",
                "refresh": "/auth/refresh",
                "stats": "/stats",
                "categories": "/categories",
                "openapi": "/openapi.json"
            }
        }), 200

    # Endpoints de Autenticación
    @app.post("/auth/login")
    @limiter.limit("5 per minute")
    def login_admin():
        """
        Autenticación de administradores
        
        Body:
            usuario (str): Nombre de usuario del administrador
            contrasena (str): Contraseña del administrador
            
        Returns:
            JSON con token JWT y tiempo de expiración
        """
        
        datos = request.get_json(silent=True) or {}
        usuario = datos.get("usuario", "")
        contrasena = datos.get("contrasena", "")
        
        if not usuario or not contrasena:
            return jsonify({"mensaje": "Usuario y contraseña son requeridos"}), 400
        
        if usuario == app.config["ADMIN_USER"] and contrasena == app.config["ADMIN_PASSWORD"]:
            exp = datetime.utcnow() + timedelta(hours=8)
            refresh_exp = datetime.utcnow() + timedelta(days=7)
            
            token = jwt.encode(
                {"sub": usuario, "rol": "admin", "exp": exp, "iat": datetime.utcnow()},
                app.config["JWT_SECRET"],
                algorithm="HS256",
            )
            
            refresh_token = jwt.encode(
                {"sub": usuario, "rol": "admin", "exp": refresh_exp, "iat": datetime.utcnow(), "type": "refresh"},
                app.config["JWT_SECRET"],
                algorithm="HS256",
            )
            
            return jsonify({
                "token": token, 
                "refresh_token": refresh_token,
                "expira_en": int(exp.timestamp()),
                "tipo": "Bearer"
            }), 200
        return jsonify({"mensaje": "Credenciales inválidas"}), 401

    @app.post("/auth/estudiantes/registro")
    @limiter.limit("3 per minute")
    def registro_estudiante():
        """
        Registro de nuevos estudiantes en el sistema
        
        Body:
            nombre (str): Nombre completo del estudiante
            email (str): Correo electrónico único
            contrasena (str): Contraseña (mínimo 8 caracteres)
            
        Returns:
            JSON con token JWT y datos del estudiante creado
        """
        
        datos = request.get_json(silent=True) or {}
        nombre = (datos.get("nombre") or "").strip()
        email = (datos.get("email") or "").strip().lower()
        contrasena = (datos.get("contrasena") or "")
        
        if not nombre or not email or not contrasena:
            return jsonify({"mensaje": "Nombre, email y contraseña son requeridos"}), 400
        if len(contrasena) < 8:
            return jsonify({"mensaje": "La contraseña debe tener al menos 8 caracteres"}), 400

        # Validación adicional de email
        import re
        email_regex = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(email_regex, email):
            return jsonify({"mensaje": "Formato de email inválido"}), 400

        try:
            doc = {
                "nombre": nombre,
                "email": email,
                "hash": generate_password_hash(contrasena),
                "creado_en": ahora_iso(),
            }
            res = col_estudiantes.insert_one(doc)
            est = col_estudiantes.find_one({"_id": res.inserted_id})
        except errors.DuplicateKeyError:
            return jsonify({"mensaje": "El email ya está registrado"}), 409

        exp = datetime.utcnow() + timedelta(hours=8)
        refresh_exp = datetime.utcnow() + timedelta(days=7)
        
        token = jwt.encode(
            {"sub": str(est["_id"]), "rol": "estudiante", "email": est["email"], "nombre": est.get("nombre", ""), "exp": exp, "iat": datetime.utcnow()},
            app.config["JWT_SECRET"],
            algorithm="HS256",
        )
        
        refresh_token = jwt.encode(
            {"sub": str(est["_id"]), "rol": "estudiante", "email": est["email"], "nombre": est.get("nombre", ""), "exp": refresh_exp, "iat": datetime.utcnow(), "type": "refresh"},
            app.config["JWT_SECRET"],
            algorithm="HS256",
        )
        
        return jsonify({
            "token": token, 
            "refresh_token": refresh_token,
            "estudiante": serializar_estudiante(est),
            "tipo": "Bearer"
        }), 201

    @app.post("/auth/estudiantes/login")
    @limiter.limit("10 per minute")
    def login_estudiante():
        """
        Autenticación de estudiantes registrados
        
        Body:
            email (str): Correo electrónico del estudiante
            contrasena (str): Contraseña del estudiante
            
        Returns:
            JSON con token JWT y datos del estudiante
        """
        
        datos = request.get_json(silent=True) or {}
        email = (datos.get("email") or "").strip().lower()
        contrasena = (datos.get("contrasena") or "")
        
        if not email or not contrasena:
            return jsonify({"mensaje": "Email y contraseña son requeridos"}), 400

        est = col_estudiantes.find_one({"email": email})
        if not est or not check_password_hash(est.get("hash", ""), contrasena):
            return jsonify({"mensaje": "Credenciales inválidas"}), 401

        exp = datetime.utcnow() + timedelta(hours=8)
        refresh_exp = datetime.utcnow() + timedelta(days=7)
        
        token = jwt.encode(
            {"sub": str(est["_id"]), "rol": "estudiante", "email": est["email"], "nombre": est.get("nombre", ""), "exp": exp, "iat": datetime.utcnow()},
            app.config["JWT_SECRET"],
            algorithm="HS256",
        )
        
        refresh_token = jwt.encode(
            {"sub": str(est["_id"]), "rol": "estudiante", "email": est["email"], "nombre": est.get("nombre", ""), "exp": refresh_exp, "iat": datetime.utcnow(), "type": "refresh"},
            app.config["JWT_SECRET"],
            algorithm="HS256",
        )
        
        return jsonify({
            "token": token, 
            "refresh_token": refresh_token,
            "estudiante": serializar_estudiante(est),
            "tipo": "Bearer"
        }), 200

    @app.get("/auth/estudiantes/me")
    @requiere_estudiante
    def yo_estudiante():
        _id = oid(request.usuario["id"])
        est = col_estudiantes.find_one({"_id": _id})
        return jsonify(serializar_estudiante(est)), 200

    @app.post("/auth/refresh")
    @limiter.limit("10 per minute")
    def refresh_token():
        """
        Endpoint para refrescar tokens JWT usando refresh token
        
        Body:
            refresh_token (str): Token de refresh válido
            
        Returns:
            JSON con nuevo token JWT y refresh token
        """
        
        datos = request.get_json(silent=True) or {}
        refresh_token = datos.get("refresh_token", "")
        
        if not refresh_token:
            return jsonify({"mensaje": "Refresh token requerido"}), 400
        
        try:
            payload = jwt.decode(refresh_token, app.config["JWT_SECRET"], algorithms=["HS256"])
            
            # Verificar que sea un refresh token
            if payload.get("type") != "refresh":
                return jsonify({"mensaje": "Token inválido"}), 401
            
            rol = payload.get("rol")
            if not rol:
                return jsonify({"mensaje": "Token inválido"}), 401
            
            # Generar nuevos tokens
            exp = datetime.utcnow() + timedelta(hours=8)
            refresh_exp = datetime.utcnow() + timedelta(days=7)
            
            if rol == "admin":
                new_token = jwt.encode(
                    {"sub": payload["sub"], "rol": "admin", "exp": exp, "iat": datetime.utcnow()},
                    app.config["JWT_SECRET"],
                    algorithm="HS256",
                )
                
                new_refresh_token = jwt.encode(
                    {"sub": payload["sub"], "rol": "admin", "exp": refresh_exp, "iat": datetime.utcnow(), "type": "refresh"},
                    app.config["JWT_SECRET"],
                    algorithm="HS256",
                )
                
                return jsonify({
                    "token": new_token,
                    "refresh_token": new_refresh_token,
                    "expira_en": int(exp.timestamp()),
                    "tipo": "Bearer"
                }), 200
                
            elif rol == "estudiante":
                # Verificar que el estudiante aún existe
                est_id = payload.get("sub")
                _id = oid(est_id)
                if not _id:
                    return jsonify({"mensaje": "Token inválido"}), 401
                
                est = col_estudiantes.find_one({"_id": _id})
                if not est:
                    return jsonify({"mensaje": "Estudiante no encontrado"}), 401
                
                new_token = jwt.encode(
                    {"sub": str(est["_id"]), "rol": "estudiante", "email": est["email"], "nombre": est.get("nombre", ""), "exp": exp, "iat": datetime.utcnow()},
                    app.config["JWT_SECRET"],
                    algorithm="HS256",
                )
                
                new_refresh_token = jwt.encode(
                    {"sub": str(est["_id"]), "rol": "estudiante", "email": est["email"], "nombre": est.get("nombre", ""), "exp": refresh_exp, "iat": datetime.utcnow(), "type": "refresh"},
                    app.config["JWT_SECRET"],
                    algorithm="HS256",
                )
                
                return jsonify({
                    "token": new_token,
                    "refresh_token": new_refresh_token,
                    "estudiante": serializar_estudiante(est),
                    "expira_en": int(exp.timestamp()),
                    "tipo": "Bearer"
                }), 200
            
            else:
                return jsonify({"mensaje": "Rol inválido"}), 401
                
        except jwt.ExpiredSignatureError:
            return jsonify({"mensaje": "Refresh token expirado"}), 401
        except jwt.InvalidTokenError:
            return jsonify({"mensaje": "Refresh token inválido"}), 401
        except Exception:
            return jsonify({"mensaje": "Error procesando refresh token"}), 401

    # Endpoints de Talleres
    @app.get("/workshops")
    @limiter.limit("60 per minute")
    def listar_talleres():
        """
        Lista todos los talleres con filtros opcionales
        
        Query Parameters:
            q (str): Búsqueda por texto en nombre, descripción, lugar, etc.
            categoria (str): Filtrar por categoría específica
            fechaDesde (str): Fecha mínima en formato YYYY-MM-DD
            fechaHasta (str): Fecha máxima en formato YYYY-MM-DD
            sort (str): Campo para ordenar (fecha, rating, creado_en)
            order (str): Dirección del ordenamiento (asc, desc)
            limit (int): Número máximo de resultados
            
        Returns:
            JSON con array de talleres que coinciden con los filtros
        """
        # Extracción y validación de parámetros de consulta
        q = (request.args.get("q") or "").strip()
        categoria = (request.args.get("categoria") or "").strip()
        fecha_desde = (request.args.get("fechaDesde") or "").strip()
        fecha_hasta = (request.args.get("fechaHasta") or "").strip()
        sort = request.args.get("sort") or "fecha"
        order = request.args.get("order") or "asc"
        limit = int(request.args.get("limit") or 0)

        # Construcción del filtro de búsqueda MongoDB
        filtro = {}
        if q:
            # Búsqueda de texto insensible a mayúsculas en múltiples campos
            regex = Regex(q, "i")
            filtro["$or"] = [
                {"nombre": regex},
                {"descripcion": regex},
                {"lugar": regex},
                {"tipo": regex},
                {"instructor": regex},
            ]
        if categoria:
            filtro["categoria"] = categoria
        if fecha_desde or fecha_hasta:
            # Las fechas se almacenan como strings YYYY-MM-DD, permitiendo comparaciones lexicográficas
            rango = {}
            if fecha_desde:
                rango["$gte"] = fecha_desde
            if fecha_hasta:
                rango["$lte"] = fecha_hasta
            filtro["fecha"] = rango

        sort_map = {
            "fecha": ("fecha", ASCENDING if order == "asc" else DESCENDING),
            "rating": ("rating", DESCENDING if order == "desc" else ASCENDING),
            "creado_en": ("creado_en", DESCENDING if order == "desc" else ASCENDING),
        }
        campo, direccion = sort_map.get(sort, ("fecha", ASCENDING))
        cursor = col_talleres.find(filtro, sort=[(campo, direccion), ("hora", ASCENDING if order == "asc" else DESCENDING)])
        if limit > 0:
            cursor = cursor.limit(limit)
        talleres = list(cursor)
        return jsonify([serializar_taller(t) for t in talleres]), 200

    @app.get("/workshops/<id_taller>")
    @limiter.limit("30 per minute")
    def obtener_taller(id_taller):
        _id = oid(id_taller)
        if not _id:
            return jsonify({"mensaje": "ID inválido"}), 400
        doc = col_talleres.find_one({"_id": _id})
        if not doc:
            return jsonify({"mensaje": "Taller no encontrado"}), 404
        return jsonify(serializar_taller(doc)), 200

    @app.post("/workshops")
    @requiere_admin
    def crear_taller():
        datos = request.get_json(silent=True) or {}
        requeridos = ["nombre", "descripcion", "fecha", "hora", "lugar", "categoria", "tipo", "cupo"]
        faltantes = [c for c in requeridos if datos.get(c) in [None, ""]]
        if faltantes:
            return jsonify({"mensaje": "Campos faltantes", "campos": faltantes}), 400

        try:
            cupo = int(datos["cupo"])
            if cupo < 0:
                raise ValueError()
        except Exception:
            return jsonify({"mensaje": "Cupo debe ser un entero no negativo"}), 400

        rating = datos.get("rating")
        if rating is not None:
            try:
                rating = float(rating)
                if rating < 0 or rating > 5:
                    raise ValueError()
            except Exception:
                return jsonify({"mensaje": "Rating debe ser un número entre 0 y 5"}), 400

        nuevo = {
            "nombre": datos["nombre"].strip(),
            "descripcion": datos["descripcion"].strip(),
            "fecha": datos["fecha"].strip(),
            "hora": datos["hora"].strip(),
            "lugar": datos["lugar"].strip(),
            "categoria": datos["categoria"].strip(),
            "tipo": datos["tipo"].strip(),
            "instructor": (datos.get("instructor") or "").strip(),
            "rating": rating if rating is not None else 0,
            "cupo": cupo,
            "creado_en": ahora_iso(),
            "actualizado_en": None,
            "inscripciones": [],
        }
        res = col_talleres.insert_one(nuevo)
        creado = col_talleres.find_one({"_id": res.inserted_id})
        return jsonify(serializar_taller(creado)), 201

    @app.put("/workshops/<id_taller>")
    @requiere_admin
    def editar_taller(id_taller):
        _id = oid(id_taller)
        if not _id:
            return jsonify({"mensaje": "ID inválido"}), 400
        datos = request.get_json(silent=True) or {}
        permitidos = ["nombre", "descripcion", "fecha", "hora", "lugar", "categoria", "tipo", "cupo", "instructor", "rating"]
        cambios = {}
        # Necesitamos doc para validaciones de cupo
        doc = col_talleres.find_one({"_id": _id}, {"inscripciones": 1})
        for k, v in datos.items():
            if k in permitidos:
                if k == "cupo":
                    try:
                        nv = int(v)
                        if nv < 0:
                            raise ValueError()
                        ins_len = len(doc.get("inscripciones", [])) if doc else 0
                        if nv < ins_len:
                            return jsonify({"mensaje": f"No puedes establecer un cupo menor a los inscritos actuales ({ins_len})"}), 400
                        cambios["cupo"] = nv
                    except Exception:
                        return jsonify({"mensaje": "Cupo debe ser un entero no negativo"}), 400
                elif k == "rating":
                    try:
                        rv = float(v)
                        if rv < 0 or rv > 5:
                            raise ValueError()
                        cambios["rating"] = rv
                    except Exception:
                        return jsonify({"mensaje": "Rating debe ser un número entre 0 y 5"}), 400
                elif isinstance(v, str):
                    cambios[k] = v.strip()
        if not cambios:
            return jsonify({"mensaje": "Nada para actualizar"}), 400
        cambios["actualizado_en"] = ahora_iso()
        res = col_talleres.update_one({"_id": _id}, {"$set": cambios})
        if res.matched_count == 0:
            return jsonify({"mensaje": "Taller no encontrado"}), 404
        actualizado = col_talleres.find_one({"_id": _id})
        return jsonify(serializar_taller(actualizado)), 200

    @app.delete("/workshops/<id_taller>")
    @requiere_admin
    def eliminar_taller(id_taller):
        _id = oid(id_taller)
        if not _id:
            return jsonify({"mensaje": "ID inválido"}), 400
        res = col_talleres.delete_one({"_id": _id})
        if res.deleted_count == 0:
            return jsonify({"mensaje": "Taller no encontrado"}), 404
        return jsonify({"mensaje": "Taller eliminado"}), 200

    @app.post("/workshops/<id_taller>/register")
    @limiter.limit("10 per minute")
    @requiere_estudiante
    def registrar_estudiante(id_taller):
        _id = oid(id_taller)
        if not _id:
            return jsonify({"mensaje": "ID inválido"}), 400

        doc = col_talleres.find_one({"_id": _id})
        if not doc:
            return jsonify({"mensaje": "Taller no encontrado"}), 404

        cupo = int(doc.get("cupo", 0))
        inscripciones = doc.get("inscripciones", [])
        if cupo >= 0 and len(inscripciones) >= cupo:
            return jsonify({"mensaje": "Cupo lleno"}), 409

        est_id = request.usuario["id"]
        email = request.usuario["email"]
        nombre = request.usuario["nombre"]

        existe = col_talleres.find_one({"_id": _id, "inscripciones.estudiante_id": est_id})
        if existe:
            return jsonify({"mensaje": "Ya estás inscrito en este taller"}), 409

        inscripcion = {
            "estudiante_id": est_id,
            "nombre": nombre,
            "email": email,
            "registrado_en": ahora_iso(),
        }
        col_talleres.update_one({"_id": _id}, {"$push": {"inscripciones": inscripcion}})
        actualizado = col_talleres.find_one({"_id": _id})
        return jsonify(serializar_taller(actualizado)), 201

    @app.delete("/workshops/<id_taller>/register")
    @limiter.limit("10 per minute")
    @requiere_estudiante
    def anular_inscripcion(id_taller):
        _id = oid(id_taller)
        if not _id:
            return jsonify({"mensaje": "ID inválido"}), 400
        est_id = request.usuario["id"]
        res = col_talleres.update_one(
            {"_id": _id},
            {"$pull": {"inscripciones": {"estudiante_id": est_id}}},
        )
        if res.matched_count == 0:
            return jsonify({"mensaje": "Taller no encontrado"}), 404
        actualizado = col_talleres.find_one({"_id": _id})
        return jsonify(serializar_taller(actualizado)), 200

    @app.get("/registrations/me")
    @requiere_estudiante
    def mis_inscripciones():
        est_id = request.usuario["id"]
        talleres = list(col_talleres.find({"inscripciones.estudiante_id": est_id}, sort=[("fecha", ASCENDING), ("hora", ASCENDING)]))
        return jsonify([serializar_taller(t) for t in talleres]), 200

    # ---------- Estudiantes (Admin) ----------
    @app.get("/students")
    @requiere_admin
    def listar_estudiantes():
        q = (request.args.get("q") or "").strip()
        filtro = {}
        if q:
            regex = Regex(q, "i")
            filtro["$or"] = [{"nombre": regex}, {"email": regex}]
        estudiantes = list(col_estudiantes.find(filtro, sort=[("creado_en", DESCENDING)]))
        return jsonify([serializar_estudiante(e) for e in estudiantes]), 200

    @app.get("/students/<id_est>")
    @requiere_admin
    def obtener_estudiante(id_est):
        _id = oid(id_est)
        if not _id:
            return jsonify({"mensaje": "ID inválido"}), 400
        est = col_estudiantes.find_one({"_id": _id})
        if not est:
            return jsonify({"mensaje": "Estudiante no encontrado"}), 404
        return jsonify(serializar_estudiante(est)), 200

    @app.put("/students/<id_est>")
    @requiere_admin
    def editar_estudiante(id_est):
        _id = oid(id_est)
        if not _id:
            return jsonify({"mensaje": "ID inválido"}), 400
        datos = request.get_json(silent=True) or {}
        cambios = {}
        if "nombre" in datos and isinstance(datos["nombre"], str):
            cambios["nombre"] = datos["nombre"].strip()
        if "email" in datos and isinstance(datos["email"], str):
            nuevo_email = datos["email"].strip().lower()
            if not nuevo_email:
                return jsonify({"mensaje": "Email inválido"}), 400
            # verificar duplicado
            otro = col_estudiantes.find_one({"email": nuevo_email, "_id": {"$ne": _id}})
            if otro:
                return jsonify({"mensaje": "El email ya está en uso"}), 409
            cambios["email"] = nuevo_email
        if not cambios:
            return jsonify({"mensaje": "Nada para actualizar"}), 400
        col_estudiantes.update_one({"_id": _id}, {"$set": cambios})
        est = col_estudiantes.find_one({"_id": _id})
        return jsonify(serializar_estudiante(est)), 200

    @app.delete("/students/<id_est>")
    @requiere_admin
    def eliminar_estudiante(id_est):
        _id = oid(id_est)
        if not _id:
            return jsonify({"mensaje": "ID inválido"}), 400
        # Eliminar sus inscripciones de talleres
        col_talleres.update_many({}, {"$pull": {"inscripciones": {"estudiante_id": str(_id)}}})
        res = col_estudiantes.delete_one({"_id": _id})
        if res.deleted_count == 0:
            return jsonify({"mensaje": "Estudiante no encontrado"}), 404
        return jsonify({"mensaje": "Estudiante eliminado"}), 200

    # ---------- Utilidades públicas ----------
    @app.get("/stats")
    @limiter.limit("20 per minute")
    def stats():
        total_talleres = col_talleres.count_documents({})
        total_estudiantes = col_estudiantes.count_documents({})
        total_registros = col_talleres.aggregate([{"$project": {"n": {"$size": {"$ifNull": ["$inscripciones", []]}}}}, {"$group": {"_id": None, "suma": {"$sum": "$n"}}}])
        registros = 0
        for x in total_registros:
            registros = x.get("suma", 0)
        return jsonify({"talleres": total_talleres, "estudiantes": total_estudiantes, "registros": registros}), 200

    @app.get("/categories")
    @limiter.limit("30 per minute")
    def categories():
        cats = col_talleres.distinct("categoria")
        return jsonify(sorted([c for c in cats if c])), 200

    @app.get("/openapi.json")
    def openapi():
        base = {
            "openapi": "3.0.0",
            "info": {"title": "API Talleres", "version": "1.0.0"},
            "paths": {
                "/workshops": {"get": {}, "post": {}},
                "/workshops/{id}": {"get": {}, "put": {}, "delete": {}},
                "/workshops/{id}/register": {"post": {}, "delete": {}},
                "/auth/login": {"post": {}},
                "/auth/estudiantes/registro": {"post": {}},
                "/auth/estudiantes/login": {"post": {}},
                "/auth/estudiantes/me": {"get": {}},
                "/registrations/me": {"get": {}},
                "/students": {"get": {}},
                "/students/{id}": {"get": {}, "put": {}, "delete": {}},
                "/stats": {"get": {}},
                "/categories": {"get": {}},
                "/health": {"get": {}},
            },
        }
        return jsonify(base), 200

    # Salud
    @app.get("/health")
    @limiter.limit("60 per minute")
    def health():
        return jsonify({"ok": True, "timestamp": ahora_iso()}), 200

    # Middleware de seguridad
    @app.before_request
    def security_headers():
        """Añade headers de seguridad a todas las respuestas"""
        # Validar Content-Type para requests POST/PUT
        if request.method in ['POST', 'PUT', 'PATCH']:
            if not request.is_json and request.content_length and request.content_length > 0:
                return jsonify({"mensaje": "Content-Type debe ser application/json"}), 400

    @app.after_request
    def after_request(response):
        """Añade headers de seguridad a todas las respuestas"""
        response.headers['X-Content-Type-Options'] = 'nosniff'
        response.headers['X-Frame-Options'] = 'DENY'
        response.headers['X-XSS-Protection'] = '1; mode=block'
        response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'
        return response

    # Errores
    @app.errorhandler(429)
    def ratelimit_handler(e):
        return jsonify({
            "mensaje": "Demasiadas peticiones",
            "descripcion": "Has excedido el límite de peticiones permitidas",
            "reintentar_en": str(e.retry_after) if hasattr(e, 'retry_after') else "60 segundos"
        }), 429

    @app.errorhandler(404)
    def _404(_):
        return jsonify({"mensaje": "Endpoint no encontrado"}), 404

    @app.errorhandler(405)
    def _405(_):
        return jsonify({"mensaje": "Método HTTP no permitido"}), 405

    @app.errorhandler(400)
    def _400(_):
        return jsonify({"mensaje": "Petición malformada"}), 400

    @app.errorhandler(500)
    def _500(_):
        return jsonify({"mensaje": "Error interno del servidor"}), 500

    return app

app = crear_app()

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001)