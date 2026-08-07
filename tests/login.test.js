const request = require('supertest');
const { app, pool } = require('../backend/src/server');

describe('Login', () => {

    test('Login mit falschem Passwort wird abgelehnt', async () => {
        const response = await request(app)
            .post('/login')
            .send({
                username: 'alice',
                password: 'falschesPasswort'
            });

        expect(response.statusCode).toBe(401);
        expect(response.body.error).toBe('Ungültige Anmeldedaten');
    });

    afterAll(async () => {
        await pool.end();
    });


    test('Login mit korrektem Passwort wird akzeptiert', async () => {
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