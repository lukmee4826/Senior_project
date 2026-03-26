from pydantic import BaseModel, field_validator
from typing import List, Optional
from datetime import datetime
import uuid

# --- Base Schemas ---

class Token(BaseModel):
    access_token: str
    token_type: str

class StandardBase(BaseModel):
    standard_name: str
    standard_version: str

class Standard(StandardBase):
    standard_id: int
    class Config:
        from_attributes = True

class BreakpointDiskDiffusionDetail(BaseModel):
    breakpoint_id: int
    standard_id: int
    standard_name: Optional[str] = None
    microbe_id: int
    strain_name: Optional[str] = None
    antibiotic_id: int
    antibiotic_name: Optional[str] = None
    antibiotic_abbrev: Optional[str] = None
    susceptible_min_mm: Optional[int] = None
    intermediate_min_mm: Optional[int] = None
    intermediate_max_mm: Optional[int] = None
    resistant_max_mm: Optional[int] = None

class BreakpointCreate(BaseModel):
    standard_id: int
    microbe_id: int
    antibiotic_id: int
    susceptible_min_mm: Optional[int] = None
    intermediate_min_mm: Optional[int] = None
    intermediate_max_mm: Optional[int] = None
    resistant_max_mm: Optional[int] = None

class BreakpointUpdate(BaseModel):
    susceptible_min_mm: Optional[int] = None
    intermediate_min_mm: Optional[int] = None
    intermediate_max_mm: Optional[int] = None
    resistant_max_mm: Optional[int] = None

class MicrobeBase(BaseModel):
    strain_name: str

class Microbe(MicrobeBase):
    microbe_id: int
    class Config:
        from_attributes = True

class MicrobeCreate(BaseModel):
    strain_name: str

class MicrobeUpdate(BaseModel):
    strain_name: str

class AntibioticBase(BaseModel):
    name: str
    abbreviation: Optional[str] = None
    concentration_ug: int

class Antibiotic(AntibioticBase):
    antibiotic_id: int
    class Config:
        from_attributes = True

class AntibioticCreate(BaseModel):
    name: str
    abbreviation: Optional[str] = None
    concentration_ug: int = 0

class AntibioticUpdate(BaseModel):
    name: Optional[str] = None
    abbreviation: Optional[str] = None
    concentration_ug: Optional[int] = None

class StandardCreate(BaseModel):
    standard_name: str
    standard_version: str

class StandardUpdate(BaseModel):
    standard_name: Optional[str] = None
    standard_version: Optional[str] = None

class BreakpointMICBase(BaseModel):
    standard_id: int
    microbe_id: int
    antibiotic_id: int
    susceptible_max_ug_ml: Optional[float] = None
    intermediate_min_ug_ml: Optional[float] = None
    intermediate_max_ug_ml: Optional[float] = None
    resistant_min_ug_ml: Optional[float] = None

class BreakpointMIC(BreakpointMICBase):
    breakpoint_id: int
    class Config:
        from_attributes = True

class PlateResultBase(BaseModel):
    antibiotic_id: int
    diameter_mm: float
    clsi_interpretation: Optional[str] = None
    eucast_interpretation: Optional[str] = None

class PlateResult(PlateResultBase):
    result_id: str
    antibiotic: Optional[Antibiotic] = None
    class Config:
        from_attributes = True

class PlateResultUpdate(BaseModel):
    antibiotic_id: Optional[int] = None
    diameter_mm: Optional[float] = None

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
        from_attributes = True

class AnalysisBatchBase(BaseModel):
    batch_name: Optional[str] = None

class AnalysisBatch(AnalysisBatchBase):
    batch_id: str
    user_id: str
    created_at: datetime
    plates: List[Plate] = []
    class Config:
        from_attributes = True

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

    @field_validator("password")
    @classmethod
    def validate_password_bcrypt_limit(cls, v: str) -> str:
        if len(v.encode("utf-8")) > 72:
            raise ValueError("Password cannot be longer than 72 bytes.")
        return v

class User(UserBase):
    user_id: str
    created_at: datetime
    # batches: List[AnalysisBatch] = [] # Avoid circular dependency or too much nesting for now
    class Config:
        from_attributes = True

# --- API Specific Schemas ---

class AnalysisResponse(BaseModel):
    plate: Plate
    message: str

class PlateResultResponse(BaseModel):
    plate: Plate
    message: str
