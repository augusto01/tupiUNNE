import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Check, 
  X, 
  FileText, 
  FileSpreadsheet, 
  AlertTriangle, 
  Building2, 
  User, 
  UserCheck,
  Calendar, 
  Tag 
} from 'lucide-react';

const DetalleSolicitud = ({
  solicitud,
  esModoEvaluacion = true,
  onVolver,
  onAprobar,
  onRechazar,
  onDescargarPDF,
  onDescargarExcel,
  estaProcesando = false
}) => {
  const [motivoRechazo, setMotivoRechazo] = useState('');
  const [mostrarCampoRechazo, setMostrarCampoRechazo] = useState(false);
  const [errorMotivo, setErrorMotivo] = useState('');

  if (!solicitud) return null;

  const renglones = solicitud.renglones || [];
  const totalMonto = renglones.reduce(
    (acc, r) => acc + (parseFloat(r.precio_unitario) * parseInt(r.cantidad, 10) || 0),
    0
  );

  const esAprobada = solicitud.estado === 'APROBADA';
  const esRechazada = solicitud.estado === 'RECHAZADA';

  // 🔍 OBTENCIÓN ROBUSTA Y MULTI-CAMPO DEL SOLICITANTE (SIN TOCAR BACKEND)
  const solicitanteNombre = (() => {
    if (solicitud.usuario_nombre || solicitud.usuario_apellido) {
      return `${solicitud.usuario_nombre || ''} ${solicitud.usuario_apellido || ''}`.trim();
    }
    if (solicitud.nombre || solicitud.apellido) {
      return `${solicitud.nombre || ''} ${solicitud.apellido || ''}`.trim();
    }
    if (solicitud.solicitante) {
      return solicitud.solicitante;
    }
    return solicitud.usuario_email || solicitud.email || 'Solicitante N/A';
  })();

  // OBTENCIÓN ROBUSTA DEL AUTORIZANTE
  const autorizanteNombre = (() => {
    if (solicitud.admin_nombre || solicitud.admin_apellido) {
      return `${solicitud.admin_nombre || ''} ${solicitud.admin_apellido || ''}`.trim();
    }
    if (solicitud.usuario_autorizante) {
      return `Usuario #${solicitud.usuario_autorizante}`;
    }
    return 'Pendiente de Aprobación';
  })();

  const handleConfirmarRechazo = () => {
    if (!motivoRechazo.trim()) {
      setErrorMotivo('Debe especificar la razón o nota explicativa del rechazo.');
      return;
    }
    setErrorMotivo('');
    onRechazar(solicitud.id, motivoRechazo);
  };

  return (
    <div className="detalle-pantalla-container">
      {/* BARRA SUPERIOR */}
      <div className="d-flex align-items-center justify-content-between mb-4">
        <button type="button" className="btn-tupi btn-tupi-descarga" onClick={onVolver}>
          <ArrowLeft size={16} />
          <span>Volver al Listado</span>
        </button>

        {esAprobada && (
          <div className="d-flex align-items-center gap-2">
            <span className="text-muted small">Descargar Comprobantes:</span>
            <button
              type="button"
              className="btn-tupi btn-tupi-descarga"
              onClick={() => onDescargarPDF(solicitud.id)}
            >
              <FileText size={15} className="text-pdf" />
              <span>PDF (.pdf)</span>
            </button>

            <button
              type="button"
              className="btn-tupi btn-tupi-descarga"
              onClick={() => onDescargarExcel(solicitud.id)}
            >
              <FileSpreadsheet size={15} className="text-excel" />
              <span>Excel (.xlsx)</span>
            </button>
          </div>
        )}
      </div>

      {/* BANNER SI POSEE MOTIVO DE RECHAZO */}
      {(solicitud.motivo_rechazo || esRechazada) && (
        <div className="motivo-rechazo-banner mb-4">
          <AlertTriangle size={18} className="banner-icon" />
          <div>
            <strong>Observaciones de la devolución:</strong>
            <p className="mb-0 small">{solicitud.motivo_rechazo || 'La solicitud requiere correcciones antes de su aprobación.'}</p>
          </div>
        </div>
      )}

      {/* CABECERA Y METADATOS */}
      <div className="abm-card mb-4">
        <div className="d-flex align-items-center justify-content-between mb-3 border-bottom pb-2">
          <div className="d-flex align-items-center gap-2">
            <h2 className="abm-title">Solicitud #{solicitud.id}</h2>
            <span className={`badge-estado ${solicitud.estado.toLowerCase()}`}>{solicitud.estado}</span>
          </div>
        </div>

        <div className="modal-metadata-grid">
          <div className="meta-item">
            <User size={16} className="meta-icon" />
            <div>
              <span className="meta-label">Solicitante</span>
              <strong className="meta-value">{solicitanteNombre}</strong>
            </div>
          </div>

          <div className="meta-item">
            <Building2 size={16} className="meta-icon" />
            <div>
              <span className="meta-label">Dependencia</span>
              <strong className="meta-value">{solicitud.dependencia_nombre || 'Rectorado UNNE'}</strong>
            </div>
          </div>

          <div className="meta-item">
            <Tag size={16} className="meta-icon" />
            <div>
              <span className="meta-label">Convocatoria</span>
              <strong className="meta-value">{solicitud.nro_convocatoria || 'CDC:2026/01'}</strong>
            </div>
          </div>

          <div className="meta-item">
            <Calendar size={16} className="meta-icon" />
            <div>
              <span className="meta-label">Fecha Emisión</span>
              <strong className="meta-value">
                {solicitud.fecha_creacion ? new Date(solicitud.fecha_creacion).toLocaleDateString('es-AR') : 'N/A'}
              </strong>
            </div>
          </div>

          {esAprobada && (
            <div className="meta-item">
              <UserCheck size={16} className="meta-icon text-success" />
              <div>
                <span className="meta-label">Usuario Autorizante</span>
                <strong className="meta-value">{autorizanteNombre}</strong>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ESTRUCTURA PRINCIPAL DE BIENES */}
      <div className="detalle-grid-layout">
        <div className="detalle-tabla-container abm-card">
          <div className="card-header">
            <h3 className="card-title">Detalle de Bienes Solicitados</h3>
          </div>

          <div className="table-wrapper">
            <table className="abm-table">
              <thead>
                <tr>
                  <th>Bien / Descripción</th>
                  <th className="text-center" style={{ width: '130px' }}>Trimestre Base</th>
                  <th className="text-center" style={{ width: '80px' }}>Cant.</th>
                  <th className="text-right" style={{ width: '130px' }}>Precio Unit ($)</th>
                  <th className="text-right" style={{ width: '140px' }}>Subtotal ($)</th>
                  <th style={{ width: '220px' }}>Observación Técnica</th>
                </tr>
              </thead>
              <tbody>
                {renglones.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-4 text-muted small">
                      Sin bienes registrados en esta solicitud.
                    </td>
                  </tr>
                ) : (
                  renglones.map((item) => {
                    const cant = parseInt(item.cantidad, 10) || 1;
                    const precio = parseFloat(item.precio_unitario) || 0;
                    const subtotal = cant * precio;

                    return (
                      <tr key={item.id || item.bien_id}>
                        <td>
                          <strong>{item.bien_descripcion || item.descripcion}</strong>
                        </td>
                        <td className="text-center">
                          <span className="badge-trimestre">
                            {item.trimestre || '1ER TRIMESTRE'}
                          </span>
                        </td>
                        <td className="text-center font-bold">{cant}</td>
                        <td className="text-right">
                          ${precio.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="text-right font-bold text-primary">
                          ${subtotal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                        </td>
                        <td>
                          <span className="text-muted small">{item.observacion || '-'}</span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="detalle-monto-resumen mt-3">
            <span>Monto Total Estimado:</span>
            <strong className="monto-destacado">${totalMonto.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</strong>
          </div>
        </div>

        {/* PANEL ADMINISTRATIVO DE REVISIÓN */}
        {esModoEvaluacion && !esAprobada && !esRechazada && (
          <div className="detalle-panel-evaluacion abm-card">
            <h3 className="card-title mb-2">Dictamen Administrativo</h3>
            <p className="text-muted small mb-3">Emita la resolución presupuestaria para esta solicitud.</p>

            {!mostrarCampoRechazo ? (
              <div className="panel-buttons-stack">
                <button
                  type="button"
                  className="btn-tupi btn-tupi-primario btn-block"
                  disabled={estaProcesando}
                  onClick={() => onAprobar(solicitud.id)}
                >
                  <Check size={16} />
                  <span>Aprobar Solicitud</span>
                </button>

                <button
                  type="button"
                  className="btn-tupi btn-tupi-peligro btn-block"
                  disabled={estaProcesando}
                  onClick={() => setMostrarCampoRechazo(true)}
                >
                  <X size={16} />
                  <span>Rechazar y Devolver</span>
                </button>
              </div>
            ) : (
              <div className="panel-rechazo-box">
                <label className="form-label font-semibold text-danger small mb-1">
                  Motivo de la devolución / correcciones requeridas:
                </label>
                <textarea
                  className="form-control mb-2"
                  rows="3"
                  placeholder="Escriba las observaciones para el usuario..."
                  value={motivoRechazo}
                  onChange={(e) => {
                    setMotivoRechazo(e.target.value);
                    if (e.target.value.trim()) setErrorMotivo('');
                  }}
                  disabled={estaProcesando}
                ></textarea>

                {errorMotivo && <small className="text-danger d-block mb-2">{errorMotivo}</small>}

                <div className="d-flex gap-2">
                  <button
                    type="button"
                    className="btn-tupi btn-tupi-peligro flex-1"
                    disabled={estaProcesando}
                    onClick={handleConfirmarRechazo}
                  >
                    <span>Confirmar Rechazo</span>
                  </button>
                  <button
                    type="button"
                    className="btn-tupi btn-tupi-descarga"
                    disabled={estaProcesando}
                    onClick={() => setMostrarCampoRechazo(false)}
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