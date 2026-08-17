# MiniBank – Application Documentation

## 1. Overview

MiniBank is a web-based banking application developed as a personal learning project with a focus on secure web application development.

The application provides core banking functionality: user registration, authentication, account management, money transfers, and transaction history.

Security was a central development goal from the start. The application was intentionally built and tested to understand common web application security risks and how to defend against them through secure coding, authorization checks, input validation, rate limiting, and automated testing.

The project is still under active development.

---

## 2. Technology Stack

**Backend**
- Node.js
- Express
- PostgreSQL
- pg (PostgreSQL client)
- bcrypt (password hashing)
- jsonwebtoken (JWT authentication)
- Node.js crypto (secure token generation)
- express-rate-limit (request rate limiting)
- dotenv (environment configuration)

**Frontend**
- HTML
- CSS
- JavaScript

**Testing**
- Jest
- Supertest

**Development**
- Git / GitHub
- IntelliJ IDEA

---

## 3. Architecture

MiniBank follows a simple client-server architecture.

```text
Browser
   │
   │ HTTP / JSON
   ▼
Express / Node.js
   │
   ├── Authentication
   ├── Authorization
   ├── Rate limiting
   ├── Input validation
   ├── Business logic
   │
   ▼
PostgreSQL
```

The frontend consists of static HTML, CSS, and JavaScript. The backend handles authentication, authorization, rate limiting, input validation, banking logic, and all communication with PostgreSQL.

Client-side validation is **not** treated as a security boundary. All security-relevant checks are enforced server-side.

---

## 4. Project Structure

```text
MiniBank/
│
├── backend/
│   └── src/
│       ├── server.js
│       └── password-policy.js
│
├── static/
│   ├── dashboard.js
│   ├── forgot-password.js
│   ├── login.js
│   ├── register.js
│   ├── reset-password.js
│   └── style.css
│
├── templates/
│   ├── dashboard.html
│   ├── forgot-password.html
│   ├── login.html
│   ├── register.html
│   └── reset-password.html
│
├── tests/
│   ├── amount-validation.test.js
│   ├── authentication.test.js
│   ├── balance.test.js
│   ├── invalid-account.test.js
│   ├── login.test.js
│   ├── rate-limiting.test.js
│   ├── registration.test.js
│   ├── successful-transaction.test.js
│   ├── transaction-rate-limiting.test.js
│   └── transactions.test.js
│
├── docs/
│   ├── APPLICATION.md
│   ├── SECURITY.md
│   └── SECURITY-INCIDENTS.md
│
├── minibank_schema.sql
├── package.json
├── package-lock.json
└── .gitignore
```

---

## 5. Authentication

MiniBank uses JSON Web Tokens (JWT).

After a successful login, the server issues a signed JWT containing the authenticated user's ID and username. The token expires after **one hour**.

Protected endpoints require the header:

```text
Authorization: Bearer <token>
```

The authenticateToken middleware verifies the token before allowing access. Protected endpoints include:

- GET /users
- GET /accounts
- GET /transactions
- POST /transactions

Requests without a token return 401. Requests with an invalid or expired token return 403.

---

## 6. User Registration

Users register with a username and password. The server validates:

- username type
- username length (3–50 characters)
- password type
- password security requirements (see Password Policy)
- username uniqueness

Passwords are never stored in plaintext — they are hashed with bcrypt before being written to the database.

Registration creates a **user** and a corresponding **bank account** inside a single database transaction, so either both are created or neither is.

---

## 7. Password Policy

Implemented centrally in backend/src/password-policy.js and reused by both registration and password reset.

A valid password must contain:

- at least 8 characters
- an uppercase letter
- a lowercase letter
- a number
- a special character
- must not appear on the common-password blacklist

---

## 8. Login

The login endpoint looks up the user via a parameterized query and compares the supplied password against the stored bcrypt hash.

Login failures always return the same generic message:

```text
Invalid login credentials
```

This applies whether the username doesn't exist or the password is wrong, preventing username enumeration through the login form.

The login endpoint is additionally protected by server-side rate limiting to reduce the risk of automated brute-force attempts and excessive requests.

---

## 9. Rate Limiting

MiniBank uses express-rate-limit to apply server-side request rate limiting to security-sensitive functionality.

Rate limiting is enforced server-side and is independent of client-side behavior, meaning it cannot be bypassed by disabling or modifying frontend JavaScript.

The implementation covers:

- login requests
- transaction requests (POST /transactions)

