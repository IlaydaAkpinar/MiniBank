const request = require('supertest');
const { app, pool } = require('../backend/src/server');

describe('Transactions - Balance', () => {

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

    test('Überweisung bei zu wenig Guthaben wird abgelehnt', async () => {
        const response = await request(app)
            .post('/transactions')
            .set('Authorization', `Bearer ${aliceToken}`)
            .send({
                from_account: 1,
                to_account: 2,
                amount: 999999
            });

        expect(response.statusCode).toBe(400);
        expect(response.body.error).toBe(
            'Nicht genügend Guthaben'
        );
    });

    afterAll(async () => {
        await pool.end();
    });

});