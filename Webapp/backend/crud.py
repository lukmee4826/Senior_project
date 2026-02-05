from sqlalchemy.orm import Session
import models, schemas
import uuid
import datetime

def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()

def create_user(db: Session, user: schemas.UserCreate):
    # In a real app, hash the password!
    fake_hashed_password = user.password + "notreallyhashed"
    db_user = models.User(
        email=user.email,
        password_hash=fake_hashed_password,
        full_name=user.full_name,
        institution=user.institution
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def update_user(db: Session, user_id: str, user_update: schemas.UserUpdate):
    db_user = db.query(models.User).filter(models.User.user_id == user_id).first()
    if db_user:
        if user_update.full_name:
            db_user.full_name = user_update.full_name
        if user_update.institution:
            db_user.institution = user_update.institution
        # Note: Email update usually requires verification, skipping for now or allow if needed
        # if user_update.email: 
        #    db_user.email = user_update.email
        db.commit()
        db.refresh(db_user)
    return db_user

def create_analysis_batch(db: Session, batch: schemas.AnalysisBatchBase, user_id: str):
    db_batch = models.AnalysisBatch(**batch.dict(), user_id=user_id)
    db.add(db_batch)
    db.commit()
    db.refresh(db_batch)
    return db_batch

def create_plate(db: Session, plate: schemas.PlateBase, batch_id: str):
    db_plate = models.Plate(**plate.dict(), batch_id=batch_id)
    db.add(db_plate)
    db.commit()
    db.refresh(db_plate)
    return db_plate

def create_plate_result(db: Session, result: schemas.PlateResultBase, plate_id: str):
    db_result = models.PlateResult(**result.dict(), plate_id=plate_id)
    db.add(db_result)
    db.commit()
    db.refresh(db_result)
    return db_result

def get_batches_by_user(db: Session, user_id: str, skip: int = 0, limit: int = 100):
    return db.query(models.AnalysisBatch)\
             .filter(models.AnalysisBatch.user_id == user_id)\
             .order_by(models.AnalysisBatch.created_at.desc())\
             .offset(skip).limit(limit).all()

def get_batch(db: Session, batch_id: str):
    return db.query(models.AnalysisBatch).filter(models.AnalysisBatch.batch_id == batch_id).first()


def get_microbe_by_name(db: Session, name: str):
    return db.query(models.Microbe).filter(models.Microbe.strain_name == name).first()

def get_antibiotic_by_name(db: Session, name: str):
    return db.query(models.Antibiotic).filter(models.Antibiotic.name == name).first()
