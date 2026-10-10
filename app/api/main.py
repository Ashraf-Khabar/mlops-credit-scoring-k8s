from fastapi import FastAPI
from pydantic import BaseModel
import joblib
import numpy as np

app = FastAPI()

# Chargement du modèle d'Intelligence Artificielle
model = joblib.load("model.joblib")

class ClientData(BaseModel):
    age: int
    revenu: float

@app.post("/predict")
async def predict(data: ClientData):
    # Transformation des données en format lisible par le modèle
    features = np.array([[data.age, data.revenu]])
    
    # Génération de la prédiction
    prediction = model.predict(features)[0]
    
    return {"risque": int(prediction)}

@app.get("/health")
def health_check():
    # check health of the application
    return {"status": "healthy"}
