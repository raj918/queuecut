# QueueCut — REST API Specification

Base URL: `http://localhost:5000/api` (Local) or deployed Vercel endpoint.  
All responses adhere to standardized JSON envelopes:
- Success: `{ "success": true, "message": string, "data": any, "meta"?: object }`
- Error: `{ "success": false, "error": { "message": string, "statusCode": number, "details"?: any } }`

---

## 1. Authentication (`/api/auth`)

### `POST /api/auth/register`
Creates a new customer or salon owner account.
```json
// Request Body
{
  "name": "Aarav Sharma",
  "phone": "9876543210",
  "email": "aarav@example.com",
  "password": "password123",
  "confirmPassword": "password123",
  "role": "CUSTOMER" // or "SALON_OWNER"
}
```

### `POST /api/auth/login`
Authenticates via mobile number or email.
```json
// Request Body
{
  "identifier": "9876543210",
  "password": "password123"
}

// Response (200 OK)
{
  "success": true,
  "data": {
    "user": { "id": "...", "name": "Aarav Sharma", "role": "CUSTOMER" },
    "tokens": {
      "accessToken": "eyJh...",
      "refreshToken": "eyJh..."
    }
  }
}
```

### `GET /api/auth/me`
*Headers: `Authorization: Bearer <token>`*  
Returns authenticated user profile, notification preferences, and owned salons.

---

## 2. Salons & Discovery (`/api/salons`)

### `GET /api/salons/nearby`
Finds salons filtered by GPS location and radius.
- Query Parameters:
  - `latitude` (required, float)
  - `longitude` (required, float)
  - `radiusMeters` (optional, default 500, choices: 500, 1000, 3000, 5000)
  - `category` (optional, string)
  - `search` (optional, text search for name or locality)

### `GET /api/salons/:id`
Returns full salon details including services, staff barbers, photos, opening hours, and real-time wait estimate.
- Query Parameters: `lat` (optional), `lon` (optional) to compute distance.

### `POST /api/salons` *(Owner only)*
Registers a new salon with coordinates and operating hours.

---

## 3. Services & Staff (`/api/services`, `/api/staff`)

### `GET /api/services/salons/:id/services`
Retrieves all active styling services for a salon.

### `POST /api/services/salons/:id/services` *(Owner only)*
Adds a new service.

### `GET /api/staff/salons/:id/staff`
Retrieves barbers and availability status.

### `POST /api/staff/:id/break` *(Owner only)*
Puts barber on a temporary break (`durationMinutes`, `reason`).

---

## 4. Bookings (`/api/bookings`)

### `POST /api/bookings` *(Customer only)*
Reserves a digital queue token.
```json
// Request Body
{
  "salonId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "serviceIds": ["5c6d1234-5717-4562-b3fc-2c963f66afa6"],
  "staffId": null, // or specific stylist UUID
  "customerNotes": "Fade haircut please",
  "idempotencyKey": "idemp_1700000000000"
}

// Response (201 Created)
{
  "success": true,
  "message": "Token booked successfully",
  "data": {
    "id": "uuid",
    "tokenNumber": "Q-001",
    "bookingNumber": "QC-20261122-101",
    "totalPrice": 150.0,
    "totalDurationMinutes": 25,
    "status": "CONFIRMED"
  }
}
```

### `GET /api/bookings/my`
Retrieves current user's bookings. Optional query: `tab=active|upcoming|completed|cancelled`.

### `POST /api/bookings/:id/cancel`
Cancels booking if not currently in chair. Reverses commission automatically.

### `POST /api/bookings/:id/check-in`
Checks customer in upon physical arrival at salon.

---

## 5. Live Queue Engine (`/api/queue`)

### `GET /api/queue/salons/:id/queue`
Retrieves live partitioned token list: `inService`, `called`, `waiting`.

### `GET /api/queue/bookings/:id/queue-position`
Calculates live position for a token, customers ahead, and remaining wait time.

### `POST /api/queue/walk-in` *(Owner only)*
Adds an in-person walk-in customer into the unified queue.
```json
{
  "salonId": "...",
  "customerName": "Rohan Gupta",
  "customerPhone": "9812345678",
  "serviceIds": ["..."],
  "staffId": null,
  "notes": "Walk-in arrived at front desk"
}
```

### `POST /api/queue/:id/call` *(Owner only)*
Calls token number; notifies customer via push notification.

### `POST /api/queue/:id/start` *(Owner only)*
Marks customer seated in styling chair (`IN_SERVICE`).

### `POST /api/queue/:id/complete` *(Owner only)*
Concludes session (`COMPLETED`), records 5% platform commission ledger.

### `POST /api/queue/:id/skip` *(Owner only)*
Skips token with audit reason.

### `POST /api/queue/:id/no-show` *(Owner only)*
Flags token as no-show.

### `POST /api/queue/pause` and `POST /api/queue/resume` *(Owner only)*
Pauses/resumes incoming bookings without erasing existing queues.

---

## 6. Owner Dashboard & Commissions (`/api/owner`)

### `GET /api/owner/dashboard`
Returns live metrics, next customer, revenue estimate, and active barber counts.

### `GET /api/owner/bookings`
Returns salon bookings with source filters (`ONLINE` vs `WALK_IN`).

### `GET /api/owner/commission`
Returns total commission due, settled, and ledger records.
