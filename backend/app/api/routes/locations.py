from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db
from app.models.domain import Location
from app.schemas.locations import LocationCreate, LocationResponse

router = APIRouter()


@router.get("/", response_model=List[LocationResponse])
async def list_locations(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Location))
    return result.scalars().all()


@router.post("/", response_model=LocationResponse)
async def create_location(loc_in: LocationCreate, db: AsyncSession = Depends(get_db)):
    db_loc = Location(**loc_in.model_dump())
    db.add(db_loc)
    await db.commit()
    await db.refresh(db_loc)
    return db_loc
