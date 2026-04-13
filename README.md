# 🛒 eCommerce Backend API

A production-ready, scalable eCommerce backend built with **Node.js**, **Express.js**, and **MongoDB Atlas**. Features a clean MVC + Service Layer architecture with full auth, role-based access, payment integration, and admin analytics.

---

## 🚀 Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js 18+ |
| Framework | Express.js |
| Database | MongoDB Atlas (Mongoose) |
| Auth | JWT (access + refresh tokens) |
| Password | bcryptjs |
| Images | Multer + Cloudinary |
| Payments | Razorpay (test mode) |
| Email | Nodemailer (Gmail SMTP) |
| Validation | express-validator |
| Security | Helmet, CORS, express-rate-limit |
| Logging | Morgan |

---

## 📁 Project Structure

```
ecommerce-backend/
├── server.js                  # Entry point
├── app.js                     # Express app & middleware
├── config/
│   ├── db.js                  # MongoDB connection
│   ├── cloudinary.js          # Cloudinary + Multer config
│   └── razorpay.js            # Razorpay instance
├── models/
│   ├── User.model.js          # User schema (buyer/seller/admin)
│   ├── Product.model.js       # Product + embedded reviews
│   ├── Order.model.js         # Order schema
│   └── Category.model.js      # Category schema
├── controllers/               # Request/response handling
├── services/                  # Business logic layer
├── routes/                    # Express routers
├── middleware/
│   ├── auth.middleware.js     # JWT protect + RBAC
│   ├── errorHandler.js        # Centralized error handling
│   ├── validate.js            # Validation middleware
│   └── validators/            # Request validators
└── utils/
    ├── AppError.js            # Custom error class
    ├── apiResponse.js         # Standard response helpers
    ├── generateToken.js       # JWT utilities
    ├── email.js               # Nodemailer email service
    └── logger.js              # Console logger
```

---

## ⚙️ Setup & Installation

### 1. Clone & Install

```bash
git clone <repo-url>
cd ecommerce-backend
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env with your credentials
```

### 3. Run

```bash
# Development (with nodemon)
npm run dev

# Production
npm start
```

---

## 🔐 Environment Variables

| Variable | Description |
|---|---|
| `MONGODB_URI` | MongoDB Atlas connection string |
| `JWT_SECRET` | Access token secret (min 32 chars) |
| `JWT_EXPIRES_IN` | Access token expiry (e.g. `15m`) |
| `REFRESH_TOKEN_SECRET` | Refresh token secret |
| `REFRESH_TOKEN_EXPIRES_IN` | Refresh token expiry (e.g. `7d`) |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |
| `RAZORPAY_KEY_ID` | Razorpay test key ID |
| `RAZORPAY_KEY_SECRET` | Razorpay key secret |
| `EMAIL_HOST` | SMTP host (e.g. `smtp.gmail.com`) |
| `EMAIL_PORT` | SMTP port (e.g. `587`) |
| `EMAIL_USER` | Gmail address |
| `EMAIL_PASS` | Gmail app password |
| `EMAIL_FROM` | Sender address |
| `FRONTEND_URL` | Frontend URL for CORS |

---

## 👥 User Roles

| Role | Capabilities |
|---|---|
| **Buyer** | Browse products, cart, wishlist, place orders, write reviews |
| **Seller** | Create/manage products, view & fulfill own orders (requires admin approval) |
| **Admin** | Full access: manage users, sellers, orders, categories, analytics |

---

## 📡 API Reference

All routes prefixed with `/api/v1/`

### Auth — `/api/v1/auth`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/register` | — | Register buyer or seller |
| POST | `/login` | — | Login, returns JWT |
| POST | `/refresh-token` | — | Refresh access token |
| POST | `/logout` | ✅ | Logout, clears refresh token |
| GET | `/me` | ✅ | Get current user |
| PATCH | `/change-password` | ✅ | Change password |

### Products — `/api/v1/products`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/` | — | List products (search, filter, paginate) |
| GET | `/:id` | — | Get single product |
| POST | `/` | Seller | Create product (with images) |
| PATCH | `/:id` | Seller | Update product |
| DELETE | `/:id` | Seller/Admin | Delete product |
| DELETE | `/:id/images/:publicId` | Seller | Remove product image |
| GET | `/seller/my-products` | Seller | Get own products |

