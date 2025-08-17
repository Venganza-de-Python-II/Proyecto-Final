import os

class Config:
    # Variables de entorno con valores por defecto adecuados
    MONGO_URI = os.getenv("MONGO_URI", "mongodb://admin:admin123@localhost:27017/?authSource=admin")
    MONGO_DB_NAME = os.getenv("MONGO_DB_NAME", "talleresdb")
    JWT_SECRET = os.getenv("JWT_SECRET", "supersecreto")
    ADMIN_USER = os.getenv("ADMIN_USER", "admin")
    ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "admin123")
    CORS_ORIGINS = os.getenv("CORS_ORIGINS", "*")
    
    # Configuración de Rate Limiting
    REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")
    RATELIMIT_STORAGE_URL = os.getenv("REDIS_URL", "redis://localhost:6379")
    RATELIMIT_DEFAULT = os.getenv("RATELIMIT_DEFAULT", "100 per hour")