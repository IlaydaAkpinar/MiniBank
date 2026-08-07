const request = require('supertest');
const { app, pool } = require('../backend/src/server');

describe('Authentication', () => {

    test('Zugriff ohne Token wird abgelehnt', async () => {
        const response = await request(app)
            .get('/accounts');

        expect(response.statusCode).toBe(401);
        expect(response.body.error).toBe('Kein Token vorhanden');
    });

    test('Zugriff mit ungültigem Token wird abgelehnt', async () => {
        const response = await request(app)
            .get('/accounts')
            .set('Authorization', 'Bearer ungültiger-token');

        expect(response.statusCode).toBe(403);
        expect(response.body.error).toBe('Ungültiger Token');
    });

    test('Zugriff mit gültigem Token wird erlaubt', async () => {

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
        expect(Array.isArray(response.body)).toBe(true);
    });

    afterAll(async () => {
        await pool.end();
    });

});