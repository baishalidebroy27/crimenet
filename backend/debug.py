import asyncio
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from app.db.mongodb_client import mongodb_client

async def run():
    mongodb_client.connect()
    cursor = mongodb_client.db.relationships.find({"source_name": "Vikram Singh", "target_name": "Vikram Singh"})
    rels = await cursor.to_list(100)
    for r in rels:
        print(f"Rel: {r}")

asyncio.run(run())
