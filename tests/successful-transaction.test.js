const request = require('supertest');
const { app, pool } = require('../backend/src/server');

describe('Transactions - Successful transfer', () => {

    // Token used to authenticate requests as 'alice' throughout this suite
    let aliceToken;

    // Log in once before all tests to obtain a valid auth token,
    // avoiding a separate login call in every individual test
    beforeAll(async () => {
        const response = await request(app)
            .post('/login')
            .send({
                username: 'alice',
                password: 'AliceTest123!'
            });

        aliceToken = response.body.token;
    });

    test('Alice can transfer money successfully', async () => {

        // Capture both balances directly from the DB before the transfer,
        // so we can assert the exact expected change rather than
        // hardcoding absolute balance values (which could drift between runs)
        const before = await pool.query(
            'SELECT balance FROM accounts WHERE id IN (1, 2) ORDER BY id'
        );

        const aliceBefore = Number(before.rows[0].balance);
        const bobBefore = Number(before.rows[1].balance);

        const response = await request(app)
            .post('/transactions')
            .set('Authorization', `Bearer ${aliceToken}`)
            .send({
                from_account: 1,
                to_account: 2,
                amount: 10
            });

        expect(response.statusCode).toBe(201);
        expect(response.body.message).toBe('Transfer completed successfully');

        // Re-fetch balances after the transfer to verify the amount
        // was correctly debited from Alice and credited to Bob
        const after = await pool.query(
            'SELECT balance FROM accounts WHERE id IN (1, 2) ORDER BY id'
        );

        const aliceAfter = Number(after.rows[0].balance);
        const bobAfter = Number(after.rows[1].balance);

        expect(aliceAfter).toBe(aliceBefore - 10);
        expect(bobAfter).toBe(bobBefore + 10);
    });

});