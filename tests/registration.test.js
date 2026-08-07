const request = require('supertest');
const { app, pool } = require('../backend/src/server');

describe('Registration', () => {

    test('serves the registration page without a token', async () => {
        const response = await request(app)
            .get('/register');

        expect(response.statusCode).toBe(200);
        expect(response.text).toContain('Open an account');
    });

    // Happy path: a unique username (timestamped to avoid collisions
    // across test runs) should register successfully with a fresh,
    // zero-balance account
    test('accepts valid registration', async () => {
        const username = `testuser_${Date.now()}`;

        const response = await request(app)
            .post('/register')
            .send({
                username,
                password: 'TestPassword123!'
            });

        expect(response.statusCode).toBe(201);
        expect(response.body.message).toBe(
            'User registered successfully'
        );
        expect(response.body.user.username).toBe(username);
        expect(response.body.account.balance).toBe('0.00');
    });

    // Username length lower bound (matches the 3-char minlength in the form)
    test('rejects usernames that are too short', async () => {
        const response = await request(app)
            .post('/register')
            .send({
                username: 'ab',
                password: 'TestPassword123!'
            });

        expect(response.statusCode).toBe(400);
        expect(response.body.error).toBe(
            'Username must be between 3 and 50 characters long'
        );
    });

    // Password length lower bound (matches the 8-char minlength in the form)
    test('rejects passwords that are too short', async () => {
        const response = await request(app)
            .post('/register')
            .send({
                username: 'validuser',
                password: '123'
            });

        expect(response.statusCode).toBe(400);
        expect(response.body.error).toBe(
            'Password must be at least 8 characters long'
        );
    });

    // Usernames must be unique — 'alice' is assumed to be a seeded/
    // pre-existing test user in the database
    test('rejects usernames that already exist', async () => {
        const response = await request(app)
            .post('/register')
            .send({
                username: 'alice',
                password: 'AliceTest123!'
            });

        expect(response.statusCode).toBe(409);
        expect(response.body.error).toBe(
            'Username already exists'
        );
    });

    // Close the DB pool after all tests so Jest doesn't hang
    // waiting on open connections
    afterAll(async () => {
        await pool.end();
    });

});
