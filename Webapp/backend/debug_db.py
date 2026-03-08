import sqlite3

conn = sqlite3.connect('senior_project.db')
cur = conn.cursor()

cur.execute("SELECT plate_id, microbe_id, strain_code FROM Plates LIMIT 3")
print("PLATES:", cur.fetchall())

cur.execute("SELECT COUNT(*) FROM Breakpoints_DiskDiffusion")
print("BP COUNT:", cur.fetchone()[0])

cur.execute("SELECT standard_id, microbe_id, antibiotic_id, susceptible_min_mm, resistant_max_mm FROM Breakpoints_DiskDiffusion LIMIT 3")
print("BP SAMPLE:", cur.fetchall())

cur.execute("SELECT result_id, plate_id, antibiotic_id, clsi_interpretation FROM PlateResults LIMIT 5")
print("RESULTS:", cur.fetchall())

# Check microbe_id overlap
cur.execute("SELECT DISTINCT microbe_id FROM Plates")
plate_microbes = set(r[0] for r in cur.fetchall())
print("Plate microbe_ids:", plate_microbes)

cur.execute("SELECT DISTINCT microbe_id FROM Breakpoints_DiskDiffusion")
bp_microbes = set(r[0] for r in cur.fetchall())
print("Breakpoint microbe_ids (first 5):", list(bp_microbes)[:5])

print("OVERLAP:", plate_microbes & bp_microbes)

# For one specific plate result, try the join
cur.execute("""
    SELECT pr.result_id, pr.antibiotic_id, pr.clsi_interpretation, 
           p.microbe_id, p.plate_id,
           bp.susceptible_min_mm, bp.resistant_max_mm
    FROM PlateResults pr
    JOIN Plates p ON p.plate_id = pr.plate_id
    LEFT JOIN Breakpoints_DiskDiffusion bp ON 
        bp.microbe_id = p.microbe_id AND bp.antibiotic_id = pr.antibiotic_id
    LIMIT 5
""")
print("JOINED:", cur.fetchall())

conn.close()
