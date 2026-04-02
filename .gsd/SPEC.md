# SPEC.md — Project Specification

> **Status**: `FINALIZED`

## Vision
To build a scalable, production-ready Smart Restaurant Software backend using FastAPI and Supabase that handles table-wise QR ordering, a Kitchen Display System, billing with Razorpay, simple inventory management, and automated WhatsApp notifications.

## Goals
1. Enable table-wise QR-based self-ordering and waiter-assisted order management.
2. Provide a Kitchen Display System (KDS) handling real-time data via API polling.
3. Facilitate offline billing and online (Razorpay) payment collection.
4. Automate WhatsApp notifications (via Twilio/Interakt) for critical order lifecycle events.
5. Provide administrative capabilities for reporting and simple stock tracking.

## Non-Goals (Out of Scope for Phase 1)
- WebSockets for real-time KDS updates (planned for v2).
- Complex recipe-based inventory deduction (planned for v2).
- Customer authentication/login (anonymous QR ordering).

## Users
- **Admin**: Full system control, reports.
- **Manager**: Order management, reporting, inventory tracking.
- **Waiter**: Create and update table orders.
- **Kitchen Staff**: Update order preparation status (via KDS).
- **Customer**: Anonymous users placing orders via QR code.

## Constraints
- **Backend Stack**: FastAPI (Python).
- **Database**: Supabase (PostgreSQL + Auth).
- **Architecture**: Must follow clean, scalable package structure (routers, schemas, models, services).

## Success Criteria
- [ ] Customers can scan a QR code and place an order natively, optionally paying via Razorpay.
- [ ] Waiters and Managers can view and manage live orders.
- [ ] Kitchen KDS reflects live order status via polling.
- [ ] WhatsApp messages are successfully dispatched at key order moments.
- [ ] Admin/Manager can track and update simple stock quantities.
