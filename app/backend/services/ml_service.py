from typing import Tuple
from schemas import PredictRequest


class CreditModelService:
    def predict(self, data: PredictRequest) -> Tuple[str, float, str]:
        """Heuristic scoring (replace with joblib model when ready)."""
        income_ratio = data.income / max(data.loan_amount, 1)
        history_factor = min(data.credit_history_length / 10.0, 1.5)
        age_factor = 1.0 if 25 <= data.age <= 55 else 0.85

        score = income_ratio * history_factor * age_factor

        if score >= 0.9:
            return "Approuvé", min(0.95, 0.55 + score * 0.2), "Profil solide — risque faible"
        if score >= 0.45:
            return "Approuvé", min(0.88, 0.5 + score * 0.25), "Ratio revenus/prêt acceptable"
        return (
            "Refusé",
            max(0.08, min(0.4, score * 0.5)),
            "Risque élevé par rapport aux revenus et à l'historique",
        )


ml_service = CreditModelService()
