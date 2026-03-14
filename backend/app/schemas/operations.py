from datetime import datetime
from typing import List
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.models.domain import DocumentStatus, DocumentType


class LedgerEntryCreate(BaseModel):
    product_id: UUID
    quantity: int = Field(gt=0, description="Absolute quantity for the transaction.")


# For standard movements (Receipts, Deliveries, Transfers)
class DocumentCreate(BaseModel):
    type: DocumentType
    reference_number: str
    source_location_id: UUID | None = None
    destination_location_id: UUID | None = None
    items: List[LedgerEntryCreate]


class DocumentResponse(BaseModel):
    id: UUID
    type: DocumentType
    status: DocumentStatus
    reference_number: str
    created_by: UUID
    source_location_id: UUID | None
    destination_location_id: UUID | None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# For stock adjustments during physical counts
class StockAdjustmentCreate(BaseModel):
    location_id: UUID
    product_id: UUID
    counted_quantity: int = Field(
        ge=0, description="The newly counted total real stock available."
    )
    reference_number: str
