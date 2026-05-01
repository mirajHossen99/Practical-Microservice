# Ecommerce-Microservice

## API Gateway

## Services

### 1. Inventory
This service manages product stock and inventory levels.
- **Stock Validation:** Checks if a product is available in stock.
- **Inventory Updates:** Handles stock increments or decrements (e.g., after a purchase or restock).

### 2. Product
The core product information is handled by this service.
- **Product Management:** Manages product names, descriptions, and **SKUs** (Stock Keeping Units).
- **CRUD Operations:** Handles adding new products or updating existing product details.

### 3. User
Responsible for managing user profiles and related data.
- **Data Persistence:** Safely stores and manages user information.
- **Profile & Roles:** Handles profile updates and User Role Management (RBAC).
