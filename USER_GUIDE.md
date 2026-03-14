# CoreInventory: Inventory Manager's Guide

Welcome to the **CoreInventory** management system. This guide covers all the essential modules and workflows designed specifically for Inventory Managers.

## 1. Dashboard & Analytics
The landing page provides a real-time snapshot of your warehouse performance.
- **KPI Cards**: Monitor Total SKU's, Low Stock alerts, Inventory Value, and Pending Operations.
- **Real-time Stock Pulse**: A live graph showing stock throughput and movement trends.
- **Inventory Distribution**: A breakdown of stock by category (Electronics, Clothing, Food, etc.).

## 2. Product Management
Manage your product catalog in the **Products** module.
- **Create Products**: Add new items with Name, SKU, Category, and Unit of Measure.
- **Stock Levels**: View current availability across all warehouses and racks.

## 3. Operations Module
This is the core of the inventory workflow. Each operation starts as a **Draft** and must be **Validated** or **Confirmed** to update actual stock levels.

### A. Incoming Receipts
- Use this when items arrive from vendors.
- **Workflow**: Create Receipt -> Select Product & Quantity -> Select Destination -> Save Draft -> **Validate** (Stock increases).

### B. Delivery Orders
- Use this when stock leaves for customer shipments.
- **Workflow**: New Delivery -> Select Product & Quantity -> Select Source -> Select Customer -> Create Draft -> **Confirm Pick/Pack** (Stock decreases).

### C. Internal Transfers
- Move stock between company locations (e.g., Warehouse A to Warehouse B).
- **Workflow**: New Transfer -> Select Product & Quantity -> Select Source & Destination -> Create Draft -> **Authorize Move** (Stock updates locally).

### D. Stock Adjustments (Cycle Counting)
- Use this to fix mismatches between system records and physical shelf counts.
- **Workflow**: Cycle Count -> Select Product & Location -> Input **Actual Physical Count** -> Record Count -> **Confirm Adjustment** (Stock level is overwritten).

## 4. Infrastructure & Locations
Organize your physical storage space.
- **Warehouses**: Primary storage facilities.
- **Racks/Aisles**: Specific locations within a warehouse.
- **Customer/Vendor Sites**: External endpoints for shipments.

## 5. Stock Ledger (History)
- A complete audit trail of every transaction.
- **Filters**: Use the advanced filters to slice data by Document Type, Status, Warehouse, or Product Category.
- **Search**: Search by product name or reference ID to trace any stock movement.

---
**Note**: This web application is restricted to **Inventory Managers**. Ensure you log out when finished to maintain system security.
