from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import os

from database import SessionLocal, UserDB, init_db
from auth_utils import hash_password
from routers import auth, users, credit

app = FastAPI(
    title="CreditPro AI API",
    description="SaaS de scoring crédit — auth, users, prédictions",
    version="2.0.0",
)

origins = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in origins],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# SOLUTION ICI : On ajoute le préfixe "/api" à tous vos routeurs.
# Ainsi, "/register" devient "/api/register" et "/token" devient "/api/token"
app.include_router(auth.router, prefix="/api")
app.include_router(users.router, prefix="/api")
app.include_router(credit.router, prefix="/api")

# On laisse le health_check à la racine ("/") pour que les sondes Kubernetes fonctionnent
@app.get("/health")
def health_check():
    return {"status": "ok", "version": "2.0.0"}


def seed_admin():
    db: Session = SessionLocal()
    try:
        admin_user = os.getenv("ADMIN_USERNAME", "admin")
        admin_pass = os.getenv("ADMIN_PASSWORD", "admin123")
        existing = db.query(UserDB).filter(UserDB.username == admin_user).first()
        if not existing:
            db.add(
                UserDB(
                    username=admin_user,
                    email="admin@creditpro.ai",
                    full_name="Administrateur",
                    hashed_password=hash_password(admin_pass),
                    role="admin",
                    is_active=True,
                )
            )
            db.commit()
        elif existing.role != "admin":
            existing.role = "admin"
            db.commit()
    finally:
        db.close()


@app.on_event("startup")
def on_startup():
    init_db()
    seed_admin()