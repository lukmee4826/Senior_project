from fastapi import FastAPI, Depends, UploadFile, File, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List
import crud, models, schemas, analysis
from database import SessionLocal, engine
import shutil
import os
import uuid

# Create tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI()

# CORS configuration
origins = [
    "http://localhost:5173",  # Vite default
    "http://localhost:3000",
    "*" # Allow all for development
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

from fastapi.staticfiles import StaticFiles

# Directory to save uploaded images
UPLOAD_DIR = "uploaded_images"
os.makedirs(UPLOAD_DIR, exist_ok=True)

app.mount("/uploaded_images", StaticFiles(directory=UPLOAD_DIR), name="uploaded_images")

@app.post("/analyze", response_model=schemas.AnalysisResponse)
async def analyze_image(
    file: UploadFile = File(...), 
    microbe_name: str = Form("Test Strain"),
    db: Session = Depends(get_db)
):
    # 1. Save File
    file_extension = file.filename.split(".")[-1]
    new_filename = f"{uuid.uuid4()}.{file_extension}"
    file_path = os.path.join(UPLOAD_DIR, new_filename)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # 2. Run Analysis
    try:
        # Pass the file path to the analysis function
        # This function should be implemented by YOU to return real data
        analysis_results = analysis.analyze_disk_image(file_path)
    except Exception as e:
        # Clean up file if analysis fails
        if os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(status_code=500, detail=str(e))

    # 3. Save to Database
    # Create or get user (Demo User)
    default_email = "demo@example.com"
    user = crud.get_user_by_email(db, default_email)
    if not user:
        user = crud.create_user(db, schemas.UserCreate(
            email=default_email, 
            password="password", 
            full_name="Demo User"
        ))

    # Create Batch
    # You might want to group multiple images into one batch in the future
    batch = crud.create_analysis_batch(db, schemas.AnalysisBatchBase(batch_name=f"Batch {new_filename}"), user.user_id)
    
    # Get or Create Microbe based on input
    # We search by strain_name
    microbe = db.query(models.Microbe).filter(models.Microbe.strain_name == microbe_name).first()
    if not microbe:
        # Create new if not exists
        microbe = models.Microbe(strain_name=microbe_name)
        db.add(microbe)
        db.commit()
        db.refresh(microbe)
    
    plate_data = schemas.PlateBase(
        microbe_id=microbe.microbe_id,
        strain_code=microbe_name, # Using name as code for simplicity
        original_image_url=file_path,
        result_image_url=file_path # Update if you generate a result image
    )
    plate = crud.create_plate(db, plate_data, batch.batch_id)

    # Save Results
    for res in analysis_results:
        # Check if antibiotic exists
        ab_name = res.get('class_name', 'Unknown')
        ab = crud.get_antibiotic_by_name(db, ab_name)
        
        if not ab:
            # Auto-create antibiotic if not found
            ab = models.Antibiotic(name=ab_name, concentration_ug=10) # Default concentration
            db.add(ab)
            db.commit()
            db.refresh(ab)
        
        # Get diameter from analysis
        diameter = res.get('diameter_mm', 0.0) 
        
        result_data = schemas.PlateResultBase(
            antibiotic_id=ab.antibiotic_id,
            diameter_mm=diameter,
            clsi_interpretation="S", # Placeholder: You should add interpretation logic here
            eucast_interpretation="S" # Placeholder
        )
        crud.create_plate_result(db, result_data, plate.plate_id)
    
    # Refresh plate to get results
    db.refresh(plate)

    return {
        "plate": plate,
        "message": "Analysis successful"
    }

@app.get("/")
def read_root():
    return {"Hello": "World"}

@app.get("/batches", response_model=List[schemas.AnalysisBatch])
def read_batches(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    # For demo, getting users from default email
    user = crud.get_user_by_email(db, "demo@example.com")
    if not user:
         raise HTTPException(status_code=404, detail="User not found")
    batches = crud.get_batches_by_user(db, user_id=user.user_id, skip=skip, limit=limit)
    return batches

@app.get("/batches/{batch_id}", response_model=schemas.AnalysisBatch)
def read_batch(batch_id: str, db: Session = Depends(get_db)):
    db_batch = crud.get_batch(db, batch_id=batch_id)
    if db_batch is None:
        raise HTTPException(status_code=404, detail="Batch not found")
    return db_batch
    return db_batch

@app.get("/users/me", response_model=schemas.User)
def read_user_me(db: Session = Depends(get_db)):
    # For demo: always return the demo user
    user = crud.get_user_by_email(db, "demo@example.com")
    if not user:
        # Create if not exists (lazy create like in analyze)
        user = crud.create_user(db, schemas.UserCreate(
            email="demo@example.com", 
            password="password", 
            full_name="Demo User",
            institution="Demo Hospital"
        ))
    return user

@app.put("/users/me", response_model=schemas.User)
def update_user_me(user_update: schemas.UserUpdate, db: Session = Depends(get_db)):
    # For demo: get user by email
    user = crud.get_user_by_email(db, "demo@example.com")
    if not user:
         raise HTTPException(status_code=404, detail="User not found")
    
    updated_user = crud.update_user(db, user.user_id, user_update)
    return updated_user
