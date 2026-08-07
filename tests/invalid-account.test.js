const request = require('supertest');
const { app, pool } = require('../backend/src/server');

describe('Transactions - Invalid account', () => {

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

    // Transferring to an account number that doesn't exist in the DB
    // should fail with 404, rather than silently succeeding or
    // throwing an unhandled server error
    test('rejects transfers to a non-existent account', async () => {
        const response = await request(app)
            .post('/transactions')
            .set('Authorization', `Bearer ${aliceToken}`)
            .send({
                from_account: 1,
                to_account: 9999,
                amount: 10
            });

        expect(response.statusCode).toBe(404);
        expect(response.body.error).toBe(
            'Target account not found'
        );
    });

    // Close the DB pool after all tests so Jest doesn't hang
    // waiting on open connections
    afterAll(async () => {
        await pool.end();
    });

});