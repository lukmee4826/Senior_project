"""Clean up orphaned antibiotics created by OCR fallback (Disk_1, Disk_2, etc.)."""
from database import SessionLocal
from sqlalchemy import text

db = SessionLocal()

# Find antibiotics that were auto-created from OCR failures
orphans = db.execute(text(
    "SELECT a.antibiotic_id, a.name, a.abbreviation, a.concentration_ug "
    "FROM Antibiotics a "
    "WHERE (a.name LIKE 'Disk_%' OR a.name LIKE 'Unknown%' OR a.name LIKE 'Cn%') "
    "AND a.concentration_ug = 0 "
    "AND a.antibiotic_id NOT IN (SELECT DISTINCT antibiotic_id FROM Breakpoints_DiskDiffusion)"
)).fetchall()

print(f"Found {len(orphans)} orphaned antibiotics:")
for o in orphans:
    print(f"  ID={o[0]} name='{o[1]}' abbr='{o[2]}' conc={o[3]}")

if orphans:
    # Check if any have plate results referencing them
    for o in orphans:
        count = db.execute(text(
            "SELECT COUNT(*) FROM PlateResults WHERE antibiotic_id=:aid"
        ), {"aid": o[0]}).scalar()
        if count > 0:
            print(f"  -> ID={o[0]} has {count} plate results, skipping delete")
        else:
            db.execute(text("DELETE FROM Antibiotics WHERE antibiotic_id=:aid"), {"aid": o[0]})
            print(f"  -> ID={o[0]} deleted (no references)")
    db.commit()
    print("Done!")
else:
    print("No orphaned antibiotics found.")

db.close()
