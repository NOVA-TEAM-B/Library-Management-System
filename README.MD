# Nova Library SaaS Enterprise Platform - Documentation

Welcome to **Nova Library**, an enterprise-level, production-quality College Library Management System. Nova Library integrates advanced NLP artificial intelligence companions, interactive floor maps, seat booking grids, digital documents versioning systems, gamified milestone tracking, and telemetry health logs.

---

## 🚀 Architecture & Technology Stack
- **Backend Core**: Flask (Python) with SQLAlchemy ORM, Flask-JWT-Extended, Flask-SocketIO (WebSockets).
- **Frontend Core**: React (TypeScript) with Vite, TailwindCSS (curated premium dark/blue/brown custom particle backgrounds), Framer Motion.
- **Real-time Engine**: WebSockets via SocketIO for real-time notification feeds.
- **Database Engine**: SQLite (default developer node), MySQL/PostgreSQL ready.
- **Notification Services**: SMTP (GMail TLS) & Twilio SMS.

---

## 🌸 Core Modules & Upgrades

### 1. Unified Authentication (OTP & JWT)
- **Multi-Factor OTP Login**: Multi-channel OTP verification (Email + SMS) with secure database token expiry caching.
- **Rate-Limiting Security**: Implements 30-second resend thresholds and brute-force blockages (HTTP 429 throttling).
- **Branding Fallback**: Domain/Subdomain parsing loads dynamic custom logos, styles, and names, automatically falling back to secure default profiles on load error.

### 2. Nova AI Library Assistant
- **Holographic Floating Panel**: Features rotating cyber rings, scanner line animations, floating coordinate offsets, and active text/voice triggers.
- **Speech-to-Text Voice Searches**: Web Speech API handles microphone speech recognition to parse natural language queries.
- **Database Integrated NLP**: Scans library inventory (e.g. *"Find books on Machine Learning"*), checks fine balances, lists holds, reminds return due dates, and answers Frequently Asked Questions conversant with database query structures.

### 3. Digital Library Hub & Document Management
- **File Ingestion System**: Securely handles digital document uploads (PDF, TXT, DOCX) verifying file types and generating unique storage UUIDs on disk (`uploads/digital_docs`).
- **File Actions**:
  - **Version Control**: Auto-detects duplicate titles inside the organization and increments versioning metadata.
  - **Serving & Downloads**: Downloads/previews PDF documents using secure Blob object URLs, keeping download keys secured behind JWT tokens.
  - **Deletion**: Synchronously clears database metadata and deletes the physical file from the storage directory.

### 4. Interactive floor Map & Seat Reservator
- **Interactive SVG Floor Plan**: Illustrates library sectors and sections. Highlight grids map physical coordinates for catalog books (Floor, Rack, Shelf).
- **Seat Reservations**: Seat assignment grid showing availability KPIs, occupant names, and reservation timers.
- **Occupancy Telemetry**: Computes active seating occupancy percentages dynamically.

### 5. Book Club Forum & Gamification
- **XP Progression**: Gamified Leveling system. Users earn +50 XP on seat bookings and +30 XP on writing book reviews.
- **Streaks Check-in**: Active reading streak tracker with 24h reset checks.
- **Unlocked Badge Showcase**: Dynamically unlocks badges ("Top Reader", "Early Return", "No Fine", "Explorer", "Critic") based on milestones.
- **Review Forum**: Interactive comments board with star ratings (1-5) and review descriptions.

### 6. Systems Health & Recovery Telemetry
- **API Telemetry Logs**: Captures CPU load, Memory usage, active database connections, and logs entries into the database (clearing archives past 100 entries).
- **Snapshot Backup Center**: Clones and backs up database sqlite files into the `instance/backups` folder with distinct timestamp prefixes.

---

## ⚙️ Setup & Developer Quickstart

### 1. Environment Configurations (`.env`)
Create a `.env` file in the root workspace directory:
```env
# Flask Core
SECRET_KEY=generate-a-secure-32-byte-hex-key-here
JWT_SECRET=generate-a-secure-jwt-signing-key-here

# Toggle Mock Delivery (true skips actual Twilio/SMTP dispatch and logs to files)
MOCK_OTP_DELIVERY=true

# SMTP E-Mail configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email-address@gmail.com
SMTP_PASS=your-gmail-app-password-here
SMTP_SECURE=true
EMAIL_FROM=your-email-address@gmail.com

# Twilio SMS configuration
TWILIO_ACCOUNT_SID=your-twilio-sid-here
TWILIO_AUTH_TOKEN=your-twilio-auth-token-here
TWILIO_FROM_NUMBER=your-twilio-number-here
```

### 2. Launch Backend Server
```bash
cd backend
pip install -r requirements.txt
python app.py
```
*Note: Hot reloading and self-healing migrations will auto-compile and build database tables dynamically.*

### 3. Launch Frontend Console
```bash
cd frontend
npm install
npm run dev
```

---

## 🧪 Integration & Automated Testing
Validate backend integrity, OTP caches, KPIs, reports, and NLP processors by executing:
```bash
python verify_x.py
```
Ensure all diagnostic outputs return `[SUCCESS]` blocks.
