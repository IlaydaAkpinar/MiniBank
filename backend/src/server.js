require('dotenv').config({
    path: process.env.NODE_ENV === 'test'
        ? '.env.test'
        : '.env'
});

const express = require('express');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { validatePassword } = require('./password-policy');

// ============================================================
// DATABASE CONNECTION
// ============================================================

// Connection pool for Postgres; credentials come from
// environment variables so nothing sensitive is hardcoded.
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT
});

const app = express();
const PORT = 3000;

// ============================================================
// MIDDLEWARE
// ============================================================

// Serve static assets (css/js/images) directly from "static".
app.use(express.static('static'));

// Parse incoming JSON request bodies.
app.use(express.json());

// ============================================================
// JWT AUTHENTICATION
// ============================================================

const authenticateToken = (req, res, next) => {

    const authHeader = req.headers['authorization'];

    // Expected format: "Bearer <token>"
    const token =
        authHeader && authHeader.split(' ')[1];

    if (!token) {

        return res.status(401).json({
            error: 'Missing token'
        });
    }

    jwt.verify(
        token,
        process.env.JWT_SECRET,
        (error, user) => {

            if (error) {

                return res.status(403).json({
                    error: 'Invalid token'
                });
            }

            req.user = user;

            next();
        }
    );
};

// ============================================================
// FRONTEND ROUTES
// ============================================================

// Public login page.
app.get('/', (req, res) => {

    res.sendFile('login.html', {
        root: 'templates'
    });
});

// Dashboard requires authentication.
app.get('/dashboard.html', authenticateToken, (req, res) => {

    res.sendFile('dashboard.html', {
        root: 'templates'
    });
});

// Registration page is public.
app.get('/register', (req, res) => {

    res.sendFile('register.html', {
        root: 'templates'
    });
});

// ============================================================
// RESET-PASSWORD PAGE
// ============================================================

// The reset-password page is public because the user
// reaches it through the reset link.

app.get('/reset-password', (req, res) => {

    res.sendFile('reset-password.html', {
        root: 'templates'
    });
});

// ============================================================
// FORGOT-PASSWORD PAGE
// ============================================================

// Public password-recovery page.

app.get('/forgot-password', (req, res) => {

    res.sendFile('forgot-password.html', {
        root: 'templates'
    });
});

// ============================================================
// USERS
// ============================================================

app.get('/users', authenticateToken, async (req, res) => {

    try {

        const result = await pool.query(
            `SELECT id, username
             FROM users
             WHERE id = $1`,
            [req.user.userId]
        );

        res.json(result.rows);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            error: 'Failed to fetch users'
        });
    }
});

// ============================================================
// ACCOUNTS
// ============================================================

app.get('/accounts', authenticateToken, async (req, res) => {

    try {

        const result = await pool.query(
            `SELECT
                 accounts.id,
                 users.username,
                 accounts.account_number,
                 accounts.balance
             FROM accounts
                      JOIN users
                           ON accounts.user_id = users.id
             WHERE accounts.user_id = $1`,
            [req.user.userId]
        );

        res.json(result.rows);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            error: 'Failed to fetch accounts'
        });
    }
});

// ============================================================
// TRANSACTIONS - HISTORY
// ============================================================

app.get('/transactions', authenticateToken, async (req, res) => {

    try {

        const result = await pool.query(
            `SELECT
                 transactions.id,
                 sender.username AS sender,
                 receiver.username AS receiver,
                 transactions.amount,
                 transactions.created_at
             FROM transactions
                      JOIN accounts AS sender_account
                           ON transactions.from_account = sender_account.id
                      JOIN users AS sender
                           ON sender_account.user_id = sender.id
                      JOIN accounts AS receiver_account
                           ON transactions.to_account = receiver_account.id
                      JOIN users AS receiver
                           ON receiver_account.user_id = receiver.id
             WHERE sender.id = $1
                OR receiver.id = $1`,
            [req.user.userId]
        );

        res.json(result.rows);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            error: 'Failed to fetch transactions'
        });
    }
});

// ============================================================
// REGISTRATION
// ============================================================

