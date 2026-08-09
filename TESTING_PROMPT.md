# BARKAT Software — Complete Live Testing Prompt
## (Copy this entire prompt and paste in next conversation)

---

You are a **Senior QA Engineer** doing an **industry-level, high-effort, comprehensive live testing** of BARKAT — a multi-tenant restaurant management SaaS platform. 

Your job is to:
1. Test **EVERY single feature** thoroughly with real interactions
2. Find **every bug, UI glitch, logic error, or bad UX**
3. Note **improvement suggestions** for design, logic, and user experience
4. Produce a **structured bug report** with severity ratings

Be **extremely thorough** — test edge cases, error states, empty states, and multi-step flows. Don't skip anything.

---

## 🔗 LIVE URLS

- **Frontend:** https://barkat-plum.vercel.app
- **Backend API:** (check from frontend network tab or known Render URL)

---

## 🔑 TEST CREDENTIALS

| Role | Email | Password |
|---|---|---|
| **Owner** | owner@testing.com | tester123 |
| **Waiter** | waiter@testing.com | tester123 |
| **Kitchen** | kitchen@testing.com | tester123 |

---

## 📋 TESTING SCOPE — Test ALL of these in order:

---

### PHASE 1: AUTH & ONBOARDING
1. Visit https://barkat-plum.vercel.app — check landing page loads correctly
2. Go to Login page — check UI, validation
3. Login as **Owner** (owner@testing.com / tester123)
4. Verify redirect to `/dashboard` then `/owner`
5. Check owner name, restaurant name, logo visible in sidebar
6. Check subscription status badge (trial/active)
7. Logout → verify redirect to login
8. Login as **Waiter** (waiter@testing.com / tester123)  
9. Verify redirect to `/waiter` dashboard
10. Logout
11. Login as **Kitchen** (kitchen@testing.com / tester123)
12. Verify redirect to `/kitchen` KDS
13. Logout and login as **Owner** again for rest of testing

---

### PHASE 2: OWNER DASHBOARD — ANALYTICS TAB
1. Check "Today Analytics" stats: Today Revenue, Total Orders, Active Orders, Served Orders
2. Check 7-day revenue chart — verify data renders correctly, no crashes
3. Check "24-Hour Peak Operations Heatmap" — verify all 24 hours show
4. Check "Payment Method Breakdown" donut chart
5. Check "Staff Performance (Top Waiters)" section
6. Check "Inventory Velocity (Top Items)" section
7. Check "Revenue Leakage Score" section
8. Check "AI Insights" section — does it show relevant insights?
9. Check "AI Recommendation" text
10. Try switching to different time periods if available

---

### PHASE 3: ORDER HISTORY TAB
1. Click "Order History" in sidebar
2. Check if orders load in a table/list
3. Verify order details visible: date, time, items, amount, status
4. Check if filters work (if any)
5. Test "Clear History" button — does it ask for password confirmation?
6. Try wrong password → should show error
7. Try correct password (tester123) → should clear served/cancelled orders

---

### PHASE 4: MENU MANAGEMENT
1. Click "Menu Catalog" in sidebar
2. Check if categories are shown
3. Click "Add Category" → fill form → submit → verify category appears
4. Click "Add Menu Item" → fill:
   - Name: "Test Burger"
   - Price: 199
   - Category: select one
   - Is Veg: Yes
   - Tax Rate: 5
   - Submit → verify item appears
5. Click edit on menu item → change price to 249 → save → verify updated
6. Toggle item availability OFF → verify it shows as unavailable
7. Toggle back ON
8. Try uploading an image for a menu item
9. Delete the test item → verify removed
10. Delete the test category → verify removed

---

### PHASE 5: TABLES & FLOOR PLAN
1. Click "Floor Plan & QR" in sidebar
2. Check existing tables displayed on floor map
3. Click "Add Table" → fill number, capacity → submit → verify appears
4. Try dragging a table to new position → verify position saves
5. Click on a table → see QR code option
6. Download/view QR code — check it shows correct URL format
7. Test the QR URL in a new tab → should open Customer Menu page
8. Delete the test table

