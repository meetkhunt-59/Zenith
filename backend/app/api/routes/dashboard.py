from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db
from app.models.domain import Product
from app.models.inventory import StockLevel, StockMove, StockMoveStatus, StockMoveType

router = APIRouter()


@router.get("/kpis")
async def get_dashboard_kpis(db: AsyncSession = Depends(get_db)):
    total_skus_q = await db.execute(select(func.count(Product.id)))
    total_skus = total_skus_q.scalar() or 0

    total_units_q = await db.execute(select(func.coalesce(func.sum(StockLevel.quantity), 0)))
    total_units = total_units_q.scalar() or 0

    low_stock_subq = (
        select(Product.id)
        .outerjoin(StockLevel, StockLevel.product_id == Product.id)
        .group_by(Product.id, Product.reorder_point)
        .having(func.coalesce(func.sum(StockLevel.quantity), 0) < Product.reorder_point)
        .subquery()
    )
    low_stock_q = await db.execute(select(func.count()).select_from(low_stock_subq))
    low_stock = low_stock_q.scalar() or 0

    pending_filter = StockMove.status.notin_([StockMoveStatus.done, StockMoveStatus.cancelled])

    pending_receipts_q = await db.execute(
        select(func.count(StockMove.id)).where(
            StockMove.type == StockMoveType.receipt,
            pending_filter,
        )
    )
    pending_deliveries_q = await db.execute(
        select(func.count(StockMove.id)).where(
            StockMove.type == StockMoveType.delivery,
            pending_filter,
        )
    )
    pending_transfers_q = await db.execute(
        select(func.count(StockMove.id)).where(
            StockMove.type == StockMoveType.transfer,
            pending_filter,
        )
    )

    return {
        "totalProducts": int(total_units),
        "totalSKUs": int(total_skus),
        "lowStock": int(low_stock),
        "pendingReceipts": int(pending_receipts_q.scalar() or 0),
        "pendingDeliveries": int(pending_deliveries_q.scalar() or 0),
        "pendingTransfers": int(pending_transfers_q.scalar() or 0),
    }
