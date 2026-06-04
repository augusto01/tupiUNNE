const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./src/routes/authRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares globales
app.use(cors());
app.use(express.json());

// Declaración de Rutas
app.use('/api/auth', authRoutes);

// Ruta base de chequeo rápido
app.get('/', (req, res) => {
  res.send('API de TUPI - Ecosistema Rectorado UNNE corriendo.');
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor de TUPI escuchando en http://localhost:${PORT}`);
});