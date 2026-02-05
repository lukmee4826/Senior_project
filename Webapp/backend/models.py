from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, Float, DateTime, UniqueConstraint
from sqlalchemy.orm import relationship
from database import Base
import uuid
from datetime import datetime

def generate_uuid():
    return str(uuid.uuid4())

class Standard(Base):
    __tablename__ = "Standards"

    standard_id = Column(Integer, primary_key=True, index=True)
    standard_name = Column(String, nullable=False)
    standard_version = Column(String, nullable=False)

    breakpoints = relationship("BreakpointDiskDiffusion", back_populates="standard")

class Microbe(Base):
    __tablename__ = "Microbes"

    microbe_id = Column(Integer, primary_key=True, index=True)
    strain_name = Column(String, unique=True, nullable=False)

    breakpoints = relationship("BreakpointDiskDiffusion", back_populates="microbe")
    plates = relationship("Plate", back_populates="microbe")

class Antibiotic(Base):
    __tablename__ = "Antibiotics"

    antibiotic_id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    concentration_ug = Column(Integer, nullable=False)

    __table_args__ = (UniqueConstraint('name', 'concentration_ug', name='_name_concentration_uc'),)

    breakpoints = relationship("BreakpointDiskDiffusion", back_populates="antibiotic")
    plate_results = relationship("PlateResult", back_populates="antibiotic")

class BreakpointDiskDiffusion(Base):
    __tablename__ = "Breakpoints_DiskDiffusion"

    breakpoint_id = Column(Integer, primary_key=True, index=True)
    standard_id = Column(Integer, ForeignKey("Standards.standard_id"), nullable=False)
    microbe_id = Column(Integer, ForeignKey("Microbes.microbe_id"), nullable=False)
    antibiotic_id = Column(Integer, ForeignKey("Antibiotics.antibiotic_id"), nullable=False)

    resistant_max_mm = Column(Integer, nullable=True)
    intermediate_min_mm = Column(Integer, nullable=True)
    intermediate_max_mm = Column(Integer, nullable=True)
    susceptible_min_mm = Column(Integer, nullable=True)

    __table_args__ = (UniqueConstraint('standard_id', 'microbe_id', 'antibiotic_id', name='_std_microbe_ab_uc'),)

    standard = relationship("Standard", back_populates="breakpoints")
    microbe = relationship("Microbe", back_populates="breakpoints")
    antibiotic = relationship("Antibiotic", back_populates="breakpoints")

class User(Base):
    __tablename__ = "Users"

    user_id = Column(String, primary_key=True, default=generate_uuid)
    email = Column(String, unique=True, nullable=False)
    password_hash = Column(String, nullable=False)
    full_name = Column(String, nullable=False)
    institution = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    batches = relationship("AnalysisBatch", back_populates="user", cascade="all, delete-orphan")

class AnalysisBatch(Base):
    __tablename__ = "AnalysisBatch"

    batch_id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("Users.user_id"), nullable=False)
    batch_name = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    user = relationship("User", back_populates="batches")
    plates = relationship("Plate", back_populates="batch", cascade="all, delete-orphan")

class Plate(Base):
    __tablename__ = "Plates"

    plate_id = Column(String, primary_key=True, default=generate_uuid)
    batch_id = Column(String, ForeignKey("AnalysisBatch.batch_id"), nullable=False)
    microbe_id = Column(Integer, ForeignKey("Microbes.microbe_id"), nullable=False)
    strain_code = Column(String, nullable=True)
    original_image_url = Column(String, nullable=False)
    result_image_url = Column(String, nullable=True)

    batch = relationship("AnalysisBatch", back_populates="plates")
    microbe = relationship("Microbe", back_populates="plates")
    results = relationship("PlateResult", back_populates="plate", cascade="all, delete-orphan")

class PlateResult(Base):
    __tablename__ = "PlateResults"

    result_id = Column(String, primary_key=True, default=generate_uuid)
    plate_id = Column(String, ForeignKey("Plates.plate_id"), nullable=False)
    antibiotic_id = Column(Integer, ForeignKey("Antibiotics.antibiotic_id"), nullable=False)
    diameter_mm = Column(Float, nullable=False)
    clsi_interpretation = Column(String, nullable=True)
    eucast_interpretation = Column(String, nullable=True)

    plate = relationship("Plate", back_populates="results")
    antibiotic = relationship("Antibiotic", back_populates="plate_results")
