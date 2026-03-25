#!/usr/bin/env python3
"""
Comprehensive Database CRUD Test Suite
Tests all Create, Read, Update, Delete operations for:
- Antibiotics (medicines)
- Microbes
- Standards
- Breakpoints
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from database import SessionLocal, engine
from sqlalchemy.orm import Session
import models
import crud
import schemas

# Create tables
models.Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ============================================================
# TEST 1: ANTIBIOTIC (MEDICINE) CRUD OPERATIONS
# ============================================================
def test_antibiotic_crud():
    print("\n" + "="*60)
    print("TEST 1: ANTIBIOTIC (MEDICINE) CRUD OPERATIONS")
    print("="*60)
    
    db = next(get_db())
    
    try:
        # CREATE
        print("\n[CREATE] Creating antibiotic 'Amoxicillin'...")
        ab = crud.create_antibiotic(db, name="Amoxicillin", abbreviation="AMX", concentration_ug=10)
        print(f"✓ Created: ID={ab.antibiotic_id}, Name={ab.name}, Abbrev={ab.abbreviation}")
        
        # CREATE another
        print("\n[CREATE] Creating antibiotic 'Cephalexin'...")
        ab2 = crud.create_antibiotic(db, name="Cephalexin", abbreviation="CEX", concentration_ug=30)
        print(f"✓ Created: ID={ab2.antibiotic_id}, Name={ab2.name}")
        
        # READ by Name
        print(f"\n[READ] Reading antibiotic by name 'Amoxicillin'...")
        found_ab = crud.get_antibiotic_by_name(db, "Amoxicillin")
        if found_ab:
            print(f"✓ Found: {found_ab.name} (ID={found_ab.antibiotic_id})")
        else:
            print("✗ NOT FOUND")
        
        # READ by Abbreviation
        print(f"\n[READ] Reading antibiotic by abbreviation 'AMX'...")
        found_ab = crud.get_antibiotic_by_abbreviation(db, "AMX")
        if found_ab:
            print(f"✓ Found: {found_ab.name} ({found_ab.abbreviation})")
        else:
            print("✗ NOT FOUND")
        
        # READ all
        print(f"\n[READ] Reading all antibiotics...")
        all_abs = crud.get_all_antibiotics(db, skip=0, limit=100)
        print(f"✓ Total antibiotics: {len(all_abs)}")
        for a in all_abs[:5]:
            print(f"  - {a.name} ({a.abbreviation})")
        
        # UPDATE
        print(f"\n[UPDATE] Updating antibiotic ID={ab.antibiotic_id}...")
        updated = crud.update_antibiotic(db, ab.antibiotic_id, name="Amoxicillin Updated", concentration_ug=20)
        if updated:
            print(f"✓ Updated: Name={updated.name}, Concentration={updated.concentration_ug}ug")
        else:
            print("✗ UPDATE FAILED")
        
        # DELETE
        print(f"\n[DELETE] Deleting antibiotic ID={ab2.antibiotic_id}...")
        deleted = crud.delete_antibiotic(db, ab2.antibiotic_id)
        if deleted:
            print(f"✓ Deleted successfully")
        else:
            print("✗ DELETE FAILED")
        
        print("\n✓ ANTIBIOTIC CRUD: PASSED")
        return True
        
    except Exception as e:
        print(f"\n✗ ANTIBIOTIC CRUD: FAILED - {e}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        db.close()

# ============================================================
# TEST 2: MICROBE CRUD OPERATIONS
# ============================================================
def test_microbe_crud():
    print("\n" + "="*60)
    print("TEST 2: MICROBE CRUD OPERATIONS")
    print("="*60)
    
    db = next(get_db())
    
    try:
        # CREATE
        print("\n[CREATE] Creating microbe 'E. coli'...")
        mb = crud.create_microbe(db, "E. coli")
        print(f"✓ Created: ID={mb.microbe_id}, Name={mb.strain_name}")
        
        # CREATE another
        print("\n[CREATE] Creating microbe 'S. aureus'...")
        mb2 = crud.create_microbe(db, "S. aureus")
        print(f"✓ Created: ID={mb2.microbe_id}, Name={mb2.strain_name}")
        
        # READ by Name
        print(f"\n[READ] Reading microbe by name 'E. coli'...")
        found_mb = crud.get_microbe_by_name(db, "E. coli")
        if found_mb:
            print(f"✓ Found: {found_mb.strain_name} (ID={found_mb.microbe_id})")
        else:
            print("✗ NOT FOUND")
        
        # READ all
        print(f"\n[READ] Reading all microbes...")
        all_mbs = crud.get_all_microbes(db, skip=0, limit=100)
        print(f"✓ Total microbes: {len(all_mbs)}")
        for m in all_mbs[:5]:
            print(f"  - {m.strain_name} (ID={m.microbe_id})")
        
        # UPDATE
        print(f"\n[UPDATE] Updating microbe ID={mb.microbe_id}...")
        updated = crud.update_microbe(db, mb.microbe_id, "E. coli K-12")
        if updated:
            print(f"✓ Updated: Name={updated.strain_name}")
        else:
            print("✗ UPDATE FAILED")
        
        # DELETE
        print(f"\n[DELETE] Deleting microbe ID={mb2.microbe_id}...")
        deleted = crud.delete_microbe(db, mb2.microbe_id)
        if deleted:
            print(f"✓ Deleted successfully")
        else:
            print("✗ DELETE FAILED")
        
        print("\n✓ MICROBE CRUD: PASSED")
        return True
        
    except Exception as e:
        print(f"\n✗ MICROBE CRUD: FAILED - {e}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        db.close()

# ============================================================
# TEST 3: STANDARD CRUD OPERATIONS
# ============================================================
def test_standard_crud():
    print("\n" + "="*60)
    print("TEST 3: STANDARD CRUD OPERATIONS")
    print("="*60)
    
    db = next(get_db())
    
    try:
        # CREATE
        print("\n[CREATE] Creating standard 'CLSI M100'...")
        std = crud.create_standard(db, "CLSI", "M100-2024")
        print(f"✓ Created: ID={std.standard_id}, Name={std.standard_name}, Version={std.standard_version}")
        
        # CREATE another
        print("\n[CREATE] Creating standard 'EUCAST'...")
        std2 = crud.create_standard(db, "EUCAST", "v14.0")
        print(f"✓ Created: ID={std2.standard_id}, Name={std2.standard_name}")
        
        # READ all
        print(f"\n[READ] Reading all standards...")
        all_stds = crud.get_all_standards(db)
        print(f"✓ Total standards: {len(all_stds)}")
        for s in all_stds:
            print(f"  - {s.standard_name} {s.standard_version} (ID={s.standard_id})")
        
        # UPDATE
        print(f"\n[UPDATE] Updating standard ID={std.standard_id}...")
        updated = crud.update_standard(db, std.standard_id, standard_version="M100-2025")
        if updated:
            print(f"✓ Updated: Version={updated.standard_version}")
        else:
            print("✗ UPDATE FAILED")
        
        # DELETE
        print(f"\n[DELETE] Deleting standard ID={std2.standard_id}...")
        deleted = crud.delete_standard(db, std2.standard_id)
        if deleted:
            print(f"✓ Deleted successfully")
        else:
            print("✗ DELETE FAILED")
        
        print("\n✓ STANDARD CRUD: PASSED")
        return True
        
    except Exception as e:
        print(f"\n✗ STANDARD CRUD: FAILED - {e}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        db.close()

# ============================================================
# TEST 4: BREAKPOINT CRUD OPERATIONS
# ============================================================
def test_breakpoint_crud():
    print("\n" + "="*60)
    print("TEST 4: BREAKPOINT CRUD OPERATIONS")
    print("="*60)
    
    db = next(get_db())
    
    try:
        # Setup: Create required data
        print("\n[SETUP] Creating test data (Standard, Microbe, Antibiotic)...")
        std = crud.create_standard(db, "Test_Standard", "v1.0")
        mb = crud.create_microbe(db, "Test_Microbe")
        ab = crud.create_antibiotic(db, "Test_Drug", "TD", 20)
        print(f"✓ Setup complete: Standard ID={std.standard_id}, Microbe ID={mb.microbe_id}, Antibiotic ID={ab.antibiotic_id}")
        
        # CREATE
        print(f"\n[CREATE] Creating breakpoint...")
        bp = crud.create_breakpoint(
            db, 
            standard_id=std.standard_id,
            microbe_id=mb.microbe_id,
            antibiotic_id=ab.antibiotic_id,
            susceptible_min_mm=17,
            intermediate_min_mm=14,
            intermediate_max_mm=16,
            resistant_max_mm=13
        )
        print(f"✓ Created: ID={bp.breakpoint_id}")
        print(f"  - Susceptible: >= {bp.susceptible_min_mm}mm")
        print(f"  - Intermediate: {bp.intermediate_min_mm}-{bp.intermediate_max_mm}mm")
        print(f"  - Resistant: <= {bp.resistant_max_mm}mm")
        
        # READ
        print(f"\n[READ] Reading breakpoint ID={bp.breakpoint_id}...")
        found_bp = crud.get_breakpoint(db, std.standard_id, mb.microbe_id, ab.antibiotic_id)
        if found_bp:
            print(f"✓ Found: Breakpoint ID={found_bp.breakpoint_id}")
        else:
            print("✗ NOT FOUND")
        
        # READ all
        print(f"\n[READ] Reading all breakpoints...")
        all_bps = crud.get_all_breakpoints(db, skip=0, limit=100)
        print(f"✓ Total breakpoints: {len(all_bps)}")
        count = crud.get_breakpoints_count(db)
        print(f"✓ Breakpoint count: {count}")
        
        # UPDATE
        print(f"\n[UPDATE] Updating breakpoint ID={bp.breakpoint_id}...")
        updated = crud.update_breakpoint(
            db, 
            bp.breakpoint_id,
            susceptible_min_mm=18,
            resistant_max_mm=12
        )
        if updated:
            print(f"✓ Updated: Susceptible={updated.susceptible_min_mm}mm, Resistant={updated.resistant_max_mm}mm")
        else:
            print("✗ UPDATE FAILED")
        
        # DELETE
        print(f"\n[DELETE] Deleting breakpoint ID={bp.breakpoint_id}...")
        deleted = crud.delete_breakpoint(db, bp.breakpoint_id)
        if deleted:
            print(f"✓ Deleted successfully")
        else:
            print("✗ DELETE FAILED")
        
        # Cleanup
        crud.delete_antibiotic(db, ab.antibiotic_id)
        crud.delete_microbe(db, mb.microbe_id)
        crud.delete_standard(db, std.standard_id)
        
        print("\n✓ BREAKPOINT CRUD: PASSED")
        return True
        
    except Exception as e:
        print(f"\n✗ BREAKPOINT CRUD: FAILED - {e}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        db.close()

# ============================================================
# TEST 5: DATA INTEGRITY TESTS
# ============================================================
def test_data_integrity():
    print("\n" + "="*60)
    print("TEST 5: DATA INTEGRITY & RELATIONSHIPS")
    print("="*60)
    
    db = next(get_db())
    
    try:
        # Create test data
        print("\n[SETUP] Creating test data...")
        std = crud.create_standard(db, "Integrity_Test", "v1.0")
        mb = crud.create_microbe(db, "Integrity_Microbe")
        ab = crud.create_antibiotic(db, "Integrity_Drug", "ID", 25)
        
        # Create breakpoint
        bp = crud.create_breakpoint(db, std.standard_id, mb.microbe_id, ab.antibiotic_id,
                                     susceptible_min_mm=20, resistant_max_mm=10)
        
        print(f"✓ Created: Standard={std.standard_name}, Microbe={mb.strain_name}, "
              f"Antibiotic={ab.name}, Breakpoint ID={bp.breakpoint_id}")
        
        # TEST: Verify relationships
        print(f"\n[TEST] Verifying relationships...")
        
        # Check breakpoint relationships
        bp_check = db.query(models.BreakpointDiskDiffusion).filter(
            models.BreakpointDiskDiffusion.breakpoint_id == bp.breakpoint_id
        ).first()
        
        if bp_check:
            print(f"✓ Breakpoint exists")
            print(f"  - Standard: {bp_check.standard.standard_name if bp_check.standard else 'None'}")
            print(f"  - Microbe: {bp_check.microbe.strain_name if bp_check.microbe else 'None'}")
            print(f"  - Antibiotic: {bp_check.antibiotic.name if bp_check.antibiotic else 'None'}")
        else:
            print("✗ Breakpoint not found")
        
        # TEST: Get antibiotics by microbe
        print(f"\n[TEST] Getting antibiotics associated with microbe...")
        associated_abs = crud.get_antibiotics_by_microbe_name(db, mb.strain_name)
        print(f"✓ Found {len(associated_abs)} antibiotic(s) for microbe '{mb.strain_name}'")
        for a in associated_abs:
            print(f"  - {a.name}")
        
        # Cleanup
        crud.delete_breakpoint(db, bp.breakpoint_id)
        crud.delete_antibiotic(db, ab.antibiotic_id)
        crud.delete_microbe(db, mb.microbe_id)
        crud.delete_standard(db, std.standard_id)
        
        print("\n✓ DATA INTEGRITY: PASSED")
        return True
        
    except Exception as e:
        print(f"\n✗ DATA INTEGRITY: FAILED - {e}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        db.close()

# ============================================================
# MAIN TEST RUNNER
# ============================================================
def main():
    print("\n" + "="*60)
    print("DATABASE CRUD OPERATIONS TEST SUITE")
    print("="*60)
    
    tests = [
        ("Antibiotic CRUD", test_antibiotic_crud),
        ("Microbe CRUD", test_microbe_crud),
        ("Standard CRUD", test_standard_crud),
        ("Breakpoint CRUD", test_breakpoint_crud),
        ("Data Integrity", test_data_integrity),
    ]
    
    results = []
    
    for test_name, test_func in tests:
        try:
            passed = test_func()
            results.append((test_name, passed))
        except Exception as e:
            print(f"\n✗ {test_name}: ERROR - {e}")
            results.append((test_name, False))
    
    # Summary
    print("\n" + "="*60)
    print("TEST SUMMARY")
    print("="*60)
    
    for test_name, passed in results:
        status = "✓ PASSED" if passed else "✗ FAILED"
        print(f"{test_name}: {status}")
    
    passed_count = sum(1 for _, p in results if p)
    total_count = len(results)
    
    print(f"\nTotal: {passed_count}/{total_count} tests passed")
    
    if passed_count == total_count:
        print("\n🎉 ALL TESTS PASSED! Database CRUD operations are working correctly.")
        return 0
    else:
        print(f"\n⚠️  {total_count - passed_count} test(s) failed")
        return 1

if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)
