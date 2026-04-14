# ROADMAP.md

> **Current Phase**: Phase 1
> **Milestone**: v1.0

## Must-Haves (from SPEC)
- [ ] QR Self-Ordering and Order Management APIs.
- [ ] Role-Based Access Control via Supabase Auth.
- [ ] KDS polling endpoints.
- [ ] Razorpay checkout and offline billing APIs.
- [ ] WhatsApp API Integration.
- [ ] Simple Inventory Tracking.

## Phases

### Phase 1: Foundation Setup
**Status**: ✅ Completed
**Objective**: Setup Python virtual environment, FastAPI clean architecture (routers, schemas, models, services), and connect Supabase database client.
**Requirements**: Foundational.

### Phase 2: Authentication & RBAC Core
**Status**: ✅ Completed
**Objective**: Set up user authentication logic. Support Admin, Manager, Waiter, and Kitchen roles using Supabase. Customer QR access is unauthenticated.
**Requirements**: REQ-08

### Phase 3: Order & Menu Management
**Status**: ✅ Completed
**Objective**: Implement APIs to create menus, manage restaurant tables, and place/update live orders (QR & Waiter flows).
**Requirements**: REQ-01, REQ-02

### Phase 4: KDS & Inventory Tracking
**Status**: ✅ Completed
**Objective**: Create endpoints that the Kitchen Display System will poll to get real-time order states. Implement basic stock modifier endpoints.
**Requirements**: REQ-03, REQ-07

### Phase 5: Billing & Payment Processing
**Status**: ✅ Completed
**Objective**: Calculate line items/taxes to generate offline bills. Integrate Razorpay API for remote payment.
**Requirements**: REQ-04, REQ-05

### Phase 6: WhatsApp Automations
**Status**: ✅ Completed
**Objective**: Trigger API calls to Twilio/Interakt based on status changes (order placed, food ready, payment successful).
**Requirements**: REQ-06
