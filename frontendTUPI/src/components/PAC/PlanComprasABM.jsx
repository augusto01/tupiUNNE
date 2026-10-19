import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Search, ShoppingCart, Trash2, Send, Save, AlertCircle, CheckCircle2, Loader2, X } from 'lucide-react';
import './PlanComprasABM.css';

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

  // Estado para controlar el Pop-up flotante
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const mostrarPopUp = (message, type = 'success') => {
    setToast({ show: true, message, type });
    // Ocultar automáticamente a los 4 segundos
    setTimeout(() => {
      setToast({ show: false, message: '', type: 'success' });
    }, 4000);
  };

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
          setRubroSeleccionado(data[0]);
        } else {
          setRubros([]);
        }
      })
      .catch(() => mostrarPopUp('No se pudieron obtener los rubros del servidor.', 'error'))
      .finally(() => setLoadingRubros(false));
  }, [token]);

  useEffect(() => {
    const currentToken = token || localStorage.getItem('tupi_token') || localStorage.getItem('token');
    if (!currentToken || !rubroSeleccionado) return;

    setLoadingBienes(true);
    fetchAuth(`/plan-compras/bienes-por-rubro?rubro=${encodeURIComponent(rubroSeleccionado)}`)
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
    setSolicitudItems((prev) => {
      const existe = prev[bien.id];
      if (existe) {
        const nuevo = { ...prev };
        delete nuevo[bien.id];
        return nuevo;
      } else {
        const precioBase = obtenerPrecioBD(bien);
        return {
          ...prev,
          [bien.id]: {
            bien_id: bien.id,
            descripcion: bien.descripcion,
            inciso: bien.inciso,
            partida_principal: bien.partida_principal,
            cantidad_solicitada: 1,
            precio_unitario: precioBase,
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

      if (campo === 'observacion') {
        return { ...prev, [bienId]: { ...item, observacion: valor } };
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

  const handleProcesarSolicitud = async (nuevoEstado) => {
    if (isSubmitting) return;

    const itemsAEnviar = Object.values(solicitudItems);

    if (itemsAEnviar.length === 0) {
      mostrarPopUp('Debe seleccionar al menos un producto antes de continuar.', 'error');
      return;
    }

    setIsSubmitting(true);
    setSubmittingAction(nuevoEstado);

    const payload = {
      nro_convocatoria: nroConvocatoria,
      estado: nuevoEstado,
      bienes_seleccionados: itemsAEnviar.map((i) => ({
        bien_id: i.bien_id,
        cantidad_solicitada: i.cantidad_solicitada,
        precio_unitario: i.precio_unitario,
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
        mostrarPopUp(
          nuevoEstado === 'BORRADOR'
            ? `¡Borrador #${data.solicitudId} guardado con éxito!`
            : `¡Solicitud #${data.solicitudId} enviada para su revisión!`,
          'success'
        );
        setSolicitudItems({});
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        mostrarPopUp(data.error || 'Ocurrió un error al procesar la solicitud.', 'error');
      }
    } catch (err) {
      mostrarPopUp(err.message || 'Error de conexión con el servidor.', 'error');
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

      {/* POP-UP FLOTANTE (TOAST) */}
      {toast.show && (
        <div className={`tupi-toast-popup ${toast.type}`}>
          <div className="toast-popup-content">
            {toast.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
            <span>{toast.message}</span>
          </div>
          <button className="toast-close-btn" onClick={() => setToast({ ...toast, show: false })}>
            <X size={16} />
          </button>
        </div>
      )}

      <div className="abm-header">
        <div>
          <h1 className="abm-title">Plan Anual de Compras 2026</h1>
          <p className="abm-subtitle">Gestión y carga de requerimientos consolidados de la dependencia</p>
        </div>
      </div>

      {/* IDENTIFICADOR CONVOCATORIA */}
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

      {/* CATÁLOGO DE BIENES */}
      <div className="abm-card mb-4">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h2 className="card-title">2. Selección del Catálogo de Bienes</h2>
          <span className="badge-cart-indicator">
            <ShoppingCart size={16} /> {listaSolicitud.length} seleccionados
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
                {rubros.map((r, index) => (
                  <option key={index} value={r}>{r}</option>
                ))}
              </select>
            )}
          </div>

          <div className="filter-item flex-2">
            <label>Búsqueda en el Catálogo</label>
            <div className="search-input-wrapper">
              <Search size={16} className="search-icon" />
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
                <th style={{ width: '220px' }}>Clasificación Presupuestaria</th>
                <th className="text-right" style={{ width: '160px' }}>Precio Base BD ($)</th>
                <th className="text-center" style={{ width: '100px' }}>Estado</th>
              </tr>
            </thead>
            <tbody>
              {loadingBienes ? (
                <tr><td colSpan="5" className="text-center py-4">Cargando catálogo...</td></tr>
              ) : bienesFiltrados.length === 0 ? (
                <tr><td colSpan="5" className="text-center py-4 text-muted">No se encontraron bienes.</td></tr>
              ) : (
                bienesFiltrados.map((bien) => {
                  const estaEnSolicitud = !!solicitudItems[bien.id];
                  const precioMuestra = obtenerPrecioBD(bien);

                  return (
                    <tr key={bien.id} className={estaEnSolicitud ? 'table-row-selected' : ''}>
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

      {/* DETALLE DE REQUERIMIENTOS */}
      <div className="abm-card">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h2 className="card-title d-flex align-items-center gap-2">
            <ShoppingCart size={20} /> 3. Detalle de Requerimientos
          </h2>
        </div>

        <div className="table-wrapper">
          <table className="abm-table">
            <thead>
              <tr>
                <th>Bien Seleccionado</th>
                <th className="text-center" style={{ width: '100px' }}>Cantidad</th>
                <th className="text-right" style={{ width: '150px' }}>Precio Unit ($)</th>
                <th className="text-right" style={{ width: '150px' }}>Subtotal ($)</th>
                <th style={{ width: '320px' }}>Observación</th>
                <th className="text-center" style={{ width: '50px' }}></th>
              </tr>
            </thead>
            <tbody>
              {listaSolicitud.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-5 text-muted">
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

        {/* BOTONES */}
        <div className="solicitud-summary-bar mt-4">
          <div className="summary-info">
            <div><span className="text-muted">Total de ítems:</span> <strong>{listaSolicitud.length}</strong></div>
            <div className="summary-total">
              <span>Monto Total Estimado:</span>
              <span className="total-amount">${totalGeneral.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>

          <div className="d-flex gap-2">
            <button
              type="button"
              className="btn btn-outline-primary btn-lg d-flex align-items-center gap-2"
              disabled={listaSolicitud.length === 0 || isSubmitting}
              onClick={() => handleProcesarSolicitud('BORRADOR')}
            >
              {isSubmitting && submittingAction === 'BORRADOR' ? (
                <>
                  <Loader2 size={18} className="spinner-rotation" />
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <Save size={18} />
                  <span>Guardar Borrador</span>
                </>
              )}
            </button>

            <button
              type="button"
              className="btn btn-primary btn-lg d-flex align-items-center gap-2"
              disabled={listaSolicitud.length === 0 || isSubmitting}
              onClick={() => handleProcesarSolicitud('PENDIENTE')}
            >
              {isSubmitting && submittingAction === 'PENDIENTE' ? (
                <>
                  <Loader2 size={18} className="spinner-rotation" />
                  <span>Enviando...</span>
                </>
              ) : (
                <>
                  <Send size={18} />
                  <span>Enviar Solicitud Final</span>
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