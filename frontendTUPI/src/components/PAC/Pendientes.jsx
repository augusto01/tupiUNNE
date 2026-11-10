import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  Eye, 
  Search, 
  UserCheck, 
  Loader2, 
  User, 
  Building2, 
  Calendar, 
  FileSpreadsheet, 
  ShieldCheck, 
  Layers,
  MessageSquare,
  FileText,
  Download
} from 'lucide-react';
import Swal from 'sweetalert2';
import DetalleSolicitud from './DetalleSolicitud';
import './Pendientes.css';

const Pendientes = () => {
  const { fetchAuth, token, user } = useAuth();

  const usuarioLogueado = user || JSON.parse(localStorage.getItem('tupi_user')) || JSON.parse(localStorage.getItem('usuario')) || {};
  const esAutorizanteUoc = parseInt(usuarioLogueado?.tipo_usuario_id, 10) === 3;
  const esAdminGeneral = parseInt(usuarioLogueado?.tipo_usuario_id, 10) === 1 || parseInt(usuarioLogueado?.tipo_usuario_id, 10) === 2 || usuarioLogueado?.rol?.toLowerCase().includes('admin');

  const [solicitudes, setSolicitudes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('TODOS');
  const [solicitudSeleccionada, setSolicitudSeleccionada] = useState(null);
  const [procesandoId, setProcesandoId] = useState(null);

  const cargarPendientes = async () => {
    setLoading(true);
    try {
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

  // 🎯 1. Exportar Consolidado UOC (Seguro con fetchAuth y Blob, detectando la dependencia del usuario)
  // 🎯 Exportar Consolidado UOC con selección de área precargada por defecto
  const handleExportarConsolidadoUOC = async (tipoFormato = 'excel') => {
    const depId = usuarioLogueado?.dependencia_id || usuarioLogueado?.dependenciaId || 1;
    const areaUsuarioId = usuarioLogueado?.area_id || '';

    try {
      const resAreas = await fetchAuth(`/plan-compras/areas?dependencia_id=${depId}`);
      const areasList = resAreas.ok ? await resAreas.json() : [];

      let optionsHtml = '<option value="">-- TODAS LAS ÁREAS DE LA UOC --</option>';
      if (Array.isArray(areasList)) {
        areasList.forEach(a => {
          const idArea = a.id || a.area_id;
          const esSeleccionado = String(idArea) === String(areaUsuarioId) ? 'selected' : '';
          optionsHtml += `<option value="${idArea}" ${esSeleccionado}>${a.nombre}</option>`;
        });
      }

      const { value: areaSeleccionadaId, dismiss } = await Swal.fire({
        title: `Exportar Consolidado UOC (${tipoFormato.toUpperCase()})`,
        html: `
          <p style="font-size: 0.95rem; color: #475569; margin-bottom: 15px;">
            UOC Detectada (ID: <b>${depId}</b>). Seleccione el área a exportar (por defecto se sugiere su área actual):
          </p>
          <select id="swal-select-area" class="swal2-input" style="width: 85%; margin: 0 auto;">
            ${optionsHtml}
          </select>
        `,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: `Sí, descargar ${tipoFormato.toUpperCase()}`,
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#0284c7',
        cancelButtonColor: '#64748b',
        preConfirm: () => {
          return document.getElementById('swal-select-area').value;
        }
      });

      if (dismiss === Swal.DismissReason.cancel) return;

      Swal.fire({
        title: 'Generando reporte...',
        html: `Procesando solicitudes de la UOC (${tipoFormato.toUpperCase()})...`,
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      const endpoint = tipoFormato === 'pdf' ? 'exportar/dependencia/pdf' : 'exportar/dependencia';
      let urlQuery = `${endpoint}?dependencia_id=${depId}`;
      if (areaSeleccionadaId) {
        urlQuery += `&area_id=${areaSeleccionadaId}`;
      }

      const response = await fetchAuth(`/plan-compras/${urlQuery}`);
      if (!response.ok) throw new Error('Error al generar el archivo.');

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `Consolidado_UOC_${depId}.${tipoFormato === 'pdf' ? 'pdf' : 'xlsx'}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);

      Swal.close();
      Swal.fire({
        icon: 'success',
        title: '¡Reporte Generado!',
        text: `El reporte se descargó correctamente.`,
        timer: 2500,
        showConfirmButton: false
      });

    } catch (err) {
      console.error('Error al exportar UOC:', err);
      Swal.fire('Error', 'No se pudo generar el reporte consolidado de la UOC.', 'error');
    }
  };

  // 🎯 2. Exportar Consolidado Universidad (Seguro con fetchAuth y Blob)
  const handleExportarConsolidadoUniversidad = async (tipoFormato = 'excel') => {
    const result = await Swal.fire({
      title: `¿Confirmar descarga global (${tipoFormato.toUpperCase()})?`,
      text: 'Está a punto de exportar el Plan Anual de Compras consolidado de toda la Universidad (Todas las UOCs aprobadas).',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: `Sí, exportar ${tipoFormato.toUpperCase()}`,
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#0284c7',
      cancelButtonColor: '#64748b'
    });

    if (!result.isConfirmed) return;

    Swal.fire({
      title: 'Generando consolidado global...',
      html: `Calculando totales y agrupando por rubro (${tipoFormato.toUpperCase()}) para toda la UNNE.`,
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    try {
      const endpoint = tipoFormato === 'pdf' ? 'exportar/universidad/pdf' : 'exportar/universidad';
      const response = await fetchAuth(`/plan-compras/${endpoint}`);
      if (!response.ok) throw new Error('Error al generar el consolidado global.');

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `Consolidado_Universidad.${tipoFormato === 'pdf' ? 'pdf' : 'xlsx'}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);

      Swal.close();
      Swal.fire({
        icon: 'success',
        title: '¡Descarga Exitosa!',
        text: `El reporte consolidado general de la Universidad ha sido generado.`,
        timer: 2500,
        showConfirmButton: false
      });

    } catch (err) {
      console.error('Error al exportar Universidad:', err);
      Swal.fire('Error', 'Ocurrió un error al generar el consolidado de la universidad.', 'error');
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
        s.area_nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
        s.observaciones?.toLowerCase().includes(busqueda.toLowerCase()) ||
        String(s.id).includes(busqueda);
      return coincideEstado && coincideBusqueda;
    })
    .sort((a, b) => {
      if (a.estado === 'PENDIENTE' && b.estado !== 'PENDIENTE') return -1;
      if (a.estado !== 'PENDIENTE' && b.estado === 'PENDIENTE') return 1;
      return b.id - a.id;
    });

  return (
    <div className="pendientes-container fade-in-animation">
      {/* ENCABEZADO */}
      <div className="pendientes-header d-flex justify-content-between align-items-center flex-wrap gap-3">
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

        {/* 🎯 BOTONES DE EXPORTACIÓN MASIVA CON MÁRGENES Y OPCIONES UOC / UNIVERSIDAD */}
        <div className="d-flex align-items-center gap-3 flex-wrap mt-2 mt-md-0">
          {esAutorizanteUoc && (
            <div className="d-flex align-items-center gap-2 flex-wrap">
              <button
                type="button"
                className="btn-tupi btn-tupi-excel"
                onClick={() => handleExportarConsolidadoUOC('excel')}
                title="Descargar Excel Aprobadas UOC"
              >
                <FileSpreadsheet size={15} />
                <span>Excel UOC</span>
              </button>
              <button
                type="button"
                className="btn-tupi btn-tupi-pdf"
                onClick={() => handleExportarConsolidadoUOC('pdf')}
                title="Descargar PDF Aprobadas UOC"
              >
                <FileText size={15} />
                <span>PDF UOC</span>
              </button>
            </div>
          )}

          {esAdminGeneral && (
            <div className="d-flex align-items-center gap-2 flex-wrap">
              <button
                type="button"
                className="btn-tupi btn-tupi-excel me-1"
                onClick={() => handleExportarConsolidadoUOC('excel')}
                title="Seleccionar área y descargar Excel UOC"
              >
                <FileSpreadsheet size={15} />
                <span>Excel UOC</span>
              </button>

              <button
                type="button"
                className="btn-tupi btn-tupi-primario"
                onClick={() => handleExportarConsolidadoUniversidad('excel')}
                title="Consolidado Excel Universidad"
              >
                <Download size={15} />
                <span>Excel Universidad</span>
              </button>

              <button
                type="button"
                className="btn-tupi btn-tupi-pdf"
                onClick={() => handleExportarConsolidadoUniversidad('pdf')}
                title="Consolidado PDF Universidad"
              >
                <FileText size={15} />
                <span>PDF Universidad</span>
              </button>
            </div>
          )}
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
                placeholder="Buscar por N° Convocatoria, Área, ID o Solicitante..."
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
                          <Layers size={12} className="inline-icon" /> Área Origen
                        </span>
                        <span className="solicitud-meta-value">
                          {sol.area_nombre || 'General'}
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

                      {(sol.observaciones || sol.observacion) && (
                        <div className="solicitud-meta-item">
                          <span className="solicitud-meta-label">
                            <MessageSquare size={12} className="inline-icon" /> Observaciones
                          </span>
                          <span className="solicitud-meta-value text-truncate">
                            {sol.observaciones || sol.observacion}
                          </span>
                        </div>
                      )}

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

                  {/* PIE DE TARJETA CON MONTO ESTIMADO Y BOTONES CENTRADOS */}
                  <div className="solicitud-footer-bar d-flex justify-content-between align-items-center">
                    <div className="solicitud-monto-group">
                      <span className="solicitud-monto-label">Monto Estimado:</span>
                      <span className="solicitud-monto-valor">
                        ${totalMonto.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>

                    <div className="solicitud-actions-group">
                      {sol.estado === 'APROBADA' && (
                        <div className="download-inline-buttons">
                          <button
                            type="button"
                            className="btn-tupi btn-tupi-pdf btn-sm-tupi"
                            onClick={() => handleDescargarPDF(sol.id)}
                            title="Descargar comprobante en PDF"
                          >
                            <FileText size={13} />
                            <span>PDF</span>
                          </button>

                          <button
                            type="button"
                            className="btn-tupi btn-tupi-excel btn-sm-tupi"
                            onClick={() => handleDescargarExcel(sol.id)}
                            title="Descargar comprobante en Excel"
                          >
                            <FileSpreadsheet size={13} />
                            <span>Excel</span>
                          </button>
                        </div>
                      )}

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