**Query params for GET /products:**
- `search` — text search
- `category` — category ObjectId
- `minPrice`, `maxPrice` — price range
- `page`, `limit` — pagination
- `sort` — e.g. `-price`, `averageRating`

### Orders — `/api/v1/orders`

| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| POST | `/` | ✅ | Buyer | Create order |
| GET | `/my-orders` | ✅ | Buyer | Get own orders |
| GET | `/:id` | ✅ | Any | Get order by ID |
| GET | `/seller/orders` | ✅ | Seller | Orders containing seller's products |
| PATCH | `/seller/:id/status` | ✅ | Seller | Update to `shipped`/`delivered` |
| GET | `/admin/all` | ✅ | Admin | All orders |
| PATCH | `/admin/:id/status` | ✅ | Admin | Override any status |

### Payments — `/api/v1/payments`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/:orderId/create` | Buyer | Create Razorpay order |
| POST | `/:orderId/verify` | Buyer | Verify payment signature |
| POST | `/:orderId/failed` | Buyer | Record payment failure |

**Payment Flow:**
```
1. POST /orders  →  creates order (status: pending)
2. POST /payments/:id/create  →  get Razorpay order ID
3. User pays via Razorpay checkout
4. POST /payments/:id/verify  →  verify signature → order confirmed
```

### Cart — `/api/v1/cart` *(Buyer only)*

| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | Get cart with totals |
| POST | `/add` | Add item (body: `productId`, `quantity`) |
| PATCH | `/item/:productId` | Update quantity |
| DELETE | `/item/:productId` | Remove item |
| DELETE | `/clear` | Clear entire cart |

### Wishlist — `/api/v1/wishlist` *(Buyer only)*

| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | Get wishlist |
| POST | `/:productId` | Add to wishlist |
| DELETE | `/:productId` | Remove from wishlist |
| PATCH | `/:productId/toggle` | Toggle (add/remove) |

### Reviews — `/api/v1/reviews`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/:productId` | — | Get product reviews |
| POST | `/:productId` | Buyer | Add review (must have purchased) |
| PATCH | `/:productId/:reviewId` | Buyer | Update own review |
| DELETE | `/:productId/:reviewId` | Buyer/Admin | Delete review |

### Categories — `/api/v1/categories` *(public)*

| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | List all active categories |
| GET | `/:id` | Get single category |

### Admin — `/api/v1/admin` *(Admin only)*

| Method | Endpoint | Description |
|---|---|---|
| GET | `/users` | All users (filter by role/search) |
| PATCH | `/users/:userId/toggle-status` | Activate/deactivate user |
| GET | `/sellers/pending` | Pending seller applications |
| PATCH | `/sellers/:sellerId/review` | Approve/reject seller |
| GET | `/orders` | All orders |
| PATCH | `/orders/:id/status` | Update any order status |
| GET | `/analytics` | Revenue, top products, monthly stats |
| POST | `/categories` | Create category |
| PATCH | `/categories/:id` | Update category |
| DELETE | `/categories/:id` | Delete category |

---

## 📦 Standard Response Format

```json
{
  "success": true,
  "message": "Operation successful",
  "data": {}
}
```

Paginated responses include:
```json
{
  "success": true,
  "message": "...",
  "data": {},
  "pagination": {
    "total": 100,
    "page": 1,
    "pages": 10,
    "limit": 10
  }
}
```

Error responses:
```json
{
  "success": false,
  "message": "Error description"
}
```

---

## 🔒 Order Status Rules

```
pending → (payment) → confirmed → (seller) → shipped → (seller) → delivered
any state → (admin) → cancelled
```

- Cannot ship if `paymentStatus !== 'paid'`
- Cannot deliver before `shipped`
- Buyer cannot modify order status
- Cancellation restores product stock

---

## 🚢 Deployment (Render / Railway)

1. Push to GitHub
2. Create a new Web Service on Render/Railway
3. Set build command: `npm install`
4. Set start command: `npm start`
5. Add all environment variables from `.env.example`
6. Set `NODE_ENV=production`

---

## 🛡️ Security Features

- **Helmet** — secure HTTP headers
- **CORS** — configurable origin whitelist
- **Rate Limiting** — 200 req/15min general; 10 req/15min on auth routes
- **bcryptjs** — password hashing with cost factor 12
- **JWT** — short-lived access tokens (15m) + long-lived refresh tokens (7d)
- **Input Validation** — all inputs validated with express-validator
- **Centralized Error Handling** — no stack traces leaked in production
