import React, { useState } from 'react';
import { 
  ArrowLeft, 
  FileEdit, 
  Download, 
  FileText, 
  FileSpreadsheet, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Building2, 
  User, 
  Calendar, 
  ShieldCheck,
  ChevronDown,
  Loader2
} from 'lucide-react';

const DetalleSolicitud = ({ 
  solicitud, 
  esModoEvaluacion = false, 
  onVolver, 
  onEditar, 
  onEvaluacion, 
  onAprobar, 
  onRechazar, 
  onDescargarPDF, 
  onDescargarExcel,
  estaProcesando = false
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [motivoRechazo, setMotivoRechazo] = useState('');
  const [errorRechazo, setErrorRechazo] = useState('');
  const [mostrarCampoRechazo, setMostrarCampoRechazo] = useState(false);
  const [loadingLocal, setLoadingLocal] = useState(false);

  if (!solicitud) return null;

  const esEditable = solicitud.estado === 'BORRADOR' || solicitud.estado === 'RECHAZADA';
  const esAprobada = solicitud.estado === 'APROBADA';
  
  // El panel lateral de acciones SOLO se muestra si es modo evaluación Y la solicitud está PENDIENTE
  const mostrarPanelLateral = esModoEvaluacion && solicitud.estado === 'PENDIENTE';

  const isSubmitting = estaProcesando || loadingLocal;

  const renglones = solicitud.renglones || solicitud.registros || [];
  const montoTotal = renglones.reduce((acc, r) => {
    const cant = parseInt(r.cantidad, 10) || 1;
    const precio = parseFloat(r.precio_unitario) || 0;
    return acc + cant * precio;
  }, 0);

  // 🎯 Handler para Aprobar (Soporta 'onAprobar' de Pendientes.jsx o 'onEvaluacion')
  const handleAprobarClick = async (e) => {
    if (e) e.preventDefault();
    if (isSubmitting) return;

    setLoadingLocal(true);
    try {
      if (onAprobar) {
        await onAprobar(solicitud.id);
      } else if (onEvaluacion) {
        await onEvaluacion(solicitud.id, 'APROBADA');
      }
    } catch (err) {
      console.error('Error al aprobar solicitud:', err);
    } finally {
      setLoadingLocal(false);
    }
  };

  // 🎯 Handler para Devolver / Rechazar (Soporta 'onRechazar' de Pendientes.jsx o 'onEvaluacion')
  const handleConfirmarRechazoClick = async (e) => {
    if (e) e.preventDefault();
    if (isSubmitting) return;

    if (!motivoRechazo.trim()) {
      setErrorRechazo('Debe ingresar un motivo para devolver o rechazar la solicitud.');
      return;
    }

    setErrorRechazo('');
    setLoadingLocal(true);

    try {
      if (onRechazar) {
        await onRechazar(solicitud.id, motivoRechazo.trim());
      } else if (onEvaluacion) {
        await onEvaluacion(solicitud.id, 'RECHAZADA', motivoRechazo.trim());
      }
    } catch (err) {
      console.error('Error al rechazar solicitud:', err);
    } finally {
      setLoadingLocal(false);
    }
  };

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
    <div className="detalle-solicitud-wrapper fade-in-animation">
      {/* 1. Encabezado de la Vista */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <div className="d-flex align-items-center gap-3">
          <button 
            type="button" 
            className="btn-tupi btn-tupi-secundario" 
            onClick={onVolver}
            disabled={isSubmitting}
          >
            <ArrowLeft size={16} />
            <span>Volver</span>
          </button>
          <h1 className="abm-title mb-0">Solicitud #{solicitud.id}</h1>
          {renderEstadoBadge(solicitud.estado)}
        </div>

        {/* Acciones Superiores */}
        <div className="summary-actions-group">
          {/* Botón de Edición directa (Si es borrador o rechazada) */}
          {esEditable && !esModoEvaluacion && onEditar && (
            <button
              type="button"
              className="btn-tupi btn-tupi-secundario"
              onClick={() => onEditar(solicitud)}
              disabled={isSubmitting}
            >
              <FileEdit size={16} />
              <span>Editar Solicitud</span>
            </button>
          )}

          {/* Menú Desplegable de Exportaciones (Restringido a solicitudes APROBADAS) */}
          {esAprobada && (
            <div className="download-dropdown-wrapper">
              <button
                type="button"
                className="btn-tupi btn-tupi-primario"
                onClick={() => setDropdownOpen(!dropdownOpen)}
              >
                <Download size={16} />
                <span>Exportar Comprobante</span>
                <ChevronDown size={14} className={`dropdown-chevron ${dropdownOpen ? 'open' : ''}`} />
              </button>

              {dropdownOpen && (
                <div className="download-menu-dropdown slide-down-animation">
                  <button
                    type="button"
                    className="download-menu-item"
                    onClick={() => {
                      setDropdownOpen(false);
                      if (onDescargarPDF) onDescargarPDF(solicitud.id);
                    }}
                  >
                    <FileText size={16} className="text-pdf" />
                    <span>Documento PDF (.pdf)</span>
                  </button>

                  <button
                    type="button"
                    className="download-menu-item"
                    onClick={() => {
                      setDropdownOpen(false);
                      if (onDescargarExcel) onDescargarExcel(solicitud.id);
                    }}
                  >
                    <FileSpreadsheet size={16} className="text-excel" />
                    <span>Planilla Excel (.xlsx)</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 2. Tarjeta de Metadatos de la Solicitud */}
      <div className="solicitud-header-info mb-4">
        <div className="solicitud-meta-grid">
          <div className="solicitud-meta-item">
            <span className="solicitud-meta-label">
              <User size={13} className="inline-icon" /> Solicitante
            </span>
            <span className="solicitud-meta-value">
              {solicitud.usuario_nombre 
                ? `${solicitud.usuario_nombre} ${solicitud.usuario_apellido}` 
                : 'Usuario Institucional'}
            </span>
          </div>

          <div className="solicitud-meta-item">
            <span className="solicitud-meta-label">
              <Building2 size={13} className="inline-icon" /> Dependencia
            </span>
            <span className="solicitud-meta-value">
              {solicitud.dependencia_nombre || 'Rectorado UNNE'}
            </span>
          </div>

          <div className="solicitud-meta-item">
            <span className="solicitud-meta-label">
              <FileSpreadsheet size={13} className="inline-icon" /> Convocatoria
            </span>
            <span className="solicitud-meta-value">
              {solicitud.nro_convocatoria || 'CDC:2026/01'}
            </span>
          </div>

          <div className="solicitud-meta-item">
            <span className="solicitud-meta-label">
              <Calendar size={13} className="inline-icon" /> Fecha Emisión
            </span>
            <span className="solicitud-meta-value">
              {solicitud.fecha_creacion 
                ? new Date(solicitud.fecha_creacion).toLocaleDateString('es-AR') 
                : 'N/A'}
            </span>
          </div>

          {(solicitud.admin_nombre || solicitud.usuario_autorizante) && (
            <div className="solicitud-meta-item">
              <span className="solicitud-meta-label">
                <ShieldCheck size={13} className="inline-icon" /> Evaluado por
              </span>
              <span className="solicitud-meta-value">
                <span className="autorizante-tag">
                  {solicitud.admin_nombre 
                    ? `${solicitud.admin_nombre} ${solicitud.admin_apellido}` 
                    : `Admin ID: ${solicitud.usuario_autorizante}`}
                </span>
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 3. Banner de Motivo de Rechazo / Observación (Si aplica) */}
      {solicitud.motivo_rechazo && (
        <div className="motivo-rechazo-banner mb-4 slide-down-animation">
          <AlertTriangle size={20} className="banner-icon flex-shrink-0" />
          <div>
            <strong>Observaciones de Devolución / Rechazo:</strong>
            <p className="mb-0 mt-1">{solicitud.motivo_rechazo}</p>
          </div>
        </div>
      )}

      {/* 4. GRID DINÁMICO: Si no hay panel lateral, aplica 'full-width' para expandir al 100% */}
      <div className={`detalle-grid-layout ${!mostrarPanelLateral ? 'full-width' : ''}`}>
        
        {/* Columna Principal: Tabla de Bienes Solicitados */}
        <div className="detalle-tabla-container">
          <div className="abm-card">
            <div className="card-header">
              <h3 className="card-title">Detalle de Bienes Solicitados</h3>
            </div>

            <div className="table-wrapper">
              <table className="abm-table">
                <thead>
                  <tr>
                    <th style={{ width: '60px' }}>N°</th>
                    <th>Bien / Descripción</th>
                    <th className="text-center">Trimestre</th>
                    <th className="text-center">Cantidad</th>
                    <th className="text-end">Precio Unit.</th>
                    <th className="text-end">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {renglones.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="text-center text-muted py-4">
                        No se registraron ítems en esta solicitud.
                      </td>
                    </tr>
                  ) : (
                    renglones.map((r, index) => {
                      const cantidad = parseInt(r.cantidad, 10) || 1;
                      const precio = parseFloat(r.precio_unitario) || 0;
                      const subtotal = cantidad * precio;

                      return (
                        <tr key={r.id || index}>
                          <td className="text-center font-weight-bold">{index + 1}</td>
                          <td>
                            <div className="font-weight-bold text-dark">
                              {r.bien_descripcion || r.descripcion || 'Bien Institucional'}
                            </div>
                            {r.observacion && (
                              <small className="text-muted d-block mt-1">
                                Nota: {r.observacion}
                              </small>
                            )}
                          </td>
                          <td className="text-center">
                            <span className="badge-trimestre">
                              {r.trimestre || '1ER TRIMESTRE'}
                            </span>
                          </td>
                          <td className="text-center font-weight-bold">{cantidad}</td>
                          <td className="text-end">
                            ${precio.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="text-end font-weight-bold text-primary">
                            ${subtotal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="detalle-monto-resumen">
              <span>Monto Total Estimado:</span>
              <strong>${montoTotal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</strong>
            </div>
          </div>
        </div>

        {/* Columna Lateral de Evaluación Administrativa (Únicamente activo en vista PENDIENTES) */}
        {mostrarPanelLateral && (
          <div className="detalle-panel-evaluacion slide-in-right-animation">
            <h3 className="panel-title">Evaluación Administrativa</h3>
            <p className="panel-subtitle">
              Audite la solicitud y determine la aprobación o devolución del requerimiento.
            </p>

            {!mostrarCampoRechazo ? (
              <div className="panel-buttons-stack">
                <button
                  type="button"
                  className="btn-tupi btn-tupi-primario btn-block"
                  disabled={isSubmitting}
                  onClick={handleAprobarClick}
                >
                  {isSubmitting ? (
                    <Loader2 size={16} className="spinner-rotation" />
                  ) : (
                    <>
                      <CheckCircle2 size={16} />
                      <span>Aprobar Solicitud</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  className="btn-tupi btn-tupi-peligro btn-block"
                  disabled={isSubmitting}
                  onClick={() => setMostrarCampoRechazo(true)}
                >
                  <XCircle size={16} />
                  <span>Devolver / Rechazar</span>
                </button>
              </div>
            ) : (
              <div className="panel-rechazo-box scale-up-animation">
                <label className="form-label font-weight-bold text-danger mb-1">
                  Motivo de la Devolución:
                </label>
                <textarea
                  className="form-control mb-2"
                  rows="4"
                  disabled={isSubmitting}
                  placeholder="Escriba aquí la observación o retroalimentación..."
                  value={motivoRechazo}
                  onChange={(e) => setMotivoRechazo(e.target.value)}
                />
                {errorRechazo && (
                  <small className="text-danger d-block mb-2 font-weight-bold">
                    {errorRechazo}
                  </small>
                )}

                <div className="d-flex gap-2 mt-3">
                  <button
                    type="button"
                    className="btn-tupi btn-tupi-peligro flex-1"
                    disabled={isSubmitting}
                    onClick={handleConfirmarRechazoClick}
                  >
                    {isSubmitting ? (
                      <Loader2 size={16} className="spinner-rotation" />
                    ) : (
                      <span>Confirmar Devolución</span>
                    )}
                  </button>

                  <button
                    type="button"
                    className="btn-tupi btn-tupi-secundario flex-1"
                    disabled={isSubmitting}
                    onClick={() => {
                      setMostrarCampoRechazo(false);
                      setMotivoRechazo('');
                      setErrorRechazo('');
                    }}
                  >
                    <span>Cancelar</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default DetalleSolicitud;                                            