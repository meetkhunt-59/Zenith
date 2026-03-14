from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db
from app.models.domain import Location
from app.schemas.locations import LocationCreate, LocationResponse, LocationUpdate

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


@router.put("/{location_id}", response_model=LocationResponse)
async def update_location(
    location_id: UUID, payload: LocationUpdate, db: AsyncSession = Depends(get_db)
):
    db_loc = await db.get(Location, location_id)
    if not db_loc:
        raise HTTPException(status_code=404, detail="Location not found")

    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(db_loc, k, v)

    await db.commit()
    await db.refresh(db_loc)
    return db_loc


@router.delete("/{location_id}")
async def delete_location(location_id: UUID, db: AsyncSession = Depends(get_db)):
    db_loc = await db.get(Location, location_id)
    if not db_loc:
        raise HTTPException(status_code=404, detail="Location not found")
    await db.delete(db_loc)
    await db.commit()
    return {"deleted": True}
