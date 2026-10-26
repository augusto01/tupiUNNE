import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  CheckCircle2, 
  XCircle, 
  FileText, 
  Search, 
  ChevronDown, 
  ChevronUp, 
  Printer, 
  UserCheck, 
  Loader2 
} from 'lucide-react';
import Swal from 'sweetalert2';
import './Pendientes.css';

const Pendientes = () => {
  const { fetchAuth, token } = useAuth();

  const [solicitudes, setSolicitudes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [procesandoId, setProcesandoId] = useState(null);

  const cargarPendientes = async () => {
    setLoading(true);
    try {
      const res = await fetchAuth('/plan-compras/solicitudes-pendientes');
      if (res.ok) {
        const data = await res.json();
        setSolicitudes(Array.isArray(data) ? data : []);
      } else {
        Swal.fire('Error', 'No se pudieron cargar las solicitudes pendientes.', 'error');
      }
    } catch (err) {
      console.error('Error al cargar pendientes:', err);
    } finally {
      setLoading(false);
    }
  };

  // Función para descargar Excel
const handleImprimirExcel = async (solicitudId) => {
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
    } else {
      Swal.fire('Error', 'No se pudo generar la planilla Excel.', 'error');
    }
  } catch (err) {
    Swal.fire('Error', 'Error al descargar el archivo Excel.', 'error');
  }
};

  useEffect(() => {
    if (token || localStorage.getItem('tupi_token')) {
      cargarPendientes();
    }
  }, [token]);

  const toggleExpand = (id, e) => {
    if (e) e.stopPropagation();
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const handleAprobar = (solicitudId) => {
    Swal.fire({
      title: '¿Aprobar Solicitud?',
      text: 'La solicitud quedará autorizada y lista para imprimir comprobante.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#16a34a',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Sí, aprobar'
    }).then(async (result) => {
      if (result.isConfirmed) {
        await procesarDecision(solicitudId, 'APROBADA');
      }
    });
  };

  const handleRechazar = (solicitudId) => {
    Swal.fire({
      title: 'Rechazar Solicitud',
      text: 'Ingrese la retroalimentación o motivo del rechazo para el usuario:',
      input: 'textarea',
      inputPlaceholder: 'Escriba las correcciones requeridas...',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Rechazar y Devolver',
      inputValidator: (value) => {
        if (!value) {
          return '¡Debe ingresar un motivo para poder rechazar!';
        }
      }
    }).then(async (result) => {
      if (result.isConfirmed) {
        await procesarDecision(solicitudId, 'RECHAZADA', result.value);
      }
    });
  };

  const procesarDecision = async (id, estado, motivo = null) => {
    setProcesandoId(id);
    try {
      const res = await fetchAuth(`/plan-compras/solicitudes/${id}/evaluar`, {
        method: 'POST',
        body: JSON.stringify({ estado, motivo_rechazo: motivo })
      });

      if (res.ok) {
        Swal.fire({
          icon: 'success',
          title: estado === 'APROBADA' ? '¡Solicitud Aprobada!' : 'Solicitud Devuelta',
          text: estado === 'APROBADA' 
            ? 'Se ha generado la autorización correctamente.' 
            : 'El usuario ya puede editar la solicitud con sus observaciones.'
        });
        cargarPendientes();
      } else {
        const errData = await res.json();
        Swal.fire('Error', errData.error || 'No se pudo procesar la solicitud.', 'error');
      }
    } catch (err) {
      Swal.fire('Error', 'Error de conexión con el servidor.', 'error');
    } finally {
      setProcesandoId(null);
    }
  };

  const handleImprimirPDF = async (solicitudId) => {
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
      } else {
        Swal.fire('Error', 'No se pudo generar el documento PDF.', 'error');
      }
    } catch (err) {
      Swal.fire('Error', 'Error al descargar el PDF.', 'error');
    }
  };

  const pendientesFiltradas = solicitudes.filter((s) =>
    s.nro_convocatoria?.toLowerCase().includes(busqueda.toLowerCase()) ||
    s.usuario_nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
    String(s.id).includes(busqueda)
  );

  return (
    <div className="pendientes-container">
      <div className="pendientes-header">
        <div>
          <h1 className="pendientes-title">Gestión de Solicitudes Pendientes</h1>
          <p className="pendientes-subtitle">Panel de aprobación y revisión para Administradores</p>
        </div>
      </div>

      <div className="pendientes-card mb-4">
        <div className="search-box">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            className="form-control search-input"
            placeholder="Buscar por N° Convocatoria, ID o Usuario..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>
      </div>

      <div className="pendientes-card">
        {loading ? (
          <div className="text-center py-5">
            <Loader2 size={30} className="spinner-rotation text-primary" />
            <p className="mt-2 text-muted">Cargando requerimientos...</p>
          </div>
        ) : pendientesFiltradas.length === 0 ? (
          <div className="text-center py-5 text-muted">
            <UserCheck size={40} className="mb-2" />
            <p>No hay solicitudes pendientes de revisión.</p>
          </div>
        ) : (
          <div className="solicitudes-list">
            {pendientesFiltradas.map((sol) => {
              const isExpanded = expandedId === sol.id;
              const estaProcesando = procesandoId === sol.id;
              const esAprobada = sol.estado === 'APROBADA';

              const totalMonto = (sol.renglones || []).reduce(
                (acc, r) => acc + (parseFloat(r.precio_unitario) * parseInt(r.cantidad, 10) || 0),
                0
              );

              return (
                <div key={sol.id} className={`pendientes-item-card ${isExpanded ? 'expanded' : ''}`}>
                  <div className="solicitud-main-row" onClick={(e) => toggleExpand(sol.id, e)}>
                    <div className="solicitud-info">
                      <div className="d-flex align-items-center gap-2">
                        <span className="solicitud-id">Solicitud #{sol.id}</span>
                        <span className={`badge-estado ${sol.estado.toLowerCase()}`}>{sol.estado}</span>
                      </div>
                      <div className="solicitud-meta">
                        <span><strong>Solicitante:</strong> {sol.usuario_nombre} {sol.usuario_apellido} ({sol.dependencia_nombre})</span>
                        <span>•</span>
                        <span><strong>Convocatoria:</strong> {sol.nro_convocatoria}</span>
                      </div>
                    </div>

                    <div className="solicitud-actions-summary">
                      <div className="solicitud-monto">
                        <small>Monto Total</small>
                        <strong>${totalMonto.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</strong>
                      </div>

                      <div className="btn-group-actions" onClick={(e) => e.stopPropagation()}>
                        {!esAprobada && (
                          <>
                            <button
                              type="button"
                              className="btn btn-success btn-sm d-flex align-items-center gap-1"
                              disabled={estaProcesando}
                              onClick={() => handleAprobar(sol.id)}
                            >
                              <CheckCircle2 size={14} /> Aprobar
                            </button>

                            <button
                              type="button"
                              className="btn btn-danger btn-sm d-flex align-items-center gap-1"
                              disabled={estaProcesando}
                              onClick={() => handleRechazar(sol.id)}
                            >
                              <XCircle size={14} /> Rechazar
                            </button>
                          </>
                        )}

                        {esAprobada && (
                          <button
                            type="button"
                            className="btn btn-outline-primary btn-sm d-flex align-items-center gap-1"
                            onClick={() => handleImprimirPDF(sol.id)}
                          >
                            <Printer size={14} /> Imprimir PDF
                          </button>
                        )}

                        {esAprobada && (
                            <div className="d-flex gap-1">
                                <button
                                type="button"
                                className="btn btn-outline-primary btn-sm d-flex align-items-center gap-1"
                                onClick={() => handleImprimirPDF(sol.id)}
                                title="Descargar Comprobante PDF"
                                >
                                <Printer size={14} /> PDF
                                </button>

                                <button
                                type="button"
                                className="btn btn-outline-success btn-sm d-flex align-items-center gap-1"
                                onClick={() => handleImprimirExcel(sol.id)}
                                title="Exportar a Planilla Excel"
                                >
                                <FileSpreadsheet size={14} /> Excel
                                </button>
                            </div>
                        )}

                        <button type="button" className="btn-toggle-expand" onClick={(e) => toggleExpand(sol.id, e)}>
                          {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="solicitud-detail-body">
                      <table className="pendientes-table">
                        <thead>
                          <tr>
                            <th>Bien / Descripción</th>
                            <th className="text-center">Trimestre</th>
                            <th className="text-center">Cantidad</th>
                            <th className="text-right">Precio Unit ($)</th>
                            <th className="text-right">Subtotal ($)</th>
                            <th>Observación</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sol.renglones.map((item) => (
                            <tr key={item.id}>
                              <td><strong>{item.bien_descripcion}</strong></td>
                              <td className="text-center">{item.trimestre || '1ER TRIMESTRE'}</td>
                              <td className="text-center">{item.cantidad}</td>
                              <td className="text-right">${parseFloat(item.precio_unitario).toFixed(2)}</td>
                              <td className="text-right font-bold">${(item.cantidad * item.precio_unitario).toFixed(2)}</td>
                              <td>{item.observacion || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
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

export default Pendientes;