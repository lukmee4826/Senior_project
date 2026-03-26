import os
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from dotenv import load_dotenv

load_dotenv()

# Secret key to encode the JWT token
SECRET_KEY = os.getenv("SECRET_KEY", "09d25e094faa6ca2556c818166b7a9563b93f7099f6f0f4caa6cf63b88e8d3e7")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7 # 7 days
MAX_BCRYPT_PASSWORD_BYTES = 72

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def verify_password(plain_password, hashed_password):
    # bcrypt only supports passwords up to 72 bytes.
    if password_too_long(plain_password):
        return False
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password):
    validate_password_length(password)
    return pwd_context.hash(password)


def password_too_long(password: str) -> bool:
    return len(password.encode("utf-8")) > MAX_BCRYPT_PASSWORD_BYTES


def validate_password_length(password: str) -> None:
    if password_too_long(password):
        raise ValueError(
            f"Password is too long. Maximum length is {MAX_BCRYPT_PASSWORD_BYTES} bytes for bcrypt."
        )


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt
