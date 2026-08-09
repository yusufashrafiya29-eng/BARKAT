# BARKAT Complete QA & Feature Testing Guide

Ye guide Barkat software ke har ek feature ka **deep dive** hai. Isme samjhaya gaya hai ki backend pe data kaise flow hota hai aur frontend pe steps kya hain. Is manual guide ko use karke tu high-effort testing kar sakta hai.

---

## 1. 🍔 The Core Flow: QR Menu → KDS → Waiter → Billing
Ye Barkat ka sabse important flow hai. Isme 4 alag-alag apps/dashboards interact karte hain real-time mein via WebSockets.

### Step-by-Step Test Process:
1. **[Customer] Place Order:**
   - Owner Dashboard > "Floor Plan & QR" se kisi table ka QR Code link copy kar (e.g. `https://barkat-plum.vercel.app/order/table/{table_id}`).
   - New incognito tab mein open kar.
   - Items add kar, apna naam/phone daal aur 'Place Order' daba.
   - **Logic Check:** Backend check karta hai ki item available hai ya nahi. Agar stock zero se connect hai, ya item off hai, toh order reject hoga.

2. **[Waiter] Accept Order:**
   - Waiter portal login kar. (Real-time bell bajegi).
   - "Pending" orders mein order dikhega. "Accept" pe click kar.
   - **Logic Check:** Status `PENDING` se `ACCEPTED` ho jata hai aur Kitchen ko notify kiya jata hai.

3. **[Kitchen] KDS Processing:**
   - Kitchen KDS tab me login kar. Order waha dikhega.
   - "Start Preparing" (ya status `PREPARING` kar).
   - Jab khana ready ho, ek-ek item ko tick kar, ya poore order ko `READY` kar.
   - **Logic Check:** KDS pe oldest order hamesha upar hona chahiye (FIFO). Jab order `READY` hota hai, tabhi backend pe automatically BOM (Bill of Materials) ke hisaab se inventory deduct hoti hai! (Ye fix kiya tha).

4. **[Waiter/Owner] Billing & Payment:**
   - Owner/Waiter portal pe ja, ready order ko select kar aur "Generate Bill".
   - Subtotal aur Taxes check kar (backend calculate karta hai).
   - Tip ya discount (agar applicable hai) apply kar.
   - "Confirm Payment" pe click kar, "Cash" select kar.
   - **Logic Check:** Order `PAID` mark hoga. Cash Register (Shift) mein *Net Sales* aur *Cash In* auto-update ho jayega. Customer CRM profile auto-generate ho jayegi with loyalty points. WhatsApp pe receipt jayegi (agar configured hai).

---

## 2. 📦 Inventory & BOM (Recipe) Management
Barkat me raw material deduction automatically hota hai based on recipes.

### Step-by-Step Test Process:
1. **Setup Raw Material:**
   - Owner > "Inventory Stock". 
   - Add new Item: "Tomato Sauce", Quantity: `10`, Unit: `kg`, Minimum Threshold: `2`.
2. **Setup Recipe:**
   - Owner > "Menu Catalog".
   - Ek Pizza ya Pasta item ko edit kar. "Recipe/Ingredients" section me jaa.
   - Ingredient add kar: "Tomato Sauce", Quantity: `0.5` kg.
3. **Execution Test:**
   - Ek order place kar is pizza/pasta ka (jaise Flow 1 mein bataya).
   - Order ko Kitchen KDS se `READY` mark kar.
   - Wapis Owner > "Inventory Stock" mein jaa.
   - **Logic Check:** Tomato sauce ka stock exactly `9.5 kg` hona chahiye (10 - 0.5). Agar `1.5 kg` bacha, toh UI pe "Low Stock Alert" aayega kyu ki threshold 2 tha.

---

## 3. 💵 Cash Register & Day End Operations
Manager/Cashier ki shift tracking jisme paise gayab (revenue leakage) na ho.

### Step-by-Step Test Process:
1. **Open Shift:**
   - Owner/Manager login > "Cash Register".
   - Agar shift close hai, toh "Open Shift" kar with initial cash e.g., `₹2000`.
   - **Logic Check:** System lock kar deta hai ki do shift ek saath open nahi ho sakti.
