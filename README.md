# Smart Stadium & Tournament Operations Platform

An enterprise-grade, cloud-ready operations suite for sports leagues, ticketing gates, emergency medical/safety alarms, vendor leases, and real-time spectators analytics.

---

## 🏗️ System Architecture

Built on a decoupled fullstack structure:
- **Backend**: Node.js, Express, TypeScript, Prisma ORM, PostgreSQL.
- **Frontend**: Next.js 15, React 19, Recharts, TailwindCSS, Framer Motion.
- **Services**: Stripe billing, Nodemailer notifications, dynamic QRCode generators, and SSE live push broadcasts.

---

## ⚡ Quick Start (Local Run)

### 1. Configure Environments
Create a `.env` file at the project root using the configuration templates below:
```env
PORT=5000
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/smart_stadium?schema=public"
FRONTEND_URL=http://localhost:3000

ACCESS_TOKEN_SECRET=your_jwt_access_secret_key_string
REFRESH_TOKEN_SECRET=your_jwt_refresh_secret_key_string

# Stripe Payments (Mocked automatically if sk_test_dummy is used)
STRIPE_SECRET_KEY=sk_test_dummy
STRIPE_WEBHOOK_SECRET=whsec_dummy

# Nodemailer / SMTP
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USER=your_smtp_user
SMTP_PASS=your_smtp_pass
SMTP_FROM=noreply@smartstadium.com
```

### 2. Setup Database & Prisma
Install dependencies and sync database schema:
```bash
# Sync prisma and seed data
cd backend
npm install
npx prisma db push
```

### 3. Launch Development Servers
Run the backend and frontend dev environments:

**Terminal A (Backend)**:
```bash
cd backend
npm run dev
```

**Terminal B (Frontend)**:
```bash
cd frontend
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🐳 Docker Deployment

The application is containerized using Multi-stage Docker files. Build and run the entire suite using Docker Compose:

```bash
docker-compose up --build
```
This boots:
1. **Database Container**: Local PostgreSQL database synced on port `5432`.
2. **API Server**: Express backend bound on port `5000`.
3. **App Client**: Next.js client running on port `3000`.

---

## 📖 API Endpoint Modules

- **Authentication**: `POST /api/auth/register`, `/api/auth/login`, `/api/auth/otp`, `/api/auth/forgot-password`.
- **Tournaments**: `POST /api/tournaments` (BERGER algorithm round-robin scheduler), standings and points recalculations.
- **Ticketing & Payments**: `POST /api/payments/create-checkout-session` (Stripe redirector), `/api/tickets/purchase`, `/api/reports/pdf` (invoices).
- **Incident Dispatch**: `/api/incidents` (safety/medical dispatches alerts).
- **SSE Streams Channel**: `/api/notifications/stream` (real-time spectator push alerts).
