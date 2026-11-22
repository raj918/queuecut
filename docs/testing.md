# QueueCut — Comprehensive Acceptance Testing Protocol

This document outlines the testing procedures verifying all 25 core acceptance criteria defined in Section 17.

---

## 1. End-to-End Showcase Acceptance Matrix

| # | Acceptance Scenario | Verification Method | Status |
| :--- | :--- | :--- | :--- |
| **1** | Customer registers on Phone A | Submit register form with role `CUSTOMER`. Verify record in PostgreSQL and auto-login. | Verified |
| **2** | Owner registers on Phone B | Submit register form with role `SALON_OWNER`. Verify separate owner dashboard access. | Verified |
| **3** | Owner creates a salon | Owner registers salon with Civil Lines Kanpur coordinates. Verify slug and defaults. | Verified |
| **4** | Owner adds services & barbers | Adds Haircut (₹150), Beard (₹80) and 3 staff members. Verify qualified services mapping. | Verified |
| **5** | Customer grants location permission | Accept Android/iOS location prompt. Center anchors to Kanpur GPS. | Verified |
| **6** | Customer sees nearby salons $\le$ 500m | Filter `radiusMeters=500`. Verify only salons with geodesic distance $\le 500\text{ m}$ appear. | Verified |
| **7** | Customer selects salon on map | Open `DiscoveryMap`, tap salon marker, inspect preview card sheet. | Verified |
| **8** | Customer selects services | Multi-select Haircut & Beard. Verify combined price (₹230) and duration (40m) tally. | Verified |
| **9** | Customer books a token | Submit booking. Backend atomically generates sequential token (e.g. `Q-001`). | Verified |
| **10**| Owner receives push notification | Backend triggers FCM push to owner device token: "New Booking Received! ✂️". | Verified |
| **11**| Owner sees booking on dashboard | Booking appears in owner's waiting queue with token number and service details. | Verified |
| **12**| Customer sees confirmed token | Confirmation screen displays official ticket with check-in instructions. | Verified |
| **13**| Owner calls customer | Owner taps "Call Turn". Status transitions `WAITING -> CALLED`. | Verified |
| **14**| Customer receives push notification | FCM alert dispatched: "It's Your Turn! Barber is calling for Token Q-001". | Verified |
| **15**| Customer screen updates live | Supabase Realtime emits `STATUS_UPDATED` event; screen moves to "Called" stage. | Verified |
| **16**| Owner starts the service | Owner taps "Start Service". Status transitions `CALLED -> IN_SERVICE`. Stylist locked. | Verified |
| **17**| Customer sees `IN_SERVICE` | Live queue screen reflects active haircut session in progress. | Verified |
| **18**| Owner completes the service | Owner taps "Complete & Bill". Status transitions `IN_SERVICE -> COMPLETED`. Stylist freed. | Verified |
| **19**| Customer completion notification | Push sent: "Service Completed! Please pay ₹230 at counter." | Verified |
| **20**| Commission ledger records 5% fee | Ledger entry created: `₹230 * 5% = ₹11.50`, status `DUE`. | Verified |
| **21**| Owner adds a walk-in | Owner clicks "Add Walk-in" at reception desk (Name: Rohan, Haircut ₹150). | Verified |
| **22**| Walk-in enters unified queue (0% fee) | Next sequential token `Q-002` created. Commission marked `NOT_ELIGIBLE` (₹0.00). | Verified |
| **23**| Customer views completed history | Customer Bookings -> "Completed" tab displays past token details and receipts. | Verified |
| **24**| Persistence after app restart | App relaunch retrieves JWT from secure storage, keeping session intact. | Verified |
| **25**| PostgreSQL data persistence | All transactions, counters, and ledgers remain stored in PostgreSQL. | Verified |

---

## 2. Concurrency & Edge Case Scenarios

### Concurrent Booking Requests
- **Condition**: Two customers tap "Confirm & Book" at the exact same millisecond.
- **Handling**: `prisma.$transaction` locks and increments `QueueCounter` atomically, ensuring Customer A receives `Q-004` and Customer B receives `Q-005` with zero collisions.

### Idempotency Protection
- **Condition**: Double-tapping the confirmation button or network retry.
- **Handling**: The unique constraint on `idempotencyKey` prevents duplicate booking creation, returning the existing booking receipt.

### Salon Paused State
- **Condition**: Owner pauses incoming bookings during a rush.
- **Handling**: Backend rejects new booking requests (`400 Bad Request`) while preserving all existing queued customers.
