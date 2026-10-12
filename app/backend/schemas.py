from pydantic import BaseModel, Field, field_validator
from typing import Optional, List, Literal
from datetime import datetime
import re


class UserCreate(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=6, max_length=128)
    email: Optional[str] = None
    full_name: Optional[str] = None

    @field_validator("username")
    @classmethod
    def username_ok(cls, v: str) -> str:
        v = v.strip()
        if not re.match(r"^[a-zA-Z0-9_.-]+$", v):
            raise ValueError("Username: lettres, chiffres, . _ - uniquement")
        return v

    @field_validator("email")
    @classmethod
    def email_ok(cls, v: Optional[str]) -> Optional[str]:
        if v is None or v == "":
            return None
        v = v.strip().lower()
        if not re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", v):
            raise ValueError("Email invalide")
        return v


class ProfileUpdate(BaseModel):
    email: Optional[str] = None
    full_name: Optional[str] = None


class UserUpdate(BaseModel):
    email: Optional[str] = None
    full_name: Optional[str] = None
    role: Optional[Literal["user", "admin"]] = None
    is_active: Optional[bool] = None


class PasswordChange(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=6, max_length=128)


class AdminPasswordReset(BaseModel):
    new_password: str = Field(..., min_length=6, max_length=128)


class UserOut(BaseModel):
    id: int
    username: str
    email: Optional[str] = None
    full_name: Optional[str] = None
    role: str
    is_active: bool
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class PredictRequest(BaseModel):
    age: int = Field(..., ge=18, le=100)
    income: float = Field(..., gt=0)
    loan_amount: float = Field(..., gt=0)
    credit_history_length: int = Field(..., ge=0, le=60)


class PredictResponse(BaseModel):
    id: int
    status: str
    probability: float
    message: str


class HistoryItem(BaseModel):
    id: int
    age: int
    income: float
    loan_amount: float
    credit_history_length: Optional[int] = 0
    status: str
    probability: Optional[float] = None
    message: Optional[str] = None
    created_at: Optional[datetime] = None
    username: Optional[str] = None

    class Config:
        from_attributes = True


class HistoryPage(BaseModel):
    items: List[HistoryItem]
    total: int
    page: int
    page_size: int


class Statistics(BaseModel):
    total: int
    approved: int
    rejected: int
    approval_rate: float
    avg_probability: float
    avg_loan_amount: float
    avg_income: float
    recent_7d: int


class PlatformStats(BaseModel):
    users_total: int
    users_active: int
    predictions_total: int
    approval_rate: float
