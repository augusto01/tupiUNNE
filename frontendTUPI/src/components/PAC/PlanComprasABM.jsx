import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Search, ShoppingCart, Trash2, Send, Save, Loader2 } from 'lucide-react';
import Swal from 'sweetalert2';
import './PlanComprasABM.css';

const TRIMESTRES_OPCIONES = [
  '1ER TRIMESTRE',
  '2DO TRIMESTRE',
  '3ER TRIMESTRE',
  '4TO TRIMESTRE'
];

const PlanComprasABM = () => {
  const { fetchAuth, token } = useAuth();

  const [rubros, setRubros] = useState([]);
  const [rubroSeleccionado, setRubroSeleccionado] = useState('');
  const [bienesCatalogo, setBienesCatalogo] = useState([]);

  const [busquedaTexto, setBusquedaTexto] = useState('');
  const [filtroInciso, setFiltroInciso] = useState('TODOS');
  const [solicitudItems, setSolicitudItems] = useState({});

  const [planEstado, setPlanEstado] = useState({ habilitado: true, mensaje: '' });
  const [nroConvocatoria, setNroConvocatoria] = useState('CDC:2026/01');
  const [loadingRubros, setLoadingRubros] = useState(true);
  const [loadingBienes, setLoadingBienes] = useState(false);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittingAction, setSubmittingAction] = useState(null);

  useEffect(() => {
    const currentToken = token || localStorage.getItem('tupi_token') || localStorage.getItem('token');
    if (!currentToken) return;

    fetchAuth('/plan-compras/estado')
      .then((res) => res.json())
      .then((data) => setPlanEstado(data))
      .catch((err) => console.error('Error estado plan:', err.message));

    setLoadingRubros(true);
    fetchAuth('/plan-compras/rubros')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setRubros(data);
          const primerRubro = data[0].rubro_id ?? data[0];
          setRubroSeleccionado(primerRubro);
        } else {
          setRubros([]);
        }
      })
      .catch(() => {
        Swal.fire({
          icon: 'error',
          title: 'Error de Carga',
          text: 'No se pudieron obtener los rubros del servidor.'
        });
      })
      .finally(() => setLoadingRubros(false));
  }, [token]);

  useEffect(() => {
    const currentToken = token || localStorage.getItem('tupi_token') || localStorage.getItem('token');
    if (!currentToken || !rubroSeleccionado) return;

    setLoadingBienes(true);
    fetchAuth(`/plan-compras/bienes-por-rubro?rubro_id=${encodeURIComponent(rubroSeleccionado)}`)
      .then((res) => res.json())
      .then((data) => {
        setBienesCatalogo(Array.isArray(data) ? data : []);
      })
      .catch((err) => console.error('Error al cargar bienes:', err.message))
      .finally(() => setLoadingBienes(false));
  }, [rubroSeleccionado, token]);

  const obtenerPrecioBD = (bien) => {
    const precio = bien.precio_unitario ?? bien.precio;
    const num = parseFloat(precio);
    return (!isNaN(num) && num > 0) ? num : 15000;
  };

  const bienesFiltrados = useMemo(() => {
    return bienesCatalogo.filter((bien) => {
      const coincideTexto = bien.descripcion.toLowerCase().includes(busquedaTexto.toLowerCase());
      const coincideInciso = filtroInciso === 'TODOS' || String(bien.inciso).includes(filtroInciso);
      return coincideTexto && coincideInciso;
    });
  }, [bienesCatalogo, busquedaTexto, filtroInciso]);

  const incisosDisponibles = useMemo(() => {
    const lista = bienesCatalogo.map((b) => b.inciso).filter(Boolean);
    return ['TODOS', ...new Set(lista)];
  }, [bienesCatalogo]);

  const handleToggleProducto = (bien) => {
    if (isSubmitting) return;
    const idBien = bien.bien_id ?? bien.id;

    setSolicitudItems((prev) => {
      const existe = prev[idBien];
      if (existe) {
        const nuevo = { ...prev };
        delete nuevo[idBien];
        return nuevo;
      } else {
        const precioBase = obtenerPrecioBD(bien);
        const trimestreBase = bien.trimestre || '1ER TRIMESTRE';

        return {
          ...prev,
          [idBien]: {
            bien_id: idBien,
            descripcion: bien.descripcion,
            inciso: bien.inciso,
            partida_principal: bien.partida_principal,
            cantidad_solicitada: 1,
            precio_unitario: precioBase,
            trimestre: trimestreBase,
            observacion: '',
            subtotal: precioBase
          }
        };
      }
    });
  };

  const handleRemoveItem = (bienId) => {
    if (isSubmitting) return;
    setSolicitudItems((prev) => {
      const nuevo = { ...prev };
      delete nuevo[bienId];
      return nuevo;
    });
  };

  const handleValueChange = (bienId, campo, valor) => {
    if (isSubmitting) return;
    setSolicitudItems((prev) => {
      const item = prev[bienId];
      if (!item) return prev;

      if (campo === 'observacion' || campo === 'trimestre') {
        return { ...prev, [bienId]: { ...item, [campo]: valor } };
      }

      if (campo === 'cantidad_solicitada') {
        const cantidad = Math.max(1, parseInt(valor, 10) || 1);
        return {
          ...prev,
          [bienId]: {
            ...item,
            cantidad_solicitada: cantidad,
            subtotal: cantidad * item.precio_unitario
          }
        };
      }

      return prev;
    });
  };

  const solicitarConfirmacion = (nuevoEstado) => {
    const itemsAEnviar = Object.values(solicitudItems);

    if (itemsAEnviar.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Solicitud Vacía',
        text: 'Debe seleccionar al menos un producto del catálogo antes de continuar.'
      });
      return;
    }

    const esBorrador = nuevoEstado === 'BORRADOR';

    Swal.fire({
      title: esBorrador ? '¿Guardar como borrador?' : '¿Seguro que querés agregar esta solicitud?',
      text: esBorrador
        ? 'La solicitud se guardará en estado borrador y podrás editarla más adelante.'
        : 'Una vez enviada, la solicitud pasará a revisión y no podrá modificarse.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#0284c7',
      cancelButtonColor: '#64748b',
      confirmButtonText: esBorrador ? 'Sí, guardar borrador' : 'Sí, enviar solicitud',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        ejecutarProcesarSolicitud(nuevoEstado);
      }
    });
  };

  const ejecutarProcesarSolicitud = async (nuevoEstado) => {
    if (isSubmitting) return;

    const itemsAEnviar = Object.values(solicitudItems);
    setIsSubmitting(true);
    setSubmittingAction(nuevoEstado);

    const payload = {
      nro_convocatoria: nroConvocatoria,
      estado: nuevoEstado,
      bienes_seleccionados: itemsAEnviar.map((i) => ({
        bien_id: i.bien_id,
        cantidad_solicitada: i.cantidad_solicitada,
        precio_unitario: i.precio_unitario,
        trimestre: i.trimestre || '1ER TRIMESTRE',
        observacion: i.observacion || ''
      }))
    };

    try {
      const res = await fetchAuth('/plan-compras/solicitudes', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (res.ok) {
        Swal.fire({
          icon: 'success',
          title: nuevoEstado === 'BORRADOR' ? '¡Borrador Guardado!' : '¡Solicitud Enviada!',
          text: nuevoEstado === 'BORRADOR'
            ? `Se registró el borrador #${data.solicitudId} correctamente.`
            : `La solicitud #${data.solicitudId} se envió a revisión con éxito.`,
          confirmButtonColor: '#0284c7'
        });

        setSolicitudItems({});
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Error al Procesar',
          text: data.error || 'Ocurrió un error al registrar la solicitud.'
        });
      }
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Error de Conexión',
        text: err.message || 'No se pudo conectar con el servidor.'
      });
    } finally {
      setIsSubmitting(false);
      setSubmittingAction(null);
    }
  };

  if (!planEstado.habilitado) {
    return (
      <div className="abm-container">
        <div className="abm-card text-center p-5">
          <h2 className="text-warning">Plan Anual Inactivo</h2>
          <p>{planEstado.mensaje || 'El período de carga de solicitudes se encuentra cerrado.'}</p>
        </div>
      </div>
    );
  }

  const listaSolicitud = Object.values(solicitudItems);
  const totalGeneral = listaSolicitud.reduce((acc, curr) => acc + (curr.subtotal || 0), 0);

  return (
    <div className="abm-container">
      <div className="abm-header">
        <div>
          <h1 className="abm-title">Plan Anual de Compras 2026</h1>
          <p className="abm-subtitle">Gestión y carga de requerimientos consolidados de la dependencia</p>
        </div>
      </div>

      <div className="abm-card mb-4">
        <div className="card-header">
          <h2 className="card-title">1. Identificador de la Convocatoria</h2>
        </div>
        <div className="abm-form">
          <div className="form-group mb-0">
            <label>Nro. Convocatoria / Referencia Interna</label>
            <input
              type="text"
              className="form-control"
              disabled={isSubmitting}
              value={nroConvocatoria}
              onChange={(e) => setNroConvocatoria(e.target.value)}
              placeholder="Ej: CDC:2026/01"
            />
          </div>
        </div>
      </div>

      <div className="abm-card mb-4">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h2 className="card-title">2. Selección del Catálogo de Bienes</h2>
          <span className="badge-cart-indicator">
            <ShoppingCart size={15} /> {listaSolicitud.length} seleccionados
          </span>
        </div>

        <div className="filters-bar-wrapper">
          <div className="filter-item">
            <label>Rubro / Categoría</label>
            {loadingRubros ? (
              <p className="text-muted small">Cargando...</p>
            ) : (
              <select
                className="form-control"
                disabled={isSubmitting}
                value={rubroSeleccionado}
                onChange={(e) => setRubroSeleccionado(e.target.value)}
              >
                {rubros.map((r) => {
                  const idR = r.rubro_id ?? r;
                  const nombreR = r.rubro_nombre ?? r.desc ?? r;
                  return (
                    <option key={idR} value={idR}>
                      {nombreR}
                    </option>
                  );
                })}
              </select>
            )}
          </div>

          <div className="filter-item flex-2">
            <label>Búsqueda en el Catálogo</label>
            <div className="search-input-wrapper">
              <Search size={15} className="search-icon" />
              <input
                type="text"
                className="form-control search-input"
                disabled={isSubmitting}
                placeholder="Buscar bien..."
                value={busquedaTexto}
                onChange={(e) => setBusquedaTexto(e.target.value)}
              />
            </div>
          </div>

          <div className="filter-item">
            <label>Inciso</label>
            <select
              className="form-control"
              disabled={isSubmitting}
              value={filtroInciso}
              onChange={(e) => setFiltroInciso(e.target.value)}
            >
              {incisosDisponibles.map((inc, idx) => (
                <option key={idx} value={inc}>{inc}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="table-wrapper catalog-table-height">
          <table className="abm-table">
            <thead>
              <tr>
                <th className="text-center" style={{ width: '60px' }}>Elegir</th>
                <th>Descripción del Bien</th>
                <th style={{ width: '180px' }}>Clasificación Presupuestaria</th>
                <th className="text-center" style={{ width: '140px' }}>Trimestre Base</th>
                <th className="text-right" style={{ width: '150px' }}>Precio Base BD ($)</th>
                <th className="text-center" style={{ width: '100px' }}>Estado</th>
              </tr>
            </thead>
            <tbody>
              {loadingBienes ? (
                <tr><td colSpan="6" className="text-center py-4">Cargando catálogo...</td></tr>
              ) : bienesFiltrados.length === 0 ? (
                <tr><td colSpan="6" className="text-center py-4 text-muted">No se encontraron bienes.</td></tr>
              ) : (
                bienesFiltrados.map((bien) => {
                  const idBien = bien.bien_id ?? bien.id;
                  const estaEnSolicitud = !!solicitudItems[idBien];
                  const precioMuestra = obtenerPrecioBD(bien);

                  return (
                    <tr key={idBien} className={estaEnSolicitud ? 'table-row-selected' : ''}>
                      <td className="text-center">
                        <input
                          type="checkbox"
                          className="checkbox-custom"
                          disabled={isSubmitting}
                          checked={estaEnSolicitud}
                          onChange={() => handleToggleProducto(bien)}
                        />
                      </td>
                      <td><strong>{bien.descripcion}</strong></td>
                      <td><small className="text-gray">{bien.inciso} | {bien.partida_principal}</small></td>
                      <td className="text-center">
                        <span className="badge-trimestre">
                          {bien.trimestre || '1ER TRIMESTRE'}
                        </span>
                      </td>
                      <td className="text-right font-bold">
                        ${precioMuestra.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="text-center">
                        {estaEnSolicitud ? (
                          <span className="badge-status added">Agregado</span>
                        ) : (
                          <span className="badge-status">Disponible</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="abm-card">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h2 className="card-title d-flex align-items-center gap-2">
            <ShoppingCart size={18} /> 3. Detalle de Requerimientos
          </h2>
        </div>

        <div className="table-wrapper">
          <table className="abm-table">
            <thead>
              <tr>
                <th>Bien Seleccionado</th>
                <th className="text-center" style={{ width: '90px' }}>Cantidad</th>
                <th style={{ width: '170px' }}>Trimestre Estimado</th>
                <th className="text-right" style={{ width: '140px' }}>Precio Unit ($)</th>
                <th className="text-right" style={{ width: '140px' }}>Subtotal ($)</th>
                <th style={{ width: '280px' }}>Observación</th>
                <th className="text-center" style={{ width: '50px' }}></th>
              </tr>
            </thead>
            <tbody>
              {listaSolicitud.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-5 text-muted">
                    No ha seleccionado productos aún. Marque las casillas en el catálogo para comenzar.
                  </td>
                </tr>
              ) : (
                listaSolicitud.map((item) => (
                  <tr key={item.bien_id}>
                    <td>
                      <strong>{item.descripcion}</strong>
                      <br />
                      <small className="text-gray">{item.inciso} | {item.partida_principal}</small>
                    </td>
                    <td className="text-center">
                      <input
                        type="number"
                        min="1"
                        disabled={isSubmitting}
                        className="form-control form-control-sm text-center"
                        value={item.cantidad_solicitada}
                        onChange={(e) => handleValueChange(item.bien_id, 'cantidad_solicitada', e.target.value)}
                      />
                    </td>
                    <td>
                      <select
                        className="form-control form-control-sm"
                        disabled={isSubmitting}
                        value={item.trimestre}
                        onChange={(e) => handleValueChange(item.bien_id, 'trimestre', e.target.value)}
                      >
                        {TRIMESTRES_OPCIONES.map((tri, index) => (
                          <option key={index} value={tri}>
                            {tri}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="text-right">
                      <input
                        type="text"
                        readOnly
                        disabled
                        className="form-control form-control-sm text-right bg-readonly"
                        value={`$${item.precio_unitario.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`}
                      />
                    </td>
                    <td className="text-right font-bold text-primary">
                      ${(item.subtotal || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </td>
                    <td>
                      <input
                        type="text"
                        disabled={isSubmitting}
                        className="form-control form-control-sm"
                        placeholder="Nota técnica..."
                        value={item.observacion || ''}
                        onChange={(e) => handleValueChange(item.bien_id, 'observacion', e.target.value)}
                      />
                    </td>
                    <td className="text-center">
                      <button
                        type="button"
                        disabled={isSubmitting}
                        className="btn-action-icon delete"
                        onClick={() => handleRemoveItem(item.bien_id)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="solicitud-summary-bar">
          <div className="summary-info">
            <div><span className="text-muted">Total de ítems:</span> <strong>{listaSolicitud.length}</strong></div>
            <div>
              <span>Monto Total Estimado:</span>
              <span className="total-amount">${totalGeneral.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>

          <div className="summary-actions-group">
            <button
              type="button"
              className="btn-tupi btn-tupi-secundario"
              disabled={listaSolicitud.length === 0 || isSubmitting}
              onClick={() => solicitarConfirmacion('BORRADOR')}
            >
              {isSubmitting && submittingAction === 'BORRADOR' ? (
                <>
                  <Loader2 size={15} className="spinner-rotation" />
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <Save size={15} />
                  <span>Guardar Borrador</span>
                </>
              )}
            </button>

            <button
              type="button"
              className="btn-tupi btn-tupi-primario"
              disabled={listaSolicitud.length === 0 || isSubmitting}
              onClick={() => solicitarConfirmacion('PENDIENTE')}
            >
              {isSubmitting && submittingAction === 'PENDIENTE' ? (
                <>
                  <Loader2 size={15} className="spinner-rotation" />
                  <span>Enviando...</span>
                </>
              ) : (
                <>
                  <Send size={15} />
                  <span>Enviar Solicitud</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlanComprasABM;