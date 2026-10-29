import { useState, useCallback } from 'react';

export const useUsuarios = () => {
  const [listaUsuarios, setListaUsuarios] = useState([]);
  const [tiposUsuario, setTiposUsuario] = useState([]); 
  const [dependencias, setDependencias] = useState([]); 
  const [loading, setLoading] = useState(false);
  const [errorBackend, setErrorBackend] = useState(null);

  const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  const API_URL = `${BASE_URL}/usuarios`; 

  const getAuthHeaders = () => {
    const token = localStorage.getItem('tupi_token') || localStorage.getItem('token'); 
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  };

  // 1. LISTAR OPERADORES
  const cargarUsuarios = useCallback(async () => {
    try {
      setLoading(true);
      setErrorBackend(null);
      
      const response = await fetch(API_URL, {
        method: 'GET',
        headers: getAuthHeaders()
      });
      
      if (!response.ok) throw new Error('Error al conectar con el servidor.');
      
      const data = await response.json();
      setListaUsuarios(data);
    } catch (err) {     
      console.error('Error cargando usuarios:', err);
      setErrorBackend('No se pudo cargar el ecosistema de usuarios.');
    } finally {
      setLoading(false);
    }
  }, [API_URL]);

  // 2. TRAER ROLES DINÁMICOS
  const cargarTiposUsuario = useCallback(async () => {
    try {
      const response = await fetch(`${BASE_URL}/tipos-usuario`, {
        method: 'GET',
        headers: getAuthHeaders()
      });
      if (!response.ok) throw new Error('No se pudieron obtener los roles del sistema.');
      
      const data = await response.json();
      setTiposUsuario(data);
    } catch (err) {
      console.error('Error cargando roles:', err);
    }
  }, [BASE_URL]);

  // 3. TRAER DEPENDENCIAS DINÁMICAS (UOC)
  const cargarDependencias = useCallback(async () => {
    try {
      const response = await fetch(`${BASE_URL}/dependencias`, {
        method: 'GET',
        headers: getAuthHeaders()
      });
      if (!response.ok) throw new Error('No se pudieron obtener las dependencias de la UNNE.');
      
      const data = await response.json();
      setDependencias(data);
    } catch (err) {
      console.error('Error cargando dependencias:', err);
    }
  }, [BASE_URL]);

  // 4. PROCESAR ALTA O MODIFICACIÓN CON REFRESO AUTOMÁTICO EN TIEMPO REAL
  const guardarUsuario = async (formData, idUsuarioEditar = null) => {
    try {
      setErrorBackend(null);
      const esEdicion = !!idUsuarioEditar;
      const url = esEdicion ? `${API_URL}/${idUsuarioEditar}` : API_URL;
      const method = esEdicion ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || `Error al ${esEdicion ? 'actualizar' : 'crear'} el operador.`);
      }

      // 🎯 Refresca la lista completa automáticamente desde el servidor
      await cargarUsuarios();
      return { ok: true };
    } catch (err) {
      console.error('Error al guardar usuario:', err);
      return { ok: false, error: err.message };
    }
  };

  // 5. CAMBIO DE ESTADO / BAJA LÓGICA CON REFRESO AUTOMÁTICO EN TIEMPO REAL
  const toggleBajaLogica = async (id) => {
    try {
      setErrorBackend(null);
      const url = `${API_URL}/${id}/baja`;

      const response = await fetch(url, {
        method: 'PATCH',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'No se pudo modificar el estado del usuario.');
      }

      const data = await response.json();

      // 🎯 Actualiza el estado local en tiempo real sin recargar la página
      setListaUsuarios(prev => 
        prev.map(u => u.id === id ? { ...u, activo: data.activo } : u)
      );

      // Re-sincronizamos con el servidor para refrescar todo
      await cargarUsuarios();

      return { ok: true, activo: data.activo };
    } catch (err) {
      console.error('Error en toggle status:', err);
      return { ok: false, error: err.message };
    }
  };

  return {
    listaUsuarios,
    tiposUsuario,
    dependencias,
    loading,
    errorBackend,
    cargarUsuarios,
    cargarTiposUsuario,
    cargarDependencias,
    guardarUsuario,
    toggleBajaLogica
  };
};