/**
 * PsicoRuta — Backend Server (Express 5 + MongoDB)
 *
 * Architecture mirrors TESTEA's deployment pattern:
 * - Express 5 with CORS, JSON body parser
 * - Mongoose connection to MongoDB Atlas
 * - Routes mounted under /api and / (for Nginx rewrite compatibility)
 * - PM2-managed in production
 */
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 3003;

// ─── Middleware ───────────────────────────────
app.use(cors({
  origin: function (origin, callback) {
    const allowed = (process.env.CORS_ORIGIN || 'https://psicoruta.com').split(',').map(s => s.trim());
    // Allow requests with no origin (curl, Postman, server-to-server)
    if (!origin || allowed.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`[CORS] Origen no listado: ${origin}`);
      callback(null, true); // Permisivo con logging — cambiar a callback(new Error(...)) para bloqueo estricto
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Auth-Token'],
  credentials: true,
  optionsSuccessStatus: 200,
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// ─── MongoDB Connection ──────────────────────
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/psicoruta_db';

mongoose.connect(MONGODB_URI, {})
  .then(() => console.log('✅ MongoDB conectada exitosamente.'))
  .catch(err => console.error('❌ Error conectando a MongoDB:', err));

// ─── Routes ──────────────────────────────────
const apiRouter = express.Router();

// Health check
apiRouter.get('/status', (req, res) => {
  res.json({
    status: 'ok',
    app: 'PsicoRuta Backend',
    message: `Express funcionando en puerto ${PORT}`,
    timestamp: new Date().toISOString(),
  });
});

// Data persistence (replaces data.php)
const dataRoutes = require('./routes/data.routes');
apiRouter.use('/data', dataRoutes);

// Soporte robusto: Sirve endpoints tanto con prefijo /api (Local/Proxy)
// como sin él (Producción Nginx VPS que hace rewrite)
app.use('/api', apiRouter);
app.use('/', apiRouter);

// ─── Start Server ────────────────────────────
const server = app.listen(PORT);

server.on('listening', () => {
  console.log(`🚀 PsicoRuta Backend corriendo en http://localhost:${PORT}`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ ERROR CRÍTICO: El puerto ${PORT} ya está en uso.`);
    console.error('👉 Detén el otro servidor o cambia el puerto en .env.');
  } else {
    console.error('❌ ERROR al iniciar el servidor:', err);
  }
  process.exit(1);
});
