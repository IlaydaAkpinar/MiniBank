const request = require('supertest');
const { app, pool } = require('../backend/src/server');

describe('Transactions - Authorization', () => {

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

    test('Alice darf nicht von Dianas Konto überweisen', async () => {
        const response = await request(app)
            .post('/transactions')
            .set('Authorization', `Bearer ${aliceToken}`)
            .send({
                from_account: 3,
                to_account: 1,
                amount: 10
            });

        expect(response.statusCode).toBe(403);
        expect(response.body.error).toBe(
            'Du darfst dieses Konto nicht verwenden'
        );
    });

    afterAll(async () => {
        await pool.end();
    });

});