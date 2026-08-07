require('dotenv').config({
    path: process.env.NODE_ENV === 'test'
        ? '.env.test'
        : '.env'
});

const express = require('express');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT
});

const app = express();
const PORT = 3000;


app.use(express.static('static'));
app.use(express.json());


const authenticateToken = (req, res, next) => {

    const authHeader = req.headers['authorization'];

    const token =
        authHeader && authHeader.split(' ')[1];


    if (!token) {

        return res.status(401).json({
            error: 'Kein Token vorhanden'
        });
    }


    jwt.verify(
        token,
        process.env.JWT_SECRET,
        (error, user) => {

            if (error) {

                return res.status(403).json({
                    error: 'Ungültiger Token'
                });
            }


            req.user = user;

            next();
        }
    );
};


app.get('/', (req, res) => {

    res.sendFile('login.html', {
        root: 'templates'
    });
});


app.get('/dashboard.html', authenticateToken, (req, res) => {

    res.sendFile('dashboard.html', {
        root: 'templates'
    });
});


app.get('/register', authenticateToken, (req, res) => {

    res.sendFile('register.html', {
        root: 'templates'
    });
});


app.get('/users', authenticateToken, async (req, res) => {

    try {

        const result = await pool.query(
            'SELECT id, username FROM users WHERE id = $1',
            [req.user.userId]
        );

        res.json(result.rows);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            error: 'Fehler beim Abrufen der Benutzer'
        });
    }
});


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
            error: 'Fehler beim Abrufen der Konten'
        });
    }
});


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
            error: 'Fehler beim Abrufen der Transaktionen'
        });
    }
});


app.post('/register', async (req, res) => {

    const { username, password } = req.body;


    if (
        typeof username !== 'string' ||
        username.trim().length < 3 ||
        username.trim().length > 50
    ) {

        return res.status(400).json({
            error:
                'Benutzername muss zwischen 3 und 50 Zeichen lang sein'
        });
    }


    if (
        typeof password !== 'string' ||
        password.length < 8
    ) {

        return res.status(400).json({
            error:
                'Passwort muss mindestens 8 Zeichen lang sein'
        });
    }


    const client = await pool.connect();


    try {

        await client.query('BEGIN');


        const hashedPassword =
            await bcrypt.hash(password, 10);


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


        const user = userResult.rows[0];


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
                'Benutzer erfolgreich registriert',

            user: user,

            account:
                accountResult.rows[0]
        });


    } catch (error) {

        await client.query('ROLLBACK');

        console.error(error);


        if (error.code === '23505') {

            return res.status(409).json({
                error:
                    'Benutzername bereits vergeben'
            });
        }


        res.status(500).json({
            error:
                'Registrierung fehlgeschlagen'
        });


    } finally {

        client.release();
    }
});


app.post('/login', async (req, res) => {

    const { username, password } = req.body;


    try {

        const result = await pool.query(
            `SELECT
id,
    username,
    password
FROM users
WHERE username = $1`,
            [username]
        );


        if (result.rows.length === 0) {

            return res.status(401).json({
                error:
                    'Ungültige Anmeldedaten'
            });
        }


        const user = result.rows[0];


        const passwordMatch =
            await bcrypt.compare(
                password,
                user.password
            );


        if (!passwordMatch) {

            return res.status(401).json({
                error:
                    'Ungültige Anmeldedaten'
            });
        }


        const token = jwt.sign(
            {
                userId: user.id,
                username: user.username
            },
            process.env.JWT_SECRET,
            {
                expiresIn: '1h'
            }
        );


        res.json({

            message:
                'Login erfolgreich',

            token
        });


    } catch (error) {

        console.error(error);

        res.status(500).json({
            error:
                'Login fehlgeschlagen'
        });
    }
});


app.post('/transactions', authenticateToken, async (req, res) => {

    const {
        from_account,
        to_account,
        amount
    } = req.body;


        if (
            !Number.isInteger(to_account) ||
            to_account <= 0
        ) {

            return res.status(400).json({
                error:
                    'Ungültiges Zielkonto'
            });
        }

    if (
        typeof amount !== 'number' ||
        !Number.isFinite(amount) ||
        amount <= 0
    ) {
        return res.status(400).json({
            error: 'Der Betrag muss größer als 0 sein'
        });
    }

    if (Math.round(amount * 100) !== amount * 100) {
        return res.status(400).json({
            error:
                'Der Betrag darf maximal zwei Nachkommastellen haben'
        });
    }

        try {

            if (!Number.isInteger(from_account) || from_account <= 0) {
                return res.status(400).json({
                    error: 'Ungültiges Absenderkonto'
                });
            }

            const accountOwnerResult = await pool.query(
                `SELECT id
                 FROM accounts
                 WHERE id = $1
                   AND user_id = $2`,
                [from_account, req.user.userId]
            );

            if (accountOwnerResult.rows.length === 0) {
                return res.status(403).json({
                    error: 'Du darfst dieses Konto nicht verwenden'
                });
            }

            const ownAccountResult =
                await pool.query(
                    `SELECT id
FROM accounts
WHERE user_id = $1`,
                    [req.user.userId]
                );


            if (
                ownAccountResult.rows.length === 0
            ) {

                return res.status(404).json({
                    error:
                        'Kein eigenes Konto gefunden'
                });
            }


            const fromAccount = from_account;


            const targetAccountCheck =
                await pool.query(
                    `SELECT id
FROM accounts
WHERE id = $1`,
                    [to_account]
                );


            if (
                targetAccountCheck.rows.length === 0
            ) {

                return res.status(404).json({
                    error:
                        'Zielkonto nicht gefunden'
                });
            }


            if (fromAccount === to_account) {

                return res.status(400).json({
                    error:
                        'Eine Überweisung auf das eigene Konto ist nicht möglich'
                });
            }


            const client =
                await pool.connect();


            try {

                await client.query('BEGIN');


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


                if (
                    debitResult.rows.length === 0
                ) {

                    await client.query(
                        'ROLLBACK'
                    );


                    return res.status(400).json({
                        error:
                            'Nicht genügend Guthaben'
                    });
                }


                await client.query(
                    `UPDATE accounts
SET balance = balance + $1
WHERE id = $2`,
                    [
                        amount,
                        to_account
                    ]
                );


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


                await client.query(
                    'COMMIT'
                );


                res.status(201).json({
                    message:
                        'Überweisung erfolgreich'
                });


            } catch (error) {

                await client.query(
                    'ROLLBACK'
                );

                console.error(error);


                res.status(500).json({
                    error:
                        'Überweisung fehlgeschlagen'
                });


            } finally {

                client.release();
            }


        } catch (error) {

            console.error(error);

            res.status(500).json({
                error:
                    'Überweisung fehlgeschlagen'
            });
        }
    }
);


pool.query(
    'SELECT NOW()',
    (err, result) => {

        if (err) {

            console.error(
                'Datenbankverbindung fehlgeschlagen:',
                err
            );

        } else {

            console.log(
                'Datenbankverbindung erfolgreich!'
            );

            console.log(
                result.rows
            );
        }
    }
);


console.log(
    'Users-Route wurde geladen'
);

console.log(
    'Accounts-Route wurde geladen'
);

console.log(
    'Transactions-Route wurde geladen'
);


if (require.main === module) {

    app.listen(
        PORT,
        () => {

            console.log(
                `MiniBank Backend läuft auf http://localhost:${PORT}`
    );
}
);
}


module.exports = {
    app,
    pool
};