The purpose is to reduce the impact of:

- brute-force login attempts
- repeated credential attacks
- automated abuse
- excessive transaction requests
- request flooding against sensitive endpoints

Rate limiting is covered by dedicated automated tests:

- tests/rate-limiting.test.js
- tests/transaction-rate-limiting.test.js

The tests verify that normal requests are processed while excessive requests within the configured time window are rejected.

The exact limits are defined in the backend implementation and should be treated as application configuration rather than a client-side security control.

---

## 10. Password Reset

```text
User requests password reset
        │
        ▼
Server checks email
        │
        ▼
Cryptographically secure token generated (crypto.randomBytes(32))
        │
        ▼
Only the SHA-256 hash of the token is stored
        │
        ▼
Reset link generated (expires in 15 minutes)
        │
        ▼
User submits new password
        │
        ▼
Token is hashed and validated
        │
        ▼
Password is replaced (bcrypt hash)
        │
        ▼
Token is marked as used
```

The reset endpoint always returns the same response regardless of whether the email exists, to avoid account enumeration.

---

## 11. Accounts

Every registered user has exactly one bank account, containing:

- account ID
- user ID
- account number
- balance

The /accounts endpoint derives the user from the verified JWT — it never trusts a user ID supplied by the client.

---

## 12. Money Transfers

Authenticated users can transfer money to another account. The server validates:

- target account exists
- amount is numeric and finite
- amount is positive
- amount has at most two decimal places
- sufficient balance
- sender and receiver are not the same account

**Important:** the client cannot choose the sender account. The server derives it from the authenticated user:

```text
JWT → authenticated user → own account (server-side lookup) → sender account
```

Any from_account value submitted by the client is ignored.

Transaction requests are additionally subject to server-side rate limiting (see section 9).

---

## 13. Database Transactions

Money transfers run inside a PostgreSQL transaction:

```text
BEGIN
  debit sender
  credit receiver
  record transaction
COMMIT
```

Any failure triggers a ROLLBACK, preventing partially completed transfers, such as a debit without a matching credit. The same pattern is used for registration (user + account creation).

---

## 14. Transaction History

Authenticated users can view transactions involving their own account only. The endpoint requires authentication and filters by the authenticated user's ID.

---

## 15. Database

MiniBank uses PostgreSQL with these main tables:

- users
- accounts
- transactions
- password_reset_tokens

Integrity is enforced with primary keys, foreign keys, unique constraints (username, account number), and non-null/numeric constraints — in addition to application-level validation.

---

## 16. Environment Configuration

Database credentials and the JWT secret are loaded from environment variables and are never hardcoded. A separate .env.test is used for automated tests (NODE_ENV=test). Environment files containing secrets are excluded from version control.

---

## 17. Testing

Automated backend tests use Jest and Supertest.

| Test Suite | Focus |
|---|---|
| authentication.test.js | JWT authentication, protected endpoints |
| login.test.js | Login behavior, generic auth errors |
| registration.test.js | Registration, password validation |
| amount-validation.test.js | Transfer amount validation |
| invalid-account.test.js | Target account validation |
| balance.test.js | Insufficient funds |
| successful-transaction.test.js | Transaction integrity |
| transactions.test.js | Authorization, sender-account manipulation |
| rate-limiting.test.js | Login / authentication rate limiting |
| transaction-rate-limiting.test.js | Transaction rate limiting |

Current result:

```text
Test Suites: 10 passed, 10 total
Tests:       19 passed, 19 total
```

Run with:

```bash
npm test
```

---

## 18. Current Limitations

MiniBank is a learning project and is **not** production-ready. Several controls are intentionally still open:

- Security headers
- HTTPS deployment
- Logging and monitoring
- Production-grade session/token management
- Concurrency testing
- Production password-reset email delivery
- Further penetration testing

Rate limiting is already implemented, but limits and thresholds may be tuned further as the application grows.

---

## 19. Development Status

| Area | Status |
|---|---|
| Core application | Implemented |
| Authentication | Implemented |
| Authorization | Implemented |
| Transaction security | Implemented |
| Password security | Implemented |
| Password reset | Implemented |
| Input validation | Implemented |
| Rate limiting | Implemented |
| Security test suite | Implemented (19/19 passing) |
| Security headers | Planned |
| HTTPS deployment | Planned |
| Logging & monitoring | Planned |
| Further hardening | Planned |

MiniBank is treated as an evolving security learning project rather than a finished product.