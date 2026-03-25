from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
import models, schemas, auth
import uuid
import datetime

def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()

def create_user(db: Session, user: schemas.UserCreate):
    hashed_password = auth.get_password_hash(user.password)
    db_user = models.User(
        email=user.email,
        password_hash=hashed_password,
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

def get_all_microbes(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Microbe).offset(skip).limit(limit).all()

def get_antibiotic_by_name(db: Session, name: str):
    return db.query(models.Antibiotic).filter(models.Antibiotic.name == name).first()

def get_antibiotic_by_abbreviation(db: Session, abbreviation: str):
    return db.query(models.Antibiotic).filter(models.Antibiotic.abbreviation == abbreviation.upper()).first()

def get_antibiotic_by_name_or_abbrev(db: Session, query: str):
    """Look up antibiotic by full name first, then fall back to abbreviation."""
    ab = db.query(models.Antibiotic).filter(models.Antibiotic.name == query).first()
    if not ab:
        ab = db.query(models.Antibiotic).filter(models.Antibiotic.abbreviation == query.upper()).first()
    return ab

def _extract_abbreviation(text: str) -> str:
    """Extract abbreviation from OCR text like 'Cn10' -> 'CN', 'AMC20' -> 'AMC', 'CN 10' -> 'CN'."""
    import re
    # Remove numbers and special characters, keep only letters
    letters_only = re.sub(r'[^A-Za-z]', '', text)
    return letters_only.upper() if letters_only else ""

def _extract_parts(query: str) -> list:
    """Extract all possible search terms from OCR text.
    E.g. 'Cn10 Gentamicin' -> ['CN10 GENTAMICIN', 'CN10', 'GENTAMICIN', 'CN', 'GENTAMICIN']
    """
    import re
    parts = []
    query_stripped = query.strip()
    
    # Full query as-is
    parts.append(query_stripped)
    
    # Split by spaces and try each word
    words = query_stripped.split()
    for w in words:
        parts.append(w)
        # Extract letters-only from each word (e.g. 'Cn10' -> 'CN')
        letters = re.sub(r'[^A-Za-z]', '', w)
        if letters and letters.upper() != w.upper():
            parts.append(letters)
    
    # Also try letters-only from the full first word
    if words:
        first_letters = re.sub(r'[^A-Za-z]', '', words[0])
        if first_letters:
            parts.append(first_letters)
    
    # Remove duplicates while preserving order
    seen = set()
    unique = []
    for p in parts:
        p_upper = p.upper()
        if p_upper not in seen and len(p_upper) >= 1:
            seen.add(p_upper)
            unique.append(p)
    
    return unique

def get_best_antibiotic_match(db: Session, query: str, microbe_id: int):
    """
    Look up antibiotic with improved fuzzy matching for OCR output.
    Handles cases like 'Cn10 Gentamicin', 'AMC 20', 'AMP', etc.
    Prioritizes matches that have breakpoints for the given microbe.
    """
    import re
    
    if not query or query.strip() == "" or query.startswith("Disk_") or query == "Unknown":
        return None
    
    # Generate all possible search terms from OCR text
    search_parts = _extract_parts(query)
    
    # Phase 1: Try to find exact match WITH breakpoint for this microbe
    for part in search_parts:
        # Try as abbreviation
        ab = db.query(models.Antibiotic).join(models.BreakpointDiskDiffusion).filter(
            models.Antibiotic.abbreviation == part.upper(),
            models.BreakpointDiskDiffusion.microbe_id == microbe_id
        ).first()
        if ab: return ab
        
        # Try as exact name (case-insensitive)
        ab = db.query(models.Antibiotic).join(models.BreakpointDiskDiffusion).filter(
            models.Antibiotic.name.ilike(part),
            models.BreakpointDiskDiffusion.microbe_id == microbe_id
        ).first()
        if ab: return ab

    # Phase 2: Try partial/contains name match WITH breakpoint
    for part in search_parts:
        if len(part) >= 3:  # Only try contains-match for 3+ chars
            ab = db.query(models.Antibiotic).join(models.BreakpointDiskDiffusion).filter(
                models.Antibiotic.name.ilike(f"%{part}%"),
                models.BreakpointDiskDiffusion.microbe_id == microbe_id
            ).first()
            if ab: return ab

    # Phase 3: Fallback — match WITHOUT breakpoint constraint
    for part in search_parts:
        ab = db.query(models.Antibiotic).filter(
            models.Antibiotic.abbreviation == part.upper()
        ).first()
        if ab: return ab
        
        ab = db.query(models.Antibiotic).filter(
            models.Antibiotic.name.ilike(part)
        ).first()
        if ab: return ab

    # Phase 4: Partial name match without breakpoint
    for part in search_parts:
        if len(part) >= 3:
            ab = db.query(models.Antibiotic).filter(
                models.Antibiotic.name.ilike(f"%{part}%")
            ).first()
            if ab: return ab

    return None

def get_all_antibiotics(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Antibiotic).offset(skip).limit(limit).all()

def get_breakpoint(db: Session, standard_id: int, microbe_id: int, antibiotic_id: int):
    return db.query(models.BreakpointDiskDiffusion).filter(
        models.BreakpointDiskDiffusion.standard_id == standard_id,
        models.BreakpointDiskDiffusion.microbe_id == microbe_id,
        models.BreakpointDiskDiffusion.antibiotic_id == antibiotic_id
    ).first()

def delete_batch(db: Session, batch_id: str):
    batch = db.query(models.AnalysisBatch).filter(models.AnalysisBatch.batch_id == batch_id).first()
    if batch:
        db.delete(batch)
        db.commit()
        return True
    return False

def get_plate_result(db: Session, result_id: str):
    return db.query(models.PlateResult).filter(models.PlateResult.result_id == result_id).first()

def update_plate_result(db: Session, result_id: str, antibiotic_id: int, diameter_mm: float, clsi: str, eucast: str):
    result = db.query(models.PlateResult).filter(models.PlateResult.result_id == result_id).first()
    if result:
        result.antibiotic_id = antibiotic_id
        result.diameter_mm = diameter_mm
        result.clsi_interpretation = clsi
        result.eucast_interpretation = eucast
        db.commit()
        db.refresh(result)
    return result

def get_batch(db: Session, batch_id: str):
    return db.query(models.AnalysisBatch).filter(models.AnalysisBatch.batch_id == batch_id).first()

# --- Microbe CRUD ---
def create_microbe(db: Session, strain_name: str):
    microbe = models.Microbe(strain_name=strain_name.strip())
    db.add(microbe)
    db.commit()
    db.refresh(microbe)
    return microbe

def update_microbe(db: Session, microbe_id: int, strain_name: str):
    microbe = db.query(models.Microbe).filter(models.Microbe.microbe_id == microbe_id).first()
    if microbe:
        microbe.strain_name = strain_name.strip()
        db.commit()
        db.refresh(microbe)
    return microbe

def delete_microbe(db: Session, microbe_id: int):
    microbe = db.query(models.Microbe).filter(models.Microbe.microbe_id == microbe_id).first()
    if microbe:
        try:
            db.delete(microbe)
            db.commit()
            return True
        except IntegrityError:
            db.rollback()
            raise ValueError("ไม่สามารถลบเชื้อนี้ได้ เนื่องจากมี Breakpoint หรือ Plate ที่อ้างอิงอยู่")
    return False

# --- Antibiotic CRUD ---
def create_antibiotic(db: Session, name: str, abbreviation: str = None, concentration_ug: int = 0):
    ab = models.Antibiotic(name=name.strip(), abbreviation=abbreviation, concentration_ug=concentration_ug)
    db.add(ab)
    db.commit()
    db.refresh(ab)
    return ab

def update_antibiotic(db: Session, antibiotic_id: int, name: str = None, abbreviation: str = None, concentration_ug: int = None):
    ab = db.query(models.Antibiotic).filter(models.Antibiotic.antibiotic_id == antibiotic_id).first()
    if ab:
        if name is not None: ab.name = name.strip()
        if abbreviation is not None: ab.abbreviation = abbreviation.strip()
        if concentration_ug is not None: ab.concentration_ug = concentration_ug
        db.commit()
        db.refresh(ab)
    return ab

def delete_antibiotic(db: Session, antibiotic_id: int):
    ab = db.query(models.Antibiotic).filter(models.Antibiotic.antibiotic_id == antibiotic_id).first()
    if ab:
        try:
            db.delete(ab)
            db.commit()
            return True
        except IntegrityError:
            db.rollback()
            raise ValueError("ไม่สามารถลบยานี้ได้ เนื่องจากมี Breakpoint หรือผลการวิเคราะห์ที่อ้างอิงอยู่")
    return False

def get_antibiotics_by_microbe_name(db: Session, microbe_name: str):
    """Return antibiotics that have at least one breakpoint for the given microbe."""
    microbe = db.query(models.Microbe).filter(models.Microbe.strain_name == microbe_name).first()
    if not microbe:
        return []
    ab_ids = db.query(models.BreakpointDiskDiffusion.antibiotic_id).filter(
        models.BreakpointDiskDiffusion.microbe_id == microbe.microbe_id
    ).distinct().all()
    ids = [r[0] for r in ab_ids]
    if not ids:
        return []
    return db.query(models.Antibiotic).filter(models.Antibiotic.antibiotic_id.in_(ids)).all()

# --- Standard CRUD ---
def get_all_standards(db: Session):
    return db.query(models.Standard).all()

def create_standard(db: Session, standard_name: str, standard_version: str):
    std = models.Standard(standard_name=standard_name.strip(), standard_version=standard_version.strip())
    db.add(std)
    db.commit()
    db.refresh(std)
    return std

def update_standard(db: Session, standard_id: int, standard_name: str = None, standard_version: str = None):
    std = db.query(models.Standard).filter(models.Standard.standard_id == standard_id).first()
    if std:
        if standard_name is not None: std.standard_name = standard_name.strip()
        if standard_version is not None: std.standard_version = standard_version.strip()
        db.commit()
        db.refresh(std)
    return std

def delete_standard(db: Session, standard_id: int):
    std = db.query(models.Standard).filter(models.Standard.standard_id == standard_id).first()
    if std:
        try:
            db.delete(std)
            db.commit()
            return True
        except IntegrityError:
            db.rollback()
            raise ValueError("ไม่สามารถลบ Standard นี้ได้ เนื่องจากมี Breakpoint ที่อ้างอิงอยู่")
    return False

# --- Breakpoint DiskDiffusion CRUD ---
def get_all_breakpoints(db, skip=0, limit=200):
    import models
    return db.query(models.BreakpointDiskDiffusion).offset(skip).limit(limit).all()

def get_breakpoints_count(db):
    import models
    return db.query(models.BreakpointDiskDiffusion).count()

def create_breakpoint(db, standard_id, microbe_id, antibiotic_id,
                      susceptible_min_mm=None, intermediate_min_mm=None,
                      intermediate_max_mm=None, resistant_max_mm=None):
    import models
    bp = models.BreakpointDiskDiffusion(
        standard_id=standard_id, microbe_id=microbe_id, antibiotic_id=antibiotic_id,
        susceptible_min_mm=susceptible_min_mm,
        intermediate_min_mm=intermediate_min_mm,
        intermediate_max_mm=intermediate_max_mm,
        resistant_max_mm=resistant_max_mm
    )
    db.add(bp); db.commit(); db.refresh(bp)
    return bp

def update_breakpoint(db, breakpoint_id, susceptible_min_mm=None,
                      intermediate_min_mm=None, intermediate_max_mm=None, resistant_max_mm=None):
    import models
    bp = db.query(models.BreakpointDiskDiffusion).filter(
        models.BreakpointDiskDiffusion.breakpoint_id == breakpoint_id).first()
    if bp:
        if susceptible_min_mm is not None: bp.susceptible_min_mm = susceptible_min_mm
        if intermediate_min_mm is not None: bp.intermediate_min_mm = intermediate_min_mm
        if intermediate_max_mm is not None: bp.intermediate_max_mm = intermediate_max_mm
        if resistant_max_mm is not None: bp.resistant_max_mm = resistant_max_mm
        db.commit(); db.refresh(bp)
    return bp

def delete_breakpoint(db, breakpoint_id):
    import models
    bp = db.query(models.BreakpointDiskDiffusion).filter(
        models.BreakpointDiskDiffusion.breakpoint_id == breakpoint_id).first()
    if bp:
        db.delete(bp); db.commit()
        return True
    return False
