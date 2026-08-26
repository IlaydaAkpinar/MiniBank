const request = require('supertest');
const { app } = require('../backend/src/server');

describe('Login', () => {

    // Wrong password for an existing user should be rejected generically
    // (same error as e.g. unknown username, to avoid leaking which part was wrong)
    test('rejects login with the wrong password', async () => {
        const response = await request(app)
            .post('/login')
            .send({
                username: 'alice',
                password: 'wrongPassword'
            });

        expect(response.statusCode).toBe(401);
        expect(response.body.error).toBe('Invalid login credentials');
    });

    // Correct credentials should return 200 and a usable auth token
    test('accepts login with the correct password', async () => {
        const response = await request(app)
            .post('/login')
            .send({
                username: 'alice',
                password: 'AliceTest123!'
            });

        expect(response.statusCode).toBe(200);
        expect(response.body.token).toBeDefined();
    });

});