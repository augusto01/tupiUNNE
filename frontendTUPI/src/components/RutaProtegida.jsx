import React from 'react';
import { Navigate } from 'react-router-dom';

const RutaProtegida = ({ children }) => {
  const token = localStorage.getItem('tupi_token');

  // Si no hay token guardado, lo rebota al login de una
  if (!token) {
    return <Navigate to="/" replace />;
  }

  // Si hay token, renderiza el Dashboard o el módulo interno que pidió
  return children;
};

export default RutaProtegida;