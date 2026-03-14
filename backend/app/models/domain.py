import enum
from datetime import datetime
from uuid import UUID, uuid4

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.models.base import Base


class Role(Base):
    __tablename__ = "roles"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    name: Mapped[str] = mapped_column(String(50), unique=True, index=True)


class User(Base):
    __tablename__ = "users"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    role_id: Mapped[UUID] = mapped_column(ForeignKey("roles.id"))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    role = relationship("Role")


class LocationType(str, enum.Enum):
    warehouse = "warehouse"
    rack = "rack"
    virtual_customer = "virtual_customer"
    virtual_vendor = "virtual_vendor"


class Location(Base):
    __tablename__ = "locations"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    name: Mapped[str] = mapped_column(String(100), index=True)
    type: Mapped[LocationType] = mapped_column(Enum(LocationType))
    parent_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("locations.id"), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    # Optional self-relationship for hierarchical locations
    children = relationship("Location", backref="parent", remote_side=[id])


class ProductCategory(Base):
    __tablename__ = "product_categories"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    name: Mapped[str] = mapped_column(String(100), unique=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )


class Product(Base):
    __tablename__ = "products"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    name: Mapped[str] = mapped_column(String(200), index=True)
    sku: Mapped[str] = mapped_column(String(100), unique=True, index=True)
    category_id: Mapped[UUID] = mapped_column(ForeignKey("product_categories.id"))
    unit_of_measure: Mapped[str] = mapped_column(String(20))  # e.g., kg, units
    reorder_point: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    category = relationship("ProductCategory")


class StockBalance(Base):
    __tablename__ = "stock_balances"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    product_id: Mapped[UUID] = mapped_column(ForeignKey("products.id"), index=True)
    location_id: Mapped[UUID] = mapped_column(ForeignKey("locations.id"), index=True)
    quantity: Mapped[int] = mapped_column(Integer, default=0)

    # Optimistic Locking Version Column!
    version: Mapped[int] = mapped_column(Integer, default=1)

    last_updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    product = relationship("Product")
    location = relationship("Location")

    # Inform SQLAlchemy which column controls the optimistic lock
    __mapper_args__ = {
        "version_id_col": version,
    }


class DocumentType(str, enum.Enum):
    receipt = "receipt"
    delivery = "delivery"
    transfer = "transfer"
    adjustment = "adjustment"


class DocumentStatus(str, enum.Enum):
    draft = "draft"
    waiting = "waiting"
    ready = "ready"
    done = "done"
    canceled = "canceled"


class Document(Base):
    __tablename__ = "documents"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    type: Mapped[DocumentType] = mapped_column(Enum(DocumentType))
    status: Mapped[DocumentStatus] = mapped_column(
        Enum(DocumentStatus), default=DocumentStatus.draft
    )
    reference_number: Mapped[str] = mapped_column(String(50), unique=True, index=True)

    created_by: Mapped[UUID] = mapped_column(ForeignKey("users.id"))
    source_location_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("locations.id"), nullable=True
    )
    destination_location_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("locations.id"), nullable=True
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    creator = relationship("User")
    source_location = relationship("Location", foreign_keys=[source_location_id])
    destination_location = relationship(
        "Location", foreign_keys=[destination_location_id]
    )


class StockLedgerEntry(Base):
    __tablename__ = "stock_ledger_entries"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    document_id: Mapped[UUID] = mapped_column(ForeignKey("documents.id"), index=True)
    product_id: Mapped[UUID] = mapped_column(ForeignKey("products.id"), index=True)
    location_id: Mapped[UUID] = mapped_column(ForeignKey("locations.id"), index=True)
    quantity_change: Mapped[int] = mapped_column(
        Integer
    )  # + for inbound, - for outbound

    created_by: Mapped[UUID] = mapped_column(ForeignKey("users.id"))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    document = relationship("Document")
    product = relationship("Product")
    location = relationship("Location")
    creator = relationship("User")
