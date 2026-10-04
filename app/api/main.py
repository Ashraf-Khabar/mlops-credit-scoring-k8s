from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware

# Test du pipeline CI.

# L'API avec documentation Swagger intégrée
app = FastAPI(
    title="API Credit Scoring",
    description="Prédiction du risque de défaut de paiement",
    version="1.0.0"
)

# Configuration CORS indispensable pour autoriser le frontend (Nginx) à appeler l'API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # En production, remplacez "*" par l'URL exacte du frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Structure attendue en entrée
class DonneesClient(BaseModel):
    age: int
    revenu: float

@app.post("/predict")
def predict_score(donnees: DonneesClient):
    # Logique de prédiction (à remplacer par votre modèle IA plus tard)
    ratio = donnees.revenu / donnees.age
    risque = "Élevé" if ratio < 1000 else "Faible"
    
    return {
        "donnees_recues": {"age": donnees.age, "revenu": donnees.revenu},
        "score_calcule": round(ratio, 2),
        "niveau_risque": risque
    }