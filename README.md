## Lassi Ghar – Beverage Selling Website & AI Chatbot (Capstone)

This project implements the **Beverage Selling Website and AI Chatbot** for Lassi Ghar, based on your capstone documentation.

It is split into two folders so anyone can run it easily:

- `backend` – Node.js, Express, MongoDB API (Auth, Products, Orders, Mock AI Chatbot)
- `frontend` – React + TypeScript + Tailwind UI (Customer + basic Admin dashboard)

### 1. Prerequisites

- Node.js (v18+ recommended)
- MongoDB running locally on `mongodb://127.0.0.1:27017`

### 2. Backend Setup (`backend`)

```bash
cd backend
npm install
cp .env.example .env   # on Windows: copy .env.example .env
```

You can keep the default values in `.env` if MongoDB is local.

Start the API:

```bash
npm run dev
```

On first successful connection to MongoDB, the server will **auto‑create a default admin user if there are no users**:

- **Email**: `admin@lassighar.com`
- **Password**: `admin`

This satisfies the “always create one admin admin user” requirement.

Main endpoints (base URL: `http://localhost:5000/api`):

- `POST /auth/register` – register customer
- `POST /auth/login` – login (returns JWT)
- `GET /auth/me` – current user (JWT required)
- `GET /products` – list beverages (search + category filters)
- `POST /products` – add product (admin only)
- `PUT /products/:id` / `DELETE /products/:id` – manage products (admin only)
- `POST /orders` – place order (customer)
- `GET /orders/my` – customer’s own orders
- `GET /orders` – all orders (admin)
- `PATCH /orders/:id/status` – update order status (admin)
- `POST /chatbot` – mock AI assistant (no real API key required)

The `/chatbot` route returns **rule‑based, hard‑coded replies** that *feel* like AI suggestions (summer drinks, recommendations, order status help) but do **not** call any external API – suitable for presentations without real keys.

### 3. Frontend Setup (`frontend`)

```bash
cd frontend
npm install
npm run dev
```

The React dev server runs on `http://localhost:5173` and **proxies `/api` calls to `http://localhost:5000`** (see `vite.config.ts`), so no extra configuration is needed.

Main UI features:

- **Customer side**
  - Browse beverages with search + category filter
  - Add to cart, view cart total, place order
  - Login / Register (JWT stored in `localStorage`)
  - View **My Orders** with status and payment info
  - Floating **AI Chatbot widget** for drink suggestions and FAQs
- **Admin side**
  - Login using the auto‑created admin (email: `admin@lassighar.com`, password: `admin`)
  - Access `/admin` dashboard
  - Add new beverages (name, category, price)
  - View simple list of existing beverages
  - View recent orders and update order status (Processing → Preparing → Out for Delivery → Completed / Cancelled)

### 4. Notes for Submission

- No real OpenAI or payment gateway keys are used; the chatbot is **simulated** with smart, rule‑based responses to match the architecture diagrams in your documentation.
- The structure matches your report:
  - **Frontend**: React + TypeScript + Tailwind
  - **Backend**: Node.js + Express
  - **Database**: MongoDB (local)
- You can push this folder to GitHub; others can run:
  - `cd backend && npm install && npm run dev`
  - `cd frontend && npm install && npm run dev`

This should be enough to **demo browsing drinks, placing orders, viewing order tracking, and interacting with an “AI” assistant**, aligned with your capstone documentation.

