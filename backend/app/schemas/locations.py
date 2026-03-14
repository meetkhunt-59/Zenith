from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict

from app.models.domain import LocationType


class LocationBase(BaseModel):
    name: str
    type: LocationType
    parent_id: UUID | None = None


class LocationCreate(LocationBase):
    pass


class LocationResponse(LocationBase):
    id: UUID
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
