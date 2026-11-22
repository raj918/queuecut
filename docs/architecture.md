# QueueCut — Architecture & System Design Document

Tagline: **Book your turn. Skip the wait.**  
Platform: Indian Salon Discovery & Digital Queue-Booking System

---

## 1. System Overview

QueueCut bridges customers seeking grooming services and salon owners managing foot traffic. The platform eliminates physical waiting benches in Indian salons by providing an atomic digital queue token system, live status tracking via Supabase Realtime, and timely push notifications via Firebase Cloud Messaging.

```
┌────────────────────────────────────────────────────────┐
│                   QueueCut Clients                     │
│   (Bare React Native CLI: Customer & Salon Owner)      │
└───────────────▲───────────────────────▲────────────────┘
                │ REST API (HTTPS/JSON) │ Supabase Realtime (WSS)
                ▼                       │
┌───────────────────────────────┐       │
│        QueueCut Backend       │       │
│   (Node.js / Express / TS)    │       │
│   • Auth (JWT / bcrypt)       │       │
│   • Queue Engine (Atomic Q-0) │       │
│   • Commission Engine (5%)    │       │
│   • Discovery Engine (GPS)    │       │
└───────┬───────────────┬───────┘       │
        │ Prisma ORM    │ FCM Admin     │
        ▼               ▼               │
┌───────────────┐ ┌───────────────┐     │
│   Supabase    │ │   Firebase    │     │
│  PostgreSQL   │ │  Cloud Msg    │     │
└───────┬───────┘ └───────────────┘     │
        │ Database Webhooks / Broadcast  │
        └───────────────────────────────┘
```

---

## 2. Queue Engine State Machine

The queue engine is fully centralized on the server to prevent race conditions and client tampering.

### State Transitions

```
[CONFIRMED] ──(Customer checks in)──> [WAITING] ──(Barber calls)──> [CALLED]
     │                                    │                              │
     │                                    ▼                              ▼
     ├──(Cancel)─────────> [CANCELLED]    ├──(Skip)─────> [SKIPPED]      │
     │                                    └──(No Show)──> [NO_SHOW]      │
     │                                                                   │
     └───────────────────────────────────────────────────────────────────┤
                                                                         ▼
                                                                   [IN_SERVICE]
                                                                         │
                                                                   (Service ends)
                                                                         ▼
                                                                    [COMPLETED]
                                                                  (Commission 5%)
```

### Key Business Invariants

1. **Atomic Token Generation**:
   Tokens are strictly scoped per salon per business date (`YYYY-MM-DD`). Counter increments run inside ACID database transactions using `QueueCounter`, generating predictable human tokens: `Q-001`, `Q-002`, `Q-003`.
2. **Never Reuse Cancelled Tokens**:
   When a customer cancels or is marked as a no-show, their token is flagged in place. Subsequent customers receive newly generated sequential tokens.
3. **Staff Qualifications**:
   A stylist can only be assigned to a booking if they possess skills for all selected services.
4. **Single-Job Concurrency**:
   A stylist cannot be in active service with more than one customer simultaneously (`IN_SERVICE`).
5. **No Reassignment After Start**:
   Once a customer is in the styling chair (`IN_SERVICE`), their booking and barber cannot be reassigned.
6. **Walk-ins on Unified Engine**:
   Walk-in physical customers enter the exact same sequential queue engine as online customers, but are flagged `bookingSource = WALK_IN`.

---

## 3. Commission & Financial Architecture

### Rules & Ledger

- **Rate**: Default 5.0% platform fee on completed online bookings.
- **Walk-in Exemption**: Physical walk-in customers are 100% exempt from platform commission (`amount = ₹0.00`, status `NOT_ELIGIBLE`).
- **Trigger**: Platform commission is recorded only when status transitions to `COMPLETED`.
- **Reversal**: Cancellations or refunds write an audit record to `CommissionAdjustment` and transition the ledger entry to `REVERSED`.
- **In-Person Payment**: For this showcase, customers pay directly at the salon counter in cash, UPI, or card. QueueCut logs commission as `DUE` to be settled periodically with salon owners.

---

## 4. Location & Nearby Discovery Engine

- **Coordinates Reference**: Kanpur showcase default anchor (`26.4729° N, 80.3458° E`).
- **Distance Formula**: Haversine great-circle formula calculating geodesic distance in meters.
- **Bounding Box Index**:
  Database queries pre-filter records using indexed latitude and longitude bounding boxes before calculating exact distances.
- **Strict Radius Enforcement**:
  A 500m radius search strictly returns salons with geodesic distance $\le 500\text{ m}$.
- **Display Standardization**:
  Distances under $1000\text{ m}$ are formatted in meters (e.g. `270 m`), while distances $\ge 1000\text{ m}$ are formatted in kilometers (e.g. `1.8 km`).

---

## 5. Notification Architecture

- **Engine**: Firebase Cloud Messaging (FCM) v1 HTTP protocol via `firebase-admin`.
- **Device Management**:
  Device registration tokens are stored per user in `DeviceToken`. Supports multi-device logins and auto-prunes invalid or expired tokens upon FCM rejection.
- **Channel**: Android 8+ notification channel `queue_updates` configured with High Importance for heads-up alerts.
