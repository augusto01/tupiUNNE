import React, { useState } from 'react';
import { 
  ArrowLeft, 
  CheckCircle2, 
  XCircle, 
  FileText, 
  Download, 
  AlertCircle, 
  Loader2,
  ChevronDown,
  FileEdit
} from 'lucide-react';
import '../PAC/PlanComprasABM.css';

const DetalleSolicitud = ({ 
  solicitud, 
  esModoEvaluacion = false, 
  onVolver, 
  onEditar, 
  onAprobar, 
  onRechazar, 
  onDescargarPDF, 
  onDescargarExcel,
  estaProcesando = false 
}) => {
  const [mostrarCampoRechazo, setMostrarCampoRechazo] = useState(false);
  const [motivoRechazoText, setMotivoRechazoText] = useState('');
  const [mostrarMenuDescarga, setMostrarMenuDescarga] = useState(false);

  if (!solicitud) return null;

  const renglones = solicitud.renglones || solicitud.registros || [];
  const totalMonto = renglones.reduce(
    (acc, r) => acc + (parseFloat(r.precio_unitario) * parseInt(r.cantidad, 10) || 0),
    0
  );

  // 🔒 EDICIÓN HABILITADA SOLO EN BORRADOR O RECHAZADA
  const esEditable = solicitud.estado === 'BORRADOR' || solicitud.estado === 'RECHAZADA';
  
  // ⛔ CONDICIÓN ESTRICTA: SOLO SE RENDERIZA EL BOTÓN SI ESTÁ APROBADA
  const estaAprobada = solicitud.estado === 'APROBADA';

  const handleEjecutarRechazar = () => {
    if (!motivoRechazoText.trim()) {
      alert('Por favor, ingrese un motivo para rechazar/devolver la solicitud.');
      return;
    }
    onRechazar(solicitud.id, motivoRechazoText.trim());
  };

  const renderBadgeEstado = (estado) => {
    switch (estado) {
      case 'PENDIENTE':
        return <span className="badge-estado pendiente">Pendiente de Aprobación</span>;
      case 'APROBADA':
        return <span className="badge-estado aprobada">Aprobada</span>;
      case 'RECHAZADA':
        return <span className="badge-estado rechazada">Rechazada</span>;
      case 'BORRADOR':
        return <span className="badge-estado borrador">Borrador</span>;
      default:
        return <span className="badge-estado">{estado}</span>;
    }
  };

  return (
    <div className="detalle-solicitud-wrapper content-section-fade">
      {/* BARRA SUPERIOR DE NAVEGACIÓN Y ACCIONES */}
      <div className="abm-header d-flex justify-content-between align-items-center mb-4">
        <div className="d-flex align-items-center gap-3">
          <button 
            type="button" 
            className="btn-tupi btn-tupi-descarga"
            onClick={onVolver}
            disabled={estaProcesando}
          >
            <ArrowLeft size={16} />
            <span>Volver</span>
          </button>
          <div>
            <h1 className="abm-title mb-0">Solicitud #{solicitud.id}</h1>
            <p className="abm-subtitle mb-0">
              Convocatoria: <strong>{solicitud.nro_convocatoria || 'CDC:2026/01'}</strong>
            </p>
          </div>
        </div>

        <div className="d-flex align-items-center gap-2">
          {/* BOTÓN EDITAR DIRECTO SI LA SOLICITUD ESTÁ RECHAZADA O EN BORRADOR */}
          {esEditable && onEditar && (
            <button
              type="button"
              className="btn-tupi btn-tupi-secundario"
              onClick={() => onEditar(solicitud)}
              disabled={estaProcesando}
            >
              <FileEdit size={15} />
              <span>Editar Solicitud</span>
            </button>
          )}

          {/* MENÚ DE DESCARGAS: APARECE ÚNICAMENTE CUANDO ESTÁ APROBADA */}
          {estaAprobada && (
            <div className="download-dropdown-wrapper">
              <button
                type="button"
                className="btn-tupi btn-tupi-descarga"
                onClick={() => setMostrarMenuDescarga(!mostrarMenuDescarga)}
                disabled={estaProcesando}
              >
                <Download size={15} />
                <span>Exportar Documento</span>
                <ChevronDown size={14} />
              </button>

              {mostrarMenuDescarga && (
                <div className="download-menu-dropdown">
                  <button
                    type="button"
                    className="download-menu-item"
                    onClick={() => {
                      setMostrarMenuDescarga(false);
                      onDescargarPDF(solicitud.id);
                    }}
                  >
                    <FileText size={16} className="text-pdf" />
                    <span>Comprobante PDF</span>
                  </button>
                  <button
                    type="button"
                    className="download-menu-item"
                    onClick={() => {
                      setMostrarMenuDescarga(false);
                      onDescargarExcel(solicitud.id);
                    }}
                  >
                    <FileText size={16} className="text-excel" />
                    <span>Planilla Excel (.xlsx)</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* BANNER DE MOTIVO DE RECHAZO */}
      {(solicitud.motivo_rechazo || solicitud.estado === 'RECHAZADA') && (
        <div className="motivo-rechazo-banner mb-4">
          <AlertCircle size={20} className="banner-icon" />
          <div>
            <strong>Observación / Motivo de Devolución:</strong>
            <p className="mb-0 mt-1">{solicitud.motivo_rechazo || 'La solicitud requiere correcciones antes de ser aprobada.'}</p>
          </div>
        </div>
      )}

      {/* METADATOS PRINCIPALES DE LA SOLICITUD */}
      <div className="abm-card mb-4">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h2 className="card-title">Información General</h2>
          {renderBadgeEstado(solicitud.estado)}
        </div>
        <div className="row p-2">
          <div className="col-md-4 mb-2">
            <span className="text-muted small d-block">Solicitante</span>
            <strong>
              {solicitud.usuario_nombre ? `${solicitud.usuario_nombre} ${solicitud.usuario_apellido}` : 'Usuario Sistema'}
            </strong>
          </div>
          <div className="col-md-4 mb-2">
            <span className="text-muted small d-block">Dependencia / Unidad Académica</span>
            <strong>{solicitud.dependencia_nombre || 'Rectorado UNNE'}</strong>
          </div>
          <div className="col-md-4 mb-2">
            <span className="text-muted small d-block">Fecha de Emisión</span>
            <strong>
              {solicitud.fecha_creacion 
                ? new Date(solicitud.fecha_creacion).toLocaleDateString('es-AR') 
                : 'N/A'}
            </strong>
          </div>
        </div>
      </div>

      {/* TABLA DE RENGLONES Y PANEL DE EVALUACIÓN */}
      <div className="detalle-grid-layout">
        <div className="detalle-tabla-container">
          <div className="abm-card mb-0">
            <div className="card-header">
              <h2 className="card-title">Bienes y Requerimientos Solicitados</h2>
            </div>
            <div className="table-wrapper">
              <table className="abm-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Bien / Descripción</th>
                    <th className="text-center">Trimestre</th>
                    <th className="text-center">Cantidad</th>
                    <th className="text-right">Precio Unit ($)</th>
                    <th className="text-right">Subtotal ($)</th>
                    <th>Observación Técnica</th>
                  </tr>
                </thead>
                <tbody>
                  {renglones.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="text-center py-4 text-muted">
                        No hay bienes registrados en esta solicitud.
                      </td>
                    </tr>
                  ) : (
                    renglones.map((r, index) => {
                      const cant = parseInt(r.cantidad, 10) || 1;
                      const pu = parseFloat(r.precio_unitario) || 0;
                      const sub = cant * pu;

                      return (
                        <tr key={r.id || index}>
                          <td className="text-center text-muted">{index + 1}</td>
                          <td>
                            <strong>{r.bien_descripcion || r.descripcion || 'Bien Registrado'}</strong>
                          </td>
                          <td className="text-center">
                            <span className="badge-trimestre">{r.trimestre || '1ER TRIMESTRE'}</span>
                          </td>
                          <td className="text-center">{cant}</td>
                          <td className="text-right">${pu.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</td>
                          <td className="text-right font-bold text-primary">
                            ${sub.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="small text-muted">{r.observacion || '-'}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="detalle-monto-resumen p-3">
              <span>Monto Total Estimado:</span>
              <strong>${totalMonto.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</strong>
            </div>
          </div>
        </div>

        {/* PANEL LATERAL DE DECISIÓN ADMINISTRATIVA */}
        {esModoEvaluacion && solicitud.estado === 'PENDIENTE' && (
          <div className="detalle-panel-evaluacion">
            <h3 className="panel-title">Decisión Administrativa</h3>
            <p className="panel-subtitle">Autorice o devuelva la orden para revisión.</p>

            {!mostrarCampoRechazo ? (
              <div className="panel-buttons-stack">
                <button
                  type="button"
                  className="btn-tupi btn-tupi-primario btn-block"
                  disabled={estaProcesando}
                  onClick={() => onAprobar(solicitud.id)}
                >
                  {estaProcesando ? (
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
                  disabled={estaProcesando}
                  onClick={() => setMostrarCampoRechazo(true)}
                >
                  <XCircle size={16} />
                  <span>Rechazar / Devolver</span>
                </button>
              </div>
            ) : (
              <div className="panel-rechazo-box">
                <label className="form-label small font-bold text-danger">Motivo de Rechazo *</label>
                <textarea
                  className="form-control mb-2"
                  rows="3"
                  disabled={estaProcesando}
                  placeholder="Ingrese las observaciones técnicas para el solicitante..."
                  value={motivoRechazoText}
                  onChange={(e) => setMotivoRechazoText(e.target.value)}
                ></textarea>

                <div className="d-flex gap-2">
                  <button
                    type="button"
                    className="btn-tupi btn-tupi-peligro flex-1"
                    disabled={estaProcesando}
                    onClick={handleEjecutarRechazar}
                  >
                    {estaProcesando ? (
                      <Loader2 size={14} className="spinner-rotation" />
                    ) : (
                      <span>Confirmar Rechazo</span>
                    )}
                  </button>
                  <button
                    type="button"
                    className="btn-tupi btn-tupi-descarga"
                    disabled={estaProcesando}
                    onClick={() => {
                      setMostrarCampoRechazo(false);
                      setMotivoRechazoText('');
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