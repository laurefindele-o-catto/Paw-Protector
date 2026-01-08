# PawPal API Documentation

## Table of Contents
- [Authentication](#authentication)
- [Request Management API](#request-management-api)
- [Vet Approval API](#vet-approval-api)
- [Error Codes](#error-codes)
- [Testing with Postman](#testing-with-postman)

---

## Authentication

All endpoints (except login/signup) require JWT authentication.

**Header Format:**
```
Authorization: Bearer <your_access_token>
```

**How to Get Token:**
```http
POST /api/auth/login
Content-Type: application/json

{
  "identifier": "your_username_or_email",
  "password": "your_password"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": 41,
    "username": "john_doe",
    "email": "john@example.com",
    "role": "owner"
  },
  "tokens": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

## Request Management API

### 1. Create Request (URL-based)

Create a request with a content URL (Cloudinary or external link).

**Endpoint:** `POST /api/requests`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "content_url": "https://res.cloudinary.com/example/image.jpg",
  "notes": "Optional notes about the request"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Request created successfully",
  "request": {
    "id": 1,
    "issue_user_id": 41,
    "content_url": "https://res.cloudinary.com/example/image.jpg",
    "notes": "Optional notes",
    "status": false,
    "created_at": "2026-01-09T10:30:00.000Z"
  }
}
```

---

### 2. Create Request with File Upload

Upload a file (image/PDF) directly and create a request.

**Endpoint:** `POST /api/requests/upload`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Form Data:**
- `contentFile` (File): Image or PDF file to upload
- `notes` (Text, optional): Notes about the request

**Example (Postman):**
1. Select POST method
2. Choose Body → form-data
3. Add key `contentFile`, change dropdown from "Text" to "File", select file
4. Add key `notes` (Text), enter your notes

**Response (201):**
```json
{
  "success": true,
  "message": "Request created successfully",
  "request": {
    "id": 2,
    "issue_user_id": 41,
    "content_url": "https://res.cloudinary.com/pawpal/image/upload/v1234567890/requests/abc123.jpg",
    "notes": "My pet has a rash",
    "status": false,
    "created_at": "2026-01-09T10:35:00.000Z"
  }
}
```

---

### 3. Get Pending Requests

Get all pending (not approved) requests created by the authenticated user.

**Endpoint:** `GET /api/requests/pending`

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "requests": [
    {
      "id": 1,
      "issue_user_id": 41,
      "content_url": "https://res.cloudinary.com/...",
      "notes": "Pet has skin issue",
      "status": false,
      "created_at": "2026-01-09T10:30:00.000Z"
    }
  ]
}
```

---

### 4. Get Approved Requests

Get all approved requests created by the authenticated user.

**Endpoint:** `GET /api/requests/approved`

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "requests": [
    {
      "id": 2,
      "issue_user_id": 41,
      "content_url": "https://res.cloudinary.com/...",
      "notes": "Skin condition check",
      "status": true,
      "created_at": "2026-01-09T09:00:00.000Z"
    }
  ]
}
```

---

### 5. Get Request by ID

Get details of a specific request.

**Endpoint:** `GET /api/requests/:requestId`

**Headers:**
```
Authorization: Bearer <token>
```

**Example:** `GET /api/requests/5`

**Response (200):**
```json
{
  "success": true,
  "request": {
    "id": 5,
    "issue_user_id": 41,
    "content_url": "https://res.cloudinary.com/...",
    "notes": "Follow-up check",
    "status": true,
    "created_at": "2026-01-08T14:20:00.000Z"
  }
}
```

**Response (404):**
```json
{
  "success": false,
  "error": "Request not found"
}
```

---

### 6. Update Request Status

Update the status of a request (owner or admin only).

**Endpoint:** `PATCH /api/requests/:requestId`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "status": true
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Request updated successfully",
  "request": {
    "id": 1,
    "issue_user_id": 41,
    "content_url": "https://res.cloudinary.com/...",
    "notes": "Pet has skin issue",
    "status": true,
    "created_at": "2026-01-09T10:30:00.000Z"
  }
}
```

---

### 7. Delete Request

Delete a request (owner or admin only).

**Endpoint:** `DELETE /api/requests/:requestId`

**Headers:**
```
Authorization: Bearer <token>
```

**Example:** `DELETE /api/requests/3`

**Response (200):**
```json
{
  "success": true,
  "message": "Request deleted successfully"
}
```

**Response (404):**
```json
{
  "success": false,
  "error": "Request not found"
}
```

---

## Vet Approval API

### 1. Approve Request

Vet approves a request with an optional note. Automatically sets request status to `true`.

**Endpoint:** `POST /api/vet-approvals/:requestId`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "note": "Approved after review. Pet looks healthy and the issue is minor."
}
```

> **Note:** The `note` field is optional. You can send an empty object `{}` if no note is needed.

**Example:** `POST /api/vet-approvals/1`

**Response (201):**
```json
{
  "success": true,
  "message": "Request approved successfully",
  "approval": {
    "vet_id": 42,
    "req_id": 1,
    "note": "Approved after review. Pet looks healthy.",
    "approved_at": "2026-01-09T11:00:00.000Z"
  }
}
```

**Response (400) - Request Not Found:**
```json
{
  "success": false,
  "error": "Request not found"
}
```

**Response (409) - Already Approved:**
```json
{
  "success": false,
  "error": "Request is already approved by a vet"
}
```

---

### 2. Get Approval by Request ID

Get approval details for a specific request.

**Endpoint:** `GET /api/vet-approvals/:requestId`

**Headers:**
```
Authorization: Bearer <token>
```

**Example:** `GET /api/vet-approvals/1`

**Response (200):**
```json
{
  "success": true,
  "approval": {
    "vet_id": 42,
    "req_id": 1,
    "note": "Approved after review. Pet looks healthy.",
    "approved_at": "2026-01-09T11:00:00.000Z",
    "vet_name": "Dr. Sarah Johnson",
    "content_url": "https://res.cloudinary.com/...",
    "issue_user_id": 41,
    "request_created_at": "2026-01-09T10:30:00.000Z"
  }
}
```

**Response (404):**
```json
{
  "success": false,
  "error": "Approval not found for this request"
}
```

---

### 3. Get My Approvals (Current Vet)

Get all approvals made by the authenticated vet.

**Endpoint:** `GET /api/vet-approvals/my-approvals`

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "approvals": [
    {
      "vet_id": 42,
      "req_id": 1,
      "note": "Approved after review.",
      "approved_at": "2026-01-09T11:00:00.000Z",
      "content_url": "https://res.cloudinary.com/...",
      "issue_user_id": 41,
      "request_created_at": "2026-01-09T10:30:00.000Z"
    },
    {
      "vet_id": 42,
      "req_id": 5,
      "note": "Follow-up approved.",
      "approved_at": "2026-01-09T12:15:00.000Z",
      "content_url": "https://res.cloudinary.com/...",
      "issue_user_id": 45,
      "request_created_at": "2026-01-09T09:00:00.000Z"
    }
  ]
}
```

---

### 4. Get All Approved Requests

Get all approved requests (admin/moderator access).

**Endpoint:** `GET /api/vet-approvals/all`

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "approvals": [
    {
      "vet_id": 42,
      "req_id": 1,
      "note": "Approved",
      "approved_at": "2026-01-09T11:00:00.000Z",
      "vet_name": "Dr. Sarah Johnson",
      "content_url": "https://res.cloudinary.com/...",
      "issue_user_id": 41,
      "request_created_at": "2026-01-09T10:30:00.000Z"
    }
  ]
}
```

---

### 5. Update Approval Note

Update the note on an existing approval (only the approving vet can update).

**Endpoint:** `PATCH /api/vet-approvals/:requestId/note`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "note": "Updated note: Follow-up recommended in 2 weeks"
}
```

**Example:** `PATCH /api/vet-approvals/1/note`

**Response (200):**
```json
{
  "success": true,
  "message": "Approval note updated successfully",
  "approval": {
    "vet_id": 42,
    "req_id": 1,
    "note": "Updated note: Follow-up recommended in 2 weeks",
    "approved_at": "2026-01-09T11:00:00.000Z"
  }
}
```

**Response (403) - Unauthorized:**
```json
{
  "success": false,
  "error": "You can only update your own approvals"
}
```

---

### 6. Revoke Approval

Revoke an approval (only by the approving vet). Sets request status back to `false` (pending).

**Endpoint:** `DELETE /api/vet-approvals/:requestId`

**Headers:**
```
Authorization: Bearer <token>
```

**Example:** `DELETE /api/vet-approvals/1`

**Response (200):**
```json
{
  "success": true,
  "message": "Approval revoked successfully"
}
```

**Response (403) - Unauthorized:**
```json
{
  "success": false,
  "error": "You can only revoke your own approvals"
}
```

**Response (404):**
```json
{
  "success": false,
  "error": "Approval not found"
}
```

---

## Error Codes

| Status Code | Description |
|-------------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request - Missing or invalid parameters |
| 401 | Unauthorized - Invalid or missing token |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource doesn't exist |
| 409 | Conflict - Resource already exists (duplicate) |
| 500 | Internal Server Error |

---

## Testing with Postman

### Import Collections

Two Postman collections are available:

1. **Request Management:** `backend/postman_collection_requests.json`
2. **Vet Approvals:** `backend/postman_vet_approvals.json`

### Import Steps

1. Open Postman
2. Click **Import** button (top-left)
3. Select the JSON file
4. Collections will appear in the left sidebar

### Environment Variables

Both collections use these variables (auto-saved by test scripts):

| Variable | Description | Example |
|----------|-------------|---------|
| `base_url` | API base URL | `http://localhost:3000` |
| `access_token` | JWT access token | Auto-saved after login |
| `request_id` | Current request ID | Auto-saved from responses |
| `vet_id` | Current vet user ID | Auto-saved after vet login |

### Testing Workflow

#### For Request Management:

1. **Login** → Saves `access_token`
2. **Create Request** → Saves `request_id`
3. **Get Pending Requests** → View all pending
4. **Get Request by ID** → View specific request
5. **Update Request Status** → Mark as approved
6. **Delete Request** → Clean up

#### For Vet Approvals:

1. **Login as Vet** → Saves `access_token` and `vet_id`
2. **HELPER: Get Pending Requests** → Auto-saves first `request_id`
3. **Approve Request** → Approve with note
4. **Get Approval by Request ID** → View approval details
5. **Get My Approvals** → View all your approvals
6. **Update Approval Note** → Modify the note
7. **Revoke Approval** → Delete approval

### File Upload Testing (Postman)

For `POST /api/requests/upload`:

1. Select **Body** tab
2. Choose **form-data**
3. Add key `contentFile`:
   - Change dropdown from **Text** to **File**
   - Click **Select Files** and choose an image/PDF
4. Add key `notes` (Text): "My pet has a skin issue"
5. Send request

### Common Issues

**Issue:** `MulterError: Field name missing`
- **Fix:** Ensure field type is set to **File** (not Text) in Postman

**Issue:** `401 Unauthorized`
- **Fix:** Run the Login endpoint first to get a fresh token

**Issue:** `Column "note" does not exist`
- **Fix:** Run the SQL migration to add missing columns:
  ```sql
  ALTER TABLE vet_approved 
  ADD COLUMN IF NOT EXISTS note TEXT,
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP DEFAULT NOW();
  ```

**Issue:** Token expired
- **Fix:** Re-run the Login endpoint to get a new token

---

## Database Schema

### Requests Table
```sql
CREATE TABLE requests (
    id SERIAL PRIMARY KEY,
    issue_user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    content_url TEXT NOT NULL,
    notes TEXT,
    status BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### Vet Approved Table
```sql
CREATE TABLE vet_approved (
    vet_id INTEGER REFERENCES vets(user_id) ON DELETE SET NULL,
    req_id INTEGER REFERENCES requests(id) ON DELETE SET NULL,
    note TEXT,
    approved_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT pk PRIMARY KEY (req_id)
);

CREATE INDEX idx_vet_approved_vet_id ON vet_approved(vet_id);
```

---

## Quick Reference

### Base URL
```
http://localhost:3000/api
```

### Request Endpoints Summary
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/requests` | Create request (URL) | ✅ |
| POST | `/requests/upload` | Create request (file) | ✅ |
| GET | `/requests/pending` | Get pending requests | ✅ |
| GET | `/requests/approved` | Get approved requests | ✅ |
| GET | `/requests/:requestId` | Get request by ID | ✅ |
| PATCH | `/requests/:requestId` | Update request status | ✅ |
| DELETE | `/requests/:requestId` | Delete request | ✅ |

### Vet Approval Endpoints Summary
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/vet-approvals/:requestId` | Approve request | ✅ Vet |
| GET | `/vet-approvals/:requestId` | Get approval details | ✅ |
| GET | `/vet-approvals/my-approvals` | Get vet's approvals | ✅ Vet |
| GET | `/vet-approvals/all` | Get all approvals | ✅ Admin |
| PATCH | `/vet-approvals/:requestId/note` | Update note | ✅ Vet |
| DELETE | `/vet-approvals/:requestId` | Revoke approval | ✅ Vet |

---

## Support

For issues or questions:
- Check the error response message
- Verify authentication token is valid
- Ensure database migrations are applied
- Review server logs for detailed error messages

**Happy Testing! 🐾**
