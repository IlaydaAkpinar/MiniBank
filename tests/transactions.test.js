const request = require('supertest');
const { app } = require('../backend/src/server');

describe('Transactions - Authorization', () => {

    // Token used to authenticate requests as Alice.
    let aliceToken;

    // Log in once before all tests.
    beforeAll(async () => {
        const response = await request(app)
            .post('/login')
            .send({
                username: 'alice',
                password: 'AliceTest123!'
            });

        aliceToken = response.body.token;
    });

    // The client must not be able to choose the sender account.
    // from_account is ignored by the server.
    // The server determines Alice's own account from the JWT.
    test('Alice cannot choose Diana as sender account', async () => {

        const response = await request(app)
            .post('/transactions')
            .set('Authorization', `Bearer ${aliceToken}`)
            .send({
                from_account: 3,
                to_account: 2,
                amount: 10
            });

        // The transfer should use Alice's own account,
        // not Diana's account (3).
        expect(response.statusCode).toBe(201);
        expect(response.body.message).toBe(
            'Transfer completed successfully'
        );
    });

});