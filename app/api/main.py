from fastapi import FastAPI
from pydantic import BaseModel

# 1. Initialisation de l'application
app = FastAPI(title="MLOps API", description="API de prédiction pour notre projet")

# 2. Définition du format strict attendu en entrée (Validation Pydantic)
class UserData(BaseModel):
    age: int
    revenu: float

# 3. Route de santé (Healthcheck)
# Kubernetes utilisera cette route en permanence pour vérifier si l'API est plantée
@app.get("/")
def read_root():
    return {"status": "L'API MLOps est en ligne et fonctionnelle !"}

# 4. Route de prédiction (Le cœur du MLOps)
@app.post("/predict")
def make_prediction(data: UserData):
    # Dans un vrai projet, on chargerait ici un modèle scikit-learn ou PyTorch.
    # Pour le test, voici notre logique simulée :
    if data.age > 25 and data.revenu > 30000:
        prediction = "Crédit Accordé"
        probabilite = 0.85
    else:
        prediction = "Crédit Refusé"
        probabilite = 0.40
        
    return {
        "age_recu": data.age,
        "revenu_recu": data.revenu,
        "prediction": prediction,
        "probabilite": probabilite
    }