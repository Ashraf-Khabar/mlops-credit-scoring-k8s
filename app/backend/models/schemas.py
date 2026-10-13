from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class PredictRequest(BaseModel):
    age: int = Field(..., ge=18, le=100, description="L'âge du demandeur (doit être majeur)")
    income: float = Field(..., gt=0, description="Revenu annuel en euros")
    loan_amount: float = Field(..., gt=0, description="Montant du prêt demandé")
    credit_history_length: int = Field(..., ge=0, description="Durée de l'historique de crédit en années")

class PredictResponse(BaseModel):
    id: Optional[int] = None
    status: str = Field(..., description="'Approuvé' ou 'Refusé'")
    probability: float = Field(..., ge=0, le=1, description="Probabilité de remboursement")
    message: str = Field(..., description="Explication de la décision")

class HistoryItem(BaseModel):
    id: int
    age: int
    income: float
    loan_amount: float
    credit_history_length: int
    status: str
    probability: float
    message: str
    created_at: datetime
    username: Optional[str] = None

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