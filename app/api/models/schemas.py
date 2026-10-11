from pydantic import BaseModel, Field

class CreditRequest(BaseModel):
    age: int = Field(..., ge=18, le=100, description="L'âge du demandeur (doit être majeur)")
    income: float = Field(..., gt=0, description="Revenu annuel en euros")
    loan_amount: float = Field(..., gt=0, description="Montant du prêt demandé")
    credit_history_length: int = Field(..., ge=0, description="Durée de l'historique de crédit en années")

class CreditResponse(BaseModel):
    status: str = Field(..., description="'Approuvé' ou 'Refusé'")
    probability: float = Field(..., ge=0, le=1, description="Probabilité de remboursement")
    message: str = Field(..., description="Explication de la décision")