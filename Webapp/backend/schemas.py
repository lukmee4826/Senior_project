from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import uuid

# --- Base Schemas ---

class StandardBase(BaseModel):
    standard_name: str
    standard_version: str

class Standard(StandardBase):
    standard_id: int
    class Config:
        orm_mode = True

class MicrobeBase(BaseModel):
    strain_name: str

class Microbe(MicrobeBase):
    microbe_id: int
    class Config:
        orm_mode = True

class AntibioticBase(BaseModel):
    name: str
    concentration_ug: int

class Antibiotic(AntibioticBase):
    antibiotic_id: int
    class Config:
        orm_mode = True

class PlateResultBase(BaseModel):
    antibiotic_id: int
    diameter_mm: float
    clsi_interpretation: Optional[str] = None
    eucast_interpretation: Optional[str] = None

class PlateResult(PlateResultBase):
    result_id: str
    antibiotic: Optional[Antibiotic] = None
    class Config:
        orm_mode = True

class PlateBase(BaseModel):
    microbe_id: int
    strain_code: Optional[str] = None
    original_image_url: str
    result_image_url: Optional[str] = None

class Plate(PlateBase):
    plate_id: str
    batch_id: str
    results: List[PlateResult] = []
    class Config:
        orm_mode = True

class AnalysisBatchBase(BaseModel):
    batch_name: Optional[str] = None

class AnalysisBatch(AnalysisBatchBase):
    batch_id: str
    user_id: str
    created_at: datetime
    plates: List[Plate] = []
    class Config:
        orm_mode = True

class UserBase(BaseModel):
    email: str
    full_name: str
    institution: Optional[str] = None

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    institution: Optional[str] = None
    email: Optional[str] = None

class UserCreate(UserBase):
    password: str

class User(UserBase):
    user_id: str
    created_at: datetime
    # batches: List[AnalysisBatch] = [] # Avoid circular dependency or too much nesting for now
    class Config:
        orm_mode = True

# --- API Specific Schemas ---

class AnalysisResponse(BaseModel):
    plate: Plate
    message: str
