from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
from backend.api.deps import get_db, get_current_user_token
from backend.schemas.table import TableCreate, TableRead
from backend.models.table import Table

router = APIRouter()

@router.get("/", response_model=List[TableRead])
def get_all_tables(db: Session = Depends(get_db)):
    return db.query(Table).all()

@router.get("/{table_id}", response_model=TableRead)
def get_table_by_id(table_id: UUID, db: Session = Depends(get_db)):
    table = db.query(Table).filter(Table.id == table_id).first()
    if not table:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Table not found")
    return table

@router.post("/", response_model=TableRead)
def create_table(
    table_in: TableCreate, 
    db: Session = Depends(get_db),
    token: dict = Depends(get_current_user_token)
):
    obj = Table(**table_in.model_dump())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj

@router.delete("/{table_id}")
def delete_table(
    table_id: UUID,
    db: Session = Depends(get_db),
    token: dict = Depends(get_current_user_token)
):
    from fastapi import HTTPException
    if token.get("role") != "OWNER":
        raise HTTPException(status_code=403, detail="Owner access required")
    
    table = db.query(Table).filter(Table.id == table_id).first()
    if not table:
        raise HTTPException(status_code=404, detail="Table not found")
        
    db.delete(table)
    db.commit()
    return {"message": "Table deleted successfully"}
