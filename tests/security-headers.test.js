const request = require('supertest');
const { app } = require('../backend/src/server');

describe('Security Headers', () => {

    test('sets security headers on responses', async () => {

        const response = await request(app)
            .get('/');

        expect(response.headers['x-content-type-options'])
            .toBe('nosniff');

        expect(response.headers['x-frame-options'])
            .toBe('SAMEORIGIN');

        expect(response.headers['referrer-policy'])
            .toBe('no-referrer');

        expect(response.headers['content-security-policy'])
            .toBeDefined();
    });
});