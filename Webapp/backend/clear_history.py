"""Clear all analysis history (PlateResults, Plates, AnalysisBatch) for all users."""
from database import SessionLocal
from sqlalchemy import text

db = SessionLocal()
db.execute(text("PRAGMA foreign_keys=ON"))
db.execute(text("DELETE FROM PlateResults"))
db.execute(text("DELETE FROM Plates"))
db.execute(text("DELETE FROM AnalysisBatch"))
db.commit()

r1 = db.execute(text("SELECT COUNT(*) FROM PlateResults")).scalar()
r2 = db.execute(text("SELECT COUNT(*) FROM Plates")).scalar()
r3 = db.execute(text("SELECT COUNT(*) FROM AnalysisBatch")).scalar()
print(f"Done! Remaining: PlateResults={r1}, Plates={r2}, AnalysisBatch={r3}")
db.close()
