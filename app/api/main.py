from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from jose import jwt
from datetime import datetime, timedelta
from database import get_db, UserDB, CreditHistoryDB
from models.schemas import CreditRequest, CreditResponse
from services.ml_service import ml_service

app = FastAPI(title="Credit Scoring SaaS")

# Configuration Sécurité
SECRET_KEY = "votre_cle_super_secrete_a_changer_en_production"
ALGORITHM = "HS256"
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# --- ROUTES D'AUTHENTIFICATION ---

@app.post("/token")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(UserDB).filter(UserDB.username == form_data.username).first()
    if not user or not pwd_context.verify(form_data.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Identifiants incorrects")
    
    access_token = jwt.encode(
        {"sub": user.username, "exp": datetime.utcnow() + timedelta(hours=2)},
        SECRET_KEY, algorithm=ALGORITHM
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/register")
def register(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    if db.query(UserDB).filter(UserDB.username == form_data.username).first():
        raise HTTPException(status_code=400, detail="Utilisateur existant")
    new_user = UserDB(username=form_data.username, hashed_password=pwd_context.hash(form_data.password))
    db.add(new_user)
    db.commit()
    return {"message": "Utilisateur créé avec succès"}

# --- ROUTE METIER PROTEGEE ---

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    user = db.query(UserDB).filter(UserDB.username == payload.get("sub")).first()
    if not user:
        raise HTTPException(status_code=401, detail="Non autorisé")
    return user

@app.post("/predict", response_model=CreditResponse)
def predict_credit(request: CreditRequest, db: Session = Depends(get_db), current_user: UserDB = Depends(get_current_user)):
    result = ml_service.predict(request)
    
    # Sauvegarde dans PostgreSQL
    history_entry = CreditHistoryDB(
        user_id=current_user.id,
        age=request.age,
        income=request.income,
        loan_amount=request.loan_amount,
        status=result.status,
        probability=result.probability
    )
    db.add(history_entry)
    db.commit()
    
    return result