# Bitespeed Identity Resolution Service

A backend service that intelligently identifies and links customer identities across multiple purchases using shared contact information.

## 🧠 Problem Understanding

In real-world e-commerce platforms, customers often place orders using different email addresses or phone numbers. This leads to fragmented customer records, making personalization, analytics, and loyalty tracking difficult.

The objective of this project is to build an identity resolution system that consolidates multiple contact records belonging to the same person into a single unified customer profile.

Each checkout request contains at least one of:
- `email`
- `phoneNumber`

If two records share either an email or phone number, they must be treated as belonging to the same customer.

## 🎯 Objective

Build an API endpoint:

```
POST /identify
```

that:
- Accepts contact details.
- Detects whether the customer already exists.
- Links related identities together.
- Merges identity groups when overlaps occur.
- Returns a consolidated customer identity.

## 🧩 Data Model

All information is stored in a single `Contact` table.

### Contact Schema

| Field            | Description                     |
| ---------------- | ------------------------------- |
| `id`             | Unique identifier               |
| `email`          | Customer email (optional)       |
| `phoneNumber`    | Customer phone number (optional) |
| `linkedId`       | References primary contact      |
| `linkPrecedence` | `primary` or `secondary`        |
| `createdAt`      | Record creation time            |
| `updatedAt`      | Last update timestamp           |
| `deletedAt`      | Soft delete field               |

### Identity Rules

- Each customer has one **primary** contact (oldest record).
- Additional identities become **secondary** contacts.
- Secondary contacts reference the primary via `linkedId`.
- Contacts are linked if `email` OR `phone` matches.

## ⚙️ System Architecture

The project follows a layered backend architecture:

```
Request
   ↓
Route Layer
   ↓
Controller Layer
   ↓
Service Layer (Business Logic)
   ↓
Prisma ORM
   ↓
PostgreSQL Database
```

**Why this structure?**
- Separation of concerns
- Testable business logic
- Production-ready design
- Easier scalability

## 🧮 Identity Resolution Approach

The `/identify` endpoint follows a deterministic workflow:

### 1️⃣ New Customer Detection

If no matching contact exists:
- Create a new **primary** contact.

### 2️⃣ Identity Linking

If an existing contact matches:
- Retrieve the entire identity group.
- Check if incoming data introduces new information.
- Create a **secondary** contact if needed.

### 3️⃣ Identity Merging (Core Logic)

If a request connects multiple primary contacts:
- Select the **oldest** contact as primary.
- Convert newer primaries into secondary contacts.
- Re-link all associated records.
- Perform updates inside a **database transaction** to maintain consistency.

### 4️⃣ Response Consolidation

The system returns:
- Primary contact ID
- All associated emails
- All associated phone numbers
- Secondary contact IDs

## 📡 API Specification

### Endpoint

```
POST /identify
```

### Request Body (JSON)

```json
{
  "email": "doc@fluxkart.com",
  "phoneNumber": "111111"
}
```

> At least one field is required.

### Response Format

```json
{
  "contact": {
    "primaryContactId": 1,
    "emails": [
      "doc@fluxkart.com",
      "emmett@fluxkart.com"
    ],
    "phoneNumbers": ["111111"],
    "secondaryContactIds": [23]
  }
}
```

## 🧪 Edge Cases Handled

- ✅ New customer creation
- ✅ Same phone, new email
- ✅ Same email, new phone
- ✅ Duplicate requests (no extra rows created)
- ✅ Multiple primary merge scenario
- ✅ Oldest contact remains primary
- ✅ Partial input (email only / phone only)
- ✅ Duplicate removal in response
- ✅ Transaction-safe merges

## 🛠 Tech Stack

| Layer      | Technology         |
| ---------- | ------------------ |
| Backend    | Node.js + Express  |
| Language   | TypeScript         |
| ORM        | Prisma             |
| Database   | PostgreSQL         |
| Validation | Zod                |
| Deployment | Render             |

## 🚀 Local Setup

### 1. Clone Repository

```bash
git clone https://github.com/AashishG01/bitespeedtask.git
cd bitespeedtask
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Setup Environment Variables

Create a `.env` file:

```env
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/bitespeed"
```

### 4. Run Database Migration

```bash
npx prisma migrate dev
```

### 5. Start Server

```bash
npm run dev
```

Server runs at: `http://localhost:3000`

### 6. Test Endpoint

```
POST http://localhost:3000/identify
```

Use a JSON body as described in the [API Specification](#-api-specification) section.

## 🗄 Prisma Studio (Optional)

View the database visually:

```bash
npx prisma studio
```

## 🌍 Deployment

The application is deployed using **Render**.

### Deployment Steps

1. Push repository to GitHub.
2. Create PostgreSQL instance on Render.
3. Add `DATABASE_URL` environment variable.
4. Add build command:
   ```bash
   npx prisma migrate deploy
   ```
5. Deploy service.

### 🔗 Live Endpoint

```
https://<your-render-url>/identify
```

## 🧠 Design Decisions

- **Single-table identity model** simplifies linking logic.
- **Oldest record as primary** guarantees deterministic merges.
- **Transactions** prevent partial updates during merges.
- **Indexes on email & phone** improve lookup performance.
- **Layered architecture** improves maintainability.

## 🔮 Future Improvements

- [ ] Add automated unit tests
- [ ] Introduce request rate limiting
- [ ] Add caching for identity lookups
- [ ] Implement optimistic locking for high concurrency
- [ ] Add structured logging & monitoring

## 👨‍💻 Author

Developed as part of the **Bitespeed Backend Task** to demonstrate backend system design, relational modeling, and identity resolution logic.

## ✅ Project Status

- ✔ Identity linking implemented
- ✔ Primary merge logic implemented
- ✔ Production-ready structure
- ✔ Deployment ready