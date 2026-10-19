import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext'; // 👈 Importamos el AuthProvider
import Login from './components/Login/Login';
import Dashboard from './components/Dashboard/Dashboard';
import PlanComprasABM from './components/PAC/PlanComprasABM'; // 👈 Importamos el componente
import RutaProtegida from './components/RutaProtegida';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Ruta Pública */}
          <Route path="/" element={<Login />} />

          {/* Rutas Protegidas */}
          <Route 
            path="/dashboard" 
            element={
              <RutaProtegida>
                <Dashboard />
              </RutaProtegida>
            } 
          />

          {/* Ruta Protegida: Plan Anual de Compras */}
          <Route 
            path="/plan-compras" 
            element={
              <RutaProtegida>
                <PlanComprasABM />
              </RutaProtegida>
            } 
          />

          {/* Redirección por defecto */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;