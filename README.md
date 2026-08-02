# API Documentation

Base URL: `http://localhost:3000`

## Authentication

Most routes require a JWT sent in the request header:

```
Authorization: Bearer <token>
```

The token is issued by `POST /api/login` and should be stored client-side (e.g. `localStorage`).

Some routes also require a specific role. Where noted, the logged-in user's role must match one of the listed roles, or the request will be rejected.

Legend:
- 🔒 Requires a valid JWT (`verifyToken`)
- 🔒 + role: Requires a valid JWT **and** one of the listed roles
- 🔓 No authentication required

---

## User & Auth Routes

### Forgot Password
`POST /api/user/forgot-password` 🔓

Sends a password reset request for the given account.

**Body:**
```json
{ "email": "user@example.com" }
```

---

### Reset Password
`POST /api/user/reset-password` 🔓

Completes a password reset, typically using a token sent to the user's email.

**Body:**
```json
{ "token": "reset-token-here", "newPassword": "..." }
```

---

### Login
`POST /api/login` 🔓

Authenticates a user and returns a JWT.

**Body:**
```json
{ "email": "user@example.com", "password": "..." }
```

**Response:**
```json
{ "token": "...", "userId": "...", "userType": "..." }
```

---

### Get Dashboard
`GET /api/:userType/get-dashboard/:id` 🔒 (StallOwner, Operator)

Returns dashboard data for the given user. The `:id` must match the authenticated user's own ID.

**URL Params:**
- `userType` — `StallOwner` or `Operator`
- `id` — user ID

---

### Get User Profile
`GET /api/user/get-profile/:id` 🔒

Returns profile details for the given user. The `:id` must match the authenticated user's own ID.

Response shape depends on user type:
- **Stall Owner:** `{ OwnerName, Email, OwnerContactNo, OwnerNRIC }`
- **Operator:** `{ OperatorName, Email, ContactPerson }`
- **Customer:** `{ CustName, CustEmail, CustContactNo }`
- **NEA Officer:** `{ OfficerName, Email, OfficerContactNo }`

---

### Update User Profile
`PUT /api/user/update-profile/:id` 🔒 (StallOwner, Operator, Customer, NeaOfficer)

Updates profile details. The `:id` must match the authenticated user's own ID.

**Body (Stall Owner / Customer / NEA Officer):**
```json
{ "name": "...", "email": "...", "contactNo": "..." }
```

**Body (Operator):**
```json
{ "name": "...", "email": "...", "contactPerson": "..." }
```

---

### Update Password
`PUT /api/user/update-password/:id` 🔒 (StallOwner, Operator, Customer, NeaOfficer)

Changes the account's password. The `:id` must match the authenticated user's own ID.

**Body:**
```json
{ "id": "...", "currentPassword": "...", "newPassword": "..." }
```

---

### Sign Up
`POST /api/:userType/signup` 🔓

Registers a new account.

**URL Params:**
- `userType` — the role being registered (e.g. `StallOwner`, `Operator`, `Customer`, `NeaOfficer`)

---

### Get Session Status
`GET /api/session` 🔓

Checks whether the supplied token (if any) belongs to a valid, logged-in session.

**Response:**
```json
{ "loggedIn": true }
```

---

## Likes & Feedback Routes

### Get Liked Foods
`GET /api/likes/:customerId` 🔒

Returns all food items a customer has liked.

---

### Like a Food Item
`POST /api/likes` 🔒

**Body:**
```json
{ "customerId": "...", "stallId": "...", "itemCode": "..." }
```

---

### Unlike a Food Item
`DELETE /api/likes` 🔒

**Body:**
```json
{ "customerId": "...", "stallId": "...", "itemCode": "..." }
```

---

### Get Like Count
`GET /api/likes/count/:stallId/:itemCode` 🔓

Returns the total number of likes for a food item.

**Response:**
```json
{ "likeCount": 12 }
```

---

### Check Like Status
`GET /api/likes/status/:customerId/:stallId/:itemCode` 🔒

Returns whether the given customer has liked the given item.

**Response:**
```json
{ "liked": true }
```

---

### Submit Feedback
`POST /api/feedback` 🔒

**Body:**
```json
{ "customerId": "...", "stallId": "...", "fbkRating": 5, "fbkComment": "..." }
```

---

### Edit Feedback
`PUT /api/feedback/:fbkID` 🔒

**Body:**
```json
{ "fbkRating": 4, "fbkComment": "..." }
```

---

### Delete Feedback
`DELETE /api/feedback/:fbkID` 🔒

---

