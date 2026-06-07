import { useState, useCallback } from 'react';

export const useUsuarios = () => {
  const [listaUsuarios, setListaUsuarios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorBackend, setErrorBackend] = useState(null);

  // Leemos la variable de entorno de Vite
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const API_URL = `${BASE_URL}/usuarios`; 

  // 1. LISTAR OPERADORES (GET)
  const cargarUsuarios = useCallback(async () => {
    try {
      setLoading(true);
      setErrorBackend(null);
      const response = await fetch(API_URL);
      if (!response.ok) throw new Error('Error al conectar con el servidor.');
      
      const data = await response.json();
      setListaUsuarios(data);
    } catch (err) {     
      console.error(err);
      setErrorBackend('No se pudo cargar el ecosistema de usuarios.');
    } finally {
      setLoading(false);
    }
  }, [API_URL]);

  // 2. PROCESAR ALTA O MODIFICACIÓN (POST / PUT)
  const guardarUsuario = async (formData, idUsuarioEditar = null) => {
    try {
      setErrorBackend(null);
      const esEdicion = !!idUsuarioEditar;
      const url = esEdicion ? `${API_URL}/${idUsuarioEditar}` : API_URL;
      const method = esEdicion ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || `Error al ${esEdicion ? 'actualizar' : 'crear'} el operador.`);
      }

      // Sincronizamos la lista de usuarios tras el éxito
      await cargarUsuarios();
      return { ok: true };
    } catch (err) {
      console.error(err);
      return { ok: false, error: err.message };
    }
  };

  // 3. CAMBIO DE ESTADO / BAJA LÓGICA (PATCH)
  const toggleBajaLogica = async (id) => {
    try {
      setErrorBackend(null);
      const response = await fetch(`${API_URL}/${id}/toggle-status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) throw new Error('No se pudo modificar el estado del usuario en la base de datos.');

      // Estado optimista en la interfaz para que sea instantáneo
      setListaUsuarios(prev => 
        prev.map(u => u.id === id ? { ...u, activo: !u.activo } : u)
      );
      return { ok: true };
    } catch (err) {
      console.error(err);
      alert(err.message);
      return { ok: false, error: err.message };
    }
  };

  return {
    listaUsuarios,
    loading,
    errorBackend,
    cargarUsuarios,
    guardarUsuario,
    toggleBajaLogica
  };
};