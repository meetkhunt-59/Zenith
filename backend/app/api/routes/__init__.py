from fastapi import APIRouter

from app.api.routes import auth, dashboard, locations, operations, products

router = APIRouter()

router.include_router(auth.router, prefix="/auth", tags=["auth"])
router.include_router(products.router, prefix="/products", tags=["products"])
router.include_router(locations.router, prefix="/locations", tags=["locations"])
router.include_router(operations.router, prefix="/operations", tags=["operations"])
router.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"])
