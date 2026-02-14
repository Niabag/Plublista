import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from './app.js';

describe('GET /api/health', () => {
  it('returns ok status with timestamp', async () => {
    const res = await request(app).get('/api/health');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
    expect(res.body.data).toHaveProperty('status', 'ok');
    expect(res.body.data).toHaveProperty('timestamp');
    expect(new Date(res.body.data.timestamp).toISOString()).toBe(res.body.data.timestamp);
  });

  it('wraps response in { data } format', async () => {
    const res = await request(app).get('/api/health');

    expect(Object.keys(res.body)).toEqual(['data']);
  });
});
