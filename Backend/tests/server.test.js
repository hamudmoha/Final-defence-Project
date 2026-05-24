const request = require('supertest');
const app = require('../src/app');

describe('Server Initialization', () => {
  it('should respond to the root route', async () => {
    const res = await request(app).get('/');
    expect(res.statusCode).toEqual(200);
    expect(res.text).toBe('EthioCamp API is running...');
  });
});
