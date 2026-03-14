# Zenith User Guide

Welcome to the **Zenith** management system. This guide will help you navigate the application and perform essential inventory operations efficiently.

## Table of Contents
1. [Authentication & Profile](#1-authentication--profile)
2. [Dashboard Overview](#2-dashboard-overview)
3. [Product Management](#3-product-management)
4. [Operations (Receipts, Deliveries, Transfers)](#4-operations)
5. [Stock Adjustments](#5-stock-adjustments)
6. [Stock Ledger (History)](#6-stock-ledger)
7. [Infrastructure (Locations)](#7-infrastructure)

---

## 1. Authentication & Profile
- **Sign In/Up**: Use your business email to sign in or create a new account.
- **Forgot Password**: If you lose your password, use the "Forgot Password?" link to receive a reset OTP/link via email.
- **Profile Menu**: Located at the bottom of the left sidebar, where you can view your profile or sign out.

## 2. Dashboard Overview
The Dashboard provides a real-time snapshot of your warehouse health:
- **Total SKUs**: Total unique products in your catalog.
- **Low Stock Alerts**: Number of items currently below their reorder point.
- **Pending Metrics**: Breakdown of scheduled Receipts, Deliveries, and Internal Transfers.
- **Real-time Stock Pulse**: Live feed of the latest movements across all locations.
- **Inventory Distribution**: Visual breakdown of stock by product categories.

## 3. Product Management
Navigate to **Products** to manage your catalog:
- **Initial Stock (NEW)**: When creating a new product, you can optionally set an initial stock level and its starting warehouse. This automatically logs an adjustment in the ledger.
- **Stock per Location**: View exactly how many units are available at each specific rack or warehouse aisle.
- **Reorder Points**: Set minimum stock levels. Items below these points will be highlighted in orange.
- **Add/Edit**: Manage SKU codes, names, categories, and units of measure.

## 4. Operations
The core of the system handles stock movement:
- **Receipts**: Record incoming stock from **Suppliers (Vendors)**. Create a "Draft", select the vendor, and once the physical goods arrive, click "Validate" to increase your virtual stock.
- **Deliveries (Multi-Step)**: 
  1. Create a Draft destination for a customer.
  2. Click **Confirm Pick/Pack** once items are ready.
  3. Click **Validate Delivery** to complete the shipment and decrease your stock.
- **Internal Transfers**: Move stock between locations (e.g., from Main Warehouse to Picking Rack).

## 5. Stock Adjustments
If you perform a physical count and find a mismatch, use **Stock Adjustments**:
- Select the Product and Location.
- Input the **Physical Count**.
- The system will automatically overwrite the existing stock level to match your physical audit.

## 6. Stock Ledger (History)
The **Stock Ledger** is a complete audit trail:
- **Advanced Filtering**: Filter by Type, Status, **Warehouse/Location**, and **Product Category**.
- **Search**: Search by reference ID or product name.

## 7. Infrastructure
Manage your physical warehouse structure in **Infrastructure > Locations**:
- Define Warehouses, Aisles, and Racks.
- This creates the locations you'll select during Receipts and Transfers.
## 8. How to Test Dynamic Filters
To verify the **Dynamic Filters** in the **Stock Ledger (History)**:

1.  **By Document Type**: Select *Receipts*, *Deliveries*, *Transfers*, or *Adjustments* from the "All Types" dropdown. Only moves of that specific type will be displayed.
2.  **By Status**:
    - Create a new Receipt or Delivery. It will appear as **Draft**.
    - In the respective module, click **Validate**. The status in the Ledger will update to **Completed** (mapped to the 'Done' database state).
    - Use the Status dropdown to filter by *Draft*, *Waiting*, *Ready*, *Completed*, or *Cancelled*.
3.  **By Warehouse or Location**:
    - Move stock between two different locations (e.g., Warehouse A to Rack B).
    - In the Ledger, select *Warehouse A* from the Locations dropdown. The transfer will appear because it involves that location.
4.  **By Product Category**:
    - Select a category (e.g., *Electronics*). Only products assigned to that category will show up in the audit log.

> [!TIP]
> Use the **Search Bar** at the top of the Ledger to further narrow down results by Product Name or Reference ID alongside your active filters.
