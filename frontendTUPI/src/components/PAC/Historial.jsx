import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  FileEdit, 
  Send, 
  Trash2, 
  ChevronDown, 
  ChevronUp, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Save, 
  FileText,
  Search,
  Loader2,
  X
} from 'lucide-react';
import './Historial.css';

const Historial = () => {
  const { fetchAuth, token } = useAuth();

  const [solicitudes, setSolicitudes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState('TODOS');
  const [busqueda, setBusqueda] = useState('');

  const [expandedId, setExpandedId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [draftItems, setDraftItems] = useState([]);

  const [isProcessing, setIsProcessing] = useState(false);
  const [processingId, setProcessingId] = useState(null);
  const [processingAction, setProcessingAction] = useState(null);

  // Estado para Pop-up Flotante
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const mostrarPopUp = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: 'success' });
    }, 4000);
  };

  const cargarHistorial = async () => {
    setLoading(true);
    try {
      const res = await fetchAuth('/plan-compras/solicitudes-historial');
      if (res.ok) {
        const data = await res.json();
        setSolicitudes(Array.isArray(data) ? data : []);
      } else {
        mostrarPopUp('No se pudo cargar el historial de solicitudes.', 'error');
      }
    } catch (err) {
      console.error('Error al cargar historial:', err);
      mostrarPopUp('Error de conexión al obtener el historial.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const currentToken = token || localStorage.getItem('tupi_token') || localStorage.getItem('token');
    if (currentToken) {
      cargarHistorial();
    }
  }, [token]);

  // Manejo de despliegue corrigiendo la propagación
  const toggleExpand = (id, e) => {
    if (e) e.stopPropagation();
    if (editingId === id || isProcessing) return;
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const handleStartEdit = (solicitud, e) => {
    if (e) e.stopPropagation();
    if (isProcessing) return;
    setEditingId(solicitud.id);
    setExpandedId(solicitud.id);
    setDraftItems(JSON.parse(JSON.stringify(solicitud.renglones || [])));
  };

  const handleCancelEdit = () => {
    if (isProcessing) return;
    setEditingId(null);
    setDraftItems([]);
  };

  const handleDraftChange = (itemKey, campo, valor) => {
    if (isProcessing) return;
    setDraftItems((prev) =>
      prev.map((item) => {
        const currentKey = item.id || item.bien_id;
        if (currentKey === itemKey) {
          if (campo === 'cantidad') {
            const cant = Math.max(1, parseInt(valor, 10) || 1);
            return { ...item, cantidad: cant, subtotal: cant * (parseFloat(item.precio_unitario) || 0) };
          }
          if (campo === 'observacion') {
            return { ...item, observacion: valor };
          }
        }
        return item;
      })
    );
  };

  const handleSaveOrSubmit = async (solicitudId, nuevoEstado) => {
    if (isProcessing) return;

    setIsProcessing(true);
    setProcessingId(solicitudId);
    setProcessingAction(nuevoEstado === 'PENDIENTE' ? 'SUBMIT' : 'SAVE_BORRADOR');

    const payload = {
      estado: nuevoEstado,
      renglones: draftItems.map((item) => ({
        id: item.id,
        bien_id: item.bien_id,
        cantidad: item.cantidad,
        precio_unitario: item.precio_unitario,
        observacion: item.observacion || ''
      }))
    };

    try {
      const res = await fetchAuth(`/plan-compras/solicitudes/${solicitudId}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (res.ok) {
        mostrarPopUp(
          nuevoEstado === 'PENDIENTE'
            ? '¡Solicitud enviada exitosamente! Ahora se encuentra a la espera de aprobación.'
            : 'Borrador actualizado correctamente.',
          'success'
        );
        setEditingId(null);
        setDraftItems([]);
        cargarHistorial();
      } else {
        mostrarPopUp(data.error || 'Ocurrió un error al actualizar la solicitud.', 'error');
      }
    } catch (err) {
      console.error('Error al guardar solicitud:', err);
      mostrarPopUp('Error al conectar con el servidor.', 'error');
    } finally {
      setIsProcessing(false);
      setProcessingId(null);
      setProcessingAction(null);
    }
  };

  const handleDeleteBorrador = async (solicitudId, e) => {
    if (e) e.stopPropagation();
    if (isProcessing) return;
    if (!window.confirm('¿Está seguro de que desea eliminar este borrador?')) return;

    setIsProcessing(true);
    setProcessingId(solicitudId);
    setProcessingAction('DELETE');

    try {
      const res = await fetchAuth(`/plan-compras/solicitudes/${solicitudId}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        mostrarPopUp('Borrador eliminado correctamente.', 'success');
        cargarHistorial();
      } else {
        const data = await res.json();
        mostrarPopUp(data.error || 'No se pudo eliminar el borrador.', 'error');
      }
    } catch (err) {
      mostrarPopUp('Error de conexión al intentar eliminar el borrador.', 'error');
    } finally {
      setIsProcessing(false);
      setProcessingId(null);
      setProcessingAction(null);
    }
  };

  const solicitudesFiltradas = solicitudes.filter((sol) => {
    const coincideEstado = filtroEstado === 'TODOS' || sol.estado === filtroEstado;
    const coincideBusqueda =
      sol.nro_convocatoria?.toLowerCase().includes(busqueda.toLowerCase()) ||
      String(sol.id).includes(busqueda);
    return coincideEstado && coincideBusqueda;
  });

  const renderEstadoBadge = (estado) => {
    switch (estado) {
      case 'BORRADOR':
        return (
          <span className="badge-status-historial borrador">
            <Clock size={13} /> Borrador
          </span>
        );
      case 'PENDIENTE':
        return (
          <span className="badge-status-historial pendiente">
            <AlertCircle size={13} /> Pendiente de Aprobación
          </span>
        );
      case 'APROBADA':
        return (
          <span className="badge-status-historial aprobada">
            <CheckCircle2 size={13} /> Aceptada
          </span>
        );
      case 'RECHAZADA':
        return (
          <span className="badge-status-historial rechazada">
            <XCircle size={13} /> Rechazada
          </span>
        );
      default:
        return <span className="badge-status-historial">{estado}</span>;
    }
  };

  return (
    <div className="historial-container">
      {/* POP-UP FLOTANTE (TOAST) */}
      {toast.show && (
        <div className={`tupi-toast-popup ${toast.type}`}>
          <div className="toast-popup-content">
            {toast.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
            <span>{toast.message}</span>
          </div>
          <button className="toast-close-btn" onClick={() => setToast({ ...toast, show: false })}>
            <X size={16} />
          </button>
        </div>
      )}

      <div className="historial-header">
        <div>
          <h1 className="historial-title">Historial de Solicitudes de Compras</h1>
          <p className="historial-subtitle">
            Consulte el estado, modifique sus borradores o envíe requerimientos pendientes.
          </p>
        </div>
      </div>

      {/* BARRA FILTROS */}
      <div className="historial-card mb-4">
        <div className="filters-row">
          <div className="filter-group flex-2">
            <label>Buscar Solicitud</label>
            <div className="search-box">
              <Search size={16} className="search-icon" />
              <input
                type="text"
                disabled={isProcessing}
                className="form-control search-input"
                placeholder="Buscar por N° Convocatoria o ID..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>
          </div>

          <div className="filter-group">
            <label>Filtrar por Estado</label>
            <select
              className="form-control"
              disabled={isProcessing}
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
            >
              <option value="TODOS">Todos los estados</option>
              <option value="BORRADOR">Borradores</option>
              <option value="PENDIENTE">Pendientes de Aprobación</option>
              <option value="APROBADA">Aceptadas</option>
              <option value="RECHAZADA">Rechazadas</option>
            </select>
          </div>
        </div>
      </div>

      {/* LISTADO */}
      <div className="historial-card">
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status"></div>
            <p className="mt-2 text-muted">Cargando solicitudes...</p>
          </div>
        ) : solicitudesFiltradas.length === 0 ? (
          <div className="text-center py-5 text-muted">
            <FileText size={40} className="mb-2 text-gray" />
            <p>No se encontraron solicitudes registradas con los filtros seleccionados.</p>
          </div>
        ) : (
          <div className="solicitudes-list">
            {solicitudesFiltradas.map((sol) => {
              const isExpanded = expandedId === sol.id;
              const isEditing = editingId === sol.id;
              const esBorrador = sol.estado === 'BORRADOR';
              const estaProcesandoEsta = isProcessing && processingId === sol.id;

              const listaRenglones = isEditing ? draftItems : sol.renglones || [];
              const totalMonto = listaRenglones.reduce(
                (acc, r) => acc + (parseFloat(r.precio_unitario) * parseInt(r.cantidad, 10) || 0),
                0
              );

              return (
                <div
                  key={sol.id}
                  className={`solicitud-item-card ${isExpanded ? 'expanded' : ''} ${
                    isEditing ? 'editing' : ''
                  }`}
                >
                  <div className="solicitud-main-row" onClick={(e) => toggleExpand(sol.id, e)}>
                    <div className="solicitud-info">
                      <div className="d-flex align-items-center gap-3">
                        <span className="solicitud-id">Solicitud #{sol.id}</span>
                        {renderEstadoBadge(sol.estado)}
                      </div>
                      <div className="solicitud-meta">
                        <span><strong>Convocatoria:</strong> {sol.nro_convocatoria || 'S/N'}</span>
                        <span>•</span>
                        <span>
                          <strong>Fecha:</strong>{' '}
                          {sol.fecha_creacion
                            ? new Date(sol.fecha_creacion).toLocaleDateString('es-AR')
                            : 'N/A'}
                        </span>
                      </div>
                    </div>

                    <div className="solicitud-actions-summary">
                      <div className="solicitud-monto">
                        <small>Total Estimado</small>
                        <strong>${totalMonto.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</strong>
                      </div>

                      <div className="btn-group-actions">
                        {esBorrador && !isEditing && (
                          <>
                            <button
                              type="button"
                              className="btn btn-outline-primary btn-sm d-flex align-items-center gap-1"
                              disabled={isProcessing}
                              onClick={(e) => handleStartEdit(sol, e)}
                              title="Editar Borrador"
                            >
                              <FileEdit size={14} /> Editar
                            </button>

                            <button
                              type="button"
                              className="btn btn-outline-danger btn-sm d-flex align-items-center gap-1"
                              disabled={isProcessing}
                              onClick={(e) => handleDeleteBorrador(sol.id, e)}
                              title="Eliminar Borrador"
                            >
                              {estaProcesandoEsta && processingAction === 'DELETE' ? (
                                <Loader2 size={14} className="spinner-rotation" />
                              ) : (
                                <Trash2 size={14} />
                              )}
                            </button>
                          </>
                        )}
                        <button 
                          type="button" 
                          className="btn-toggle-expand" 
                          disabled={isProcessing}
                          onClick={(e) => toggleExpand(sol.id, e)}
                        >
                          {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="solicitud-detail-body">
                      <div className="detail-table-wrapper">
                        <table className="historial-table">
                          <thead>
                            <tr>
                              <th>Bien / Descripción</th>
                              <th className="text-center" style={{ width: '100px' }}>Cantidad</th>
                              <th className="text-right" style={{ width: '140px' }}>Precio Unit ($)</th>
                              <th className="text-right" style={{ width: '140px' }}>Subtotal ($)</th>
                              <th style={{ width: '300px' }}>Observación / Especificación</th>
                            </tr>
                          </thead>
                          <tbody>
                            {listaRenglones.length === 0 ? (
                              <tr>
                                <td colSpan="5" className="text-center py-3 text-muted">
                                  Sin renglones asociados.
                                </td>
                              </tr>
                            ) : (
                              listaRenglones.map((item) => {
                                const itemKey = item.id || item.bien_id;
                                const subtotalItem =
                                  (parseFloat(item.precio_unitario) || 0) *
                                  (parseInt(item.cantidad, 10) || 0);

                                return (
                                  <tr key={itemKey}>
                                    <td>
                                      <strong>{item.descripcion || item.bien_descripcion}</strong>
                                    </td>
                                    <td className="text-center">
                                      {isEditing ? (
                                        <input
                                          type="number"
                                          min="1"
                                          disabled={isProcessing}
                                          className="form-control form-control-sm text-center"
                                          value={item.cantidad}
                                          onChange={(e) =>
                                            handleDraftChange(itemKey, 'cantidad', e.target.value)
                                          }
                                        />
                                      ) : (
                                        <span>{item.cantidad}</span>
                                      )}
                                    </td>
                                    <td className="text-right">
                                      ${parseFloat(item.precio_unitario || 0).toLocaleString('es-AR', {
                                        minimumFractionDigits: 2
                                      })}
                                    </td>
                                    <td className="text-right font-bold text-primary">
                                      ${subtotalItem.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                                    </td>
                                    <td>
                                      {isEditing ? (
                                        <input
                                          type="text"
                                          disabled={isProcessing}
                                          className="form-control form-control-sm"
                                          value={item.observacion || ''}
                                          onChange={(e) =>
                                            handleDraftChange(itemKey, 'observacion', e.target.value)
                                          }
                                          placeholder="Añadir nota técnica..."
                                        />
                                      ) : (
                                        <span className="text-muted small">
                                          {item.observacion || 'Sin observaciones'}
                                        </span>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })
                            )}
                          </tbody>
                        </table>
                      </div>

                      {isEditing && (
                        <div className="edit-actions-bar">
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            disabled={isProcessing}
                            onClick={handleCancelEdit}
                          >
                            Cancelar
                          </button>

                          <div className="d-flex gap-2">
                            <button
                              type="button"
                              className="btn btn-outline-primary btn-sm d-flex align-items-center gap-1"
                              disabled={isProcessing}
                              onClick={() => handleSaveOrSubmit(sol.id, 'BORRADOR')}
                            >
                              {estaProcesandoEsta && processingAction === 'SAVE_BORRADOR' ? (
                                <>
                                  <Loader2 size={14} className="spinner-rotation" />
                                  <span>Guardando...</span>
                                </>
                              ) : (
                                <>
                                  <Save size={14} />
                                  <span>Guardar Borrador</span>
                                </>
                              )}
                            </button>

                            <button
                              type="button"
                              className="btn btn-primary btn-sm d-flex align-items-center gap-1"
                              disabled={isProcessing}
                              onClick={() => handleSaveOrSubmit(sol.id, 'PENDIENTE')}
                            >
                              {estaProcesandoEsta && processingAction === 'SUBMIT' ? (
                                <>
                                  <Loader2 size={14} className="spinner-rotation" />
                                  <span>Enviando...</span>
                                </>
                              ) : (
                                <>
                                  <Send size={14} />
                                  <span>Subir y Enviar Solicitud</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Historial;