Perfect. I’ll give you a **clear, execution-level roadmap** — like a mini project plan you can follow step-by-step and actually complete.

This assumes:

* Node.js
* TypeScript
* PostgreSQL
* Prisma ORM
* Express

If you follow this properly, your submission will look professional.

---

# 🗺️ COMPLETE ROADMAP (From Zero → Selected)

---

# 🟢 PHASE 1 — Understand & Design (Before Writing Code)

## Step 1 — Rewrite The Problem In Your Own Words

Before coding, be crystal clear:

You are building:

> A system that merges customer identities based on shared email OR phone number.

Core rule:

* Same email OR same phone → same person
* Oldest contact becomes primary
* Others become secondary

If two primaries get connected → merge them.

If this logic is clear in your head, coding becomes easy.

---

## Step 2 — Design Your Database Schema

Use Prisma schema like:

```prisma
model Contact {
  id             Int       @id @default(autoincrement())
  phoneNumber    String?
  email          String?
  linkedId       Int?
  linkPrecedence LinkPrecedence
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt
  deletedAt      DateTime?

  linkedContact  Contact?  @relation("ContactLink", fields: [linkedId], references: [id])
  secondaryContacts Contact[] @relation("ContactLink")
}

enum LinkPrecedence {
  primary
  secondary
}
```

Important:

* Add index on email
* Add index on phoneNumber

---

# 🟢 PHASE 2 — Project Setup

## Step 3 — Initialize Project

```bash
npm init -y
npm install express typescript ts-node prisma @prisma/client
npm install dotenv zod
```

Initialize prisma:

```bash
npx prisma init
```

Configure PostgreSQL in `.env`

---

## Step 4 — Folder Structure (Clean Architecture)

```
src/
 ├── routes/
 │     identify.route.ts
 ├── controllers/
 │     identify.controller.ts
 ├── services/
 │     contact.service.ts
 ├── validators/
 │     identify.validator.ts
 ├── utils/
 ├── app.ts
 └── server.ts
```

Never put logic inside route file.

---

# 🟢 PHASE 3 — Core Logic Implementation

Now comes the important part.

---

# 🔥 STEP-BY-STEP LOGIC FLOW

---

## Step 5 — Validate Input

Rules:

* At least one of email or phoneNumber required
* If both missing → return 400

Use Zod for validation.

---

## Step 6 — Find Matching Contacts

Query:

* Where email = incomingEmail
* OR phoneNumber = incomingPhone
* AND deletedAt is null

If no matches → create new primary.

---

## Step 7 — If Matches Found

Now the serious logic begins.

### 1️⃣ Collect All Related Contacts

From matched rows:

* Get their primary contacts
* Get all secondaries under those primaries

Basically expand the identity group fully.

---

### 2️⃣ Determine The True Primary

From all involved contacts:

* Choose the one with earliest `createdAt`
* That becomes primary

---

### 3️⃣ If Multiple Primaries Exist

You must:

* Convert newer primaries into secondary
* Update their linkedId to oldest primary
* Update linkPrecedence to "secondary"

Do this inside a TRANSACTION.

---

### 4️⃣ Check If New Information Exists

If incoming email/phone does NOT already exist in identity group:

Create new secondary contact.

If both already exist → do nothing.

---

## Step 8 — Return Consolidated Response

Build response:

```json
{
  "contact": {
    "primaryContactId": number,
    "emails": [],
    "phoneNumbers": [],
    "secondaryContactIds": []
  }
}
```

Rules:

* Primary email first
* Primary phone first
* Remove duplicates
* secondaryContactIds exclude primary

---

# 🟢 PHASE 4 — Edge Cases

Test manually using Postman.

Test all of these:

### ✅ Case 1

First ever request

### ✅ Case 2

Same email, new phone

### ✅ Case 3

Same phone, new email

### ✅ Case 4

Two primaries merge

### ✅ Case 5

Only email provided

### ✅ Case 6

Only phone provided

### ✅ Case 7

Repeated identical request

Make sure no duplicate secondary is created.

---

# 🟢 PHASE 5 — Production Quality Improvements

Now upgrade your project quality.

---

## Step 9 — Add Transactions

Use Prisma `$transaction()` for:

* Primary merging
* Converting primaries to secondary
* Creating new secondary

This prevents partial updates.

---

## Step 10 — Add Logging

Basic structured logs.

---

## Step 11 — Add Basic Unit Tests

Test service logic only.

Even 3–4 test cases makes you stand out.

---

## Step 12 — Add Proper Error Handling

Create global error middleware.

Return:

* 400 for validation
* 500 for unexpected errors

---

# 🟢 PHASE 6 — README (Very Important)

Your README should include:

### 1. Problem Summary

Explain identity resolution clearly.

### 2. Architecture Diagram (optional but impressive)

```
Route → Controller → Service → Database
```

### 3. Merging Logic Explanation

Explain:

* How primary chosen
* How merge works

### 4. Edge Cases Covered

### 5. API Examples

### 6. Deployment URL

---

# 🟢 PHASE 7 — Deployment

Use:

* Render
* Railway
* Fly.io

Steps:

1. Push to GitHub
2. Connect repo to hosting
3. Add environment variables
4. Run migrations
5. Test live endpoint

Put live URL in README.

---

# 🟢 PHASE 8 — Clean Commits Strategy

Instead of one big commit, do:

```
init project
setup prisma schema
implement identify endpoint
add identity merge logic
add transaction support
add validation middleware
add error handling
update readme
deploy configuration
```

Shows professional workflow.

---

# 🟢 PHASE 9 — Final Checklist Before Submission

* Code runs without error
* No console logs
* No commented junk
* Clean variable names
* All edge cases tested
* Deployment works
* README strong
* API works via JSON (not form-data)

---

# 🧠 What Will Make You Selected

If your submission:

* Correctly handles merging
* Uses transactions
* Clean architecture
* Well documented
* Hosted live
* Has thoughtful commits

They will assume:

> “This person understands backend systems.”

That’s selection-level quality.

---

If you want next, I can:

* Give you exact merging algorithm pseudocode
* Or give you a clean implementation blueprint for contact.service
* Or simulate tricky test cases to validate your logic

Let’s build this like a serious backend engineer.