app.post('/register', async (req, res) => {

    const {
        username,
        password
    } = req.body;


    // --------------------------------------------------------
    // Validate username
    // --------------------------------------------------------

    if (
        typeof username !== 'string' ||
        username.trim().length < 3 ||
        username.trim().length > 50
    ) {

        return res.status(400).json({
            error:
                'Username must be between 3 and 50 characters long'
        });
    }


    // --------------------------------------------------------
    // Validate password type
    // --------------------------------------------------------

    if (typeof password !== 'string') {

        return res.status(400).json({
            error:
                'Password is required'
        });
    }


    // --------------------------------------------------------
    // Validate password using central password policy
    // --------------------------------------------------------

    const passwordErrors =
        validatePassword(password);


    if (passwordErrors.length > 0) {

        return res.status(400).json({
            error:
                'Password does not meet the security requirements',

            details:
            passwordErrors
        });
    }


    // --------------------------------------------------------
    // Database transaction
    // --------------------------------------------------------

    const client = await pool.connect();


    try {

        await client.query('BEGIN');


        // Hash the password before storing it.
        const hashedPassword =
            await bcrypt.hash(password, 10);


        // ----------------------------------------------------
        // Create user
        // ----------------------------------------------------

        const userResult = await client.query(
            `INSERT INTO users
                 (username, password)
             VALUES
                 ($1, $2)
             RETURNING id, username`,
            [
                username.trim(),
                hashedPassword
            ]
        );


        const user =
            userResult.rows[0];


        // ----------------------------------------------------
        // Automatically create bank account
        // ----------------------------------------------------

        const accountResult = await client.query(
            `INSERT INTO accounts
                 (user_id, account_number, balance)
             VALUES
                 ($1, $2, $3)
                 RETURNING id, account_number, balance`,
            [
                user.id,
                `DE${Date.now()}`,
                0
            ]
        );


        await client.query('COMMIT');


        res.status(201).json({

            message:
                'User registered successfully',

            user:
            user,

            account:
                accountResult.rows[0]
        });


    } catch (error) {

        await client.query('ROLLBACK');

        console.error(error);


        // PostgreSQL unique violation.
        if (error.code === '23505') {

            return res.status(409).json({
                error:
                    'Username already exists'
            });
        }


        res.status(500).json({
            error:
                'Registration failed'
        });


    } finally {

        client.release();
    }
});

// ============================================================
// FORGOT-PASSWORD
// ============================================================

// Creates a password-reset token.
// The actual reset page is /reset-password.

app.post('/forgot-password', async (req, res) => {

    const {
        email
    } = req.body;


    // --------------------------------------------------------
    // Validate email input
    // --------------------------------------------------------

    if (
        typeof email !== 'string' ||
        email.trim().length === 0
    ) {

        return res.status(400).json({
            error:
                'Invalid email address'
        });
    }


    try {

        const result = await pool.query(
            `SELECT id
             FROM users
             WHERE email = $1`,
            [
                email.trim().toLowerCase()
            ]
        );


        /*
         * Intentionally return the same response
         * whether the email exists or not.
         *
         * This prevents account enumeration.
         */

        if (result.rows.length === 0) {

            return res.json({
                message:
                    'If an account with this email address exists, a reset link has been created.'
            });
        }


        const userId =
            result.rows[0].id;


        // ----------------------------------------------------
        // Generate cryptographically secure reset token
        // ----------------------------------------------------

        const resetToken =
            crypto.randomBytes(32).toString('hex');


        // ----------------------------------------------------
        // Store only a hash of the token
        // ----------------------------------------------------

        const tokenHash =
            crypto
                .createHash('sha256')
                .update(resetToken)
                .digest('hex');


        // ----------------------------------------------------
        // Delete old unused reset tokens
        // ----------------------------------------------------

        await pool.query(
            `DELETE FROM password_reset_tokens
             WHERE user_id = $1
               AND used_at IS NULL`,
            [
                userId
            ]
        );


        // ----------------------------------------------------
        // Store new reset token
        // Valid for 15 minutes
        // ----------------------------------------------------

        await pool.query(
            `INSERT INTO password_reset_tokens
                (user_id, token_hash, expires_at)
             VALUES
                ($1, $2, NOW() + INTERVAL '15 minutes')`,
            [
                userId,
                tokenHash
            ]
        );


        // ----------------------------------------------------
        // Local development reset URL
        // ----------------------------------------------------

        const resetUrl =
            `http://localhost:3000/reset-password?token=${resetToken}`;


        console.log(
            'PASSWORT-RESET-LINK:',
            resetUrl
        );


        return res.json({
            message:
                'If an account with this email address exists, a reset link has been created.'
        });


    } catch (error) {

        console.error(
            'Password reset error:',
            error
        );


        return res.status(500).json({
            error:
                'Password reset could not be processed'
        });
    }
});

// ============================================================
// RESET-PASSWORD
// ============================================================

// Actually changes the password using the reset token.

