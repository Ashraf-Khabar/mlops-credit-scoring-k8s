from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta
from database import get_db, UserDB, CreditHistoryDB
from schemas import (
    PredictRequest,
    PredictResponse,
    HistoryItem,
    HistoryPage,
    Statistics,
)
from deps import get_current_user, require_admin
from services.ml_service import ml_service

router = APIRouter(tags=["credit"])


@router.get("/statistics", response_model=Statistics)
def get_statistics(
    db: Session = Depends(get_db),
    current_user: UserDB = Depends(get_current_user),
):
    base = db.query(CreditHistoryDB).filter(CreditHistoryDB.user_id == current_user.id)
    total = base.count()
    approved = base.filter(
        CreditHistoryDB.status.in_(["Approuvé", "Approved"])
    ).count()
    rejected = total - approved
    approval_rate = round((approved / total * 100), 1) if total else 0.0

    avg_prob = (
        db.query(func.avg(CreditHistoryDB.probability))
        .filter(CreditHistoryDB.user_id == current_user.id)
        .scalar()
    )
    avg_loan = (
        db.query(func.avg(CreditHistoryDB.loan_amount))
        .filter(CreditHistoryDB.user_id == current_user.id)
        .scalar()
    )
    avg_income = (
        db.query(func.avg(CreditHistoryDB.income))
        .filter(CreditHistoryDB.user_id == current_user.id)
        .scalar()
    )

    week_ago = datetime.utcnow() - timedelta(days=7)
    recent_7d = (
        db.query(CreditHistoryDB)
        .filter(
            CreditHistoryDB.user_id == current_user.id,
            CreditHistoryDB.created_at >= week_ago,
        )
        .count()
    )

    return Statistics(
        total=total,
        approved=approved,
        rejected=rejected,
        approval_rate=approval_rate,
        avg_probability=round(float(avg_prob or 0), 3),
        avg_loan_amount=round(float(avg_loan or 0), 2),
        avg_income=round(float(avg_income or 0), 2),
        recent_7d=recent_7d,
    )


@router.post("/predict", response_model=PredictResponse)
def predict(
    request: PredictRequest,
    db: Session = Depends(get_db),
    current_user: UserDB = Depends(get_current_user),
):
    status_result, probability, message = ml_service.predict(request)

    history = CreditHistoryDB(
        user_id=current_user.id,
        age=request.age,
        income=request.income,
        loan_amount=request.loan_amount,
        credit_history_length=request.credit_history_length,
        status=status_result,
        probability=probability,
        message=message,
    )
    db.add(history)
    db.commit()
    db.refresh(history)

    return PredictResponse(
        id=history.id,
        status=status_result,
        probability=probability,
        message=message,
    )


@router.get("/history", response_model=HistoryPage)
def get_history(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    status_filter: Optional[str] = Query(None, alias="status"),
    db: Session = Depends(get_db),
    current_user: UserDB = Depends(get_current_user),
):
    query = db.query(CreditHistoryDB).filter(CreditHistoryDB.user_id == current_user.id)
    if status_filter:
        query = query.filter(CreditHistoryDB.status == status_filter)

    total = query.count()
    rows = (
        query.order_by(CreditHistoryDB.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )
    items = [
        HistoryItem(
            id=r.id,
            age=r.age,
            income=r.income,
            loan_amount=r.loan_amount,
            credit_history_length=r.credit_history_length or 0,
            status=r.status,
            probability=r.probability,
            message=r.message,
            created_at=r.created_at,
        )
        for r in rows
    ]
    return HistoryPage(items=items, total=total, page=page, page_size=page_size)


@router.get("/history/all", response_model=HistoryPage)
def get_all_history(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
    _: UserDB = Depends(require_admin),
):
    total = db.query(CreditHistoryDB).count()
    rows = (
        db.query(CreditHistoryDB, UserDB.username)
        .outerjoin(UserDB, UserDB.id == CreditHistoryDB.user_id)
        .order_by(CreditHistoryDB.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )
    items = [
        HistoryItem(
            id=r.id,
            age=r.age,
            income=r.income,
            loan_amount=r.loan_amount,
            credit_history_length=r.credit_history_length or 0,
            status=r.status,
            probability=r.probability,
            message=r.message,
            created_at=r.created_at,
            username=username,
        )
        for r, username in rows
    ]
    return HistoryPage(items=items, total=total, page=page, page_size=page_size)
