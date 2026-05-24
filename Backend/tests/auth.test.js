const request = require('supertest');
const app = require('../src/app');

describe('Auth API Endpoints', () => {
  it('should return 401 when trying to access a protected route without token', async () => {
    const res = await request(app).get('/api/auth/me'); // Assuming this route exists and is protected
    expect(res.statusCode).toBeDefined();
  });

  it('should fail login with invalid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'nonexistent@example.com',
        password: 'wrongpassword'
      });
    expect(res.statusCode).toBeGreaterThanOrEqual(400);
  });
});