app.post('/reset-password', async (req, res) => {

    const {
        token,
        newPassword
    } = req.body;


    // --------------------------------------------------------
    // Validate reset token
    // --------------------------------------------------------

    if (
        typeof token !== 'string' ||
        token.length === 0
    ) {

        return res.status(400).json({
            error:
                'Invalid reset data'
        });
    }


    // --------------------------------------------------------
    // Validate password type
    // --------------------------------------------------------

    if (typeof newPassword !== 'string') {

        return res.status(400).json({
            error:
                'Password is required'
        });
    }


    // --------------------------------------------------------
    // Validate new password using the SAME policy
    // as registration.
    // --------------------------------------------------------

    const passwordErrors =
        validatePassword(newPassword);


    if (passwordErrors.length > 0) {

        return res.status(400).json({

            error:
                'Password does not meet the security requirements',

            details:
            passwordErrors
        });
    }


    try {

        // ----------------------------------------------------
        // Hash supplied reset token
        // ----------------------------------------------------

        const tokenHash =
            crypto
                .createHash('sha256')
                .update(token)
                .digest('hex');


        // ----------------------------------------------------
        // Find valid reset token
        // ----------------------------------------------------

        const tokenResult =
            await pool.query(
                `SELECT
                     id,
                     user_id
                 FROM password_reset_tokens
                 WHERE token_hash = $1
                   AND used_at IS NULL
                   AND expires_at > NOW()`,
                [
                    tokenHash
                ]
            );


        // Do not reveal why the token is invalid.
        if (
            tokenResult.rows.length === 0
        ) {

            return res.status(400).json({
                error:
                    'The password reset link is invalid or expired.'
            });
        }


        const resetToken =
            tokenResult.rows[0];


        // ----------------------------------------------------
        // Hash new password
        // ----------------------------------------------------

        const hashedPassword =
            await bcrypt.hash(
                newPassword,
                10
            );


        // ----------------------------------------------------
        // Update password and invalidate token
        // ----------------------------------------------------

        const client =
            await pool.connect();


        try {

            await client.query('BEGIN');


            // Update password.
            await client.query(
                `UPDATE users
                 SET password = $1
                 WHERE id = $2`,
                [
                    hashedPassword,
                    resetToken.user_id
                ]
            );


            // Mark reset token as used.
            await client.query(
                `UPDATE password_reset_tokens
                 SET used_at = NOW()
                 WHERE id = $1`,
                [
                    resetToken.id
                ]
            );


            await client.query('COMMIT');


            return res.json({
                message:
                    'Password was changed successfully.'
            });


        } catch (error) {

            await client.query('ROLLBACK');

            throw error;


        } finally {

            client.release();
        }


    } catch (error) {

        console.error(
            'Password reset error:',
            error
        );


        return res.status(500).json({
            error:
                'Password could not be reset'
        });
    }
});

// ============================================================
// LOGIN
// ============================================================

app.post('/login', async (req, res) => {

    const {
        username,
        password
    } = req.body;


    try {

        const result = await pool.query(
            `SELECT
                 id,
                 username,
                 password
             FROM users
             WHERE username = $1`,
            [
                username
            ]
        );


        // Do not reveal whether the username exists.
        if (result.rows.length === 0) {

            return res.status(401).json({
                error:
                    'Invalid login credentials'
            });
        }


        const user =
            result.rows[0];


        const passwordMatch =
            await bcrypt.compare(
                password,
                user.password
            );


        if (!passwordMatch) {

            return res.status(401).json({
                error:
                    'Invalid login credentials'
            });
        }


        // Create JWT containing authenticated user's ID.
        const token =
            jwt.sign(
                {
                    userId:
                    user.id,

                    username:
                    user.username
                },

                process.env.JWT_SECRET,

                {
                    expiresIn:
                        '1h'
                }
            );


        res.json({

            message:
                'Login successful',

            token
        });


    } catch (error) {

        console.error(error);

        res.status(500).json({
            error:
                'Login failed'
        });
    }
});

// ============================================================
// TRANSFERS
// ============================================================

