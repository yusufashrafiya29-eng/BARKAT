# Implementation Plan: Foaps Webhook Integration (Backend)

## Goal Description
Build the backend infrastructure to receive and manage incoming Foaps (Zomato/Swiggy) orders in real-time, completely replacing the simulated frontend drops. This ensures that when the Foaps API keys arrive, the system is 100% ready to receive live webhooks.

## Proposed Changes

---

### Database Models

#### [NEW] [models/aggregator.py](file:///C:/Users/Preneel/Desktop/raaziya malek/BARKAT/backend/models/aggregator.py)
Create a new SQLAlchemy model `AggregatorOrder` to store incoming third-party deliveries.
- `id` (UUID)
- `restaurant_id` (ForeignKey)
- `foaps_order_id` (String) - Unique ID from Foaps
- `platform` (String) - 'Zomato', 'Swiggy', etc.
- `customer_name`, `customer_phone`
- `items_summary` (JSON or String)
- `gross_amount`, `discount_amount`, `taxes`, `net_payout` (Float)
- `status` (String) - NEW, KITCHEN_PREPARING, READY_FOR_RIDER, DELIVERED
- `rider_name`, `rider_status`
- Timestamps

#### [MODIFY] [models/__init__.py](file:///C:/Users/Preneel/Desktop/raaziya malek/BARKAT/backend/models/__init__.py)
- Import `AggregatorOrder` to ensure Alembic detects it.

---

### Migrations

#### [NEW] Database Migration Script
- Run Alembic `revision --autogenerate -m "Add AggregatorOrder model"` and `upgrade head` to create the `aggregator_orders` table in PostgreSQL.

---

### API Endpoints (Webhooks)

#### [NEW] [api/api_v1/aggregators.py](file:///C:/Users/Preneel/Desktop/raaziya malek/BARKAT/backend/api/api_v1/aggregators.py)
Create a new router for aggregator-specific actions:
- `POST /webhooks/foaps`: The live webhook receiver. It will parse the incoming JSON from Foaps, calculate the `net_payout` based on commissions, and save the order to `aggregator_orders`.
- `GET /orders`: Returns all aggregator orders for the `AggregatorOrdersTab` in the frontend (replacing the simulated mock API).
- `PUT /orders/{id}/status`: Updates the status (e.g., when the chef clicks "Mark Ready for Valet").

#### [MODIFY] [api/api_v1/router.py](file:///C:/Users/Preneel/Desktop/raaziya malek/BARKAT/backend/api/api_v1/router.py)
- Register the new `aggregators.py` router.

---

### Frontend Updates

#### [MODIFY] [src/api/owner.ts](file:///C:/Users/Preneel/Desktop/raaziya malek/BARKAT/frontend/src/api/owner.ts)
- Update `getAggregators` to fetch from `GET /api/v1/aggregators/orders`.

#### [MODIFY] [src/components/owner-dashboard/AggregatorOrdersTab.tsx](file:///C:/Users/Preneel/Desktop/raaziya malek/BARKAT/frontend/src/components/owner-dashboard/AggregatorOrdersTab.tsx)
- Connect the UI to the live backend API instead of using hardcoded simulation logic.
- Remove the mock webhook generator code.

## Verification Plan
1. **Automated Testing:** I will run `curl` commands to simulate a Zomato order payload hitting the `POST /webhooks/foaps` endpoint.
2. **Database Verification:** Ensure the order appears correctly in the PostgreSQL `aggregator_orders` table.
3. **Frontend Verification:** Ensure the `AggregatorOrdersTab` fetches the real data from the backend seamlessly.

> [!NOTE]
> Please review this plan. If you approve, I will begin execution immediately!
