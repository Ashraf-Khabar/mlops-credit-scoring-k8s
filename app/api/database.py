from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime
from sqlalchemy.orm import declarative_base, sessionmaker
from datetime import datetime

# L'URL pointe vers le Service Kubernetes 'postgres-svc'
SQLALCHEMY_DATABASE_URL = "postgresql://admin:adminpassword@postgres-svc:5432/credit_db"

engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Modèle Utilisateur
class UserDB(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)

# Modèle Historique des requêtes
class CreditHistoryDB(Base):
    __tablename__ = "credit_history"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer)
    age = Column(Integer)
    income = Column(Float)
    loan_amount = Column(Float)
    status = Column(String)
    probability = Column(Float)
    created_at = Column(DateTime, default=datetime.utcnow)

# Création des tables
Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()