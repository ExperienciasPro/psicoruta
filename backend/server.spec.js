const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');

// Clonar la lógica básica del servidor sin arrancar el puerto real
const app = express();
app.use(express.json());

// Mock de la ruta de status
app.get('/api/status', (req, res) => {
  res.json({
    status: 'ok',
    app: 'PsicoRuta Backend',
    timestamp: new Date().toISOString(),
  });
});

// Mock simple de CORS middleware para testear CORS estricto
const testAllowedOrigins = ['https://psicoruta.com'];
const corsMiddleware = (req, res, next) => {
  const origin = req.headers.origin;
  if (!origin || testAllowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
    next();
  } else {
    res.status(403).json({ error: 'CORS policy blocked this request' });
  }
};
app.use('/api/data', corsMiddleware);
app.post('/api/data', (req, res) => {
  res.json({ ok: true });
});

describe('Backend API Integration Tests', () => {
  it('GET /api/status should return status ok', async () => {
    const res = await request(app)
      .get('/api/status')
      .expect(200);
    
    expect(res.body.status).toBe('ok');
    expect(res.body.app).toBe('PsicoRuta Backend');
  });

  it('CORS check: should allow registered origins', async () => {
    const res = await request(app)
      .post('/api/data')
      .set('Origin', 'https://psicoruta.com')
      .expect(200);
      
    expect(res.headers['access-control-allow-origin']).toBe('https://psicoruta.com');
  });

  it('CORS check: should deny unregistered origins', async () => {
    const res = await request(app)
      .post('/api/data')
      .set('Origin', 'https://malicious-site.com')
      .expect(403);
      
    expect(res.body.error).toBe('CORS policy blocked this request');
  });
});
