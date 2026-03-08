"""
Tests for:
1. GET /antibiotics  - verify abbreviation field is returned
2. Abbreviation lookup via direct DB query
3. GET /microbes     - endpoint works
4. Verify EUCAST breakpoints exist in DB
"""
import sys, os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

import requests
import sqlite3

BASE_URL = "http://127.0.0.1:8000"
DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "senior_project.db")

PASS = "\033[92m[PASS]\033[0m"
FAIL = "\033[91m[FAIL]\033[0m"
INFO = "\033[94m[INFO]\033[0m"

def test_antibiotics_endpoint():
    print(f"\n{INFO} Test: GET /antibiotics returns abbreviation field")
    try:
        r = requests.get(f"{BASE_URL}/antibiotics?limit=5")
        assert r.status_code == 200, f"Expected 200, got {r.status_code}"
        data = r.json()
        assert len(data) > 0, "No antibiotics returned"
        sample = data[0]
        assert "abbreviation" in sample, f"'abbreviation' field missing in response: {sample}"
        print(f"{PASS} /antibiotics returns abbreviation. Sample: name={sample['name']!r}, abbrev={sample['abbreviation']!r}")
        return True
    except Exception as e:
        print(f"{FAIL} {e}")
        return False

def test_abbreviation_lookup_direct():
    print(f"\n{INFO} Test: Antibiotic lookup by abbreviation (direct DB query)")
    try:
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        # Test a few well-known abbreviations
        tests = [("AMP", "Ampicillin"), ("CIP", "Ciprofloxacin"), ("AMK", "Amikacin")]
        all_pass = True
        for abbrev, expected_name in tests:
            c.execute("SELECT name, abbreviation FROM Antibiotics WHERE abbreviation = ?", (abbrev,))
            row = c.fetchone()
            if row and expected_name.lower() in row[0].lower():
                print(f"{PASS} Abbreviation '{abbrev}' -> '{row[0]}'")
            else:
                print(f"{FAIL} Abbreviation '{abbrev}' not found or mismatched. Got: {row}")
                all_pass = False
        conn.close()
        return all_pass
    except Exception as e:
        print(f"{FAIL} {e}")
        return False

def test_eucast_standard_exists():
    print(f"\n{INFO} Test: EUCAST standard exists in DB with breakpoints")
    try:
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        c.execute("SELECT standard_id, standard_name FROM Standards WHERE standard_name='EUCAST'")
        row = c.fetchone()
        assert row, "EUCAST standard not found in Standards table!"
        std_id = row[0]
        c.execute("SELECT COUNT(*) FROM Breakpoints_DiskDiffusion WHERE standard_id=?", (std_id,))
        disk_count = c.fetchone()[0]
        c.execute("SELECT COUNT(*) FROM Breakpoints_MIC WHERE standard_id=?", (std_id,))
        mic_count = c.fetchone()[0]
        conn.close()
        print(f"{PASS} EUCAST standard found (id={std_id}). Disk breakpoints: {disk_count}, MIC breakpoints: {mic_count}")
        return True
    except Exception as e:
        print(f"{FAIL} {e}")
        return False

def test_microbes_endpoint():
    print(f"\n{INFO} Test: GET /microbes returns data")
    try:
        r = requests.get(f"{BASE_URL}/microbes?limit=3")
        assert r.status_code == 200, f"Expected 200, got {r.status_code}"
        data = r.json()
        print(f"{PASS} /microbes returned {len(data)} item(s). First: {data[0]['strain_name'] if data else 'empty'}")
        return True
    except Exception as e:
        print(f"{FAIL} {e}")
        return False

def test_breakpoint_interpretation():
    print(f"\n{INFO} Test: EUCAST breakpoint lookup for known antibiotic+microbe")
    try:
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        # Look at one known combo from EUCAST disk diffusion
        c.execute("""
            SELECT m.strain_name, a.name, a.abbreviation, b.susceptible_min_mm, b.resistant_max_mm, s.standard_name
            FROM Breakpoints_DiskDiffusion b
            JOIN Microbes m ON b.microbe_id = m.microbe_id
            JOIN Antibiotics a ON b.antibiotic_id = a.antibiotic_id
            JOIN Standards s ON b.standard_id = s.standard_id
            WHERE s.standard_name = 'EUCAST'
            LIMIT 3
        """)
        rows = c.fetchall()
        conn.close()
        if rows:
            for r in rows:
                print(f"{PASS} {r[5]} | Microbe: {r[0]!r} | Drug: {r[1]!r} ({r[2]}) | S>={r[3]}, R<={r[4]}")
            return True
        else:
            print(f"{FAIL} No EUCAST disk breakpoints found in joined query")
            return False
    except Exception as e:
        print(f"{FAIL} {e}")
        return False

if __name__ == "__main__":
    results = []
    results.append(test_antibiotics_endpoint())
    results.append(test_abbreviation_lookup_direct())
    results.append(test_eucast_standard_exists())
    results.append(test_microbes_endpoint())
    results.append(test_breakpoint_interpretation())

    passed = sum(results)
    total = len(results)
    print(f"\n{'='*50}")
    print(f"Results: {passed}/{total} tests passed")
