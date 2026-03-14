from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.models.inventory import StockMoveStatus, StockMoveType


class StockMoveCreate(BaseModel):
    product_id: UUID
    from_location_id: UUID | None = None
    to_location_id: UUID | None = None
    quantity: int = Field(ge=0)
    type: StockMoveType
    status: StockMoveStatus = StockMoveStatus.draft


class StockMoveUpdate(BaseModel):
    status: StockMoveStatus | None = None


class ProductMini(BaseModel):
    id: UUID
    name: str
    sku: str
    category_id: UUID

    model_config = ConfigDict(from_attributes=True)


class LocationMini(BaseModel):
    id: UUID
    name: str

    model_config = ConfigDict(from_attributes=True)


class StockMoveResponse(BaseModel):
    id: UUID
    product_id: UUID
    from_location_id: UUID | None
    to_location_id: UUID | None
    quantity: int
    type: StockMoveType
    status: StockMoveStatus
    created_by: UUID | None
    created_at: datetime
    completed_at: datetime | None

    product: ProductMini | None = None
    from_loc: LocationMini | None = None
    to_loc: LocationMini | None = None

    model_config = ConfigDict(from_attributes=True)


class StockLevelResponse(BaseModel):
    product_id: UUID
    location_id: UUID
    quantity: int
    last_updated: datetime

    model_config = ConfigDict(from_attributes=True)
