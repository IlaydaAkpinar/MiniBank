# MiniBank

MiniBank is a small web application that simulates a simplified banking system.
The project was built as an independent learning and practice project with a focus on cybersecurity, secure web development, and practical application security concepts.

A central goal is to understand common web application security problems in practice, harden the implementation, and verify the behavior with automated tests.

## Goals

MiniBank is intended to help with:

* gaining practical experience in cybersecurity and web application security
* understanding common vulnerabilities and attack paths in web applications
* implementing authentication and authorization securely
* handling user input safely
* learning backend and database security with realistic examples
* verifying security controls through automated tests
* improving practical knowledge in penetration testing and web security
* experimenting with security concepts and observing their impact

The project is both a technical application and a personal learning environment for continued work in IT security.

---

## Security Focus

MiniBank focuses on securing a web application.

Current security-related areas include:

* **Authentication**

  * login with username and password
  * JWT-based authentication
  * protected API endpoints
  * token verification through middleware

* **Authorization**

  * users can access only their own accounts
  * transfers verify ownership of the sender account
  * protected user, account, and transaction data

* **Password security**

  * passwords are not stored in plaintext
  * `bcrypt` is used to hash and compare passwords

* **Input validation**

  * username validation
  * password validation
  * account ID validation
  * transfer amount validation
  * rejection of invalid or negative values

* **Database security**

  * PostgreSQL
  * parameterized SQL queries
  * foreign key relationships between users, accounts, and transactions
  * database transactions for money transfers

* **Security testing**

  * automated tests with Jest
  * HTTP tests with Supertest
  * tests for authentication and authorization
  * tests for invalid input
  * tests for balances and transfers

---

## Features

MiniBank currently includes:

* user registration
* login
* JWT-based sessions
* protected dashboard page
* display of the user's account number
* display of the account balance
* transfers between accounts
* transaction history
* logout
* input validation
* automated backend tests

---

## Technologies

### Backend

* **Node.js**
* **Express**
* **PostgreSQL**
* **bcrypt**
* **JSON Web Token (JWT)**

### Frontend

* HTML
* CSS
* JavaScript

### Testing

* **Jest**
* **Supertest**

### Development

* IntelliJ IDEA
* Git
* GitHub
* PostgreSQL / psql

---

## Project Structure

```text
MiniBank/
|
+-- backend/
|   +-- src/
|       +-- server.js
|
+-- static/
|   +-- dashboard.js
|   +-- login.js
|   +-- register.js
|   +-- style.css
|
+-- templates/
|   +-- dashboard.html
|   +-- login.html
|   +-- register.html
|
+-- tests/
|   +-- amount-validation.test.js
|   +-- authentication.test.js
|   +-- balance.test.js
|   +-- invalid-account.test.js
|   +-- login.test.js
|   +-- registration.test.js
|   +-- successful-transaction.test.js
|   +-- transactions.test.js
|
+-- minibank_schema.sql
+-- package.json
+-- package-lock.json
+-- .gitignore
+-- app.py
```

---

## Requirements

To run the project, you need:

* Node.js
* npm
* PostgreSQL
* Git

---

## Installation

Clone the repository:

```bash
git clone https://github.com/IlaydaAkpinar/MiniBank.git
cd MiniBank
```

Install dependencies:

```bash
npm install
```

Then create a PostgreSQL database and load the schema from:

```text
minibank_schema.sql
```

Required credentials are configured through environment variables.

Example:

```text
DB_USER=...
DB_HOST=...
DB_NAME=...
DB_PASSWORD=...
DB_PORT=...
JWT_SECRET=...
```

The `.env` file is not committed to the repository.

---

## Start The Application

The backend server is currently started with Node.js:

```bash
node backend/src/server.js
```

The application is then available at:

```text
http://localhost:3000
```

---

## Tests

Run the automated tests with:

```bash
npm test
```

The current test coverage includes:

* authentication
* login
* registration
* transaction authorization
* invalid account data
* invalid transfer amounts
* successful transfers
* balances

Current status:

```text
Test Suites: 8 passed, 8 total
Tests:       16 passed, 16 total
```

---

## Database

MiniBank uses PostgreSQL to store users, accounts, and transactions.

The basic data model is:

```text
users
  |
  +-- accounts
          |
          +-- transactions
```

Each user owns one account.
Transactions reference a sender account and a receiver account.

Transfers are executed inside a database transaction. This prevents partial updates, such as debiting the sender without crediting the receiver.

---

## Security Testing And Next Steps

MiniBank is continuously extended and also serves as a practical environment for learning web application security.

Planned or possible next steps include:

* additional security tests
* investigation of common web vulnerabilities
* expanded authorization checks
* improved session and token security
* rate limiting
* security headers
* CSRF protection
* logging and monitoring
* additional automated security tests
* practical testing with penetration testing tools

Security controls should be implemented and, where possible, explicitly tested.

---

## Project Documentation

More detailed technical documentation will be created separately.

It will cover architecture, database structure, security decisions, tests, discovered vulnerabilities, and mitigations in more detail.

---

## Background

MiniBank is an independently developed learning project designed to turn theoretical knowledge into practical experience.

The main focus is the connection between software development and cybersecurity, especially web application security and penetration testing.

The project is intentionally expanded over time to explore new security concepts in practice and to keep improving through hands-on experimentation and testing.
