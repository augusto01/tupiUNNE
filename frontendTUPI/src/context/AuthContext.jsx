import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext();
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => 
    localStorage.getItem('token') || localStorage.getItem('tupi_token') || null
  );

  const [usuario, setUsuario] = useState(() => {
    const userStored = localStorage.getItem('usuario') || localStorage.getItem('tupi_user');
    return userStored ? JSON.parse(userStored) : null;
  });

  // Estado para Módulos / Permisos del Dashboard
  const [permisos, setPermisos] = useState(() => {
    const permisosStored = localStorage.getItem('permisos') || localStorage.getItem('tupi_permisos');
    return permisosStored ? JSON.parse(permisosStored) : [];
  });

  const login = (newToken, userData, permisosData = []) => {
    // Guardar en ambas nomenclaturas para no romper ningún componente
    localStorage.setItem('token', newToken);
    localStorage.setItem('tupi_token', newToken);

    if (userData) {
      localStorage.setItem('usuario', JSON.stringify(userData));
      localStorage.setItem('tupi_user', JSON.stringify(userData));
    }

    if (permisosData) {
      localStorage.setItem('permisos', JSON.stringify(permisosData));
      localStorage.setItem('tupi_permisos', JSON.stringify(permisosData));
    }

    setToken(newToken);
    setUsuario(userData);
    setPermisos(permisosData);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('tupi_token');
    localStorage.removeItem('usuario');
    localStorage.removeItem('tupi_user');
    localStorage.removeItem('permisos');
    localStorage.removeItem('tupi_permisos');

    setToken(null);
    setUsuario(null);
    setPermisos([]);
  };

  const fetchAuth = async (endpoint, options = {}) => {
    const currentToken = token || localStorage.getItem('token') || localStorage.getItem('tupi_token');

    if (!currentToken) {
      throw new Error('No hay sesión activa.');
    }

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${currentToken}`,
      ...options.headers
    };

    const baseUrl = API_URL.endsWith('/api') ? API_URL : `${API_URL}/api`;
    const response = await fetch(`${baseUrl}${endpoint}`, {
      ...options,
      headers
    });

    if (response.status === 401 || response.status === 403) {
      logout();
      throw new Error('Sesión expirada o no autorizada.');
    }

    return response;
  };

  return (
    <AuthContext.Provider value={{ token, usuario, permisos, login, logout, fetchAuth, API_URL }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);