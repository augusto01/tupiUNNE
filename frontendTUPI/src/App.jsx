import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login/Login';
import Dashboard from './components/Dashboard/Dashboard';
import RutaProtegida from './components/RutaProtegida';

function App() {
  return (
    <Router>
      <Routes>
        {/* Ruta Pública: Pantalla de Login con tus colores */}
        <Route path="/" element={<Login />} />

        {/* Ruta Protegida: El Dashboard de TUPI con marca de agua */}
        <Route 
          path="/dashboard" 
          element={
            <RutaProtegida>
              <Dashboard />
            </RutaProtegida>
          } 
        />

        {/* Ruta por defecto: Si escriben cualquier verdura en la URL, los manda al Login */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;