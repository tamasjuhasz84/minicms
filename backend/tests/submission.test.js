import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../server.js';

describe('POST /submit', () => {
  it('should reject invalid submission (empty body)', async () => {
    const res = await request(app).post('/submit').send({});
    expect(res.status).toBe(400); // ha nincs validáció, ez 200 is lehet
  });

  it('should accept valid submission', async () => {
    const res = await request(app).post('/submit').send({
      active: true,
      name: 'Teszt Elek'
    });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
  });
});