from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db
from app.models.domain import (
    Document,
    DocumentStatus,
    DocumentType,
    Product,
    StockBalance,
)

router = APIRouter()


@router.get("/kpis")
async def get_dashboard_kpis(db: AsyncSession = Depends(get_db)):
    # Total Products in Stock
    total_products_query = await db.execute(select(func.count(Product.id)))
    total_products = total_products_query.scalar() or 0

    # Low Stock Items
    # In a real app we'd join StockBalance and Product.reorder_point and group by product
    # For MVP: any product with stock balance less than its reorder point
    low_stock_query = await db.execute(
        select(func.count(StockBalance.id))
        .join(Product, StockBalance.product_id == Product.id)
        .where(StockBalance.quantity <= Product.reorder_point)
    )
    low_stock_items = low_stock_query.scalar() or 0

    # Pending Receipts
    pending_receipts_query = await db.execute(
        select(func.count(Document.id)).where(
            Document.type == DocumentType.receipt,
            Document.status.not_in([DocumentStatus.done, DocumentStatus.canceled]),
        )
    )
    pending_receipts = pending_receipts_query.scalar() or 0

    # Pending Deliveries
    pending_deliveries_query = await db.execute(
        select(func.count(Document.id)).where(
            Document.type == DocumentType.delivery,
            Document.status.not_in([DocumentStatus.done, DocumentStatus.canceled]),
        )
    )
    pending_deliveries = pending_deliveries_query.scalar() or 0

    # Internal Transfers Scheduled
    transfers_query = await db.execute(
        select(func.count(Document.id)).where(
            Document.type == DocumentType.transfer,
            Document.status.not_in([DocumentStatus.done, DocumentStatus.canceled]),
        )
    )
    transfers_scheduled = transfers_query.scalar() or 0

    return {
        "total_products_in_stock": total_products,
        "low_stock_items": low_stock_items,
        "pending_receipts": pending_receipts,
        "pending_deliveries": pending_deliveries,
        "internal_transfers_scheduled": transfers_scheduled,
    }
