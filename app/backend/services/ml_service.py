import joblib
from models.schemas import CreditRequest, CreditResponse

class CreditModelService:
    def __init__(self):
        # Simulation du chargement : self.model = joblib.load("model.joblib")
        pass

    def predict(self, data: CreditRequest) -> CreditResponse:
        try:
            # Simulation d'inférence ML
            score = (data.income / data.loan_amount) * (data.credit_history_length / 10)
            
            if score > 0.5:
                return CreditResponse(status="Approuvé", probability=0.85, message="Risque faible")
            return CreditResponse(status="Refusé", probability=0.30, message="Risque élevé par rapport aux revenus")
            
        except Exception as e:
            raise ValueError(f"Erreur lors de la prédiction ML : {str(e)}")

ml_service = CreditModelService()