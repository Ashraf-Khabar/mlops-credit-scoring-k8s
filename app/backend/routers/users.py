from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import Optional, List
from database import get_db, UserDB, CreditHistoryDB
from schemas import UserOut, UserUpdate, AdminPasswordReset, PlatformStats, UserCreate
from auth_utils import hash_password
from deps import require_admin

router = APIRouter(prefix="/users", tags=["users"])


def _to_user_out(user: UserDB) -> UserOut:
    return UserOut(
        id=user.id,
        username=user.username,
        email=user.email,
        full_name=user.full_name,
        role=user.role or "user",
        is_active=bool(user.is_active),
        created_at=user.created_at,
    )


@router.get("", response_model=List[UserOut])
def list_users(
    q: Optional[str] = Query(None),
    role: Optional[str] = Query(None),
    active: Optional[bool] = Query(None),
    db: Session = Depends(get_db),
    _: UserDB = Depends(require_admin),
):
    query = db.query(UserDB)
    if q:
        like = f"%{q}%"
        query = query.filter(
            (UserDB.username.ilike(like))
            | (UserDB.email.ilike(like))
            | (UserDB.full_name.ilike(like))
        )
    if role:
        query = query.filter(UserDB.role == role)
    if active is not None:
        query = query.filter(UserDB.is_active == active)
    users = query.order_by(UserDB.id.asc()).all()
    return [_to_user_out(u) for u in users]


@router.post("", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def create_user(
    body: UserCreate,
    db: Session = Depends(get_db),
    _: UserDB = Depends(require_admin),
):
    if db.query(UserDB).filter(UserDB.username == body.username).first():
        raise HTTPException(status_code=400, detail="Ce nom d'utilisateur existe déjà")
    if body.email and db.query(UserDB).filter(UserDB.email == body.email).first():
        raise HTTPException(status_code=400, detail="Cet email est déjà utilisé")

    user = UserDB(
        username=body.username,
        email=body.email,
        full_name=body.full_name,
        hashed_password=hash_password(body.password),
        role="user",
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return _to_user_out(user)


@router.get("/platform-stats", response_model=PlatformStats)
def platform_stats(
    db: Session = Depends(get_db),
    _: UserDB = Depends(require_admin),
):
    users_total = db.query(UserDB).count()
    users_active = db.query(UserDB).filter(UserDB.is_active == True).count()  # noqa: E712
    predictions_total = db.query(CreditHistoryDB).count()
    approved = (
        db.query(CreditHistoryDB)
        .filter(CreditHistoryDB.status.in_(["Approuvé", "Approved"]))
        .count()
    )
    rate = round((approved / predictions_total * 100), 1) if predictions_total else 0.0
    return PlatformStats(
        users_total=users_total,
        users_active=users_active,
        predictions_total=predictions_total,
        approval_rate=rate,
    )


@router.get("/{user_id}", response_model=UserOut)
def get_user(
    user_id: int,
    db: Session = Depends(get_db),
    _: UserDB = Depends(require_admin),
):
    user = db.query(UserDB).filter(UserDB.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable")
    return _to_user_out(user)


@router.patch("/{user_id}", response_model=UserOut)
def update_user(
    user_id: int,
    body: UserUpdate,
    db: Session = Depends(get_db),
    admin: UserDB = Depends(require_admin),
):
    user = db.query(UserDB).filter(UserDB.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable")

    if body.email is not None:
        email = body.email.strip().lower() if body.email else None
        if email:
            conflict = (
                db.query(UserDB)
                .filter(UserDB.email == email, UserDB.id != user_id)
                .first()
            )
            if conflict:
                raise HTTPException(status_code=400, detail="Cet email est déjà utilisé")
        user.email = email
    if body.full_name is not None:
        user.full_name = body.full_name
    if body.role is not None:
        if user.id == admin.id and body.role != "admin":
            raise HTTPException(
                status_code=400, detail="Vous ne pouvez pas retirer votre propre rôle admin"
            )
        user.role = body.role
    if body.is_active is not None:
        if user.id == admin.id and not body.is_active:
            raise HTTPException(
                status_code=400, detail="Vous ne pouvez pas désactiver votre propre compte"
            )
        user.is_active = body.is_active

    db.commit()
    db.refresh(user)
    return _to_user_out(user)


@router.post("/{user_id}/reset-password")
def reset_password(
    user_id: int,
    body: AdminPasswordReset,
    db: Session = Depends(get_db),
    _: UserDB = Depends(require_admin),
):
    user = db.query(UserDB).filter(UserDB.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable")
    user.hashed_password = hash_password(body.new_password)
    db.commit()
    return {"message": "Mot de passe réinitialisé"}


@router.delete("/{user_id}")
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    admin: UserDB = Depends(require_admin),
):
    if user_id == admin.id:
        raise HTTPException(status_code=400, detail="Vous ne pouvez pas supprimer votre compte")
    user = db.query(UserDB).filter(UserDB.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable")
    db.delete(user)
    db.commit()
    return {"message": "Utilisateur supprimé"}
