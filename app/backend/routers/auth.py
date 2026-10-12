from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from database import get_db, UserDB
from schemas import UserCreate, UserOut, TokenResponse, PasswordChange, ProfileUpdate
from auth_utils import (
    hash_password,
    verify_password,
    needs_rehash,
    create_access_token,
)
from deps import get_current_user

router = APIRouter(tags=["auth"])


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


@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def register(body: UserCreate, db: Session = Depends(get_db)):
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


@router.post("/token", response_model=TokenResponse)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)
):
    user = db.query(UserDB).filter(UserDB.username == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Nom d'utilisateur ou mot de passe incorrect",
        )
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Compte désactivé")

    if needs_rehash(user.hashed_password):
        user.hashed_password = hash_password(form_data.password)
        db.commit()

    token = create_access_token(user.username, user.role or "user")
    return TokenResponse(access_token=token, user=_to_user_out(user))


@router.get("/me", response_model=UserOut)
def me(current_user: UserDB = Depends(get_current_user)):
    return _to_user_out(current_user)


@router.patch("/me", response_model=UserOut)
def update_me(
    body: ProfileUpdate,
    db: Session = Depends(get_db),
    current_user: UserDB = Depends(get_current_user),
):
    if body.email is not None:
        email = body.email.strip().lower() if body.email else None
        if email:
            conflict = (
                db.query(UserDB)
                .filter(UserDB.email == email, UserDB.id != current_user.id)
                .first()
            )
            if conflict:
                raise HTTPException(status_code=400, detail="Cet email est déjà utilisé")
        current_user.email = email
    if body.full_name is not None:
        current_user.full_name = body.full_name.strip() or None
    db.commit()
    db.refresh(current_user)
    return _to_user_out(current_user)


@router.post("/me/password")
def change_password(
    body: PasswordChange,
    db: Session = Depends(get_db),
    current_user: UserDB = Depends(get_current_user),
):
    if not verify_password(body.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Mot de passe actuel incorrect")
    current_user.hashed_password = hash_password(body.new_password)
    db.commit()
    return {"message": "Mot de passe mis à jour"}
