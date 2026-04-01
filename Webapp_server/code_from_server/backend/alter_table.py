import sqlite3

DB_PATH = "senior_project.db"

# SQLite ALTER TABLE only supports ADD COLUMN.
# Keep these nullable so legacy rows continue to work.
COLUMNS_TO_ADD: dict[str, str] = {
    "bbox_x1": "REAL",
    "bbox_y1": "REAL",
    "bbox_x2": "REAL",
    "bbox_y2": "REAL",
    "disk_used_idx": "INTEGER",
}


def main() -> None:
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    for col, col_type in COLUMNS_TO_ADD.items():
        try:
            cur.execute(f"ALTER TABLE PlateResults ADD COLUMN {col} {col_type};")
            print(f"Added column {col} ({col_type}) successfully.")
        except sqlite3.OperationalError as e:
            print(f"OperationalError for {col}: {e} (Column might already exist)")

    conn.commit()
    conn.close()


if __name__ == "__main__":
    main()
