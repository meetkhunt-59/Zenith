from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class ProductBase(BaseModel):
    name: str
    sku: str
    category_id: UUID
    unit_of_measure: str
    reorder_point: int = 0


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    name: str | None = None
    sku: str | None = None
    category_id: UUID | None = None
    unit_of_measure: str | None = None
    reorder_point: int | None = None


class ProductResponse(ProductBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ProductCategoryBase(BaseModel):
    name: str


class ProductCategoryCreate(ProductCategoryBase):
    pass


class ProductCategoryResponse(ProductCategoryBase):
    id: UUID
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
