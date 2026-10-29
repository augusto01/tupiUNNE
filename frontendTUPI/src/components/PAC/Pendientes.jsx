import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Eye, Search, UserCheck, Loader2, User, Building2, Calendar, FileSpreadsheet, ShieldCheck, Filter } from 'lucide-react';
import Swal from 'sweetalert2';
import DetalleSolicitud from './DetalleSolicitud';
import './Pendientes.css';

const Pendientes = () => {
  const { fetchAuth, token, user } = useAuth();

  // Obtención robusta del usuario logueado para identificar su rol y UOC
  const usuarioLogueado = user || JSON.parse(localStorage.getItem('tupi_user')) || JSON.parse(localStorage.getItem('usuario')) || {};

// El Autorizante ahora es tipo_usuario_id === 3
const esAutorizanteUoc = parseInt(usuarioLogueado?.tipo_usuario_id, 10) === 3;

const [solicitudes, setSolicitudes] = useState([]);
const [loading, setLoading] = useState(true);
const [busqueda, setBusqueda] = useState('');
const [filtroEstado, setFiltroEstado] = useState('TODOS');
const [solicitudSeleccionada, setSolicitudSeleccionada] = useState(null);
const [procesandoId, setProcesandoId] = useState(null);

  const cargarPendientes = async () => {
    setLoading(true);
    try {
      // Llama al endpoint único. El backend filtra por la UOC del usuario si es Autorizante (tipo_usuario_id = 4)
      const res = await fetchAuth('/plan-compras/solicitudes-pendientes');
      if (res.ok) {
        const data = await res.json();
        const soloValidas = (Array.isArray(data) ? data : []).filter(
          (s) => s.estado === 'PENDIENTE' || s.estado === 'APROBADA'
        );
        setSolicitudes(soloValidas);
      } else {
        Swal.fire('Error', 'No se pudieron cargar las solicitudes.', 'error');
      }
    } catch (err) {
      console.error('Error al cargar pendientes:', err);
      Swal.fire('Error', 'Error de conexión con el servidor.', 'error');
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

  const handleAprobar = async (solicitudId) => {
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

  const handleRechazar = async (solicitudId, motivo) => {
    await procesarDecision(solicitudId, 'RECHAZADA', motivo);
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
            : 'Se devolvió la solicitud al usuario para que pueda realizar las correcciones.',
          confirmButtonColor: '#0284c7'
        });
        setSolicitudSeleccionada(null);
        cargarPendientes();
      } else {
        const errData = await res.json();
        Swal.fire('Error', errData.error || 'No se pudo procesar la solicitud.', 'error');
      }
    } catch (err) {
      console.error('Error al evaluar solicitud:', err);
      Swal.fire('Error', 'Error de conexión con el servidor.', 'error');
    } finally {
      setProcesandoId(null);
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
      }
    } catch (err) {
      Swal.fire('Error', 'Error al descargar el archivo PDF.', 'error');
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
      }
    } catch (err) {
      Swal.fire('Error', 'Error al descargar la planilla de Excel.', 'error');
    }
  };

  if (solicitudSeleccionada) {
    return (
      <div className="pendientes-container">
        <DetalleSolicitud
          solicitud={solicitudSeleccionada}
          esModoEvaluacion={true}
          onVolver={() => setSolicitudSeleccionada(null)}
          onAprobar={handleAprobar}
          onRechazar={handleRechazar}
          onDescargarPDF={handleDescargarPDF}
          onDescargarExcel={handleDescargarExcel}
          estaProcesando={procesandoId === solicitudSeleccionada.id}
        />
      </div>
    );
  }

  const pendientesFiltradas = solicitudes
    .filter((s) => {
      const coincideEstado = filtroEstado === 'TODOS' || s.estado === filtroEstado;
      const coincideBusqueda =
        s.nro_convocatoria?.toLowerCase().includes(busqueda.toLowerCase()) ||
        s.usuario_nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
        s.usuario_apellido?.toLowerCase().includes(busqueda.toLowerCase()) ||
        String(s.id).includes(busqueda);
      return coincideEstado && coincideBusqueda;
    })
    .sort((a, b) => {
      if (a.estado === 'PENDIENTE' && b.estado !== 'PENDIENTE') return -1;
      if (a.estado !== 'PENDIENTE' && b.estado === 'PENDIENTE') return 1;
      return b.id - a.id;
    });

  return (
    <div className="pendientes-container">
      {/* ENCABEZADO ADAPTATIVO SEGÚN ROL */}
      <div className="pendientes-header d-flex justify-content-between align-items-center">
        <div>
          <h1 className="pendientes-title">
            {esAutorizanteUoc 
              ? 'Autorización de Solicitudes UOC' 
              : 'Gestión de Solicitudes Pendientes'}
          </h1>
          <p className="pendientes-subtitle">
            {esAutorizanteUoc 
              ? `Revisión y aprobación para la UOC: ${usuarioLogueado?.dependencia || usuarioLogueado?.dependencia_nombre || 'Asignada'}`
              : 'Panel de aprobación y revisión administrativa global'}
          </p>
        </div>

        {/* Badge distintivo para Autorizante */}
        {esAutorizanteUoc && (
          <div className="uoc-badge-container d-flex align-items-center gap-2 p-2 px-3 rounded" style={{ backgroundColor: '#e0f2fe', color: '#0369a1' }}>
            <Building2 size={16} />
            <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>
              UOC: {usuarioLogueado?.dependencia || 'Mi Dependencia'}
            </span>
          </div>
        )}
      </div>

      <div className="pendientes-card mb-4">
        <div className="filters-row">
          <div className="filter-group flex-2">
            <label>Buscar Solicitud</label>
            <div className="search-box">
              <Search size={16} className="search-icon" />
              <input
                type="text"
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
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
            >
              <option value="TODOS">Pendientes y Aprobadas</option>
              <option value="PENDIENTE">Solo Pendientes de Aprobación</option>
              <option value="APROBADA">Solo Aprobadas</option>
            </select>
          </div>
        </div>
      </div>

      <div className="pendientes-card">
        {loading ? (
          <div className="text-center py-5">
            <Loader2 size={28} className="spinner-rotation text-primary mx-auto" />
            <p className="mt-2 text-muted small">Cargando requerimientos...</p>
          </div>
        ) : pendientesFiltradas.length === 0 ? (
          <div className="text-center py-5 text-muted">
            <UserCheck size={36} className="mb-2 mx-auto text-gray" />
            <p className="small">
              {esAutorizanteUoc 
                ? 'No se encontraron solicitudes pendientes en su UOC.' 
                : 'No se encontraron solicitudes con el filtro seleccionado.'}
            </p>
          </div>
        ) : (
          <div className="solicitudes-list">
            {pendientesFiltradas.map((sol) => {
              const totalMonto = (sol.renglones || sol.registros || []).reduce(
                (acc, r) => acc + (parseFloat(r.precio_unitario) * parseInt(r.cantidad, 10) || 0),
                0
              );

              return (
                <div key={sol.id} className="pendientes-item-card">
                  {/* METADATOS Y ENCABEZADO */}
                  <div className="solicitud-header-info">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <strong style={{ fontSize: '1.05rem', color: '#0f172a' }}>
                        Solicitud #{sol.id}
                      </strong>
                      <span className={`badge-estado ${sol.estado.toLowerCase()}`}>{sol.estado}</span>
                    </div>

                    <div className="solicitud-meta-grid">
                      <div className="solicitud-meta-item">
                        <span className="solicitud-meta-label">
                          <User size={12} className="inline-icon" /> Solicitante
                        </span>
                        <span className="solicitud-meta-value">
                          {sol.usuario_nombre} {sol.usuario_apellido}
                        </span>
                      </div>

                      <div className="solicitud-meta-item">
                        <span className="solicitud-meta-label">
                          <Building2 size={12} className="inline-icon" /> Dependencia / UOC
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

                  {/* PIE DE TARJETA CON MONTO ESTIMADO Y BOTÓN DE ACCIÓN */}
                  <div className="solicitud-footer-bar">
                    <div className="solicitud-monto-group">
                      <span className="solicitud-monto-label">Monto Estimado:</span>
                      <span className="solicitud-monto-valor">
                        ${totalMonto.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>

                    <div className="solicitud-actions-group">
                      <button
                        type="button"
                        className="btn-tupi btn-tupi-primario"
                        onClick={() => setSolicitudSeleccionada(sol)}
                      >
                        <Eye size={15} />
                        <span>Evaluar Solicitud</span>
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

export default Pendientes;