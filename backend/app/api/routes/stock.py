from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db
from app.models.inventory import StockLevel
from app.schemas.operations import StockLevelResponse

router = APIRouter()


@router.get("/levels", response_model=List[StockLevelResponse])
async def list_stock_levels(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(StockLevel))
    return result.scalars().all()

