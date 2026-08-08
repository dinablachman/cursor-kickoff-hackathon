from fastapi import APIRouter, HTTPException, Query

from .. import models, schemas, serializers
from ..deps import CurrentUser, DbSession, MaintainerUser, OptionalUser

router = APIRouter(prefix="/api/ideas", tags=["ideas"])


def get_idea(db: DbSession, idea_id: int) -> models.Idea:
    idea = db.get(models.Idea, idea_id)
    if idea is None:
        raise HTTPException(status_code=404, detail="Idea not found")
    return idea


@router.get("", response_model=list[schemas.IdeaOut])
def list_ideas(
    db: DbSession,
    viewer: OptionalUser,
    category: schemas.IdeaCategory | None = Query(default=None),
    status: schemas.IdeaStatus | None = Query(default=None),
    repo_id: int | None = Query(default=None),
    sort: str = Query(default="top", pattern="^(top|new)$"),
) -> list[schemas.IdeaOut]:
    query = db.query(models.Idea)
    if category is not None:
        query = query.filter(models.Idea.category == category)
    if status is not None:
        query = query.filter(models.Idea.status == status)
    if repo_id is not None:
        query = query.filter(models.Idea.repo_id == repo_id)

    ideas = query.all()
    if sort == "top":
        ideas.sort(key=lambda idea: (idea.score, idea.created_at), reverse=True)
    else:
        ideas.sort(key=lambda idea: idea.created_at, reverse=True)

    return [serializers.idea_out(idea, viewer) for idea in ideas]


@router.post("", response_model=schemas.IdeaOut, status_code=201)
def create_idea(
    payload: schemas.IdeaCreate, db: DbSession, user: CurrentUser
) -> schemas.IdeaOut:
    if payload.repo_id is not None and db.get(models.Repo, payload.repo_id) is None:
        raise HTTPException(status_code=404, detail="Repo not found")
    if payload.category == models.IDEA_CATEGORY_NEW_APP and payload.repo_id is not None:
        raise HTTPException(
            status_code=400, detail="A new-app idea cannot be tied to an existing repo"
        )

    idea = models.Idea(
        title=payload.title,
        description=payload.description,
        category=payload.category,
        repo_id=payload.repo_id,
        author_id=user.id,
    )
    db.add(idea)
    db.commit()
    db.refresh(idea)
    return serializers.idea_out(idea, user)


@router.get("/{idea_id}", response_model=schemas.IdeaDetailOut)
def idea_detail(
    idea_id: int, db: DbSession, viewer: OptionalUser
) -> schemas.IdeaDetailOut:
    return serializers.idea_detail_out(get_idea(db, idea_id), viewer)


@router.post("/{idea_id}/vote", response_model=schemas.IdeaOut)
def vote(
    idea_id: int, payload: schemas.IdeaVoteCreate, db: DbSession, user: CurrentUser
) -> schemas.IdeaOut:
    idea = get_idea(db, idea_id)
    existing = (
        db.query(models.IdeaVote)
        .filter(models.IdeaVote.idea_id == idea.id, models.IdeaVote.user_id == user.id)
        .one_or_none()
    )

    if payload.value == 0:
        if existing is not None:
            db.delete(existing)
    elif existing is None:
        db.add(models.IdeaVote(idea_id=idea.id, user_id=user.id, value=payload.value))
    else:
        existing.value = payload.value

    db.commit()
    db.refresh(idea)
    return serializers.idea_out(idea, user)


@router.get("/{idea_id}/comments", response_model=list[schemas.IdeaCommentOut])
def list_comments(idea_id: int, db: DbSession) -> list[schemas.IdeaCommentOut]:
    idea = get_idea(db, idea_id)
    return [serializers.idea_comment_out(comment) for comment in idea.comments]


@router.post("/{idea_id}/comments", response_model=schemas.IdeaCommentOut, status_code=201)
def add_comment(
    idea_id: int,
    payload: schemas.IdeaCommentCreate,
    db: DbSession,
    user: CurrentUser,
) -> schemas.IdeaCommentOut:
    idea = get_idea(db, idea_id)
    body = payload.body.strip()
    if not body:
        raise HTTPException(status_code=400, detail="Comment body cannot be empty")

    comment = models.IdeaComment(idea_id=idea.id, user_id=user.id, body=body)
    db.add(comment)
    db.commit()
    db.refresh(comment)
    return serializers.idea_comment_out(comment)


@router.patch("/{idea_id}/status", response_model=schemas.IdeaOut)
def set_status(
    idea_id: int,
    payload: schemas.IdeaStatusUpdate,
    db: DbSession,
    user: MaintainerUser,
) -> schemas.IdeaOut:
    idea = get_idea(db, idea_id)
    idea.status = payload.status
    db.commit()
    db.refresh(idea)
    return serializers.idea_out(idea, user)


@router.post("/{idea_id}/convert", response_model=schemas.BountyOut, status_code=201)
def convert_to_bounty(
    idea_id: int, db: DbSession, user: MaintainerUser
) -> schemas.BountyOut:
    idea = get_idea(db, idea_id)
    if idea.converted_bounty_id is not None:
        raise HTTPException(
            status_code=409, detail="Idea has already been converted to a bounty"
        )
    if idea.repo is None:
        raise HTTPException(
            status_code=400,
            detail="Only ideas tied to a registered repo can become bounties",
        )
    if idea.repo.maintainer_id != user.id:
        raise HTTPException(
            status_code=403, detail="Only the repo maintainer can convert this idea"
        )

    bounty = models.Bounty(
        repo_id=idea.repo_id,
        title=idea.title,
        description=idea.description,
        status=models.BOUNTY_OPEN,
        source=models.SOURCE_MANUAL,
    )
    db.add(bounty)
    db.flush()

    idea.converted_bounty_id = bounty.id
    idea.status = models.IDEA_PLANNED
    db.commit()
    db.refresh(bounty)
    return serializers.bounty_out(bounty)
