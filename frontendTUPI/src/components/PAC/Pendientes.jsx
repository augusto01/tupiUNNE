import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Eye, Search, UserCheck, Loader2 } from 'lucide-react';
import Swal from 'sweetalert2';
import DetalleSolicitud from './DetalleSolicitud';
import './Pendientes.css';

const Pendientes = () => {
  const { fetchAuth, token } = useAuth();

  const [solicitudes, setSolicitudes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('TODOS'); // 'TODOS', 'PENDIENTE', 'APROBADA'
  const [solicitudSeleccionada, setSolicitudSeleccionada] = useState(null);
  const [procesandoId, setProcesandoId] = useState(null);

  const cargarPendientes = async () => {
    setLoading(true);
    try {
      const res = await fetchAuth('/plan-compras/solicitudes-pendientes');
      if (res.ok) {
        const data = await res.json();
        // Filtrar estrictamente solo PENDIENTES y APROBADAS
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

  // NAVEGACIÓN A PANTALLA COMPLETA DE INSPECCIÓN/EVALUACIÓN
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

  // Filtrado y Ordenamiento: PENDIENTES ARRIBA DE TODO
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
      // Prioridad 1: PENDIENTE siempre antes que APROBADA
      if (a.estado === 'PENDIENTE' && b.estado !== 'PENDIENTE') return -1;
      if (a.estado !== 'PENDIENTE' && b.estado === 'PENDIENTE') return 1;
      // Prioridad 2: Ordenar por ID descendente
      return b.id - a.id;
    });

  return (
    <div className="pendientes-container">
      <div className="pendientes-header">
        <div>
          <h1 className="pendientes-title">Gestión de Solicitudes Pendientes</h1>
          <p className="pendientes-subtitle">Panel de aprobación y revisión administrativa</p>
        </div>
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
            <p className="small">No se encontraron solicitudes con el filtro seleccionado.</p>
          </div>
        ) : (
          <div className="solicitudes-list">
            {pendientesFiltradas.map((sol) => {
              const totalMonto = (sol.renglones || []).reduce(
                (acc, r) => acc + (parseFloat(r.precio_unitario) * parseInt(r.cantidad, 10) || 0),
                0
              );

              return (
                <div key={sol.id} className="pendientes-item-card">
                  <div className="solicitud-main-row">
                    <div className="solicitud-info">
                      <div className="solicitud-id-row">
                        <span className="solicitud-id">Solicitud #{sol.id}</span>
                        <span className={`badge-estado ${sol.estado.toLowerCase()}`}>{sol.estado}</span>
                      </div>
                      <div className="solicitud-meta">
                        <span><strong>Solicitante:</strong> {sol.usuario_nombre} {sol.usuario_apellido} ({sol.dependencia_nombre || 'Rectorado UNNE'})</span>
                        <span className="meta-separator">•</span>
                        <span><strong>Convocatoria:</strong> {sol.nro_convocatoria || 'CDC:2026/01'}</span>
                      </div>
                    </div>

                    <div className="solicitud-right-zone">
                      <div className="solicitud-monto-box">
                        <span className="monto-label">Monto Estimado</span>
                        <strong className="monto-valor">${totalMonto.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</strong>
                      </div>

                      <div className="btn-group-actions">
                        <button
                          type="button"
                          className="btn-tupi btn-tupi-secundario"
                          onClick={() => setSolicitudSeleccionada(sol)}
                        >
                          <Eye size={15} />
                          <span>Inspeccionar</span>
                        </button>
                      </div>
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