# Dyno APIs DAMS Deployment & Configuration Guide

This guide explains how to deploy the DAMS webhook server and connect it to your MyRestro instance to receive Swiggy/Zomato orders.

## What is DAMS?
DAMS (Dyno APIs Webhook Server) is an open-source Java Spring Boot application provided by Dyno APIs. It receives webhook payloads from Swiggy/Zomato (via Dyno APIs) and allows you to process or forward them.

## 1. Deploying DAMS

You can deploy DAMS on the same VPS as your MyRestro backend, or on a separate machine. 

### Prerequisites
- Java JDK 11 or higher
- PostgreSQL (or MySQL)
- Maven

### Steps
1. Clone the DAMS repository:
   ```bash
   git clone https://github.com/dynoapis/dams.git
   cd dams
   ```

2. Configure Database:
   Open `src/main/resources/application.properties` and set your database credentials:
   ```properties
   spring.datasource.url=jdbc:postgresql://localhost:5432/dams_db
   spring.datasource.username=your_user
   spring.datasource.password=your_pass
   ```

3. Build and Run:
   ```bash
   ./mvnw package
   java -jar target/*.jar
   ```
   DAMS will start on port `8080` by default.

## 2. Configuring Dyno APIs

1. Go to your Dyno APIs Dashboard.
2. In the Webhooks section, enter your DAMS server URL: `http://YOUR_DAMS_SERVER_IP:8080/api/v1/orders`
3. Save the configuration.

## 3. Forwarding to MyRestro

Currently, DAMS saves orders to its own database. To forward them to MyRestro in real-time, you have two options:

### Option A: Modify DAMS Source Code (Recommended)
Edit the `OrdersController.java` in DAMS to forward the payload to MyRestro.
```java
// Inside insertNewOrders method
RestTemplate restTemplate = new RestTemplate();
restTemplate.postForObject("https://your-myrestro-backend.com/api/v1/aggregators/webhooks/dams", orderRequest, String.class);
```

### Option B: MyRestro Polling (Alternative)
MyRestro can poll the DAMS `/api/v1/{restaurantId}/orders` endpoint. However, the webhook approach is preferred for real-time POS syncing.

## 4. Item Mapping (Crucial Step)

Before accepting orders on the Waiter Panel, you MUST map your Swiggy/Zomato items to your MyRestro menu items.

Use the API endpoint to create mappings:
`POST /api/v1/aggregators/item-mappings`
```json
{
  "platform": "Swiggy",
  "platform_item_id": "12345",
  "platform_item_name": "Butter Chicken",
  "menu_item_id": "uuid-of-butter-chicken-in-myrestro"
}
```

If an item is unmapped, the backend will reject the order acceptance.

## 5. Status Sync Back

Once you have your Dyno APIs API key, you need to implement the TODOs in `api/api_v1/aggregators.py` and `api/api_v1/orders.py` to push status updates (like `READY_FOR_RIDER` or `REJECTED`) back to the Dyno APIs endpoint.
