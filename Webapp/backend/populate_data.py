from sqlalchemy.orm import Session
from database import SessionLocal, engine
import models, schemas, crud
import uuid
from datetime import datetime, timedelta
import random

# Create tables if they don't exist
models.Base.metadata.create_all(bind=engine)

def init_db():
    db = SessionLocal()
    try:
        # 1. Ensure Demo User Exists
        email = "demo@example.com"
        user = crud.get_user_by_email(db, email)
        if not user:
            print(f"Creating user {email}...")
            user = crud.create_user(db, schemas.UserCreate(
                email=email,
                password="password",
                full_name="Demo User"
            ))
        else:
            print(f"User {email} already exists.")

        # 2. Create Microbes if missing
        microbes = [
            {"name": "E. coli", "code": "EC"},
            {"name": "S. aureus", "code": "SA"},
            {"name": "P. aeruginosa", "code": "PA"},
        ]
        
        db_microbes = {}
        for m in microbes:
            microbe = db.query(models.Microbe).filter(models.Microbe.strain_name == m["name"]).first()
            if not microbe:
                microbe = models.Microbe(strain_name=m["name"])
                db.add(microbe)
                db.commit()
                db.refresh(microbe)
            db_microbes[m["name"]] = microbe

        # 3. Create Antibiotics if missing
        antibiotics_data = [
            {"name": "Ampicillin", "conc": 10},
            {"name": "Ciprofloxacin", "conc": 5},
            {"name": "Gentamicin", "conc": 10},
            {"name": "Tetracycline", "conc": 30},
        ]
        
        db_antibiotics = []
        for a in antibiotics_data:
            ab = crud.get_antibiotic_by_name(db, a["name"])
            if not ab:
                ab = models.Antibiotic(name=a["name"], concentration_ug=a["conc"])
                db.add(ab)
                db.commit()
                db.refresh(ab)
            db_antibiotics.append(ab)

        # 4. Create Sample Batches
        # Batch 1: E. coli (Yesterday)
        batch1_name = "Batch E. coli Analysis"
        created_at1 = datetime.utcnow() - timedelta(days=1)
        
        # Check if batch exists to avoid dupes on re-run (simple check)
        existing_batch = db.query(models.AnalysisBatch).filter(models.AnalysisBatch.batch_name == batch1_name).first()
        
        if not existing_batch:
            print(f"Creating {batch1_name}...")
            batch1 = models.AnalysisBatch(
                user_id=user.user_id,
                batch_name=batch1_name,
                created_at=created_at1
            )
            db.add(batch1)
            db.commit()
            db.refresh(batch1)
            
            # Plate for Batch 1
            plate1 = models.Plate(
                batch_id=batch1.batch_id,
                microbe_id=db_microbes["E. coli"].microbe_id,
                original_image_url="http://localhost:8000/static/sample1.jpg", # Fake URL
                result_image_url="http://localhost:8000/static/sample1_result.jpg"
            )
            db.add(plate1)
            db.commit()
            db.refresh(plate1)
            
            # Results for Plate 1
            for ab in db_antibiotics:
                # Random realistic zone sizes
                diameter = round(random.uniform(10.0, 35.0), 1)
                # Mock interpretation
                interp = "S" if diameter > 20 else ("I" if diameter > 15 else "R")
                
                res = models.PlateResult(
                    plate_id=plate1.plate_id,
                    antibiotic_id=ab.antibiotic_id,
                    diameter_mm=diameter,
                    clsi_interpretation=interp,
                    eucast_interpretation=interp
                )
                db.add(res)
            db.commit()

        # Batch 2: S. aureus (Today)
        batch2_name = "Batch S. aureus Urgent"
        created_at2 = datetime.utcnow()
        
        existing_batch2 = db.query(models.AnalysisBatch).filter(models.AnalysisBatch.batch_name == batch2_name).first()
        
        if not existing_batch2:
            print(f"Creating {batch2_name}...")
            batch2 = models.AnalysisBatch(
                user_id=user.user_id,
                batch_name=batch2_name,
                created_at=created_at2
            )
            db.add(batch2)
            db.commit()
            db.refresh(batch2)
            
            # Plate for Batch 2
            plate2 = models.Plate(
                batch_id=batch2.batch_id,
                microbe_id=db_microbes["S. aureus"].microbe_id,
                original_image_url="http://localhost:8000/static/sample2.jpg",
                result_image_url="http://localhost:8000/static/sample2_result.jpg"
            )
            db.add(plate2)
            db.commit()
            db.refresh(plate2)
            
            # Results for Plate 2
            for ab in db_antibiotics[:3]: # Only first 3
                diameter = round(random.uniform(10.0, 35.0), 1)
                interp = "S" if diameter > 18 else "R"
                
                res = models.PlateResult(
                    plate_id=plate2.plate_id,
                    antibiotic_id=ab.antibiotic_id,
                    diameter_mm=diameter,
                    clsi_interpretation=interp,
                    eucast_interpretation=interp
                )
                db.add(res)
            db.commit()

        print("Data population complete!")

    finally:
        db.close()

if __name__ == "__main__":
    init_db()
