# MiniBank – Security Documentation

## 1. Security Approach

MiniBank was built as a security-focused learning project. The goal was not just to implement banking functionality, but to understand how vulnerabilities arise in web applications and how to prevent them through defensive programming, authorization checks, input validation, rate limiting, and automated testing.

General development loop used throughout the project:

```text
Implement functionality
        ↓
Identify potential attack vectors
        ↓
Test the application (as an attacker would)
        ↓
Identify weaknesses
        ↓
Implement defensive controls
        ↓
Add regression tests
```

Detailed write-ups of individual findings live in [SECURITY-INCIDENTS.md](./SECURITY-INCIDENTS.md).

---

## 2. Current Security Controls

| Security Area | Status | Implementation |
|---|---|---|
| Password hashing | ✅ | bcrypt |
| Password verification | ✅ | bcrypt.compare() |
| Password policy | ✅ | Central validatePassword() |
| Common password protection | ✅ | Password blacklist |
| JWT authentication | ✅ | jsonwebtoken |
| JWT expiration | ✅ | 1 hour |
| Protected endpoints | ✅ | Authentication middleware |
| Missing token handling | ✅ | HTTP 401 |
| Invalid token handling | ✅ | HTTP 403 |
| Login enumeration protection | ✅ | Generic login error |
| Password-reset enumeration protection | ✅ | Generic reset response |
| Secure reset tokens | ✅ | crypto.randomBytes(32) |
| Reset token hashing | ✅ | SHA-256 |
| Reset token expiration | ✅ | 15 minutes |
| One-time reset tokens | ✅ | used_at |
| SQL injection protection | ✅ | Parameterized queries |
| Username validation | ✅ | 3–50 characters |
| Duplicate usernames | ✅ | PostgreSQL UNIQUE |
| Atomic registration | ✅ | DB transaction |
| Server-side account authorization | ✅ | User ID from JWT |
| Client-controlled sender protection | ✅ | Sender derived server-side |
| Target account validation | ✅ | Server-side existence check |
| Self-transfer protection | ✅ | Source/target comparison |
| Negative / zero amount protection | ✅ | amount > 0 |
| NaN / Infinity protection | ✅ | Number.isFinite() |
| Decimal precision validation | ✅ | Max 2 decimal places |
| Insufficient funds protection | ✅ | Conditional debit |
| Atomic transfers | ✅ | DB transaction |
| Transaction history authorization | ✅ | Authenticated user ID |
| Secrets outside source code | ✅ | Environment variables |
| Separate test environment | ✅ | .env.test |
| Login rate limiting | ✅ | express-rate-limit |
| Transaction rate limiting | ✅ | express-rate-limit |
| Security headers | ✅ | Helmet |
| Automated tests | ✅ | Jest + Supertest |

---

## 3. Password Security

Passwords are never stored directly. They are hashed with bcrypt on registration and reset:

```js
bcrypt.hash(password, 10);
```

Verified on login:

```js
bcrypt.compare(password, user.password);
```

The application never needs to store or recover the original password.

---

## 4. Password Policy

Enforced server-side in backend/src/password-policy.js, reused by both registration and password reset so the reset flow can't accidentally define weaker rules than registration.

A valid password requires: 8+ characters, uppercase, lowercase, number, special character, and must not be on the common-password blacklist.

---

## 5. Authentication and Authorization

JWTs identify authenticated users. Protected endpoints verify the token before processing the request, distinguishing:

- 401 — missing authentication
- 403 — invalid/expired token

The authenticated user's ID always comes from the verified JWT — never from a client-supplied parameter.

---

## 6. Broken Access Control Prevention

A core focus of MiniBank is preventing users from acting on behalf of other users.

For money transfers, the client is **not** trusted to determine the sender account. Instead of using a client-supplied from_account, the server resolves:

```text
JWT → authenticated user → own account (DB lookup) → sender account
```

This is covered by a dedicated regression test (see SI-001 in SECURITY-INCIDENTS.md).

---

## 7. Input Validation

All security-sensitive values are validated server-side, not just in the frontend. Transaction amounts must be numeric, finite, positive, and have at most two decimal places. The backend explicitly rejects negative numbers, zero, strings, NaN, Infinity, and excess decimal precision. Target accounts are validated for existence before any transfer proceeds.

---

