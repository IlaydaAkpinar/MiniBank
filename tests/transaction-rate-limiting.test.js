const request = require('supertest');
const { app } = require('../backend/src/server');

describe('Transaction rate limiting', () => {

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

    test('blocks excessive transaction requests', async () => {

        // Send the maximum number of requests allowed
        // by the transaction rate limiter.
        for (let i = 0; i < 30; i++) {

            const response = await request(app)
                .post('/transactions')
                .set(
                    'Authorization',
                    `Bearer ${aliceToken}`
                )
                .send({
                    to_account: 2,
                    amount: 0
                });

            // The request reaches the transaction endpoint,
            // but is rejected by the amount validation.
            expect(response.statusCode).toBe(400);
            expect(response.body.error).toBe(
                'Amount must be greater than 0'
            );
        }

        // The next request exceeds the configured limit
        // of 30 requests per IP within 15 minutes.
        const response = await request(app)
            .post('/transactions')
            .set(
                'Authorization',
                `Bearer ${aliceToken}`
            )
            .send({
                to_account: 2,
                amount: 0
            });

        expect(response.statusCode).toBe(429);
        expect(response.body.error).toBe(
            'Too many transaction requests. Please try again later.'
        );
    });

});