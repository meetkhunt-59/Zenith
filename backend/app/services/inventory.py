from datetime import datetime, timezone
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy import and_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.inventory import StockLevel, StockMove, StockMoveStatus, StockMoveType


async def get_move(db: AsyncSession, move_id: UUID) -> StockMove:
    result = await db.execute(select(StockMove).where(StockMove.id == move_id))
    move = result.scalars().first()
    if not move:
        raise HTTPException(status_code=404, detail="Move not found")
    return move


async def upsert_stock_level(
    db: AsyncSession, *, product_id: UUID, location_id: UUID, new_quantity: int
) -> StockLevel:
    if new_quantity < 0:
        raise HTTPException(status_code=400, detail="Stock level cannot be negative")

    result = await db.execute(
        select(StockLevel).where(
            and_(
                StockLevel.product_id == product_id,
                StockLevel.location_id == location_id,
            )
        )
    )
    level = result.scalars().first()
    if not level:
        level = StockLevel(product_id=product_id, location_id=location_id, quantity=new_quantity)
        db.add(level)
        return level

    level.quantity = new_quantity
    return level


async def add_to_stock_level(
    db: AsyncSession, *, product_id: UUID, location_id: UUID, delta: int
) -> StockLevel:
    result = await db.execute(
        select(StockLevel).where(
            and_(
                StockLevel.product_id == product_id,
                StockLevel.location_id == location_id,
            )
        )
    )
    level = result.scalars().first()
    current = level.quantity if level else 0
    next_qty = current + delta
    if next_qty < 0:
        raise HTTPException(status_code=400, detail="Insufficient stock for this operation")
    return await upsert_stock_level(db, product_id=product_id, location_id=location_id, new_quantity=next_qty)


async def validate_move(db: AsyncSession, move_id: UUID) -> StockMove:
    move = await get_move(db, move_id)

    if move.status in (StockMoveStatus.done, StockMoveStatus.cancelled):
        raise HTTPException(status_code=400, detail=f"Move is already {move.status.value}")

    if move.type == StockMoveType.receipt:
        if not move.to_location_id:
            raise HTTPException(status_code=400, detail="Receipt requires to_location_id")
        await add_to_stock_level(
            db, product_id=move.product_id, location_id=move.to_location_id, delta=move.quantity
        )

    elif move.type == StockMoveType.delivery:
        if not move.from_location_id:
            raise HTTPException(status_code=400, detail="Delivery requires from_location_id")
        await add_to_stock_level(
            db, product_id=move.product_id, location_id=move.from_location_id, delta=-move.quantity
        )

    elif move.type == StockMoveType.transfer:
        if not move.from_location_id or not move.to_location_id:
            raise HTTPException(
                status_code=400, detail="Transfer requires from_location_id and to_location_id"
            )
        await add_to_stock_level(
            db, product_id=move.product_id, location_id=move.from_location_id, delta=-move.quantity
        )
        await add_to_stock_level(
            db, product_id=move.product_id, location_id=move.to_location_id, delta=move.quantity
        )

    elif move.type == StockMoveType.adjustment:
        if not move.to_location_id:
            raise HTTPException(status_code=400, detail="Adjustment requires to_location_id")
        await upsert_stock_level(
            db, product_id=move.product_id, location_id=move.to_location_id, new_quantity=move.quantity
        )

    move.status = StockMoveStatus.done
    move.completed_at = datetime.now(timezone.utc)

    try:
        await db.commit()
    except Exception as exc:
        await db.rollback()
        raise HTTPException(status_code=409, detail=f"Validation failed: {str(exc)}")

    await db.refresh(move)
    return move

