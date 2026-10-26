import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  Check, 
  X, 
  Download, 
  FileText, 
  FileSpreadsheet, 
  Search, 
  ChevronDown, 
  ChevronUp, 
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
  
  const [downloadDropdownOpen, setDownloadDropdownOpen] = useState(null);
  const dropdownRef = useRef(null);

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
      Swal.fire('Error', 'Error de conexión con el servidor al consultar pendientes.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const currentToken = token || localStorage.getItem('tupi_token') || localStorage.getItem('token');
    if (currentToken) {
      cargarPendientes();
    }
  }, [token]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDownloadDropdownOpen(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleExpand = (id, e) => {
    if (e) e.stopPropagation();
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const toggleDownloadMenu = (id, e) => {
    if (e) e.stopPropagation();
    setDownloadDropdownOpen((prev) => (prev === id ? null : id));
  };

  const handleAprobar = (solicitudId, e) => {
    if (e) e.stopPropagation();
    Swal.fire({
      title: '¿Aprobar Solicitud?',
      text: 'La solicitud quedará autorizada y lista para emitir comprobantes.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#059669',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Sí, aprobar',
      cancelButtonText: 'Cancelar'
    }).then(async (result) => {
      if (result.isConfirmed) {
        await procesarDecision(solicitudId, 'APROBADA');
      }
    });
  };

  const handleRechazar = (solicitudId, e) => {
    if (e) e.stopPropagation();
    Swal.fire({
      title: 'Rechazar Solicitud',
      text: 'Ingrese las observaciones o el motivo del rechazo:',
      input: 'textarea',
      inputPlaceholder: 'Escriba las correcciones requeridas...',
      showCancelButton: true,
      confirmButtonColor: '#e11d48',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Rechazar y Devolver',
      cancelButtonText: 'Cancelar',
      inputValidator: (value) => {
        if (!value || !value.trim()) {
          return '¡Debe ingresar un motivo para poder rechazar la solicitud!';
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
          title: estado === 'APROBADA' ? 'Solicitud Autorizada' : 'Solicitud Devuelta',
          text: estado === 'APROBADA' 
            ? 'Se registró la aprobación con éxito.' 
            : 'Se devolvió la solicitud al usuario para correcciones.',
          confirmButtonColor: '#0284c7'
        });
        cargarPendientes();
      } else {
        const errData = await res.json();
        Swal.fire('Error', errData.error || 'No se pudo procesar la solicitud.', 'error');
      }
    } catch (err) {
      console.error('Error procesando decisión:', err);
      Swal.fire('Error', 'Error de conexión con el servidor.', 'error');
    } finally {
      setProcesandoId(null);
    }
  };

  const handleDescargarPDF = async (solicitudId) => {
    setDownloadDropdownOpen(null);
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
        Swal.fire('Error', 'No se pudo generar el documento PDF.', 'error');
      }
    } catch (err) {
      console.error('Error al descargar PDF:', err);
      Swal.fire('Error', 'Error al conectar con el servidor.', 'error');
    }
  };

  const handleDescargarExcel = async (solicitudId) => {
    setDownloadDropdownOpen(null);
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
        Swal.fire('Error', 'No se pudo generar la planilla de Excel.', 'error');
      }
    } catch (err) {
      console.error('Error al descargar Excel:', err);
      Swal.fire('Error', 'Error al conectar con el servidor.', 'error');
    }
  };

  const pendientesFiltradas = solicitudes.filter((s) =>
    s.nro_convocatoria?.toLowerCase().includes(busqueda.toLowerCase()) ||
    s.usuario_nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
    s.usuario_apellido?.toLowerCase().includes(busqueda.toLowerCase()) ||
    String(s.id).includes(busqueda)
  );

  return (
    <div className="pendientes-container">
      <div className="pendientes-header">
        <div>
          <h1 className="pendientes-title">Gestión de Solicitudes Pendientes</h1>
          <p className="pendientes-subtitle">Panel de aprobación y revisión administrativa</p>
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
            <Loader2 size={28} className="spinner-rotation text-primary mx-auto" />
            <p className="mt-2 text-muted small">Cargando solicitudes...</p>
          </div>
        ) : pendientesFiltradas.length === 0 ? (
          <div className="text-center py-5 text-muted">
            <UserCheck size={36} className="mb-2 mx-auto text-gray" />
            <p className="small">No se encontraron solicitudes con el filtro seleccionado.</p>
          </div>
        ) : (
          <div className="solicitudes-list">
            {pendientesFiltradas.map((sol) => {
              const isExpanded = expandedId === sol.id;
              const estaProcesando = procesandoId === sol.id;
              const esAprobada = sol.estado === 'APROBADA';
              const isDropdownOpen = downloadDropdownOpen === sol.id;

              const totalMonto = (sol.renglones || []).reduce(
                (acc, r) => acc + (parseFloat(r.precio_unitario) * parseInt(r.cantidad, 10) || 0),
                0
              );

              return (
                <div key={sol.id} className={`pendientes-item-card ${isExpanded ? 'expanded' : ''}`}>
                  <div className="solicitud-main-row" onClick={(e) => toggleExpand(sol.id, e)}>
                    
                    <div className="solicitud-info">
                      <div className="solicitud-id-row">
                        <span className="solicitud-id">Solicitud #{sol.id}</span>
                        <span className={`badge-estado ${sol.estado.toLowerCase()}`}>{sol.estado}</span>
                      </div>
                      <div className="solicitud-meta">
                        <span><strong>Solicitante:</strong> {sol.usuario_nombre} {sol.usuario_apellido} ({sol.dependencia_nombre})</span>
                        <span className="meta-separator">•</span>
                        <span><strong>Convocatoria:</strong> {sol.nro_convocatoria || 'CDC:2026/01'}</span>
                      </div>
                    </div>

                    <div className="solicitud-right-zone">
                      <div className="solicitud-monto-box">
                        <span className="monto-label">Monto Estimado</span>
                        <strong className="monto-valor">${totalMonto.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</strong>
                      </div>

                      <div className="btn-group-actions" onClick={(e) => e.stopPropagation()}>
                        {!esAprobada && (
                          <div className="buttons-row">
                            <button
                              type="button"
                              className="btn-tupi btn-tupi-primario"
                              disabled={estaProcesando}
                              onClick={(e) => handleAprobar(sol.id, e)}
                            >
                              <Check size={14} />
                              <span>Aprobar</span>
                            </button>

                            <button
                              type="button"
                              className="btn-tupi btn-tupi-peligro"
                              disabled={estaProcesando}
                              onClick={(e) => handleRechazar(sol.id, e)}
                            >
                              <X size={14} />
                              <span>Rechazar</span>
                            </button>
                          </div>
                        )}

                        {esAprobada && (
                          <div className="download-dropdown-wrapper" ref={isDropdownOpen ? dropdownRef : null}>
                            <button
                              type="button"
                              className="btn-tupi btn-tupi-descarga"
                              onClick={(e) => toggleDownloadMenu(sol.id, e)}
                            >
                              <Download size={14} />
                              <span>Descargar</span>
                              <ChevronDown size={13} />
                            </button>

                            {isDropdownOpen && (
                              <div className="download-menu-dropdown">
                                <button 
                                  type="button"
                                  className="download-menu-item"
                                  onClick={() => handleDescargarPDF(sol.id)}
                                >
                                  <FileText size={15} className="text-pdf" />
                                  <span>Documento PDF (.pdf)</span>
                                </button>
                                <button 
                                  type="button"
                                  className="download-menu-item"
                                  onClick={() => handleDescargarExcel(sol.id)}
                                >
                                  <FileSpreadsheet size={15} className="text-excel" />
                                  <span>Planilla Excel (.xlsx)</span>
                                </button>
                              </div>
                            )}
                          </div>
                        )}

                        <button 
                          type="button" 
                          className="btn-toggle-expand" 
                          onClick={(e) => toggleExpand(sol.id, e)}
                          title={isExpanded ? 'Contraer' : 'Expandir'}
                        >
                          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
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
                          {sol.renglones && sol.renglones.length > 0 ? (
                            sol.renglones.map((item) => {
                              const cant = parseInt(item.cantidad, 10) || 1;
                              const precio = parseFloat(item.precio_unitario) || 0;
                              const subtotal = cant * precio;

                              return (
                                <tr key={item.id || item.bien_id}>
                                  <td><strong>{item.bien_descripcion}</strong></td>
                                  <td className="text-center">
                                    <span className="badge-trimestre">
                                      {item.trimestre || '1ER TRIMESTRE'}
                                    </span>
                                  </td>
                                  <td className="text-center">{cant}</td>
                                  <td className="text-right">
                                    ${precio.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                                  </td>
                                  <td className="text-right font-bold text-primary">
                                    ${subtotal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                                  </td>
                                  <td>{item.observacion || '-'}</td>
                                </tr>
                              );
                            })
                          ) : (
                            <tr>
                              <td colSpan="6" className="text-center py-3 text-muted small">
                                Sin registros asociados.
                              </td>
                            </tr>
                          )}
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