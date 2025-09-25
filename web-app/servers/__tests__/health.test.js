const request = require('supertest');
const { createServer } = require('../app');

describe('Health endpoint', () => {
  let app;

  beforeAll(async () => {
    // ensure we skip fabric and use dev paths in CI
    process.env.DEV_FAKE_STORAGE = 'true';
    process.env.SKIP_FABRIC_ENROLL = 'true';
    process.env.ALLOW_DEV_LOGIN = 'true';
    app = await createServer();
  });

  test('GET /health returns 200 and json', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status', 'ok');
  });
});
