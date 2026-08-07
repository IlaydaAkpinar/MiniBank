const request = require('supertest');
const { app, pool } = require('../backend/src/server');

describe('Transactions - Successful transfer', () => {

    let aliceToken;

    beforeAll(async () => {
        const response = await request(app)
            .post('/login')
            .send({
                username: 'alice',
                password: 'AliceTest123!'
            });

        aliceToken = response.body.token;
    });

    test('Alice kann erfolgreich Geld überweisen', async () => {

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
        expect(response.body.message).toBe('Überweisung erfolgreich');

        const after = await pool.query(
            'SELECT balance FROM accounts WHERE id IN (1, 2) ORDER BY id'
        );

        const aliceAfter = Number(after.rows[0].balance);
        const bobAfter = Number(after.rows[1].balance);

        expect(aliceAfter).toBe(aliceBefore - 10);
        expect(bobAfter).toBe(bobBefore + 10);
    });

    afterAll(async () => {
        await pool.end();
    });

});
