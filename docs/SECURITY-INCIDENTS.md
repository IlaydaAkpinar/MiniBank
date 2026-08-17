# MiniBank – Security Findings & Incidents

## Purpose

This document records security-relevant findings identified during the development and security testing of MiniBank, following the same process each time:

```text
Finding → Analysis → Root cause → Remediation → Security test → Regression protection
```

These are development / security-testing findings from the MiniBank learning project — not incidents from a live production system. They are written up here the way a real vulnerability report would be, as practice for the format used in application security work.

---

## SI-001 – Client-Controlled Sender Account

**Status:** Resolved
**Category:** Broken Access Control / Authorization
**Severity:** High
**Affected component:** POST /transactions

### Description
During security testing of the transaction functionality, a potential authorization problem was identified around the sender account. The transaction request contained a from_account field. A security-sensitive account identifier should never be trusted purely because it comes from the client — if the backend used it without verifying ownership, an authenticated user could potentially initiate a transfer from another user's account.

### Example attack scenario

```json
{
  "from_account": 3,
  "to_account": 2,
  "amount": 10
}
```

Submitted while authenticated as a different user. The key question: does the server verify that account 3 actually belongs to the authenticated user?

### Root cause
Sender identity must be derived from the authenticated session, not trusted from client input. The client controls the HTTP request body and can set from_account to anything.

### Remediation
The endpoint no longer treats from_account as authoritative. The server derives the sender account from the verified JWT:

```text
JWT → req.user.userId → accounts.user_id → sender account
```

### Security test
tests/transactions.test.js submits a manipulated from_account and asserts the server still uses the authenticated user's own account.

### Result
Resolved — the authorization decision is enforced server-side and covered by a regression test.

---

## SI-002 – Transaction Amount Validation

**Status:** Resolved
**Category:** Input Validation / Business Logic
**Severity:** Medium
**Affected component:** POST /transactions

### Description
Transaction amounts are security-sensitive. Untested input classes included negative amounts, zero, strings, non-finite numbers, and excessive decimal precision.

### Root cause
Financial values from the client must never be trusted without server-side validation — client-side checks alone provide no protection against a hand-crafted request.

### Remediation

```js
if (typeof amount !== 'number' || !Number.isFinite(amount) || amount <= 0) {
  return res.status(400).json({ error: 'Amount must be greater than 0' });
}
if (Math.round(amount * 100) !== amount * 100) {
  return res.status(400).json({ error: 'Amount may have at most two decimal places' });
}
```

### Security tests
Covered by tests/amount-validation.test.js:
- amount = -10 → 400 Amount must be greater than 0
- amount = 0 → 400 Amount must be greater than 0
- amount = "10" (string) → 400
- amounts with more than two decimal places → 400

### Result
Resolved — amounts are validated server-side before any financial operation runs.

---

## SI-003 – Insufficient Funds / Negative Balance Protection

**Status:** Resolved
**Category:** Business Logic / Financial Integrity
**Severity:** High
**Affected component:** POST /transactions

### Description
Users must not be able to transfer more than their available balance. A balance check performed *before* the update, as a separate step, would be unsafe if the operation isn't atomic.

### Remediation
The balance check happens inside the debit statement itself:

```sql
UPDATE accounts
SET balance = balance - $1
WHERE id = $2
  AND balance >= $1
RETURNING id, balance;
```

If no row is returned, the transfer is rejected.

### Security test
tests/balance.test.js attempts a transfer of 999999 and expects 400 Insufficient funds.

### Result
Resolved — a debit cannot succeed without sufficient funds.

---

## SI-004 – Unauthorized Access to Protected Resources

**Status:** Resolved
**Category:** Broken Access Control / Authentication
**Severity:** High
**Affected components:** /users, /accounts, /transactions, /dashboard.html

### Description
Account and transaction data must not be reachable without authentication.

### Remediation
The authenticateToken middleware validates the Authorization header before any protected route executes.

### Security tests
tests/authentication.test.js verifies: missing token → rejected, invalid token → rejected, valid token → accepted.

### Result
Resolved.

---

## SI-005 – User Enumeration Through Login Errors

**Status:** Resolved
**Category:** Information Disclosure
**Severity:** Medium

### Description
Returning different errors for "unknown username" vs. "wrong password" would let an attacker enumerate valid usernames.

### Remediation
Both cases return the same generic message: Invalid login credentials.

### Security test
tests/login.test.js verifies an incorrect password returns the generic error.

### Result
Resolved.

---

## SI-006 – SQL Injection Protection

**Status:** Resolved
**Category:** Injection
**Severity:** High

### Description
User-controlled input flows through authentication, registration, and account operations. Direct string concatenation into SQL would create an injection surface.

