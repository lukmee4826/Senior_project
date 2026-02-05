from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models import Base, AnalysisBatch
from database import SessionLocal

db = SessionLocal()

try:
    batches = db.query(AnalysisBatch).all()
    print(f"Total Batches Found: {len(batches)}")
    for b in batches:
        print(f"- ID: {b.batch_id}, Name: {b.batch_name}, Created: {b.created_at}")
except Exception as e:
    print(f"Error: {e}")
finally:
    db.close()