2. **Transactions:**
   - Cash In kar `₹500` ("Change from bank").
   - Cash Out kar `₹300` ("Bought vegetables").
   - 2-3 Orders process kar aur cash mein bill pay kar (Total e.g., ₹1000).
3. **Close Shift / Z-Report:**
   - "Close Shift" pe click kar.
   - System Expected Balance show karega: `2000 (Opening) + 500 (In) - 300 (Out) + 1000 (Sales) = ₹3200`.
   - Actual cash drawer count tu `₹3100` daal.
   - **Logic Check:** Discrepancy `-₹100` dikhani chahiye. Ye CA Reports me "Z-Report" CSV mein record hogi.

---

## 4. 📅 Table Bookings (Reservations)
Dine-in booking flow jisme advance payment (Razorpay) secure hai.

### Step-by-Step Test Process:
1. **Public Booking:**
   - `https://barkat-plum.vercel.app/book/{restaurant_id}` pe jaa.
   - Form fill kar for tomorrow 8 PM.
   - **Logic Check:** Backend pe check hota hai ki us din table booked toh nahi hai (Waitlist mein jayega agar capacity full hai).
2. **Owner Approval:**
   - Owner > "Bookings".
   - Pending booking ko select kar, ek Table assign kar, "Approve" daba.
   - **Logic Check:** Customer ko confirmation SMS/WhatsApp jayega.
3. **Secure Payments Check:**
   - Agar tumne booking form me advance pay kiya hai, toh verify kar ki payment URL params me pass nahi ho raha (We fixed this BUG-013).

---

## 5. 👥 Staff Roles & Access Isolation (Security)
Sabse bada risk SaaS me yeh hota hai ki ek account ka data dusre ko na dikhe, aur waiter owner ka kaam na kar paaye.

### Step-by-Step Test Process:
1. **Role Access Check:**
   - Waiter login kar (waiter@testing.com).
   - Try entering `/owner` directly in URL tab.
   - **Logic Check:** Frontend tujhe wapis login ya waiter dashboard pe phek dega. Waiter ke pas "Analytics", "Inventory", ya "Settings" API ka access nahi hai backend pe (403 Forbidden aayega).
2. **Cross-Tenant Isolation (V.IMP):**
   - New Restaurant account bana (Sign up as new owner).
   - Check kar "Analytics", "Menu", "Orders" completely khali hain ya nahi.
   - (Aaj maine jo caching bug fix kiya tha, usse ab 100% blank dikhega and data secure rahega).

---

## 6. 📊 Analytics & Reporting (CA/GST)
Data crunching aur CSV exports.

### Step-by-Step Test Process:
1. **Dashboard Stats:**
   - Check "24-Hour Peak Operations Heatmap". 
   - **Logic Check:** Jis ghante me orders aate hain wahan color intense (red/orange) ho jayega.
   - "Revenue Leakage Score". (System check karta hai ki kitne item manager ne complimentary diye ya kitne order cancel hue preparation ke baad).
2. **CA Reports Download:**
   - Owner > CA Reports & GST.
   - "Sales Report (CSV)" download kar.
   - Excel me open kar.
   - **Logic Check:** Columns match hone chahiye: Date, Subtotal, Tax, Total, Status. Timezones UTC se local time (IST) me theek se convert hoke dikhne chahiye (We fixed BUG-008 for this).

---

## 🚀 Testing Karte Time Kin Baaton Ka Dhyan Rakhna Hai:
* **Double Clicks:** Jaldi-jaldi 2 baar "Submit" dabane ki koshish kar aur dekh system crash karta hai ya handle karta hai.
* **Negative Values:** Price ya Quantity ko negative (`-10`) rakhne ki koshish kar.
* **Empty States:** Jab koi menu item ya orders nahi hain, toh "No data found" aana chahiye, ajeeb sa error nahi.
* **Responsive Check:** Mobile view me KDS aur Waiter Portal theek lag rahe hain ya buttons cut rahe hain?

All the best! Fata-fat test karke bata koi bhi minor UI issue ya flow mein dikkat lage toh hum turant fix/improve kar denge.