### Remediation
All queries use parameterized placeholders, e.g.:

```js
await pool.query(
  `SELECT id, username, password FROM users WHERE username = $1`,
  [username]
);
```

### Result
No direct SQL string concatenation was found anywhere in the reviewed queries — mitigated by consistent use of parameterized queries.

---

## SI-007 – Password Reset Token Protection

**Status:** Resolved
**Category:** Authentication / Credential Recovery
**Severity:** High

### Description
Password reset is effectively a second authentication path and needs its own security model: unpredictable tokens, limited lifetime, and no plaintext storage.

### Remediation
- Tokens generated with crypto.randomBytes(32)
- Only the SHA-256 hash is stored
- Tokens expire after 15 minutes and are marked used after a successful reset
- Old unused tokens for the same user are invalidated when a new reset is requested

### Result
Resolved — the reset flow covers unpredictability, expiration, hashing, and single-use.

---

## SI-008 – Password Policy Bypass Prevention

**Status:** Resolved
**Category:** Input Validation / Authentication
**Severity:** Medium

### Description
Password requirements enforced only in the frontend can be trivially bypassed with a direct HTTP request.

### Remediation
Validation lives server-side in backend/src/password-policy.js and is applied on both registration and password reset.

### Security test
Registration tests confirm passwords below the minimum requirements are rejected.

### Result
Resolved.

---

## SI-009 – Atomic Money Transfer

**Status:** Resolved
**Category:** Financial Integrity / Data Consistency
**Severity:** High

### Description
A transfer involves multiple writes (debit, credit, transaction record). A failure between steps could leave the database inconsistent — e.g. sender debited but receiver never credited.

### Remediation
The full operation runs inside one PostgreSQL transaction; any error triggers a rollback.

### Verification
tests/successful-transaction.test.js asserts sender_after = sender_before - amount and receiver_after = receiver_before + amount.

### Result
Resolved.

---

## SI-010 – Registration Atomicity

**Status:** Resolved
**Category:** Data Integrity
**Severity:** Medium

### Description
Registration creates both a user and an account. If these were separate, unrelated operations, a failure could leave a user without an account.

### Remediation
User creation and account creation happen inside the same database transaction.

### Result
Resolved.

---

## SI-011 – Missing Rate Limiting

**Status:** Resolved
**Category:** Denial of Service / Brute Force / Abuse Prevention
**Severity:** Medium
**Affected components:** Login endpoint, POST /transactions

### Description
Sensitive endpoints had no request-rate limiting. Without it, an attacker could send repeated requests to brute-force credentials, stuff credentials, abuse the login flow, or repeatedly submit transaction requests to flood the endpoint.

### Root cause
The application processed repeated requests without an application-level request-rate restriction. Client-side restrictions cannot be relied upon, since an attacker communicates directly with the backend.

### Remediation
Server-side rate limiting was implemented using express-rate-limit, applied to:
- the login endpoint
- POST /transactions

The limiter rejects excessive requests within the configured time window instead of allowing them to reach the application logic.

### Security tests
- tests/rate-limiting.test.js — verifies normal login traffic is unaffected and excessive requests are rejected
- tests/transaction-rate-limiting.test.js — verifies the same behavior for transaction requests

### Result
Resolved — rate limiting is implemented and verified by automated regression tests.

---

## Regression Testing

Security fixes are backed by automated tests wherever practical. Current suite:

```text
Test Suites: 10 passed, 10 total
Tests:       19 passed, 19 total
```

Run with npm test. The current security regression suite covers authentication, authorization, input validation, financial integrity, password security, and rate limiting. The goal is to make sure a previously fixed vulnerability can't silently come back during future changes.

---

## Current Open Security Work

The following areas remain candidates for future hardening and are not yet resolved findings:

- security headers
- HTTPS deployment
- logging and monitoring
- production-grade session/token management
- concurrency testing
- further penetration testing
- additional automated security tests

---

## Lessons Learned

- Never trust security-sensitive values supplied by the client (e.g. from_account).
- Authentication and authorization are different concerns — being logged in doesn't mean you're allowed to do everything.
- Input validation has to happen server-side; the frontend is not a security boundary.
- Financial operations need atomic database transactions, not sequential unguarded writes.
- Every security fix should ship with a regression test.
- Error messages should avoid leaking information an attacker could use (e.g. username enumeration).
- Password reset needs its own threat model, separate from login.
- Sensitive endpoints benefit from server-side rate limiting to reduce brute-force and abuse risks.
- Security testing works best as a continuous part of development, not a final pass at the end.

This project is intentionally continued as a hands-on Red Team / Blue Team learning exercise.