---

### PHASE 6: CUSTOMER MENU (QR ORDER FLOW)
1. Get QR URL for an existing table (format: /order/table/{tableId})
2. Open in new tab / incognito window
3. Verify restaurant name and menu loads correctly
4. Check categories are visible
5. Check item cards: name, price, veg/non-veg indicator, image
6. Add 2 items to cart
7. Enter customer name and phone number
8. Place order → verify success message
9. Go back to owner dashboard → check if order appears in active orders
10. Go to waiter dashboard → check if order appears there
11. Try placing another order within 30 seconds → should get rate limit error
12. Wait 30s then try again → should work

---

### PHASE 7: WAITER DASHBOARD
1. Login as Waiter (waiter@testing.com / tester123)
2. Check orders list loads
3. Find the pending customer order from Phase 6
4. Click "Accept" → verify status changes to ACCEPTED
5. Check KDS (kitchen) receives update
6. Try adding items to existing order manually
7. Test "Generate Bill" flow
8. Check table status updates
9. Logout

---

### PHASE 8: KITCHEN KDS
1. Login as Kitchen (kitchen@testing.com / tester123)
2. Check KDS screen loads
3. Verify order from Phase 6 appears
4. Check FIFO ordering (oldest first)
5. Click "Start Preparing" or change status to PREPARING
6. Mark individual items as READY
7. Mark order as READY → verify auto-status change when all items ready
8. Check WebSocket real-time: open waiter tab simultaneously → does KDS update instantly without refresh?
9. Test sound notification (if any) when new order arrives

---

### PHASE 9: BILLING & PAYMENTS
1. Login as Owner
2. Find a served/ready order
3. Click "Generate Bill"
4. Check bill breakdown: subtotal, tax, discount
5. Try applying a discount amount
6. Check total recalculates correctly
7. Test "Cash" payment → confirm → verify order marked PAID
8. Test "UPI" payment option
9. Check if cash register auto-updates when payment confirmed
10. Test "Multi-tender" (split payment if available)

---

### PHASE 10: INVENTORY MANAGEMENT
1. Click "Inventory Stock" in sidebar
2. Check existing stock items
3. Click "Add Stock Item" → fill: Name, Quantity, Unit, Min Threshold → save
4. Verify item appears in list
5. Check low stock indicator for items below threshold
6. Go to Menu → edit a menu item → set recipe ingredients (link to stock)
7. Place an order with that item → mark as READY in kitchen
8. Go back to Inventory → verify stock was deducted
9. Check stock doesn't go below 0

---

### PHASE 11: RESERVATIONS / BOOKINGS
1. Click "Bookings" in sidebar
2. Check existing reservations list
3. Click "Add Reservation" → fill:
   - Customer Name, Phone
   - Date (tomorrow)
   - Time: 19:00
   - Guests: 4
   - Table: select one
4. Submit → verify appears as CONFIRMED
5. Try without table → should appear as WAITLIST
6. Test public booking page: https://barkat-plum.vercel.app/book/{restaurant_id}
7. Fill customer form on public booking page → submit
8. Go to owner dashboard → verify pending reservation appeared
9. Approve/confirm the reservation

---

### PHASE 12: CASH REGISTER
1. Click "Cash Register" in sidebar
2. Check if shift is currently open or closed
3. If no shift open: "Open Shift" → enter opening balance: 1000 → open
4. Verify shift opened with correct balance
5. Add CASH_IN transaction: ₹500 "Petty cash received"
6. Add CASH_OUT transaction: ₹200 "Vegetable purchase"
7. Check running balance updates
8. Verify: When order is paid (Phase 9) → net_sales auto-updates
9. "Close Shift" → enter closing balance → verify discrepancy calculated
10. Check shift history shows previous shifts

---

### PHASE 13: STAFF MANAGEMENT
1. Click "Staff Roster" in sidebar
2. Check existing staff list (waiter, kitchen)
3. Check approve/reject buttons work
4. Toggle staff active/inactive
5. Try adding new staff from owner portal
6. Check staff appears in list

---

