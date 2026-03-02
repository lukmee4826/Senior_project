import csv
import os
import sys

# Add the current directory to sys.path to make imports work
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.orm import Session
from database import SessionLocal, engine
import models

# Create tables if they don't exist
models.Base.metadata.create_all(bind=engine)

def get_or_create_standard(db: Session, name: str, version: str):
    standard = db.query(models.Standard).filter(models.Standard.standard_name == name).first()
    if not standard:
        standard = models.Standard(standard_name=name, standard_version=version)
        db.add(standard)
        db.commit()
        db.refresh(standard)
    return standard

def get_or_create_microbe(db: Session, name: str):
    # Specific fix for "S.pneumoniae" and others in the CSV that might have varying formats
    # For now, we use the name exactly as it appears in the CSV or clean it if needed
    clean_name = name.strip()
    microbe = db.query(models.Microbe).filter(models.Microbe.strain_name == clean_name).first()
    if not microbe:
        microbe = models.Microbe(strain_name=clean_name)
        db.add(microbe)
        db.commit()
        db.refresh(microbe)
    return microbe

def get_or_create_antibiotic(db: Session, name: str, default_concentration: int = 0):
    clean_name = name.strip()
    # Check if exists (ignore concentration for existence check if unique constraint allows, 
    # but here constraint is (name, concentration). 
    # The CSV doesn't have concentration. We will use a default or try to find existing.
    
    # Ideally we should parse concentration from name if present, e.g., "Gentamicin 10µg"
    # But current CSV is just names like "Gentamicin".
    # We will assume a default concentration of 0 or dummy for now as the CSV is missing it.
    
    antibiotic = db.query(models.Antibiotic).filter(
        models.Antibiotic.name == clean_name
    ).first()
    
    if not antibiotic:
        antibiotic = models.Antibiotic(name=clean_name, concentration_ug=default_concentration)
        db.add(antibiotic)
        db.commit()
        db.refresh(antibiotic)
    return antibiotic

def parse_float(value):
    if not value or value.strip() == "":
        return None
    try:
        return float(value)
    except ValueError:
        return None

def seed_breakpoints(csv_path: str):
    db = SessionLocal()
    try:
        # Create a default "CLSI" standard
        standard = get_or_create_standard(db, "CLSI", "2024")
        
        print(f"Reading breakpoints from {csv_path}...")
        
        with open(csv_path, mode='r', encoding='utf-8') as csvfile:
            reader = csv.DictReader(csvfile)
            count = 0
            skipped_empty = 0
            skipped_existing = 0
            
            for row in reader:
                microbe_name = row['microbe_name']
                medicine_name = row['medicine_name']
                
                # S/I/R values
                s_min = parse_float(row['susceptible_min_mm'])
                r_max = parse_float(row['resistant_max_mm'])
                i_min = parse_float(row['intermediate_min_mm'])
                i_max = parse_float(row['intermediate_max_mm'])
                
                # Skip if all are None (no breakpoints)
                # FIX: User wants to keep them even if empty
                # if s_min is None and r_max is None and i_min is None and i_max is None:
                #    skipped_empty += 1
                #    continue

                microbe = get_or_create_microbe(db, microbe_name)
                antibiotic = get_or_create_antibiotic(db, medicine_name)
                
                # Check if breakpoint exists
                bp = db.query(models.BreakpointDiskDiffusion).filter(
                    models.BreakpointDiskDiffusion.standard_id == standard.standard_id,
                    models.BreakpointDiskDiffusion.microbe_id == microbe.microbe_id,
                    models.BreakpointDiskDiffusion.antibiotic_id == antibiotic.antibiotic_id
                ).first()
                
                if not bp:
                    bp = models.BreakpointDiskDiffusion(
                        standard_id=standard.standard_id,
                        microbe_id=microbe.microbe_id,
                        antibiotic_id=antibiotic.antibiotic_id,
                        susceptible_min_mm=s_min,
                        resistant_max_mm=r_max,
                        intermediate_min_mm=i_min,
                        intermediate_max_mm=i_max
                    )
                    db.add(bp)
                    db.flush() # Ensure it's visible for next queries
                    count += 1
                else:
                    skipped_existing += 1
            
            db.commit()
            print(f"Summary:")
            print(f"  - New breakpoints seeded: {count}")
            print(f"  - Skipped (already existed): {skipped_existing}")
            print(f"  - Skipped (no breakpoint data): {skipped_empty}")
            print(f"  - Total processed: {count + skipped_existing + skipped_empty}")
            
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    # Path to the CSV file
    # Assuming the script is run from backend/ directory and CSV is in root or relative
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__))) # Webapp/
    project_root = os.path.dirname(base_dir) # Senior_project/
    csv_file_path = os.path.join(project_root, "cleaned_breakpoints_final.csv")
    
    if os.path.exists(csv_file_path):
        seed_breakpoints(csv_file_path)
    else:
        print(f"CSV file not found at: {csv_file_path}")
