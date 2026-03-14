from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import get_db
from app.models.inventory import StockMove, StockMoveStatus, StockMoveType
from app.schemas.operations import StockMoveCreate, StockMoveResponse, StockMoveUpdate
from app.services.inventory import validate_move

router = APIRouter()


def _moves_query(move_type: StockMoveType | None = None):
    stmt = (
        select(StockMove)
        .options(
            selectinload(StockMove.product),
            selectinload(StockMove.from_loc),
            selectinload(StockMove.to_loc),
        )
        .order_by(StockMove.created_at.desc())
    )
    if move_type:
        stmt = stmt.where(StockMove.type == move_type)
    return stmt


@router.get("/moves", response_model=List[StockMoveResponse])
async def list_moves(
    type: StockMoveType | None = None,  # noqa: A002 (FastAPI param name)
    status: StockMoveStatus | None = None,
    db: AsyncSession = Depends(get_db),
):
    stmt = _moves_query(type)
    if status:
        stmt = stmt.where(StockMove.status == status)
    result = await db.execute(stmt)
    return result.scalars().all()


@router.post("/moves", response_model=StockMoveResponse)
async def create_move(payload: StockMoveCreate, db: AsyncSession = Depends(get_db)):
    if payload.type != StockMoveType.adjustment and payload.quantity <= 0:
        raise HTTPException(status_code=400, detail="quantity must be > 0")

    if payload.type == StockMoveType.receipt and not payload.to_location_id:
        raise HTTPException(status_code=400, detail="Receipt requires to_location_id")
    if payload.type == StockMoveType.delivery and not payload.from_location_id:
        raise HTTPException(status_code=400, detail="Delivery requires from_location_id")
    if payload.type == StockMoveType.transfer and (
        not payload.from_location_id or not payload.to_location_id
    ):
        raise HTTPException(
            status_code=400, detail="Transfer requires from_location_id and to_location_id"
        )
    if payload.type == StockMoveType.adjustment and not payload.to_location_id:
        raise HTTPException(status_code=400, detail="Adjustment requires to_location_id")

    move = StockMove(**payload.model_dump())
    db.add(move)
    await db.commit()
    # Re-load with relationships for a richer response
    result = await db.execute(_moves_query().where(StockMove.id == move.id))
    return result.scalars().first()


@router.post("/moves/{move_id}/validate", response_model=StockMoveResponse)
async def validate_move_endpoint(move_id: UUID, db: AsyncSession = Depends(get_db)):
    move = await validate_move(db, move_id)
    # Ensure relationships are available for the response model
    await db.refresh(move, attribute_names=["product", "from_loc", "to_loc"])
    return move


@router.put("/moves/{move_id}", response_model=StockMoveResponse)
async def update_move(move_id: UUID, payload: StockMoveUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(_moves_query().where(StockMove.id == move_id))
    move = result.scalars().first()
    if not move:
        raise HTTPException(status_code=404, detail="Move not found")

    data = payload.model_dump(exclude_unset=True)
    if "status" in data and data["status"] is not None:
        move.status = data["status"]

    await db.commit()
    await db.refresh(move)
    return move


@router.get("/receipts", response_model=List[StockMoveResponse])
async def list_receipts(db: AsyncSession = Depends(get_db)):
    result = await db.execute(_moves_query(StockMoveType.receipt))
    return result.scalars().all()


@router.post("/receipts", response_model=StockMoveResponse)
async def create_receipt(payload: StockMoveCreate, db: AsyncSession = Depends(get_db)):
    if payload.type != StockMoveType.receipt:
        raise HTTPException(status_code=400, detail="type must be receipt")
    return await create_move(payload, db)


@router.get("/deliveries", response_model=List[StockMoveResponse])
async def list_deliveries(db: AsyncSession = Depends(get_db)):
    result = await db.execute(_moves_query(StockMoveType.delivery))
    return result.scalars().all()


@router.post("/deliveries", response_model=StockMoveResponse)
async def create_delivery(payload: StockMoveCreate, db: AsyncSession = Depends(get_db)):
    if payload.type != StockMoveType.delivery:
        raise HTTPException(status_code=400, detail="type must be delivery")
    return await create_move(payload, db)


@router.get("/transfers", response_model=List[StockMoveResponse])
async def list_transfers(db: AsyncSession = Depends(get_db)):
    result = await db.execute(_moves_query(StockMoveType.transfer))
    return result.scalars().all()


@router.post("/transfers", response_model=StockMoveResponse)
async def create_transfer(payload: StockMoveCreate, db: AsyncSession = Depends(get_db)):
    if payload.type != StockMoveType.transfer:
        raise HTTPException(status_code=400, detail="type must be transfer")
    return await create_move(payload, db)


@router.get("/adjustments", response_model=List[StockMoveResponse])
async def list_adjustments(db: AsyncSession = Depends(get_db)):
    result = await db.execute(_moves_query(StockMoveType.adjustment))
    return result.scalars().all()


@router.post("/adjustments", response_model=StockMoveResponse)
async def create_adjustment(payload: StockMoveCreate, db: AsyncSession = Depends(get_db)):
    if payload.type != StockMoveType.adjustment:
        raise HTTPException(status_code=400, detail="type must be adjustment")
    return await create_move(payload, db)
