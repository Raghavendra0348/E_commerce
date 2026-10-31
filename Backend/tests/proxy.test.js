const express = require('express');
const request = require('supertest');
const configureProxy = require('../src/config/developmentProxy');
function create(mode) { const app = express(); configureProxy(app, mode); app.get('/ip', (req, res) => res.json({ ip: req.ip })); return app; }
describe('local development proxy client IPs', () => {
  it('keeps phone and desktop rate-limit identities separate', async () => {
    const app = create('development');
    const phone = await request(app).get('/ip').set('X-Forwarded-For', '192.168.1.20');
    const desktop = await request(app).get('/ip').set('X-Forwarded-For', '192.168.1.10');
    expect(phone.body.ip).toBe('192.168.1.20');
    expect(desktop.body.ip).toBe('192.168.1.10');
  });
  it('does not trust a spoofed address beyond the actual device hop', async () => {
    const response = await request(create('development')).get('/ip').set('X-Forwarded-For', '203.0.113.5, 192.168.1.20');
    expect(response.body.ip).toBe('192.168.1.20');
  });
  it('does not change proxy trust in production', async () => {
    const app = create('production');
    expect(app.get('trust proxy')).toBe(false);
    const response = await request(app).get('/ip').set('X-Forwarded-For', '192.168.1.20');
    expect(response.body.ip).not.toBe('192.168.1.20');
  });
});
