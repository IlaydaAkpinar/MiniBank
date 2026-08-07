const request = require('supertest');
const { app, pool } = require('../backend/src/server');

describe('Transactions - Amount validation', () => {

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

    test('Überweisung mit negativem Betrag wird abgelehnt', async () => {
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
            'Der Betrag muss größer als 0 sein'
        );
    });

    test('Überweisung mit Betrag 0 wird abgelehnt', async () => {
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
            'Der Betrag muss größer als 0 sein'
        );
    });

    test('Überweisung mit ungültigem Betrag wird abgelehnt', async () => {
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
            'Der Betrag muss größer als 0 sein'
        );
    });

    afterAll(async () => {
        await pool.end();
    });

});