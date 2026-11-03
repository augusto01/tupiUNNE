import React, { useState } from 'react';
import { 
  ArrowLeft, 
  FileText, 
  FileSpreadsheet, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  User, 
  Building2, 
  Calendar, 
  Layers,
  MessageSquare,
  FileEdit,
  Loader2
} from 'lucide-react';
import './DetalleSolicitud.css';
import './PlanComprasABM.css';

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
  const [motivoRechazo, setMotivoRechazo] = useState('');
  const [errorRechazo, setErrorRechazo] = useState('');
  const [mostrarCampoRechazo, setMostrarCampoRechazo] = useState(false);
  const [loadingLocal, setLoadingLocal] = useState(false);

  if (!solicitud) return null;

  const esEditable = solicitud.estado === 'BORRADOR' || solicitud.estado === 'RECHAZADA';
  const esAprobada = solicitud.estado === 'APROBADA';
  const mostrarPanelLateral = esModoEvaluacion && solicitud.estado === 'PENDIENTE';
  const isSubmitting = estaProcesando || loadingLocal;

  const renglones = solicitud.renglones || solicitud.registros || [];
  const montoTotal = renglones.reduce((acc, r) => {
    const cant = parseInt(r.cantidad, 10) || 1;
    const precio = parseFloat(r.precio_unitario) || 0;
    return acc + cant * precio;
  }, 0);

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
      {/* Encabezado */}
      <div className="detalle-header-bar">
        <div className="d-flex align-items-center gap-3 flex-wrap">
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

        <div className="summary-actions-group">
          {esEditable && !esModoEvaluacion && onEditar && (
            <button
              type="button"
              className="btn-tupi btn-tupi-editar"
              onClick={() => onEditar(solicitud)}
              disabled={isSubmitting}
            >
              <FileEdit size={16} />
              <span>Editar Solicitud</span>
            </button>
          )}

          {esAprobada && (
            <div className="download-inline-buttons">
              <button
                type="button"
                className="btn-tupi btn-tupi-pdf btn-sm-tupi"
                onClick={() => onDescargarPDF && onDescargarPDF(solicitud.id)}
                title="Descargar comprobante en PDF"
              >
                <FileText size={14} />
                <span>PDF</span>
              </button>

              <button
                type="button"
                className="btn-tupi btn-tupi-excel btn-sm-tupi"
                onClick={() => onDescargarExcel && onDescargarExcel(solicitud.id)}
                title="Descargar comprobante en Excel"
              >
                <FileSpreadsheet size={14} />
                <span>Excel</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Tarjeta de Metadatos */}
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
              <Layers size={13} className="inline-icon" /> Área Origen
            </span>
            <span className="solicitud-meta-value">
              {solicitud.area_nombre || 'Sin Área Asignada'}
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

          {(solicitud.observaciones || solicitud.observacion) && (
            <div className="solicitud-meta-item">
              <span className="solicitud-meta-label">
                <MessageSquare size={13} className="inline-icon" /> Observaciones
              </span>
              <span className="solicitud-meta-value">
                {solicitud.observaciones || solicitud.observacion}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 🎯 Banner de Rechazo Centrado y Responsivo */}
      {solicitud.motivo_rechazo && (
        <div className="motivo-rechazo-banner mb-4">
          <AlertTriangle size={22} className="banner-icon" />
          <div className="banner-content">
            <strong>Observaciones de Devolución / Rechazo:</strong>
            <p>{solicitud.motivo_rechazo}</p>
          </div>
        </div>
      )}

      {/* Grid del Detalle */}
      <div className={`detalle-grid-layout ${!mostrarPanelLateral ? 'sin-panel-evaluacion' : ''}`}>
        <div className="detalle-tabla-container">
          <div className="detalle-card-tabla">
            <div className="card-header-table">
              <h3 className="card-title">Detalle de Bienes Solicitados</h3>
            </div>

            <div className="table-wrapper">
              <table className="detalle-tabla">
                <thead>
                  <tr>
                    <th style={{ width: '60px' }} className="text-center">N°</th>
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

            {/* 🎯 Pie de Monto Total Estilizado como Pill/Tarjeta */}
            <div className="detalle-monto-footer">
              <div className="solicitud-monto-group">
                <span className="solicitud-monto-label">Monto Total Estimado:</span>
                <span className="solicitud-monto-valor">
                  ${montoTotal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>
        </div>

        {mostrarPanelLateral && (
          <div className="detalle-panel-evaluacion">
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
              <div className="panel-rechazo-box">
                <label className="form-label font-weight-bold text-danger mb-1" style={{ fontSize: '0.8rem' }}>
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
                  <small className="text-danger d-block mb-2 font-weight-bold" style={{ fontSize: '0.75rem' }}>
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
                      <span>Confirmar</span>
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