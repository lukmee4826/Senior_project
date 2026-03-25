"""Check duplicate antibiotics for Gentamicin."""
from database import SessionLocal
from sqlalchemy import text

db = SessionLocal()

# All antibiotics with 'Gentamicin' or 'CN' 
print("=== All Gentamicin/CN antibiotics ===")
for a in db.execute(text(
    "SELECT antibiotic_id, name, abbreviation, concentration_ug FROM Antibiotics "
    "WHERE LOWER(name) LIKE '%gentamicin%' OR LOWER(name) LIKE '%cn%' OR abbreviation='CN' "
    "ORDER BY antibiotic_id"
)).fetchall():
    # Check if this ID has any breakpoints
    bp_count = db.execute(text(
        "SELECT COUNT(*) FROM Breakpoints_DiskDiffusion WHERE antibiotic_id=:aid"
    ), {"aid": a[0]}).scalar()
    print(f"  ID={a[0]:4d} name='{a[1]}' abbr='{a[2]}' conc={a[3]} breakpoints={bp_count}")

# Check: What's the actual abbreviation stored for the one WITH breakpoints?
print("\n=== Breakpoints with CN abbreviation ===")
for b in db.execute(text(
    "SELECT a.antibiotic_id, a.name, a.abbreviation, a.concentration_ug, COUNT(*) as bp_count "
    "FROM Antibiotics a JOIN Breakpoints_DiskDiffusion bd ON a.antibiotic_id=bd.antibiotic_id "
    "WHERE a.abbreviation='CN' OR LOWER(a.name) LIKE '%gentamicin%' "
    "GROUP BY a.antibiotic_id"
)).fetchall():
    print(f"  ID={b[0]:4d} name='{b[1]}' abbr='{b[2]}' conc={b[3]} bp_count={b[4]}")

# Check what the Disk_4 and Disk_5 are
print("\n=== Disk_N antibiotics (auto-created from OCR) ===")
for a in db.execute(text(
    "SELECT antibiotic_id, name, abbreviation, concentration_ug FROM Antibiotics "
    "WHERE name LIKE 'Disk%' ORDER BY antibiotic_id"
)).fetchall():
    print(f"  ID={a[0]:4d} name='{a[1]}' abbr='{a[2]}' conc={a[3]}")

db.close()
