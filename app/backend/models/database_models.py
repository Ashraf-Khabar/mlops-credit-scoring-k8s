from sqlalchemy import Column, Integer, Float, Boolean, DateTime
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime

Base = declarative_base()

class CreditPrediction(Base):
    __tablename__ = "credit_predictions"

    id = Column(Integer, primary_key=True, index=True)
    age = Column(Integer, nullable=False)
    income = Column(Float, nullable=False)
    loan_amount = Column(Float, nullable=False)
    credit_history_length = Column(Integer, nullable=False)
    
    # Résultat du modèle ML
    probability = Column(Float, nullable=False)
    approved = Column(Boolean, nullable=False)
    
    # Audit trail
    created_at = Column(DateTime, default=datetime.utcnow)