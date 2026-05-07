# Udhar Khata Backend

Informal loan ledger REST API for Indian users. Track money given to and received from friends and family.

## Tech Stack

- **Runtime:** Node.js 20+
- **Framework:** Express.js
- **Database:** MongoDB with Mongoose ODM
- **Auth:** JWT (access token 15min + refresh token 30 days) via httpOnly cookies
- **OTP:** Twilio SMS (fallback to dev console log)
- **File Upload:** Multer + Cloudinary
- **Push Notifications:** Firebase Cloud Messaging (FCM)
- **Validation:** Zod
- **Rate Limiting:** express-rate-limit
- **Logging:** Winston + Morgan
- **Cron:** node-cron (overdue reminders daily at 9am IST)

## Project Structure

```
udhar-khata-backend/
├── src/
│   ├── config/           # DB, Cloudinary, Firebase configs
│   ├── controllers/      # Route handlers with business logic
│   ├── jobs/             # Cron jobs (overdue reminders)
│   ├── middleware/       # Auth, rate limiter, validation, upload, error handler
│   ├── models/          # Mongoose schemas
│   ├── routes/          # Express route definitions
│   ├── services/        # Business logic services (OTP, FCM, export, etc.)
│   ├── utils/           # ApiResponse, ApiError, asyncHandler, constants, logger
│   └── validators/      # Zod validation schemas
├── uploads/             # Temporary upload directory
├── server.js            # Entry point
├── package.json
└── .env.example
```

## Prerequisites

- Node.js 20+
- MongoDB instance (local or Atlas)
- Cloudinary account (for receipt uploads)
- Firebase project with FCM enabled (for push notifications)
- Twilio account (for SMS OTP)

## Setup Instructions

1. **Clone and install:**

```bash
cd udhar-khata-backend
npm install
```

2. **Create environment file:**

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/udhar-khata
JWT_ACCESS_SECRET=your-access-secret-min-32-chars
JWT_REFRESH_SECRET=your-refresh-secret-min-32-chars
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=30d
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"..."}
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=+1234567890
NODE_ENV=development
```

3. **Start the server:**

```bash
# Development
npm run dev

# Production
npm start
```

## API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/send-otp` | Send OTP to phone |
| POST | `/api/v1/auth/verify-otp` | Verify OTP, get JWT |
| POST | `/api/v1/auth/refresh` | Refresh access token |
| POST | `/api/v1/auth/logout` | Clear refresh token |
| PUT | `/api/v1/auth/profile` | Update name/avatar |
| PUT | `/api/v1/auth/fcm-token` | Update FCM token |

### Contacts
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/contacts` | List contacts (sorted by \|netBalance\| desc) |
| POST | `/api/v1/contacts` | Create contact |
| GET | `/api/v1/contacts/:id` | Contact + last 20 transactions |
| PUT | `/api/v1/contacts/:id` | Update contact |
| DELETE | `/api/v1/contacts/:id` | Soft delete |
| GET | `/api/v1/contacts/:id/transactions` | Paginated transactions (cursor-based) |

### Transactions
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/transactions` | Create transaction |
| PUT | `/api/v1/transactions/:id` | Edit note, date, category, dueDate |
| DELETE | `/api/v1/transactions/:id` | Delete (recalculates balance) |
| POST | `/api/v1/transactions/:id/settle` | Mark as settled |
| POST | `/api/v1/transactions/:id/receipt` | Upload receipt image |

### Groups
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/groups` | Create group with members |
| GET | `/api/v1/groups/:id` | Group detail with member balances |
| PUT | `/api/v1/groups/:id/members/:memberId/pay` | Mark member as paid |
| DELETE | `/api/v1/groups/:id` | Delete group |

### Analytics (Premium)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/analytics/summary` | Total gave/received/net |
| GET | `/api/v1/analytics/monthly` | Monthly aggregation (12 months) |
| GET | `/api/v1/analytics/top-contacts` | Top 5 by absolute balance |
| GET | `/api/v1/analytics/categories` | Category breakdown |

### Nudge
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/nudge/generate` | Generate WhatsApp message |

### Export (Premium)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/export/pdf` | Download PDF ledger |
| GET | `/api/v1/export/csv` | Download CSV |

### Notifications
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/notifications` | List notifications |
| PUT | `/api/v1/notifications/read-all` | Mark all as read |

## Key Business Rules

- **All amounts in paise** (1 INR = 100 paise). Never use floats for money.
- **Free tier:** Maximum 10 contacts per user.
- **OTP:** 6-digit, 5 min TTL, 3 attempts max, 5 requests per phone per hour.
- **JWT:** Access token 15min, refresh token 30 days, rotated on each use.
- **Overdue reminders:** Cron runs daily at 9am IST, sends FCM push + in-app notification.
- **netBalance:** Computed from all transactions (gave - received) for each contact.
- **Owner check** on every query — users can only access their own data.

## Error Codes

| Status | Code | Description |
|--------|------|-------------|
| 400 | VALIDATION_ERROR | Invalid input |
| 401 | UNAUTHORIZED | Missing/invalid JWT |
| 403 | PREMIUM_REQUIRED | Premium feature |
| 404 | NOT_FOUND | Resource not found |
| 409 | CONFLICT | Duplicate entry |
| 429 | RATE_LIMITED | Too many requests |
| 500 | SERVER_ERROR | Internal error |
