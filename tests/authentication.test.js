const request = require('supertest');
const { app } = require('../backend/src/server');

describe('Authentication', () => {

    // No Authorization header at all — the most basic unauthenticated case
    test('rejects access without a token', async () => {
        const response = await request(app)
            .get('/accounts');

        expect(response.statusCode).toBe(401);
        expect(response.body.error).toBe('Missing token');
    });

    // A malformed/non-existent token should be rejected with 403,
    // distinct from the 401 for a completely missing token
    test('rejects access with an invalid token', async () => {
        const response = await request(app)
            .get('/accounts')
            .set('Authorization', 'Bearer invalid-token');

        expect(response.statusCode).toBe(403);
        expect(response.body.error).toBe('Invalid token');
    });

    // End-to-end happy path: log in to obtain a real token,
    // then use it to access a protected route
    test('allows access with a valid token', async () => {

        const loginResponse = await request(app)
            .post('/login')
            .send({
                username: 'alice',
                password: 'AliceTest123!'
            });

        expect(loginResponse.statusCode).toBe(200);

        const token = loginResponse.body.token;

        const response = await request(app)
            .get('/accounts')
            .set('Authorization', `Bearer ${token}`);

        expect(response.statusCode).toBe(200);
        // Confirm the endpoint returns a list of accounts, not a single object
        expect(Array.isArray(response.body)).toBe(true);
    });

});