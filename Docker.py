import pymongo

uri = "mongodb://admin:admin123@localhost:27017"

try:
    client = pymongo.MongoClient(uri, serverSelectionTimeoutMS=5000)
    client.admin.command('ping')
    print("✔ Connected to MongoDB successfully.")
except ConnectionError as e:
    print("❌ Failed to connect to MongoDB. Please check your connection settings.Error:",e)

