from fastapi import APIRouter, HTTPException
from models.schemas import CreditRequest, CreditResponse
from services.ml_service import ml_service

router = APIRouter(prefix="/credit", tags=["Scoring"])

@router.post("/predict", response_model=CreditResponse)
async def predict_credit_score(request: CreditRequest):
    try:
        result = ml_service.predict(request)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Une erreur interne est survenue.")