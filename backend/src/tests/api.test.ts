import request from 'supertest';
import app from '../index';

describe('Express API Route Tests', () => {
  test('GET /health returns 200 OK', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status');
    expect(res.body.status).toBe('ok');
  });

  test('POST /api/import without a file returns 400 Bad Request', async () => {
    const res = await request(app).post('/api/import');
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain('No CSV file uploaded');
  });
});