app.post('/transactions', authenticateToken, async (req, res) => {

    /*
     * IMPORTANT:
     * from_account is intentionally NOT accepted from the client.
     *
     * The server determines the sender account from the
     * authenticated user's ID contained in the verified JWT.
     */

    const {
        to_account,
        amount
    } = req.body;


    // --------------------------------------------------------
    // Validate target account
    // --------------------------------------------------------

    if (
        !Number.isInteger(to_account) ||
        to_account <= 0
    ) {

        return res.status(400).json({
            error:
                'Invalid target account'
        });
    }


    // --------------------------------------------------------
    // Validate amount
    // --------------------------------------------------------

    if (
        typeof amount !== 'number' ||
        !Number.isFinite(amount) ||
        amount <= 0
    ) {

        return res.status(400).json({
            error:
                'Amount must be greater than 0'
        });
    }


    // Only allow two decimal places.
    if (
        Math.round(amount * 100) !== amount * 100
    ) {

        return res.status(400).json({
            error:
                'Amount may have at most two decimal places'
        });
    }


    try {

        // ----------------------------------------------------
        // Determine sender account from authenticated user
        // ----------------------------------------------------

        const ownAccountResult =
            await pool.query(
                `SELECT id
                 FROM accounts
                 WHERE user_id = $1`,
                [
                    req.user.userId
                ]
            );


        if (
            ownAccountResult.rows.length === 0
        ) {

            return res.status(404).json({
                error:
                    'No own account found'
            });
        }


        // The sender account is determined by the server.
        const fromAccount =
            ownAccountResult.rows[0].id;


        // ----------------------------------------------------
        // Check whether target account exists
        // ----------------------------------------------------

        const targetAccountCheck =
            await pool.query(
                `SELECT id
                 FROM accounts
                 WHERE id = $1`,
                [
                    to_account
                ]
            );


        if (
            targetAccountCheck.rows.length === 0
        ) {

            return res.status(404).json({
                error:
                    'Target account not found'
            });
        }


        // ----------------------------------------------------
        // Prevent transfers to the same account
        // ----------------------------------------------------

        if (
            fromAccount === to_account
        ) {

            return res.status(400).json({
                error:
                    'Transfers to the same account are not allowed'
            });
        }


        // ----------------------------------------------------
        // Start database transaction
        // ----------------------------------------------------

        const client =
            await pool.connect();


        try {

            await client.query('BEGIN');


            // ------------------------------------------------
            // Debit sender
            // ------------------------------------------------

            const debitResult =
                await client.query(
                    `UPDATE accounts
                     SET balance = balance - $1
                     WHERE id = $2
                       AND balance >= $1
                         RETURNING id, balance`,
                    [
                        amount,
                        fromAccount
                    ]
                );


            // No row means insufficient funds.
            if (
                debitResult.rows.length === 0
            ) {

                await client.query(
                    'ROLLBACK'
                );


                return res.status(400).json({
                    error:
                        'Insufficient funds'
                });
            }


            // ------------------------------------------------
            // Credit receiver
            // ------------------------------------------------

            await client.query(
                `UPDATE accounts
                 SET balance = balance + $1
                 WHERE id = $2`,
                [
                    amount,
                    to_account
                ]
            );


            // ------------------------------------------------
            // Record transaction
            // ------------------------------------------------

            await client.query(
                `INSERT INTO transactions
                     (from_account, to_account, amount)
                 VALUES
                     ($1, $2, $3)`,
                [
                    fromAccount,
                    to_account,
                    amount
                ]
            );


            // ------------------------------------------------
            // Commit
            // ------------------------------------------------

            await client.query(
                'COMMIT'
            );


            res.status(201).json({
                message:
                    'Transfer completed successfully'
            });


        } catch (error) {

            await client.query(
                'ROLLBACK'
            );

            console.error(error);


            res.status(500).json({
                error:
                    'Transfer failed'
            });


        } finally {

            client.release();
        }


    } catch (error) {

        console.error(error);

        res.status(500).json({
            error:
                'Transfer failed'
        });
    }
});

// ============================================================
// DATABASE CONNECTION TEST
// ============================================================

pool.query(
    'SELECT NOW()',
    (err, result) => {

        if (err) {

            console.error(
                'Database connection failed:',
                err
            );

        } else {

            console.log(
                'Database connection successful!'
            );

            console.log(
                result.rows
            );
        }
    }
);

// ============================================================
// STARTUP LOGGING
// ============================================================

console.log(
    'Users route loaded'
);

console.log(
    'Accounts route loaded'
);

console.log(
    'Transactions route loaded'
);

console.log(
    'Password policy loaded'
);

// ============================================================
// SERVER START
// ============================================================

// Only start the server when this file is executed directly.
// When Jest imports the file, no separate server is started.

if (require.main === module) {

    app.listen(
        PORT,
        () => {

            console.log(
                `MiniBank backend is running on http://localhost:${PORT}`
            );
        }
    );
}

// ============================================================
// EXPORTS
// ============================================================

module.exports = {
    app,
    pool
};