### PHASE 14: CRM & LOYALTY
1. Click "CRM & Loyalty" in sidebar  
2. Check customer list
3. Find customer who placed order in Phase 6 (if phone provided)
4. Verify loyalty points were added (₹100 = 1 point)
5. Check total_spent updated
6. Check total_visits count

---

### PHASE 15: REPORTS (CA Reports & GST)
1. Click "CA Reports & GST" in sidebar
2. Try downloading "Sales Report CSV"
3. Try downloading "Item-wise Report CSV"
4. Try downloading "Shift Z-Report CSV"
5. Check if CSV downloads correctly and data is accurate

---

### PHASE 16: STORE SETTINGS
1. Click "Store Settings" in sidebar
2. Check Restaurant Info section
3. Try updating restaurant name → save → verify
4. Check GSTIN and FSSAI fields
5. Check Payment Settings: UPI ID field → enter test UPI → save
6. Check Razorpay Keys section (should show key_id, key_secret fields)
7. Check Advance Booking Fee field
8. Check "Branding" section if available

---

### PHASE 17: BILLING & PLAN (SUBSCRIPTION)
1. Click "Billing & Plan" in sidebar
2. Check current plan shown (trial/basic/pro/max)
3. Check trial days remaining
4. Click "Upgrade" or plan selection
5. Verify plan prices: Basic ₹499/mo, Pro ₹999/mo, Max ₹1399/mo
6. Check yearly pricing: Basic ₹4990/yr, Pro ₹9990/yr, Max ₹13990/yr
7. Try clicking upgrade → check if Razorpay payment modal opens
8. Don't complete payment — just verify the modal/flow

---

### PHASE 18: DISCOUNTS & OFFERS
1. Click "Discounts & Offers" (if visible)
2. Check discount options
3. Try creating a discount
4. Test applying discount during billing

---

### PHASE 19: DAY END / PETTY CASH
1. Click "Day End Close" or "Petty Cash & Expenses"
2. Check UI and functionality
3. Add a petty cash expense if possible

---

### PHASE 20: AGGREGATORS (Enterprise)
1. Click "Enterprise" or "Aggregators" section
2. Check Swiggy/Zomato integration UI
3. Verify no crashes

---

### PHASE 21: EDGE CASES & ERROR HANDLING
1. **Empty state**: Delete all orders → refresh → check empty state messages
2. **Long text**: Create menu item with very long name (100 chars) → check UI overflow
3. **Zero price**: Try creating item with price 0 → should it be allowed?
4. **Duplicate table**: Create table with number that already exists
5. **Invalid phone**: Customer order with invalid phone format
6. **Session expiry**: Wait... then try an action — does it prompt login?
7. **Simultaneous tabs**: Open waiter + owner + kitchen in 3 tabs — real-time sync check
8. **Mobile view**: Resize browser to 375px width — check mobile responsiveness
9. **Browser back**: After logout, press browser back → should redirect to login, not show dashboard
10. **Wrong route**: Visit /owner without login → should redirect to login

---

## 📊 REPORT FORMAT

After testing, provide a structured report:

### 🔴 Critical Bugs (App-breaking)
| # | Feature | Bug Description | Steps to Reproduce | Expected | Actual |

### 🟠 High Bugs (Major functionality broken)
| # | Feature | Bug Description | Steps | Expected | Actual |

### 🟡 Medium Bugs (Minor issues)
| # | Feature | Bug Description | Steps | Expected | Actual |

### 💡 UX/Design Improvements
| # | Area | Current Behavior | Suggested Improvement |

### ✅ Features Working Perfectly
List all features that passed testing.

### 📈 Performance Observations
Note any slow loading, timeouts, or poor response times.

---

## ⚡ IMPORTANT NOTES
- Test on Chrome latest version
- Check browser console for JavaScript errors on every page
- Check Network tab for failed API calls (red requests)
- Note exact error messages from the API
- If a feature requires data to test (e.g., need orders to test billing), create that data first
- Test both happy path AND error cases for every feature
- Pay special attention to: data isolation (your data only), real-time updates, payment flows