## 8. SQL Injection Prevention

All database queries use parameterized statements:

```js
await pool.query(
  `SELECT id, username FROM users WHERE id = $1`,
  [req.user.userId]
);
```

User input is always passed as a query parameter, never concatenated into the SQL string.

---

## 9. Financial Integrity

Transfers run inside a PostgreSQL transaction:

```text
BEGIN
  debit sender
  credit receiver
  record transaction
COMMIT
```

Any failure triggers a ROLLBACK. The debit itself is conditioned on sufficient balance directly in the UPDATE:

```sql
UPDATE accounts
SET balance = balance - $1
WHERE id = $2
  AND balance >= $1
RETURNING id, balance;
```

If no row is returned, the transfer is rejected — this prevents negative balances even under this transaction path.

---

## 10. Password Reset Security

- Tokens generated with crypto.randomBytes(32) (cryptographically secure)
- Only a SHA-256 hash of the token is stored — the raw token never touches the database
- Tokens expire after 15 minutes
- Tokens are single-use (used_at)
- Old unused tokens for the same user are invalidated when a new reset is requested
- The reset endpoint returns the same response whether or not the email exists, preventing account enumeration

---

## 11. Rate Limiting

MiniBank uses express-rate-limit to reduce automated abuse of sensitive endpoints.

Rate limiting is implemented server-side and therefore cannot be bypassed by disabling or modifying frontend JavaScript.

The current implementation covers:

- login requests (`POST /login`)
- registration requests (`POST /register`)
- password-reset requests (`POST /forgot-password` and `POST /reset-password`)
- transaction requests (`POST /transactions`)

The purpose is to mitigate:

- brute-force login attempts
- repeated authentication attempts
- automated abuse
- excessive transaction requests
- request flooding

Rate limiting is an additional security layer — it does not replace authentication, authorization, or input validation.

Dedicated regression tests verify the behavior:

- tests/rate-limiting.test.js
- tests/transaction-rate-limiting.test.js

The tests confirm that excessive requests are rejected rather than processed indefinitely. Rate limiting is therefore considered an implemented security control rather than a planned feature.

---

## 12. Security Headers

MiniBank uses Helmet to add security-related HTTP response headers.

Helmet provides multiple browser security protections, including:

- Content Security Policy (CSP)
- X-Content-Type-Options
- X-Frame-Options
- Referrer-Policy
- Strict-Transport-Security (HSTS) when deployed over HTTPS
- additional security-related headers provided by Helmet

These headers reduce the risk of common browser-based attacks and provide an additional layer of defense beyond application-level validation and authorization.

The security headers are applied server-side and therefore do not depend on frontend JavaScript.

The implementation is covered by an automated regression test:

- `tests/security-headers.test.js`
The test verifies that security headers are present on HTTP responses.

---

## 13. Automated Security Testing

Security controls are backed by automated regression tests (Jest + Supertest):

```text
Test Suites: 11 passed, 11 total
Tests:       20 passed, 20 total
```

The current suite covers JWT authentication, authorization, login behavior, registration, password validation, transaction authorization, transaction amount validation, invalid accounts, insufficient funds, successful transfers, and rate limiting.

The goal for every fix is: a test that fails before the fix and passes after it, so the issue can't silently reappear.

---

## 14. Security Findings

Individual vulnerabilities identified and fixed during development are documented with full root-cause analysis in [SECURITY-INCIDENTS.md](./SECURITY-INCIDENTS.md).

---

## 15. Planned Security Improvements

| Security Measure | Status |
|---|---|
| Rate limiting | ✅ Implemented |
| Brute-force protection | 🟡 Partially addressed through rate limiting |
| Security headers |  ✅ Implemented  |
| HTTPS deployment | 🔲 Planned |
| Logging & monitoring | 🔲 Planned |
| Concurrency testing | 🔲 Planned |
| Further penetration testing | 🔲 Planned |

Rate limiting provides an initial layer of brute-force and abuse protection. Further hardening and testing will continue as the project develops.

---

## 16. Security Philosophy

MiniBank is intentionally built as a hands-on security learning project, cycling through:

```text
Red Team thinking    → How could this functionality be abused?
Blue Team thinking    → How can the application prevent or detect this?
Secure development    → How is the protection implemented and tested?
```

Security is treated as part of every feature's development, not a separate final step.