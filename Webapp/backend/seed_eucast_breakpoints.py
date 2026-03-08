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
    if not value or value.strip() == "" or value.strip() == "-":
        return None
    try:
        return float(value)
    except ValueError:
        return None

def seed_eucast_breakpoints(txt_path: str):
    db = SessionLocal()
    try:
        # Create a default "EUCAST" standard
        # The exact version is unknown from the file, we can name it "Latest" or a placeholder.
        standard = get_or_create_standard(db, "EUCAST", "Latest")
        
        print(f"Reading breakpoints from {txt_path}...")
        
        count = 0
        skipped_existing = 0
        skipped_parse = 0
        
        with open(txt_path, mode='r', encoding='utf-8') as file:
            # Skip header
            header = file.readline()
            
            for line in file:
                parts = line.strip('\n').split('\t')
                
                # Check if this row is valid and is a DISK record
                if len(parts) >= 7 and parts[3].strip() == 'DISK':
                    microbe_name = parts[0].strip()
                    medicine_name = parts[1].strip()
                    
                    res_val = parts[4].strip()
                    int_val = parts[5].strip()
                    sus_val = parts[6].strip()
                    
                    # Parse resistant and susceptible values
                    r_max = parse_float(res_val)
                    s_min = parse_float(sus_val)
                    
                    # Parse intermediate range
                    i_min = None
                    i_max = None
                    if int_val and int_val != "-":
                        if "-" in int_val:
                            # E.g., "28-40"
                            int_parts = int_val.split("-")
                            if len(int_parts) == 2:
                                i_min = parse_float(int_parts[0])
                                i_max = parse_float(int_parts[1])
                        else:
                            # Just a single value, unusual for intermediate but possible
                            i_min = parse_float(int_val)
                            i_max = parse_float(int_val)

                    # Only proceed if we have at least one valid breakpoint value
                    if s_min is None and r_max is None and i_min is None and i_max is None:
                        skipped_parse += 1
                        continue

                    microbe = get_or_create_microbe(db, microbe_name)
                    antibiotic = get_or_create_antibiotic(db, medicine_name)
                    
                    # Check if breakpoint exists for this exact combination
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
                        db.flush() # Ensure it's visible for next queries if duplicates arise
                        count += 1
                    else:
                        skipped_existing += 1
            
            db.commit()
            print(f"Summary:")
            print(f"  - New EUCAST breakpoints seeded: {count}")
            print(f"  - Skipped (already existed): {skipped_existing}")
            print(f"  - Skipped due to missing values: {skipped_parse}")
            print(f"  - Total processed (DISK only): {count + skipped_existing + skipped_parse}")
            
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__))) # Webapp/
    project_root = os.path.dirname(base_dir) # Senior_project/
    txt_file_path = os.path.join(project_root, "join_file", "final_breakpoints_with_names_readable.txt")
    
    if os.path.exists(txt_file_path):
        seed_eucast_breakpoints(txt_file_path)
    else:
        print(f"Text file not found at: {txt_file_path}")
