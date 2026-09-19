from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from database.models import Collection, User
from schemas.schemas import CollectionCreate, CollectionResponse
from security import get_current_user

router = APIRouter(prefix="/api/collections", tags=["collections"])


@router.post("", response_model=CollectionResponse, status_code=201)
def create_collection(payload: CollectionCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    collection = Collection(name=payload.name, description=payload.description, owner_id=user.id)
    db.add(collection)
    db.commit()
    db.refresh(collection)
    return collection


@router.get("", response_model=list[CollectionResponse])
def list_collections(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(Collection).filter(Collection.owner_id == user.id).order_by(Collection.created_at.desc()).all()


@router.delete("/{collection_id}", status_code=204)
def delete_collection(collection_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    collection = db.query(Collection).filter(Collection.id == collection_id, Collection.owner_id == user.id).first()
    if not collection:
        raise HTTPException(status_code=404, detail="Collection not found.")
    db.delete(collection)
    db.commit()
