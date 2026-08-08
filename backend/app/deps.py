from typing import Annotated, Iterator

from fastapi import Depends, Header, HTTPException, status
from sqlalchemy.orm import Session

from . import models
from .database import SessionLocal


def get_db() -> Iterator[Session]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


DbSession = Annotated[Session, Depends(get_db)]


def get_current_user(
    db: DbSession,
    x_github_username: Annotated[str | None, Header()] = None,
    x_role: Annotated[str | None, Header()] = None,
) -> models.User:
    username = (x_github_username or "").strip()
    if not username:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing X-GitHub-Username header",
        )

    role = (x_role or models.ROLE_STUDENT).strip().lower()
    if role not in (models.ROLE_STUDENT, models.ROLE_MAINTAINER):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="X-Role must be 'student' or 'maintainer'",
        )

    user = (
        db.query(models.User)
        .filter(models.User.github_username == username)
        .one_or_none()
    )
    if user is None:
        user = models.User(github_username=username, role=role)
        db.add(user)
        db.commit()
        db.refresh(user)
    elif user.role != role:
        user.role = role
        db.commit()
        db.refresh(user)

    return user


CurrentUser = Annotated[models.User, Depends(get_current_user)]


def get_optional_user(
    db: DbSession,
    x_github_username: Annotated[str | None, Header()] = None,
    x_role: Annotated[str | None, Header()] = None,
) -> models.User | None:
    if not (x_github_username or "").strip():
        return None
    return get_current_user(db, x_github_username, x_role)


OptionalUser = Annotated[models.User | None, Depends(get_optional_user)]


def require_maintainer(user: CurrentUser) -> models.User:
    if user.role != models.ROLE_MAINTAINER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This action requires the maintainer role",
        )
    return user


MaintainerUser = Annotated[models.User, Depends(require_maintainer)]
