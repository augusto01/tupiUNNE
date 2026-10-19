// src/config/gemini.js
require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

if (!process.env.GEMINI_API_KEY) {
  console.warn('⚠️ Alerta: GEMINI_API_KEY no está configurada en el archivo .env');
}

// Usamos el cliente del SDK estándar
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

module.exports = { genAI };