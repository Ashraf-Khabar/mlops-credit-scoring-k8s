from fastapi import FastAPI
from routers import credit

app = FastAPI(
    title="API de Credit Scoring",
    description="API avancée d'évaluation des risques de crédit",
    version="1.0.0"
)

# Inclusion des routes
app.include_router(credit.router)

@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "credit-scoring-api"}