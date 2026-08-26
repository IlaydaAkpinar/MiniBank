const request = require('supertest');
const { app } = require('../backend/src/server');

describe('Transactions - Balance', () => {

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

    // A transfer exceeding the account's available balance must be
    // rejected — this guards against overdrafts / negative balances
    test('rejects transfers when the balance is too low', async () => {
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
            'Insufficient funds'
        );
    });


});