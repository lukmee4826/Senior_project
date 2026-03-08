from fastapi import FastAPI, Depends, UploadFile, File, HTTPException, Form, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import List
from datetime import timedelta
from jose import JWTError, jwt
import crud, models, schemas, analysis, auth
from database import SessionLocal, engine
import shutil
import os
import uuid

# Create tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, auth.SECRET_KEY, algorithms=[auth.ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    user = crud.get_user_by_email(db, email=email)
    if user is None:
        raise credentials_exception
    return user

@app.post("/login", response_model=schemas.Token)
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = crud.get_user_by_email(db, form_data.username)
    if not user or not auth.verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/register", response_model=schemas.User, status_code=status.HTTP_201_CREATED)
def register_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = crud.get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    return crud.create_user(db=db, user=user)

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

from fastapi.staticfiles import StaticFiles

# Directory to save uploaded images
UPLOAD_DIR = "uploaded_images"
os.makedirs(UPLOAD_DIR, exist_ok=True)

app.mount("/uploaded_images", StaticFiles(directory=UPLOAD_DIR), name="uploaded_images")

@app.get("/microbes", response_model=List[schemas.Microbe])
def read_microbes(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    microbes = crud.get_all_microbes(db, skip=skip, limit=limit)
    return microbes

@app.post("/batches", response_model=schemas.AnalysisBatch)
def create_batch(batch: schemas.AnalysisBatchBase, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return crud.create_analysis_batch(db, batch, current_user.user_id)

@app.post("/analyze", response_model=schemas.PlateResultResponse)
async def analyze_image(
    file: UploadFile = File(...), 
    microbe_name: str = Form(...), 
    batch_id: str = Form(None), # Optional batch_id
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # 1. Save File
    file_ext = os.path.splitext(file.filename)[1]
    filename = f"{uuid.uuid4()}{file_ext}"
    file_path = os.path.join(UPLOAD_DIR, filename)
    
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
    # Use Current User

    # Create Batch or Use Existing
    if batch_id:
        batch = crud.get_batch(db, batch_id) # Changed from get_analysis_batch to get_batch
        if not batch:
            raise HTTPException(status_code=404, detail="Batch not found")
    else:
        # Fallback to creating a new batch per image if no batch_id provided
        new_batch_name = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        batch = crud.create_analysis_batch(db, schemas.AnalysisBatchBase(batch_name=f"Batch {new_batch_name}"), current_user.user_id)
    
    # Get or Create Microbe based on input
    microbe = db.query(models.Microbe).filter(models.Microbe.strain_name == microbe_name).first()
    if not microbe:
        microbe = models.Microbe(strain_name=microbe_name)
        db.add(microbe)
        db.commit()
        db.refresh(microbe)
    
    plate_data = schemas.PlateBase(
        microbe_id=microbe.microbe_id,
        strain_code=microbe_name,
        original_image_url=file_path,
        result_image_url=file_path 
    )
    plate = crud.create_plate(db, plate_data, batch.batch_id)

    # Get Standard
    clsi_standard = db.query(models.Standard).filter(models.Standard.standard_name == "CLSI").first()
    eucast_standard = db.query(models.Standard).filter(models.Standard.standard_name == "EUCAST").first()

    for res in analysis_results:
        # Find antibiotic by class_name (abbreviation or full name from YOLO)
        ab_name = res.get('class_name', 'Unknown')
        ab = crud.get_best_antibiotic_match(db, query=ab_name, microbe_id=microbe.microbe_id)
        
        if not ab:
            # Auto-create antibiotic if completely unknown
            ab = models.Antibiotic(name=ab_name, abbreviation=ab_name.upper() if len(ab_name) <= 5 else None, concentration_ug=0)
            db.add(ab)
            db.commit()
            db.refresh(ab)
        
        diameter = res.get('diameter_mm', 0.0)
        
        # Calculate CLSI Interpretation
        clsi_interp = "Unknown"
        if clsi_standard:
            bp = crud.get_breakpoint(db, clsi_standard.standard_id, microbe.microbe_id, ab.antibiotic_id)
            if bp:
                clsi_interp = calculate_interpretation(diameter, bp)

        # Calculate EUCAST Interpretation
        eucast_interp = "Unknown"
        if eucast_standard:
            bp_eu = crud.get_breakpoint(db, eucast_standard.standard_id, microbe.microbe_id, ab.antibiotic_id)
            if bp_eu:
                eucast_interp = calculate_interpretation(diameter, bp_eu)

        result_data = schemas.PlateResultBase(
            antibiotic_id=ab.antibiotic_id,
            diameter_mm=diameter,
            clsi_interpretation=clsi_interp,
            eucast_interpretation=eucast_interp
        )
        crud.create_plate_result(db, result_data, plate.plate_id)
    
    # Refresh plate to get results
    db.refresh(plate)

    return {
        "plate": plate,
        "message": "Analysis successful" if analysis_results else "No Antibiotic Disk Detected"
    }

def calculate_interpretation(diameter: float, bp: models.BreakpointDiskDiffusion) -> str:
    # Logic: R <= resistant_max, S >= susceptible_min
    # Prioritize R, then S, then I?
    
    # 1. Check Resistant
    if bp.resistant_max_mm is not None and diameter <= bp.resistant_max_mm:
        return "R"
    
    # 2. Check Susceptible
    if bp.susceptible_min_mm is not None and diameter >= bp.susceptible_min_mm:
        return "S"
        
    # 3. Check Intermediate
    # Explicit range check or exclusion?
    # If not R and not S, and strictly between?
    if bp.intermediate_min_mm is not None and bp.intermediate_max_mm is not None:
         if bp.intermediate_min_mm <= diameter <= bp.intermediate_max_mm:
             return "I"
             
    # Fallback for implicit Intermediate (between R and S)
    if bp.resistant_max_mm is not None and bp.susceptible_min_mm is not None:
        if bp.resistant_max_mm < diameter < bp.susceptible_min_mm:
            return "I"

    return "Unknown"

@app.get("/")
def read_root():
    return {"Hello": "World"}

@app.get("/plates/{plate_id}/breakpoints")
def get_plate_breakpoints(plate_id: str, db: Session = Depends(get_db)):
    """Return S/I/R mm breakpoint thresholds for each result in a plate."""
    plate = db.query(models.Plate).filter(models.Plate.plate_id == plate_id).first()
    if not plate:
        raise HTTPException(status_code=404, detail="Plate not found")
    clsi_std = db.query(models.Standard).filter(models.Standard.standard_name == "CLSI").first()
    eucast_std = db.query(models.Standard).filter(models.Standard.standard_name == "EUCAST").first()
    result_map = {}
    for res in plate.results:
        clsi_bp = crud.get_breakpoint(db, clsi_std.standard_id, plate.microbe_id, res.antibiotic_id) if clsi_std else None
        eucast_bp = crud.get_breakpoint(db, eucast_std.standard_id, plate.microbe_id, res.antibiotic_id) if eucast_std else None
        result_map[res.result_id] = {
            "clsi": {
                "susceptible_min_mm": clsi_bp.susceptible_min_mm if clsi_bp else None,
                "intermediate_min_mm": clsi_bp.intermediate_min_mm if clsi_bp else None,
                "intermediate_max_mm": clsi_bp.intermediate_max_mm if clsi_bp else None,
                "resistant_max_mm": clsi_bp.resistant_max_mm if clsi_bp else None,
            } if clsi_bp else None,
            "eucast": {
                "susceptible_min_mm": eucast_bp.susceptible_min_mm if eucast_bp else None,
                "intermediate_min_mm": eucast_bp.intermediate_min_mm if eucast_bp else None,
                "intermediate_max_mm": eucast_bp.intermediate_max_mm if eucast_bp else None,
                "resistant_max_mm": eucast_bp.resistant_max_mm if eucast_bp else None,
            } if eucast_bp else None,
        }
    return result_map

@app.get("/batches", response_model=List[schemas.AnalysisBatch])
def read_batches(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    batches = crud.get_batches_by_user(db, user_id=current_user.user_id, skip=skip, limit=limit)
    return batches

@app.get("/batches/{batch_id}", response_model=schemas.AnalysisBatch)
def read_batch(batch_id: str, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    db_batch = crud.get_batch(db, batch_id=batch_id)
    if db_batch is None or db_batch.user_id != current_user.user_id:
        raise HTTPException(status_code=404, detail="Batch not found")
    return db_batch

@app.get("/users/me", response_model=schemas.User)
def read_user_me(current_user: models.User = Depends(get_current_user)):
    return current_user

@app.put("/users/me", response_model=schemas.User)
def update_user_me(user_update: schemas.UserUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    updated_user = crud.update_user(db, current_user.user_id, user_update)
    return updated_user

@app.get("/antibiotics", response_model=List[schemas.Antibiotic])
def read_antibiotics(skip: int = 0, limit: int = 500, microbe_name: str = None, db: Session = Depends(get_db)):
    if microbe_name:
        results = crud.get_antibiotics_by_microbe_name(db, microbe_name)
        if results:
            return results
    return crud.get_all_antibiotics(db, skip=skip, limit=limit)

# --- Standards ---
@app.get("/standards", response_model=List[schemas.Standard])
def read_standards(db: Session = Depends(get_db)):
    return crud.get_all_standards(db)

@app.post("/standards", response_model=schemas.Standard, status_code=201)
def create_standard(body: schemas.StandardCreate, db: Session = Depends(get_db)):
    return crud.create_standard(db, body.standard_name, body.standard_version)

@app.put("/standards/{standard_id}", response_model=schemas.Standard)
def update_standard(standard_id: int, body: schemas.StandardUpdate, db: Session = Depends(get_db)):
    std = crud.update_standard(db, standard_id, body.standard_name, body.standard_version)
    if not std:
        raise HTTPException(status_code=404, detail="Standard not found")
    return std

@app.delete("/standards/{standard_id}")
def delete_standard(standard_id: int, db: Session = Depends(get_db)):
    if not crud.delete_standard(db, standard_id):
        raise HTTPException(status_code=404, detail="Standard not found")
    return {"message": "Deleted"}

# --- Microbes CRUD ---
@app.post("/microbes", response_model=schemas.Microbe, status_code=201)
def create_microbe(body: schemas.MicrobeCreate, db: Session = Depends(get_db)):
    existing = crud.get_microbe_by_name(db, body.strain_name)
    if existing:
        raise HTTPException(status_code=409, detail="Microbe already exists")
    return crud.create_microbe(db, body.strain_name)

@app.put("/microbes/{microbe_id}", response_model=schemas.Microbe)
def update_microbe(microbe_id: int, body: schemas.MicrobeUpdate, db: Session = Depends(get_db)):
    updated = crud.update_microbe(db, microbe_id, body.strain_name)
    if not updated:
        raise HTTPException(status_code=404, detail="Microbe not found")
    return updated

@app.delete("/microbes/{microbe_id}")
def delete_microbe(microbe_id: int, db: Session = Depends(get_db)):
    if not crud.delete_microbe(db, microbe_id):
        raise HTTPException(status_code=404, detail="Microbe not found")
    return {"message": "Deleted"}

# --- Antibiotics CRUD ---
@app.post("/antibiotics", response_model=schemas.Antibiotic, status_code=201)
def create_antibiotic(body: schemas.AntibioticCreate, db: Session = Depends(get_db)):
    return crud.create_antibiotic(db, body.name, body.abbreviation, body.concentration_ug)

@app.put("/antibiotics/{antibiotic_id}", response_model=schemas.Antibiotic)
def update_antibiotic(antibiotic_id: int, body: schemas.AntibioticUpdate, db: Session = Depends(get_db)):
    updated = crud.update_antibiotic(db, antibiotic_id, body.name, body.abbreviation, body.concentration_ug)
    if not updated:
        raise HTTPException(status_code=404, detail="Antibiotic not found")
    return updated

@app.delete("/antibiotics/{antibiotic_id}")
def delete_antibiotic(antibiotic_id: int, db: Session = Depends(get_db)):
    if not crud.delete_antibiotic(db, antibiotic_id):
        raise HTTPException(status_code=404, detail="Antibiotic not found")
    return {"message": "Deleted"}

@app.put("/results/{result_id}", response_model=schemas.PlateResult)
def update_result(result_id: str, result_update: schemas.PlateResultUpdate, db: Session = Depends(get_db)):
    # 1. Get existing result
    result = crud.get_plate_result(db, result_id)
    if not result:
        raise HTTPException(status_code=404, detail="Result not found")
    
    # 2. Update values
    new_ab_id = result_update.antibiotic_id if result_update.antibiotic_id is not None else result.antibiotic_id
    new_diameter = result_update.diameter_mm if result_update.diameter_mm is not None else result.diameter_mm
    
    # 3. Recalculate Logic
    # 3.1 Get Plate -> Microbe
    plate = result.plate
    microbe_id = plate.microbe_id
    
    # 3.2 Get Standards
    clsi_standard = db.query(models.Standard).filter(models.Standard.standard_name == "CLSI").first()
    eucast_standard = db.query(models.Standard).filter(models.Standard.standard_name == "EUCAST").first()
    
    clsi_interp = "Unknown"
    if clsi_standard:
        bp = crud.get_breakpoint(db, clsi_standard.standard_id, microbe_id, new_ab_id)
        if bp:
            clsi_interp = calculate_interpretation(new_diameter, bp)
    
    eucast_interp = "Unknown"
    if eucast_standard:
        bp_eu = crud.get_breakpoint(db, eucast_standard.standard_id, microbe_id, new_ab_id)
        if bp_eu:
            eucast_interp = calculate_interpretation(new_diameter, bp_eu)
    
    # 4. Save
    updated_result = crud.update_plate_result(
        db, 
        result_id, 
        antibiotic_id=new_ab_id, 
        diameter_mm=new_diameter, 
        clsi=clsi_interp, 
        eucast=eucast_interp
    )
    return updated_result

@app.delete("/batches/{batch_id}")
def delete_batch(batch_id: str, db: Session = Depends(get_db)):
    success = crud.delete_batch(db, batch_id)
    if not success:
        raise HTTPException(status_code=404, detail="Batch not found")
    return {"message": "Batch deleted successfully"}

# --- Breakpoint DiskDiffusion CRUD ---
@app.get("/breakpoints")
def read_breakpoints(skip: int = 0, limit: int = 200, microbe_id: int = None, standard_id: int = None, db: Session = Depends(get_db)):
    query = db.query(models.BreakpointDiskDiffusion)
    if microbe_id:
        query = query.filter(models.BreakpointDiskDiffusion.microbe_id == microbe_id)
    if standard_id:
        query = query.filter(models.BreakpointDiskDiffusion.standard_id == standard_id)
    bps = query.offset(skip).limit(limit).all()
    result = []
    for bp in bps:
        result.append({
            "breakpoint_id": bp.breakpoint_id,
            "standard_id": bp.standard_id,
            "standard_name": bp.standard.standard_name if bp.standard else None,
            "microbe_id": bp.microbe_id,
            "strain_name": bp.microbe.strain_name if bp.microbe else None,
            "antibiotic_id": bp.antibiotic_id,
            "antibiotic_name": bp.antibiotic.name if bp.antibiotic else None,
            "antibiotic_abbrev": bp.antibiotic.abbreviation if bp.antibiotic else None,
            "susceptible_min_mm": bp.susceptible_min_mm,
            "intermediate_min_mm": bp.intermediate_min_mm,
            "intermediate_max_mm": bp.intermediate_max_mm,
            "resistant_max_mm": bp.resistant_max_mm,
        })
    return result

@app.get("/breakpoints/count")
def count_breakpoints(db: Session = Depends(get_db)):
    return {"count": crud.get_breakpoints_count(db)}

@app.post("/breakpoints", status_code=201)
def create_breakpoint(body: schemas.BreakpointCreate, db: Session = Depends(get_db)):
    # Check if already exists
    existing = crud.get_breakpoint(db, body.standard_id, body.microbe_id, body.antibiotic_id)
    if existing:
        raise HTTPException(status_code=409, detail="Breakpoint already exists for this combination")
    bp = crud.create_breakpoint(db, body.standard_id, body.microbe_id, body.antibiotic_id,
                                 body.susceptible_min_mm, body.intermediate_min_mm,
                                 body.intermediate_max_mm, body.resistant_max_mm)
    return {
        "breakpoint_id": bp.breakpoint_id, "standard_id": bp.standard_id,
        "microbe_id": bp.microbe_id, "antibiotic_id": bp.antibiotic_id,
        "susceptible_min_mm": bp.susceptible_min_mm, "intermediate_min_mm": bp.intermediate_min_mm,
        "intermediate_max_mm": bp.intermediate_max_mm, "resistant_max_mm": bp.resistant_max_mm,
    }

@app.put("/breakpoints/{breakpoint_id}")
def update_breakpoint(breakpoint_id: int, body: schemas.BreakpointUpdate, db: Session = Depends(get_db)):
    bp = crud.update_breakpoint(db, breakpoint_id,
                                 body.susceptible_min_mm, body.intermediate_min_mm,
                                 body.intermediate_max_mm, body.resistant_max_mm)
    if not bp:
        raise HTTPException(status_code=404, detail="Breakpoint not found")
    return {"breakpoint_id": bp.breakpoint_id, "susceptible_min_mm": bp.susceptible_min_mm,
            "intermediate_min_mm": bp.intermediate_min_mm, "intermediate_max_mm": bp.intermediate_max_mm,
            "resistant_max_mm": bp.resistant_max_mm}

@app.delete("/breakpoints/{breakpoint_id}")
def delete_breakpoint(breakpoint_id: int, db: Session = Depends(get_db)):
    if not crud.delete_breakpoint(db, breakpoint_id):
        raise HTTPException(status_code=404, detail="Breakpoint not found")
    return {"message": "Deleted"}
