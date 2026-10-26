import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  FileEdit, 
  Trash2, 
  Eye,
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  FileText,
  Search,
  Loader2,
  X,
  User,
  Building2,
  Calendar,
  FileSpreadsheet,
  ShieldCheck
} from 'lucide-react';
import DetalleSolicitud from './DetalleSolicitud';
import PlanComprasABM from './PlanComprasABM';
import './Historial.css';

const Historial = () => {
  const { fetchAuth, token } = useAuth();

  const [solicitudes, setSolicitudes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState('TODOS');
  const [busqueda, setBusqueda] = useState('');

  const [solicitudAInspeccionar, setSolicitudAInspeccionar] = useState(null);
  const [solicitudAEditar, setSolicitudAEditar] = useState(null);

  const [isProcessing, setIsProcessing] = useState(false);
  const [processingId, setProcessingId] = useState(null);

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
      const res = await fetchAuth('/plan-compras/solicitudes-pendientes');
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

  const handleDeleteBorrador = async (solicitudId, e) => {
    if (e) e.stopPropagation();
    if (isProcessing) return;
    if (!window.confirm('¿Está seguro de que desea eliminar este borrador?')) return;

    setIsProcessing(true);
    setProcessingId(solicitudId);

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
    }
  };

  const handleDescargarPDF = async (solicitudId) => {
    try {
      const res = await fetchAuth(`/plan-compras/solicitudes/${solicitudId}/pdf`);
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Solicitud_Autorizada_${solicitudId}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      } else {
        mostrarPopUp('No se pudo generar el documento PDF.', 'error');
      }
    } catch (err) {
      mostrarPopUp('Error de conexión al descargar el PDF.', 'error');
    }
  };

  const handleDescargarExcel = async (solicitudId) => {
    try {
      const res = await fetchAuth(`/plan-compras/solicitudes/${solicitudId}/excel`);
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Solicitud_${solicitudId}.xlsx`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      } else {
        mostrarPopUp('No se pudo generar la planilla Excel.', 'error');
      }
    } catch (err) {
      mostrarPopUp('Error de conexión al descargar el Excel.', 'error');
    }
  };

  if (solicitudAEditar) {
    return (
      <PlanComprasABM
        solicitudAEditar={solicitudAEditar}
        onCancelarEdicion={() => setSolicitudAEditar(null)}
        onGuardadoExitoso={() => {
          setSolicitudAEditar(null);
          cargarHistorial();
        }}
      />
    );
  }

  if (solicitudAInspeccionar) {
    return (
      <div className="historial-container">
        <DetalleSolicitud
          solicitud={solicitudAInspeccionar}
          esModoEvaluacion={false}
          onVolver={() => setSolicitudAInspeccionar(null)}
          onEditar={(sol) => {
            setSolicitudAInspeccionar(null);
            setSolicitudAEditar(sol);
          }}
          onDescargarPDF={handleDescargarPDF}
          onDescargarExcel={handleDescargarExcel}
        />
      </div>
    );
  }

  const solicitudesFiltradas = solicitudes.filter((sol) => {
    const coincideEstado = filtroEstado === 'TODOS' || sol.estado === filtroEstado;
    const coincideBusqueda =
      sol.nro_convocatoria?.toLowerCase().includes(busqueda.toLowerCase()) ||
      sol.usuario_nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
      sol.usuario_apellido?.toLowerCase().includes(busqueda.toLowerCase()) ||
      String(sol.id).includes(busqueda);
    return coincideEstado && coincideBusqueda;
  });

  const renderEstadoBadge = (estado) => {
    switch (estado) {
      case 'BORRADOR':
        return <span className="badge-estado borrador">Borrador</span>;
      case 'PENDIENTE':
        return <span className="badge-estado pendiente">Pendiente</span>;
      case 'APROBADA':
        return <span className="badge-estado aprobada">Aprobada</span>;
      case 'RECHAZADA':
        return <span className="badge-estado rechazada">Rechazada</span>;
      default:
        return <span className="badge-estado">{estado}</span>;
    }
  };

  return (
    <div className="historial-container">
      {toast.show && (
        <div className={`tupi-toast-popup ${toast.type}`}>
          <div className="toast-popup-content">
            {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            <span>{toast.message}</span>
          </div>
          <button className="toast-close-btn" onClick={() => setToast({ ...toast, show: false })}>
            <X size={15} />
          </button>
        </div>
      )}

      <div className="historial-header">
        <div>
          <h1 className="historial-title">Historial de Solicitudes</h1>
          <p className="historial-subtitle">
            Consulte el estado, modifique borradores o corrija solicitudes devueltas para reenviarlas.
          </p>
        </div>
      </div>

      <div className="historial-card mb-4">
        <div className="filters-row">
          <div className="filter-group flex-2">
            <label>Buscar Solicitud</label>
            <div className="search-box">
              <Search size={15} className="search-icon" />
              <input
                type="text"
                disabled={isProcessing}
                className="form-control search-input"
                placeholder="Buscar por N° Convocatoria, ID o Solicitante..."
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
              <option value="APROBADA">Aprobadas</option>
              <option value="RECHAZADA">Rechazadas</option>
            </select>
          </div>
        </div>
      </div>

      <div className="historial-card">
        {loading ? (
          <div className="text-center py-5">
            <Loader2 size={26} className="spinner-rotation text-primary mx-auto" />
            <p className="mt-2 text-muted small">Cargando solicitudes...</p>
          </div>
        ) : solicitudesFiltradas.length === 0 ? (
          <div className="text-center py-5 text-muted">
            <FileText size={36} className="mb-2 mx-auto text-gray" />
            <p className="small">No se encontraron solicitudes con los filtros aplicados.</p>
          </div>
        ) : (
          <div className="solicitudes-list">
            {solicitudesFiltradas.map((sol) => {
              const esEditable = sol.estado === 'BORRADOR' || sol.estado === 'RECHAZADA';
              const estaProcesandoEsta = isProcessing && processingId === sol.id;

              const totalMonto = (sol.renglones || sol.registros || []).reduce(
                (acc, r) => acc + (parseFloat(r.precio_unitario) * parseInt(r.cantidad, 10) || 0),
                0
              );

              return (
                <div key={sol.id} className="solicitud-item-card">
                  {/* METADATOS Y ENCABEZADO */}
                  <div className="solicitud-header-info">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <strong style={{ fontSize: '1.05rem', color: '#0f172a' }}>
                        Solicitud #{sol.id}
                      </strong>
                      {renderEstadoBadge(sol.estado)}
                    </div>

                    <div className="solicitud-meta-grid">
                      <div className="solicitud-meta-item">
                        <span className="solicitud-meta-label">
                          <User size={12} className="inline-icon" /> Solicitante
                        </span>
                        <span className="solicitud-meta-value">
                          {sol.usuario_nombre ? `${sol.usuario_nombre} ${sol.usuario_apellido}` : 'Usuario Sistema'}
                        </span>
                      </div>

                      <div className="solicitud-meta-item">
                        <span className="solicitud-meta-label">
                          <Building2 size={12} className="inline-icon" /> Dependencia
                        </span>
                        <span className="solicitud-meta-value">
                          {sol.dependencia_nombre || 'Rectorado UNNE'}
                        </span>
                      </div>

                      <div className="solicitud-meta-item">
                        <span className="solicitud-meta-label">
                          <FileSpreadsheet size={12} className="inline-icon" /> Convocatoria
                        </span>
                        <span className="solicitud-meta-value">
                          {sol.nro_convocatoria || 'CDC:2026/01'}
                        </span>
                      </div>

                      <div className="solicitud-meta-item">
                        <span className="solicitud-meta-label">
                          <Calendar size={12} className="inline-icon" /> Fecha
                        </span>
                        <span className="solicitud-meta-value">
                          {sol.fecha_creacion ? new Date(sol.fecha_creacion).toLocaleDateString('es-AR') : 'N/A'}
                        </span>
                      </div>

                      {(sol.admin_nombre || sol.usuario_autorizante) && (
                        <div className="solicitud-meta-item">
                          <span className="solicitud-meta-label">
                            <ShieldCheck size={12} className="inline-icon" /> Evaluado por
                          </span>
                          <span className="solicitud-meta-value">
                            <span className="autorizante-tag">
                              {sol.admin_nombre 
                                ? `${sol.admin_nombre} ${sol.admin_apellido}` 
                                : `Admin ID: ${sol.usuario_autorizante}`}
                            </span>
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* PIE DE TARJETA CON MONTO ESTIMADO Y BOTONES DE ACCIÓN */}
                  <div className="solicitud-footer-bar">
                    <div className="solicitud-monto-group">
                      <span className="solicitud-monto-label">Monto Estimado:</span>
                      <span className="solicitud-monto-valor">
                        ${totalMonto.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>

                    <div className="solicitud-actions-group">
                      {esEditable && (
                        <>
                          <button
                            type="button"
                            className="btn-tupi btn-tupi-secundario"
                            disabled={isProcessing}
                            onClick={() => setSolicitudAEditar(sol)}
                          >
                            <FileEdit size={14} />
                            <span>Editar</span>
                          </button>

                          {sol.estado === 'BORRADOR' && (
                            <button
                              type="button"
                              className="btn-tupi btn-tupi-peligro"
                              disabled={isProcessing}
                              onClick={(e) => handleDeleteBorrador(sol.id, e)}
                            >
                              {estaProcesandoEsta ? (
                                <Loader2 size={14} className="spinner-rotation" />
                              ) : (
                                <>
                                  <Trash2 size={14} />
                                  <span>Eliminar</span>
                                </>
                              )}
                            </button>
                          )}
                        </>
                      )}

                      <button
                        type="button"
                        className="btn-tupi btn-tupi-descarga"
                        onClick={() => setSolicitudAInspeccionar(sol)}
                      >
                        <Eye size={14} />
                        <span>Inspeccionar</span>
                      </button>
                    </div>
                  </div>
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