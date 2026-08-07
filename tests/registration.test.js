const request = require('supertest');
const { app, pool } = require('../backend/src/server');

describe('Registration', () => {

    test('Gültige Registrierung wird akzeptiert', async () => {
        const username = `testuser_${Date.now()}`;

        const response = await request(app)
            .post('/register')
            .send({
                username,
                password: 'TestPassword123!'
            });

        expect(response.statusCode).toBe(201);
        expect(response.body.message).toBe(
            'Benutzer erfolgreich registriert'
        );
        expect(response.body.user.username).toBe(username);
        expect(response.body.account.balance).toBe('0.00');
    });

    test('Zu kurzer Benutzername wird abgelehnt', async () => {
        const response = await request(app)
            .post('/register')
            .send({
                username: 'ab',
                password: 'TestPassword123!'
            });

        expect(response.statusCode).toBe(400);
        expect(response.body.error).toBe(
            'Benutzername muss zwischen 3 und 50 Zeichen lang sein'
        );
    });

    test('Zu kurzes Passwort wird abgelehnt', async () => {
        const response = await request(app)
            .post('/register')
            .send({
                username: 'validuser',
                password: '123'
            });

        expect(response.statusCode).toBe(400);
        expect(response.body.error).toBe(
            'Passwort muss mindestens 8 Zeichen lang sein'
        );
    });

    test('Bereits vorhandener Benutzername wird abgelehnt', async () => {
        const response = await request(app)
            .post('/register')
            .send({
                username: 'alice',
                password: 'AliceTest123!'
            });

        expect(response.statusCode).toBe(409);
        expect(response.body.error).toBe(
            'Benutzername bereits vergeben'
        );
    });

    afterAll(async () => {
        await pool.end();
    });

});