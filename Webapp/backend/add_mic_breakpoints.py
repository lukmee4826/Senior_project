import os
import sys

# Add the current directory to sys.path to make imports work
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.orm import Session
from database import SessionLocal, engine
import models

# Create tables if they don't exist (this will create Breakpoints_MIC)
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

def get_or_create_antibiotic(db: Session, name: str, abbrev: str, default_concentration: int = 0):
    clean_name = name.strip()
    clean_abbrev = abbrev.strip() if abbrev and abbrev != "-" else None
    
    antibiotic = db.query(models.Antibiotic).filter(
        models.Antibiotic.name == clean_name
    ).first()
    
    if not antibiotic:
        antibiotic = models.Antibiotic(name=clean_name, abbreviation=clean_abbrev, concentration_ug=default_concentration)
        db.add(antibiotic)
        db.commit()
        db.refresh(antibiotic)
    elif clean_abbrev and not antibiotic.abbreviation:
        # Update abbreviation if missing
        antibiotic.abbreviation = clean_abbrev
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

def seed_mic_breakpoints(txt_path: str):
    db = SessionLocal()
    try:
        # Depending on knowledge, we default to EUCAST. We can parse or assume EUCAST for latest data.
        standard = get_or_create_standard(db, "EUCAST", "Latest")
        
        print(f"Reading breakpoints from {txt_path}...")
        
        count = 0
        skipped_existing = 0
        skipped_parse = 0
        
        with open(txt_path, mode='r', encoding='utf-8') as file:
            header = file.readline()
            
            for line in file:
                parts = line.strip('\n').split('\t')
                
                # Check if this row is valid and is an MIC record
                if len(parts) >= 7 and parts[3].strip() == 'MIC':
                    microbe_name = parts[0].strip()
                    medicine_name = parts[1].strip()
                    abbrev = parts[2].strip()
                    
                    res_val = parts[4].strip()
                    int_val = parts[5].strip()
                    sus_val = parts[6].strip()
                    
                    # Parse resistant and susceptible values
                    r_min = parse_float(res_val) # Resistant is generally >= this
                    s_max = parse_float(sus_val) # Susceptible is generally <= this
                    
                    # Parse intermediate range
                    i_min = None
                    i_max = None
                    if int_val and int_val != "-":
                        if "-" in int_val:
                            # E.g., "16-32"
                            int_parts = int_val.split("-")
                            if len(int_parts) == 2:
                                i_min = parse_float(int_parts[0])
                                i_max = parse_float(int_parts[1])
                        else:
                            i_min = parse_float(int_val)
                            i_max = parse_float(int_val)

                    if s_max is None and r_min is None and i_min is None and i_max is None:
                        skipped_parse += 1
                        continue

                    microbe = get_or_create_microbe(db, microbe_name)
                    antibiotic = get_or_create_antibiotic(db, medicine_name, abbrev)
                    
                    bp = db.query(models.BreakpointMIC).filter(
                        models.BreakpointMIC.standard_id == standard.standard_id,
                        models.BreakpointMIC.microbe_id == microbe.microbe_id,
                        models.BreakpointMIC.antibiotic_id == antibiotic.antibiotic_id
                    ).first()
                    
                    if not bp:
                        bp = models.BreakpointMIC(
                            standard_id=standard.standard_id,
                            microbe_id=microbe.microbe_id,
                            antibiotic_id=antibiotic.antibiotic_id,
                            susceptible_max_ug_ml=s_max,
                            resistant_min_ug_ml=r_min,
                            intermediate_min_ug_ml=i_min,
                            intermediate_max_ug_ml=i_max
                        )
                        db.add(bp)
                        db.flush() 
                        count += 1
                    else:
                        skipped_existing += 1
            
            db.commit()
            print(f"Summary:")
            print(f"  - New MIC breakpoints seeded: {count}")
            print(f"  - Skipped (already existed): {skipped_existing}")
            print(f"  - Skipped due to missing values: {skipped_parse}")
            print(f"  - Total processed (MIC only): {count + skipped_existing + skipped_parse}")
            
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
        seed_mic_breakpoints(txt_file_path)
    else:
        print(f"Text file not found at: {txt_file_path}")
