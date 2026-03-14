from uuid import UUID

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.domain import (
    Document,
    DocumentStatus,
    DocumentType,
    StockBalance,
    StockLedgerEntry,
)
from app.schemas.operations import DocumentCreate


async def process_document(
    db: AsyncSession, doc_in: DocumentCreate, user_id: UUID
) -> Document:
    # 1. Create Document
    doc = Document(
        type=doc_in.type,
        reference_number=doc_in.reference_number,
        source_location_id=doc_in.source_location_id,
        destination_location_id=doc_in.destination_location_id,
        created_by=user_id,
        status=DocumentStatus.done,  # Auto-validate for immediate processing
    )
    db.add(doc)
    await db.flush()  # ensure document gets an ID

    # 2. Process Items
    for item in doc_in.items:
        try:
            if doc_in.type == DocumentType.receipt:
                await apply_stock_change(
                    db,
                    item.product_id,
                    doc_in.destination_location_id,
                    item.quantity,
                    doc.id,
                    user_id,
                )

            elif doc_in.type == DocumentType.delivery:
                await apply_stock_change(
                    db,
                    item.product_id,
                    doc_in.source_location_id,
                    -item.quantity,
                    doc.id,
                    user_id,
                )

            elif doc_in.type == DocumentType.transfer:
                await apply_stock_change(
                    db,
                    item.product_id,
                    doc_in.source_location_id,
                    -item.quantity,
                    doc.id,
                    user_id,
                )
                await apply_stock_change(
                    db,
                    item.product_id,
                    doc_in.destination_location_id,
                    item.quantity,
                    doc.id,
                    user_id,
                )

            elif doc_in.type == DocumentType.adjustment:
                if doc_in.destination_location_id:
                    await apply_stock_change(
                        db,
                        item.product_id,
                        doc_in.destination_location_id,
                        item.quantity,
                        doc.id,
                        user_id,
                    )
                elif doc_in.source_location_id:
                    await apply_stock_change(
                        db,
                        item.product_id,
                        doc_in.source_location_id,
                        -item.quantity,
                        doc.id,
                        user_id,
                    )
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))

    try:
        await db.commit()
        await db.refresh(doc)
        return doc
    except Exception as e:
        await db.rollback()
        # SQLAlchemy handles optimistic locking by throwing StaleDataError or similar on flush
        raise HTTPException(
            status_code=409,
            detail=f"Transaction Failed or Concurrency Conflict: {str(e)}",
        )


async def apply_stock_change(
    db: AsyncSession,
    product_id: UUID,
    location_id: UUID | None,
    qty_change: int,
    document_id: UUID,
    user_id: UUID,
):
    if not location_id:
        raise ValueError("Location required for stock change")

    result = await db.execute(
        select(StockBalance).where(
            StockBalance.product_id == product_id,
            StockBalance.location_id == location_id,
        )
    )
    balance = result.scalars().first()

    if not balance:
        if qty_change < 0:
            raise ValueError(
                f"Insufficient stock for product {product_id} at location {location_id}"
            )
        balance = StockBalance(
            product_id=product_id, location_id=location_id, quantity=qty_change
        )
        db.add(balance)
    else:
        if balance.quantity + qty_change < 0:
            raise ValueError(
                f"Insufficient stock for product {product_id} at location {location_id}"
            )
        balance.quantity += qty_change
        # SQLAlchemy's version_id_col handles the concurrency check automatically during UPDATE

    entry = StockLedgerEntry(
        document_id=document_id,
        product_id=product_id,
        location_id=location_id,
        quantity_change=qty_change,
        created_by=user_id,
    )
    db.add(entry)


async def cancel_document(
    db: AsyncSession, document_id: UUID, user_id: UUID
) -> Document:
    # Fetch Document
    result = await db.execute(select(Document).where(Document.id == document_id))
    doc = result.scalars().first()

    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    if doc.status == DocumentStatus.canceled:
        raise HTTPException(status_code=400, detail="Document already canceled")

    # Fetch original ledger entries
    entries_result = await db.execute(
        select(StockLedgerEntry).where(StockLedgerEntry.document_id == doc.id)
    )
    original_entries = entries_result.scalars().all()

    # Revert all changes
    for entry in original_entries:
        try:
            # We reverse the change (if it was +5, we do -5)
            await apply_stock_change(
                db,
                entry.product_id,
                entry.location_id,
                -entry.quantity_change,
                doc.id,
                user_id,
            )
        except ValueError as e:
            raise HTTPException(
                status_code=400, detail=f"Cannot revert stock: {str(e)}"
            )

    doc.status = DocumentStatus.canceled

    try:
        await db.commit()
        await db.refresh(doc)
        return doc
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=409, detail=f"Cancel Failed or Concurrency Conflict: {str(e)}"
        )
