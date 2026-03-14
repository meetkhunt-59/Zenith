from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db
from app.models.domain import DocumentType, StockBalance
from app.schemas.operations import (
    DocumentCreate,
    DocumentResponse,
    LedgerEntryCreate,
    StockAdjustmentCreate,
)
from app.services.inventory import cancel_document, process_document

router = APIRouter()


@router.post("/receipts", response_model=DocumentResponse)
async def create_receipt(
    doc_in: DocumentCreate, user_id: UUID, db: AsyncSession = Depends(get_db)
):
    if doc_in.type != DocumentType.receipt:
        raise HTTPException(400, "Document type must be receipt")
    return await process_document(db, doc_in, user_id)


@router.post("/deliveries", response_model=DocumentResponse)
async def create_delivery(
    doc_in: DocumentCreate, user_id: UUID, db: AsyncSession = Depends(get_db)
):
    if doc_in.type != DocumentType.delivery:
        raise HTTPException(400, "Document type must be delivery")
    return await process_document(db, doc_in, user_id)


@router.post("/transfers", response_model=DocumentResponse)
async def create_transfer(
    doc_in: DocumentCreate, user_id: UUID, db: AsyncSession = Depends(get_db)
):
    if doc_in.type != DocumentType.transfer:
        raise HTTPException(400, "Document type must be transfer")
    if not doc_in.source_location_id or not doc_in.destination_location_id:
        raise HTTPException(
            400, "Transfers require both source and destination locations"
        )
    return await process_document(db, doc_in, user_id)


@router.post("/adjustments", response_model=DocumentResponse)
async def create_adjustment(
    adj_in: StockAdjustmentCreate, user_id: UUID, db: AsyncSession = Depends(get_db)
):
    # Calculate the difference between physical count and system count
    result = await db.execute(
        select(StockBalance).where(
            StockBalance.product_id == adj_in.product_id,
            StockBalance.location_id == adj_in.location_id,
        )
    )
    balance = result.scalars().first()
    system_qty = balance.quantity if balance else 0

    difference = adj_in.counted_quantity - system_qty

    if difference == 0:
        raise HTTPException(
            400, "Counted quantity matches system quantity; no adjustment needed."
        )

    doc_in = DocumentCreate(
        type=DocumentType.adjustment,
        reference_number=adj_in.reference_number,
        # We record the location as destination for positive adjustments, source for negative
        destination_location_id=adj_in.location_id if difference > 0 else None,
        source_location_id=adj_in.location_id if difference < 0 else None,
        items=[
            LedgerEntryCreate(product_id=adj_in.product_id, quantity=abs(difference))
        ],
    )
    # The `process_document` service handles standard type mappings:
    # For adjustments, we can trick it by treating it like a receipt (diff > 0) or delivery (diff < 0)
    # Or expand `process_document` to explicitly handle adjustments.
    # Let's cleanly expand `process_document` in the service to support `adjustment` natively.
    return await process_document(db, doc_in, user_id)


@router.post("/{document_id}/cancel", response_model=DocumentResponse)
async def cancel_doc(
    document_id: UUID, user_id: UUID, db: AsyncSession = Depends(get_db)
):
    return await cancel_document(db, document_id, user_id)
