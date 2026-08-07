const request = require('supertest');
const { app, pool } = require('../backend/src/server');

describe('Transactions - Invalid account', () => {

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

    test('Überweisung auf ein nicht existentes Konto wird abgelehnt', async () => {
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
            'Zielkonto nicht gefunden'
        );
    });

    afterAll(async () => {
        await pool.end();
    });

});