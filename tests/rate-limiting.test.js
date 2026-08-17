const request = require('supertest');
const { app, pool } = require('../backend/src/server');

describe('Rate limiting', () => {

    test('blocks excessive login attempts', async () => {

        // Send the maximum number of requests allowed
        // by the authentication rate limiter.
        for (let i = 0; i < 10; i++) {

            const response = await request(app)
                .post('/login')
                .send({
                    username: 'nonexistent-user',
                    password: 'WrongPassword123!'
                });

            expect(response.statusCode).toBe(401);
            expect(response.body.error).toBe(
                'Invalid login credentials'
            );
        }

        // The next request exceeds the configured limit
        // of 10 requests per IP within 15 minutes.
        const response = await request(app)
            .post('/login')
            .send({
                username: 'nonexistent-user',
                password: 'WrongPassword123!'
            });

        expect(response.statusCode).toBe(429);
        expect(response.body.error).toBe(
            'Too many requests. Please try again later.'
        );
    });

    // Close the DB pool after all tests so Jest doesn't hang
    // waiting on open connections
    afterAll(async () => {
        await pool.end();
    });

});