from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from jose import JWTError, jwt
from pydantic import BaseModel
from database import get_db, UserDB, CreditHistoryDB, engine, Base
import os

# --- Configuration JWT ---
SECRET_KEY = os.getenv("SECRET_KEY", "super-secret-key-pour-le-dev")
ALGORITHM = "HS256"
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# --- Initialisation FastAPI ---
app = FastAPI(title="CreditPro AI API")

# Configuration CORS pour autoriser Next.js (Port 3000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Fonction de validation de l'utilisateur (Sécurisée anti-crash) ---
def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Identifiants invalides ou jeton expiré",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        # Tente de décoder le JWT. Si le format est mauvais (ex: "null"), ça lève une JWTError
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        # On intercepte l'erreur proprement pour renvoyer une 401 au lieu d'une 500
        raise credentials_exception
        
    user = db.query(UserDB).filter(UserDB.username == username).first()
    if user is None:
        raise credentials_exception
    return user

# --- Modèles de données (Pydantic) ---
class UserCreate(BaseModel):
    username: str
    password: str

class PredictRequest(BaseModel):
    age: int
    income: float
    loan_amount: float
    credit_history_length: int

# --- Routes API ---

@app.post("/register")
def register(user: UserCreate, db: Session = Depends(get_db)):
    # Dans un vrai projet de prod, il faut hasher le mot de passe ici (ex: avec passlib)
    db_user = UserDB(username=user.username, hashed_password=user.password)
    db.add(db_user)
    db.commit()
    return {"message": "Utilisateur créé avec succès"}


@app.post("/token")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(UserDB).filter(UserDB.username == form_data.username).first()
    # Vérification basique (à remplacer par une vérification de hash en prod)
    if not user or user.hashed_password != form_data.password:
        raise HTTPException(status_code=400, detail="Nom d'utilisateur ou mot de passe incorrect")
    
    # Création du vrai jeton JWT
    access_token = jwt.encode({"sub": user.username}, SECRET_KEY, algorithm=ALGORITHM)
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/statistics")
def get_statistics(db: Session = Depends(get_db), current_user: UserDB = Depends(get_current_user)):
    total = db.query(CreditHistoryDB).filter(CreditHistoryDB.user_id == current_user.id).count()
    approved = db.query(CreditHistoryDB).filter(
        CreditHistoryDB.user_id == current_user.id,
        CreditHistoryDB.status.in_(["Approuvé", "Approved"])
    ).count()
    
    rejected = total - approved
    approval_rate = round((approved / total * 100), 1) if total > 0 else 0.0
    
    return {
        "total": total,
        "approved": approved,
        "rejected": rejected,
        "approval_rate": approval_rate
    }

@app.post("/predict")
def predict(request: PredictRequest, db: Session = Depends(get_db), current_user: UserDB = Depends(get_current_user)):
    # Simulation du modèle ML (Placez votre logique de prédiction réelle ici)
    is_approved = request.income > (request.loan_amount * 0.3)
    status_result = "Approuvé" if is_approved else "Refusé"
    probability = 0.85 if is_approved else 0.20

    # Sauvegarde dans PostgreSQL
    history = CreditHistoryDB(
        user_id=current_user.id,
        age=request.age,
        income=request.income,
        loan_amount=request.loan_amount,
        status=status_result
    )
    db.add(history)
    db.commit()

    return {"status": status_result, "probability": probability}