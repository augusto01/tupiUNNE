import React, { useState } from 'react';
import axios from 'axios';
import { FileText, Upload, CheckCircle2, XCircle, Package, AlertCircle, Loader2 } from 'lucide-react';
import './AnalizadorExpediente.css';

// Obtención dinámica de la URL del backend según el entorno (Vite / CRA)
const API_URL = 
  import.meta.env?.VITE_API_URL || 
  process.env.REACT_APP_API_URL || 
  'http://localhost:5000';

export const AnalizadorExpediente = () => {
  const [archivo, setArchivo] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type !== 'application/pdf') {
        setError('Selecciona únicamente un archivo PDF.');
        setArchivo(null);
        return;
      }
      setArchivo(file);
      setError('');
    }
  };

  const handleAnalizar = async (e) => {
    e.preventDefault();
    if (!archivo) {
      setError('Selecciona un expediente PDF antes de procesar.');
      return;
    }

    // Recuperación del token para la autenticación en el backend
    const token = localStorage.getItem('tupi_token') || localStorage.getItem('token');

    if (!token) {
      setError('No hay una sesión activa o el token no fue provisto. Por favor, reinicia sesión.');
      return;
    }

    const formData = new FormData();
    formData.append('expediente', archivo);

    setCargando(true);
    setError('');
    setResultado(null);

    try {
      const response = await axios.post(`${API_URL}/expedientes/analizar`, formData, {
        headers: { 
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        },
      });

      if (response.data.success) {
        setResultado(response.data.data);
      } else {
        setError(response.data.message || 'No se pudo procesar el expediente.');
      }
    } catch (err) {
      console.error('Error al analizar expediente:', err);
      const backendMessage = err.response?.data?.message || err.response?.data?.error;
      setError(backendMessage || 'Error al conectar con el servidor.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="analizador-container content-section-fade">
      <div className="analizador-header">
        <h2>Análisis Inteligente de Expedientes</h2>
        <p>Procesamiento y extracción automática mediante Inteligencia Artificial.</p>
      </div>

      <div className="analizador-card">
        <form onSubmit={handleAnalizar} className="upload-form">
          <div className="file-input-wrapper">
            <label>Seleccionar documento (PDF)</label>
            <label className="file-input-custom">
              <input type="file" accept=".pdf" onChange={handleFileChange} disabled={cargando} />
              <div className="file-input-content">
                <Upload size={20} />
                {archivo ? (
                  <span className="file-name-selected">{archivo.name}</span>
                ) : (
                  <span>Haz clic aquí o arrastra tu expediente en PDF</span>
                )}
              </div>
            </label>
          </div>

          <button type="submit" className="btn-analizar" disabled={cargando || !archivo}>
            {cargando ? (
              <>
                <Loader2 size={16} className="spinner-icon" /> Analizando...
              </>
            ) : (
              'Analizar Expediente'
            )}
          </button>
        </form>
      </div>

      {error && (
        <div className="analizador-alert-error">
          <AlertCircle size={16} style={{ display: 'inline', marginRight: '8px' }} />
          {error}
        </div>
      )}

      {resultado && (
        <div className="resultado-container">
          <div className="resultado-section">
            <h4><FileText size={18} /> Resumen General</h4>
            <p className="resumen-texto">{resultado.resumen_general}</p>
          </div>

          <div className="resultado-section">
            <h4><CheckCircle2 size={18} /> Examen Técnico</h4>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span>¿Contiene dictamen técnico?:</span>
              <span className={`badge-status ${resultado.tiene_examen_tecnico ? 'positivo' : 'negativo'}`}>
                {resultado.tiene_examen_tecnico ? 'SÍ' : 'NO'}
              </span>
            </div>
            {resultado.tiene_examen_tecnico && resultado.detalle_examen_tecnico && (
              <div className="detalle-tecnico-box">
                <strong>Detalle:</strong> {resultado.detalle_examen_tecnico}
              </div>
            )}
          </div>

          <div className="resultado-section">
            <h4><Package size={18} /> Listado de Bienes</h4>
            {resultado.listado_bienes && resultado.listado_bienes.length > 0 ? (
              <div className="table-responsive-wrapper">
                <table className="bienes-tabla">
                  <thead>
                    <tr>
                      <th>Bien</th>
                      <th>Descripción</th>
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resultado.listado_bienes.map((item, index) => (
                      <tr key={index}>
                        <td><strong>{item.bien}</strong></td>
                        <td>{item.descripcion}</td>
                        <td><span className="badge-estado">{item.estado || 'N/A'}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="sin-bienes-msg">No se identificaron bienes consignados en este expediente.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};