### Get Stall Rating
`GET /api/feedback/stall/:stallId` 🔓

Returns the average rating, rating count, and reviews for a stall.

**Response:**
```json
{ "avgRating": 4.2, "count": 15, "reviews": [ { "FbkRating": 5, "FbkComment": "...", "FbkDateTime": "..." } ] }
```

---

## Menu Routes

### Get Menu by Stall
`GET /api/stall/:stallId/menu` 🔓

Returns all menu items for a given stall.

---

### Check Stall Ownership
`GET /api/stall/:stallId/owns` 🔓

**Note:** Although this route doesn't enforce `verifyToken` at the middleware level, it's expected to be called with an `Authorization` header so the controller can compare the logged-in user against the stall owner.

**Response:**
```json
{ "owns": true }
```

---

### Add Menu Item
`POST /api/stall/:stallId/menu` 🔒

Multipart form upload (accepts an optional photo file).

**Form fields:**
- `itemCode`
- `ItemDesc`
- `ItemPrice`
- `ItemCategory`
- `photo` (file, optional)

---

### Update Menu Item
`PUT /api/stall/:stallId/menu/:code` 🔒

**Body:**
```json
{ "ItemDesc": "...", "ItemPrice": 5.5, "ItemCategory": "..." }
```

---

### Delete Menu Item
`DELETE /api/stall/:stallId/menu/:code` 🔒

---

### Get All Menu Items
`GET /api/menu` 🔓

Returns all menu items across all stalls. Used by the customer order page.

---

## Order Routes

### Create Order
`POST /api/order/create` 🔒

**Body:**
```json
{
  "customerId": "...",
  "stallId": "...",
  "paymentMethod": "PayNow",
  "items": [ { "itemCode": "...", "quantity": 2 } ]
}
```

---

### Get Order History
`GET /api/order/history/:customerId` 🔒

Returns past orders for a customer.

---

### Get Order Detail
`GET /api/order/byId/:orderId` 🔒

Returns full details for a single order.

---

### Get Customers for Ordering
`GET /api/order/customers` 🔒

Returns a list of customers, likely used for staff-facing order creation.

---

## Inspection, Hygiene & Analytics Routes

### Create Inspection
`POST /api/inspection/create` 🔒 (NeaOfficer)

**Body:**
```json
{
  "officerId": "...",
  "stallId": "...",
  "hygieneGrade": "A",
  "gradeExpiry": "2027-01-01",
  "remarks": [ "..." ]
}
```

---

### Get Inspection Detail
`GET /api/inspection/byId/:inspectionId` 🔒 (NeaOfficer)

**Response:**
```json
{
  "inspection": {
    "inspectionId": "...",
    "stallName": "...",
    "inspectionDate": "...",
    "hygieneGrade": "A",
    "gradeExpiry": "..."
  }
}
```

---

### Update Hygiene Grade
`PUT /api/inspection/:inspectionId/grade` 🔒 (NeaOfficer)

**Body:**
```json
{ "hygieneGrade": "A", "gradeExpiry": "2027-01-01" }
```

---

### Get Hygiene History
`GET /api/inspection/history/:stallId` 🔒 (NeaOfficer)

Returns the inspection history for a given stall.

---

### Get Stall Performance Analytics
`GET /api/analytics/stall-performance/:operatorId` 🔒 (NeaOfficer)

Returns performance/compliance analytics for stalls under a given operator.

---

### Get Officers List
`GET /api/inspection/officers` 🔒

Returns a list of NEA officers, likely for dropdowns or assignment.

---

### Get Operators List
`GET /api/inspection/operators` 🔒

Returns a list of operators.

---

### Get Stalls List
`GET /api/inspection/stalls` 🔒

Returns a list of stalls, used for the inspection form dropdown.

---

## Website (HTML) Routes

These serve static pages and don't return JSON.

| Method | Path | Serves |
|---|---|---|
| GET | `/` | `index.html` |
| GET | `/login` | `login.html` |
| GET | `/signup` | `sign-up.html` |
| GET | `/forgot-password` | `forgot-password.html` |
| GET | `/reset-password` | `reset-password.html` |
| GET | `/dashboard` | `dashboard.html` |
| GET | `/profile` | `profile.html` |
| GET | `/menu` | `menu-management.html` |
| GET | `/order` | `order.html` |
| GET | `/rating.html` | `rating-comment.html` |
| GET | `/inspection` | `inspection.html` |
| GET | `/analytics` | `analytics.html` |

Static uploaded files (e.g. menu item photos) are served from `/uploads`.

---