const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./src/routes/authRoutes');
const usuarioRoutes = require('./src/routes/usuarioRoutes');
const apiRoutes = require('./src/routes/apiRoutes');
const expedienteRoutes = require('./src/routes/expedienteRoutes');

const planComprasRoutes = require('./src/routes/planComprasRoutes.js').default || require('./src/routes/planComprasRoutes.js');

const app = express();
const PORT = process.env.PORT || 5000;

// Configuración de CORS
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5174'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middlewares globales
app.use(express.json());

// ==============================================================
// Declaración de Rutas (ORDEN CORREGIDO)
// ==============================================================

// 1. Autenticación y Usuarios (Tienen prioridad y manejan sus endpoints públicos)
app.use('/api/auth', authRoutes);
app.use('/api/usuarios', usuarioRoutes); // 👈 Puesto antes de /api para no ser bloqueado por apiRoutes

// 2. Rutas Específicas
app.use('/api/expedientes', expedienteRoutes);
app.use('/api/plan-compras', planComprasRoutes);

// 3. Router Genérico / Protegido de la API
app.use('/api', apiRoutes); 

// Ruta base de chequeo rápido
app.get('/', (req, res) => {
  res.send('API de TUPI - Ecosistema Rectorado UNNE corriendo.');
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor de TUPI escuchando en http://localhost:${PORT}`);
});