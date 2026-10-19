const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./src/routes/authRoutes');
const usuarioRoutes = require('./src/routes/usuarioRoutes');
const apiRoutes = require('./src/routes/apiRoutes');
const expedienteRoutes = require('./src/routes/expedienteRoutes');
const planComprasRoutes = require('./src/routes/PlanComprasRoutes'); // <-- Importar las rutas del Plan Anual de Compras

const app = express();
const PORT = process.env.PORT || 5000;

// Permitir peticiones desde el frontend (Vite)
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true
}));

// Middlewares globales
app.use(cors());
app.use(express.json());

// Declaración de Rutas
app.use('/api/auth', authRoutes);
app.use('/api', apiRoutes);
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/expedientes', expedienteRoutes);
app.use('/api/plan-compras', planComprasRoutes); // <-- Rutas del Plan Anual de Compras


// Ruta base de chequeo rápido
app.get('/', (req, res) => {
  res.send('API de TUPI - Ecosistema Rectorado UNNE corriendo.');
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor de TUPI escuchando en http://localhost:${PORT}`);
});