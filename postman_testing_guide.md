🛡️ Auth Module
(Requires JWT token in headers: Authorization: Bearer <token>)

1. Get Current User Info

Method: GET
URL: {{base_url}}/api/v1/auth/me
Body: None
🍔 Menu Module
(POST methods require Auth Token)

2. Get All Categories & Menu Items

Method: GET
URL: {{base_url}}/api/v1/menu/categories
Body: None
3. Create a Category

Method: POST
URL: {{base_url}}/api/v1/menu/categories
Body:
json
{
  "name": "Beverages",
  "description": "Hot and cold drinks",
  "is_active": true
}
4. Create a Menu Item

Method: POST
URL: {{base_url}}/api/v1/menu/items
Body:
json
{
  "category_id": "PASTE_CATEGORY_UUID_HERE",
  "name": "Mango Shake",
  "description": "Sweet Alphonso Mango Shake",
  "price": 180.0,
  "is_veg": true,
  "is_available": true,
  "preparation_time": 10,
  "image_url": "https://example.com/mango.jpg"
}
🪑 Tables Module
5. Get All Tables

Method: GET
URL: {{base_url}}/api/v1/tables/
Body: None
6. Create a Table

Method: POST
URL: {{base_url}}/api/v1/tables/
Body:
json
{
  "table_number": 1,
  "capacity": 4,
  "qr_code_url": null
}
(Note: table_number must be an integer, e.g., 1, not "T1").

📝 Orders Module
7. Create an Order

Method: POST
URL: {{base_url}}/api/v1/orders/
Body:
json
{
  "table_id": "PASTE_TABLE_UUID_HERE",
  "customer_phone": "+919876543210",
  "items": [
    {
      "menu_item_id": "PASTE_MENU_ITEM_UUID_HERE",
      "quantity": 2,
      "notes": "Less sugar please"
    }
  ]
}
(Note: customer_phone must strictly follow E.164 format with the + sign)

8. Get Kitchen Active Orders

Method: GET
URL: {{base_url}}/api/v1/orders/kitchen/active
Body: None
9. Get Orders for a specific Table

Method: GET
URL: {{base_url}}/api/v1/orders/table/PASTE_TABLE_UUID_HERE
Body: None
10. Update Order Status

Method: PUT
URL: {{base_url}}/api/v1/orders/PASTE_ORDER_UUID_HERE/status
Body:
json
{
  "status": "PREPARING"
}
(Valid statuses: PENDING, PREPARING, SERVED, CANCELLED)

📦 Inventory Module
11. Get All Inventory Items

Method: GET
URL: {{base_url}}/api/v1/inventory/
Body: None
12. Add a new Stock Item

Method: POST
URL: {{base_url}}/api/v1/inventory/
Body:
json
{
  "name": "Tomatoes",
  "quantity": 15.5,
  "unit": "kg",
  "minimum_threshold": 2.0,
  "cost_price": 45.0,
  "is_active": true
}
13. Adjust Stock Level (e.g. subtracting material used)

Method: PUT
URL: {{base_url}}/api/v1/inventory/PASTE_INVENTORY_UUID_HERE/adjust
Body:
json
{
  "quantity_change": -1.5
}
🧾 Billing Module
14. Generate a Final Bill

Method: POST
URL: {{base_url}}/api/v1/billing/PASTE_ORDER_UUID_HERE/generate
Body:
json
{
  "payment_method": "UPI",
  "discount_amount": 50.0
}
(Valid payment methods: CASH, CARD, UPI)

15. Confirm Payment

Method: PUT
URL: {{base_url}}/api/v1/billing/PASTE_ORDER_UUID_HERE/confirm
Body:
json
{
  "transaction_id": "PayTM_TXN_00129384"
}
💓 Health Module
16. Check Backend Server Status

Method: GET
URL: {{base_url}}/api/v1/health
Body: None
I actually noticed that the local postman_testing_guide.md file you have open is missing the Inventory endpoints and a few others. Let me know if you'd like me to update that document directly to inc