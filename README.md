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

### 4. Auth Service
The security gateway for the application.
- **Identity Management:** Handles user registration, login, and multi-factor authentication (MFA).
- **Token Service:** Issues and verifies JWT tokens for secure inter-service communication.

### 5. Email Service
Handles all asynchronous communication with users.
- **Transactional Messaging:** Sends system-generated emails (e.g., Verify Email, Order Receipts).
- **Template Management:** Manages dynamic email templates for consistent branding.