const request = require('supertest');
const { app } = require('../backend/src/server');

describe('Transactions - Amount validation', () => {

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

    // Negative amounts should never be accepted, since they'd effectively
    // reverse the direction of the transfer
    test('rejects transfers with a negative amount', async () => {
        const response = await request(app)
            .post('/transactions')
            .set('Authorization', `Bearer ${aliceToken}`)
            .send({
                from_account: 1,
                to_account: 2,
                amount: -10
            });

        expect(response.statusCode).toBe(400);
        expect(response.body.error).toBe(
            'Amount must be greater than 0'
        );
    });

    // A zero-amount transfer is meaningless and should be rejected
    // just like a negative one
    test('rejects transfers with amount 0', async () => {
        const response = await request(app)
            .post('/transactions')
            .set('Authorization', `Bearer ${aliceToken}`)
            .send({
                from_account: 1,
                to_account: 2,
                amount: 0
            });

        expect(response.statusCode).toBe(400);
        expect(response.body.error).toBe(
            'Amount must be greater than 0'
        );
    });

    // Guard against type confusion: a stringified number should not
    // bypass numeric validation (e.g. via loose type coercion)
    test('rejects transfers with an invalid amount type', async () => {
        const response = await request(app)
            .post('/transactions')
            .set('Authorization', `Bearer ${aliceToken}`)
            .send({
                from_account: 1,
                to_account: 2,
                amount: "10"
            });

        expect(response.statusCode).toBe(400);
        expect(response.body.error).toBe(
            'Amount must be greater than 0'
        );
    });

});