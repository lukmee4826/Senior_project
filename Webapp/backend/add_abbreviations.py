import sqlite3
import os
import sys

# Define proper paths relative to scripts location
base_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(os.path.dirname(base_dir)) # Up from Webapp/backend to Senior_project
db_path = os.path.join(base_dir, "senior_project.db")
txt_path = os.path.join(project_root, "join_file", "final_breakpoints_with_names_readable.txt")

def update_database():
    print(f"Connecting to database at: {db_path}")
    if not os.path.exists(db_path):
        print("Database not found!")
        return
        
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Step 1: Add abbreviation column if it doesn't exist
    try:
        print("Attempting to add 'abbreviation' column...")
        cursor.execute("ALTER TABLE Antibiotics ADD COLUMN abbreviation VARCHAR;")
        print("Column 'abbreviation' added successfully.")
    except sqlite3.OperationalError as e:
        if "duplicate column name" in str(e).lower():
            print("Column 'abbreviation' already exists.")
        else:
            print(f"Error adding column: {e}")
            
    # Step 2: Build abbreviation mapping from the text file
    print(f"Reading abbreviations from {txt_path}...")
    abbrev_map = {}
    if os.path.exists(txt_path):
        with open(txt_path, mode='r', encoding='utf-8') as f:
            header = f.readline() # SKIP HEADER
            for line in f:
                parts = line.strip('\n').split('\t')
                if len(parts) >= 3:
                    medicine_name = parts[1].strip()
                    abbrev = parts[2].strip()
                    if medicine_name and abbrev and abbrev != "-":
                        abbrev_map[medicine_name] = abbrev
                        
        print(f"Loaded {len(abbrev_map)} unique abbreviations.")
    else:
        print("Breakpoints text file not found! Continuing with empty map.")
        
    # Step 3: Populate table
    print("Updating Antibiotics table...")
    cursor.execute("SELECT antibiotic_id, name FROM Antibiotics")
    antibiotics = cursor.fetchall()
    
    update_count = 0
    missing_count = 0
    
    for row in antibiotics:
        aid = row[0]
        name = row[1]
        
        # Exact match or lowercase match
        matched_abbrev = None
        if name in abbrev_map:
            matched_abbrev = abbrev_map[name]
        else:
            # Try case-insensitive comparison
            for k, v in abbrev_map.items():
                if k.lower() == name.lower():
                    matched_abbrev = v
                    break
        
        if matched_abbrev:
            cursor.execute("UPDATE Antibiotics SET abbreviation = ? WHERE antibiotic_id = ?", (matched_abbrev, aid))
            update_count += 1
        else:
            # If not found, use first 3 letters capitalized as fallback
            fallback = name[:3].upper() if len(name) >= 3 else name.upper()
            cursor.execute("UPDATE Antibiotics SET abbreviation = ? WHERE antibiotic_id = ?", (fallback, aid))
            missing_count += 1
            
    conn.commit()
    conn.close()
    
    print(f"Successfully updated {update_count} records safely from text file.")
    if missing_count > 0:
        print(f"Generated {missing_count} fallback abbreviations for unmatched antibiotics.")
    print("Database modification complete!")

if __name__ == "__main__":
    update_database()
