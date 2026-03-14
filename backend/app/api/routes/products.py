from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db
from app.models.domain import Product, ProductCategory
from app.schemas.products import (
    ProductCategoryCreate,
    ProductCategoryResponse,
    ProductCreate,
    ProductResponse,
    ProductUpdate,
)

router = APIRouter()


@router.get("/categories", response_model=List[ProductCategoryResponse])
async def list_categories(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(ProductCategory))
    return result.scalars().all()


@router.post("/categories", response_model=ProductCategoryResponse)
async def create_category(
    cat_in: ProductCategoryCreate, db: AsyncSession = Depends(get_db)
):
    db_cat = ProductCategory(**cat_in.model_dump())
    db.add(db_cat)
    await db.commit()
    await db.refresh(db_cat)
    return db_cat


@router.get("/", response_model=List[ProductResponse])
async def list_products(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Product))
    return result.scalars().all()


@router.post("/", response_model=ProductResponse)
async def create_product(prod_in: ProductCreate, db: AsyncSession = Depends(get_db)):
    # Verify category exists
    cat_check = await db.get(ProductCategory, prod_in.category_id)
    if not cat_check:
        raise HTTPException(status_code=400, detail="Category not found")

    db_prod = Product(**prod_in.model_dump())
    db.add(db_prod)

    try:
        await db.commit()
        await db.refresh(db_prod)
    except Exception:
        await db.rollback()
        raise HTTPException(
            status_code=400,
            detail="Product Creation Failed (Check SKU uniqueness constraints).",
        )

    return db_prod


@router.put("/{product_id}", response_model=ProductResponse)
async def update_product(
    product_id: UUID, payload: ProductUpdate, db: AsyncSession = Depends(get_db)
):
    db_prod = await db.get(Product, product_id)
    if not db_prod:
        raise HTTPException(status_code=404, detail="Product not found")

    data = payload.model_dump(exclude_unset=True)
    if "category_id" in data:
        cat_check = await db.get(ProductCategory, data["category_id"])
        if not cat_check:
            raise HTTPException(status_code=400, detail="Category not found")

    for k, v in data.items():
        setattr(db_prod, k, v)

    await db.commit()
    await db.refresh(db_prod)
    return db_prod


@router.delete("/{product_id}")
async def delete_product(product_id: UUID, db: AsyncSession = Depends(get_db)):
    db_prod = await db.get(Product, product_id)
    if not db_prod:
        raise HTTPException(status_code=404, detail="Product not found")
    await db.delete(db_prod)
    await db.commit()
    return {"deleted": True}
