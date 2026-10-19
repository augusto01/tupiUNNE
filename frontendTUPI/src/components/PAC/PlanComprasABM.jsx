import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Search, Filter, ShoppingCart, Trash2, Send, AlertCircle, CheckCircle2 } from 'lucide-react';
import './PlanComprasABM.css';

const PlanComprasABM = () => {
  const { fetchAuth, token } = useAuth();

  // Estados de datos dinámicos desde la API
  const [rubros, setRubros] = useState([]);
  const [rubroSeleccionado, setRubroSeleccionado] = useState('');
  const [bienesCatalogo, setBienesCatalogo] = useState([]);

  // Filtros Avanzados
  const [busquedaTexto, setBusquedaTexto] = useState('');
  const [filtroInciso, setFiltroInciso] = useState('TODOS');

  // Estado para los ítems seleccionados en la Solicitud (Carrito)
  // Estructura: { [bienId]: { bien_id, descripcion, inciso, partida_principal, cantidad_solicitada, precio_unitario, observacion, subtotal } }
  const [solicitudItems, setSolicitudItems] = useState({});

  // Estados de control UI y mensajes
  const [planEstado, setPlanEstado] = useState({ habilitado: true, mensaje: '' });
  const [nroConvocatoria, setNroConvocatoria] = useState('CDC:2026/01');
  const [loadingRubros, setLoadingRubros] = useState(true);
  const [loadingBienes, setLoadingBienes] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // 1. Cargar estado del Plan Anual y Rubros al iniciar
  useEffect(() => {
    const currentToken = token || localStorage.getItem('token') || localStorage.getItem('tupi_token');
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
      .catch((err) => {
        console.error('Error al cargar rubros:', err.message);
        setErrorMsg('No se pudieron obtener los rubros del servidor.');
      })
      .finally(() => setLoadingRubros(false));
  }, [token]);

  // 2. Cargar bienes del catálogo al cambiar el rubro
  useEffect(() => {
    const currentToken = token || localStorage.getItem('token') || localStorage.getItem('tupi_token');
    if (!currentToken || !rubroSeleccionado) return;

    setLoadingBienes(true);
    fetchAuth(`/plan-compras/bienes-por-rubro?rubro=${encodeURIComponent(rubroSeleccionado)}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setBienesCatalogo(data);
        } else {
          setBienesCatalogo([]);
        }
      })
      .catch((err) => console.error('Error al cargar bienes:', err.message))
      .finally(() => setLoadingBienes(false));
  }, [rubroSeleccionado, token]);

  // 3. Filtrar catálogo por texto e inciso
  const bienesFiltrados = useMemo(() => {
    return bienesCatalogo.filter((bien) => {
      const coincideTexto = bien.descripcion.toLowerCase().includes(busquedaTexto.toLowerCase());
      const coincideInciso = filtroInciso === 'TODOS' || String(bien.inciso).includes(filtroInciso);
      return coincideTexto && coincideInciso;
    });
  }, [bienesCatalogo, busquedaTexto, filtroInciso]);

  // Obtenemos incisos para el combo de filtro
  const incisosDisponibles = useMemo(() => {
    const lista = bienesCatalogo.map((b) => b.inciso).filter(Boolean);
    return ['TODOS', ...new Set(lista)];
  }, [bienesCatalogo]);

  // 4. Agregar / Quitar producto del carrito/solicitud
  const handleToggleProducto = (bien) => {
    setSolicitudItems((prev) => {
      const existe = prev[bien.id];
      if (existe) {
        const nuevo = { ...prev };
        delete nuevo[bien.id];
        return nuevo;
      } else {
        return {
          ...prev,
          [bien.id]: {
            bien_id: bien.id,
            descripcion: bien.descripcion,
            inciso: bien.inciso,
            partida_principal: bien.partida_principal,
            cantidad_solicitada: 1,
            precio_unitario: 0,
            observacion: '', // 💡 Campo observación incluido
            subtotal: 0
          }
        };
      }
    });
  };

  // 5. Quitar ítem directamente de la solicitud
  const handleRemoveItem = (bienId) => {
    setSolicitudItems((prev) => {
      const nuevo = { ...prev };
      delete nuevo[bienId];
      return nuevo;
    });
  };

  // 6. Actualizar valores (cantidad, precio, observacion)
  const handleValueChange = (bienId, campo, valor) => {
    setSolicitudItems((prev) => {
      const item = prev[bienId];
      if (!item) return prev;

      if (campo === 'observacion') {
        return {
          ...prev,
          [bienId]: {
            ...item,
            observacion: valor
          }
        };
      }

      const numValue = parseFloat(valor) || 0;
      const cantidad = campo === 'cantidad_solicitada' ? numValue : item.cantidad_solicitada;
      const precio = campo === 'precio_unitario' ? numValue : item.precio_unitario;

      return {
        ...prev,
        [bienId]: {
          ...item,
          [campo]: numValue,
          subtotal: cantidad * precio
        }
      };
    });
  };

  // 7. Enviar la solicitud completa al backend
  const handleSubmitSolicitud = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const itemsAEnviar = Object.values(solicitudItems);

    if (itemsAEnviar.length === 0) {
      setErrorMsg('Debe seleccionar al menos un producto en su solicitud.');
      return;
    }

    const payload = {
      nro_convocatoria: nroConvocatoria,
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
        setSuccessMsg(`¡Solicitud #${data.solicitudId} registrada correctamente!`);
        setSolicitudItems({});
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        setErrorMsg(data.error || 'Ocurrió un error al enviar la solicitud.');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Error de conexión con el servidor.');
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
      {/* Cabecera Principal */}
      <div className="abm-header">
        <div>
          <h1 className="abm-title">Plan Anual de Compras 2026</h1>
          <p className="abm-subtitle">Gestión y carga de requerimientos consolidados de la dependencia</p>
        </div>
      </div>

      {/* Alertas de Feedback */}
      {errorMsg && (
        <div className="alert alert-danger mb-4 d-flex align-items-center gap-2">
          <AlertCircle size={18} />
          <span>{errorMsg}</span>
        </div>
      )}
      {successMsg && (
        <div className="alert alert-success mb-4 d-flex align-items-center gap-2">
          <CheckCircle2 size={18} />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Tarjeta de Datos de Convocatoria */}
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
              value={nroConvocatoria}
              onChange={(e) => setNroConvocatoria(e.target.value)}
              placeholder="Ej: CDC:2026/01"
            />
          </div>
        </div>
      </div>

      {/* SECCIÓN 1: CATÁLOGO Y BÚSQUEDA (GRID SUPERIOR) */}
      <div className="abm-card mb-4">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h2 className="card-title">2. Selección del Catálogo de Bienes</h2>
          <span className="badge-cart-indicator">
            <ShoppingCart size={16} /> {listaSolicitud.length} seleccionados
          </span>
        </div>

        {/* Barra de Filtros Avanzados */}
        <div className="filters-bar-wrapper">
          <div className="filter-item">
            <label>Rubro / Categoría</label>
            {loadingRubros ? (
              <p className="text-muted small">Cargando...</p>
            ) : (
              <select
                className="form-control"
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
                placeholder="Buscar por nombre o descripción del bien..."
                value={busquedaTexto}
                onChange={(e) => setBusquedaTexto(e.target.value)}
              />
            </div>
          </div>

          <div className="filter-item">
            <label>Filtrar por Inciso</label>
            <select
              className="form-control"
              value={filtroInciso}
              onChange={(e) => setFiltroInciso(e.target.value)}
            >
              {incisosDisponibles.map((inc, idx) => (
                <option key={idx} value={inc}>{inc}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Tabla del Catálogo */}
        <div className="table-wrapper catalog-table-height">
          <table className="abm-table">
            <thead>
              <tr>
                <th className="text-center" style={{ width: '60px' }}>Elegir</th>
                <th>Descripción del Bien</th>
                <th style={{ width: '220px' }}>Clasificación Presupuestaria</th>
                <th className="text-center" style={{ width: '100px' }}>Estado</th>
              </tr>
            </thead>
            <tbody>
              {loadingBienes ? (
                <tr>
                  <td colSpan="4" className="text-center py-4">Cargando catálogo...</td>
                </tr>
              ) : bienesFiltrados.length === 0 ? (
                <tr>
                  <td colSpan="4" className="text-center py-4 text-muted">
                    No se encontraron bienes con los criterios de búsqueda aplicados.
                  </td>
                </tr>
              ) : (
                bienesFiltrados.map((bien) => {
                  const estaEnSolicitud = !!solicitudItems[bien.id];
                  return (
                    <tr key={bien.id} className={estaEnSolicitud ? 'table-row-selected' : ''}>
                      <td className="text-center">
                        <input
                          type="checkbox"
                          className="checkbox-custom"
                          checked={estaEnSolicitud}
                          onChange={() => handleToggleProducto(bien)}
                        />
                      </td>
                      <td>
                        <strong>{bien.descripcion}</strong>
                      </td>
                      <td>
                        <small className="text-gray">{bien.inciso} | {bien.partida_principal}</small>
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

      {/* SECCIÓN 2: MI SOLICITUD A ENVIAR (GRID INFERIOR COMPLETO) */}
      <div className="abm-card" id="seccion-solicitud">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h2 className="card-title d-flex align-items-center gap-2">
            <ShoppingCart size={20} /> 3. Detalle de Requerimientos a Solicitar
          </h2>
          <span className="text-muted small">Ajuste cantidades, montos y agregue observaciones</span>
        </div>

        <form onSubmit={handleSubmitSolicitud}>
          <div className="table-wrapper">
            <table className="abm-table">
              <thead>
                <tr>
                  <th>Bien Seleccionado</th>
                  <th className="text-center" style={{ width: '100px' }}>Cantidad</th>
                  <th className="text-right" style={{ width: '140px' }}>Precio Unit ($)</th>
                  <th className="text-right" style={{ width: '140px' }}>Subtotal ($)</th>
                  <th style={{ width: '280px' }}>Observaciones / Especificación Técnica</th>
                  <th className="text-center" style={{ width: '50px' }}></th>
                </tr>
              </thead>
              <tbody>
                {listaSolicitud.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-5 text-muted">
                      No ha agregado ningún producto. Marque las casillas en el catálogo superior para armar su solicitud.
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
                          className="form-control form-control-sm text-center"
                          value={item.cantidad_solicitada}
                          onChange={(e) => handleValueChange(item.bien_id, 'cantidad_solicitada', e.target.value)}
                        />
                      </td>
                      <td className="text-right">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          className="form-control form-control-sm text-right"
                          value={item.precio_unitario}
                          onChange={(e) => handleValueChange(item.bien_id, 'precio_unitario', e.target.value)}
                          placeholder="0.00"
                        />
                      </td>
                      <td className="text-right font-bold text-primary">
                        ${(item.subtotal || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                      </td>
                      <td>
                        {/* 💡 Campo de Observaciones ampliado para no apretar la UI */}
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          placeholder="Ej: Marca sugerida, color, especificación..."
                          value={item.observacion || ''}
                          onChange={(e) => handleValueChange(item.bien_id, 'observacion', e.target.value)}
                        />
                      </td>
                      <td className="text-center">
                        <button
                          type="button"
                          className="btn-action-icon delete"
                          title="Eliminar de la lista"
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

          {/* Footer de Consolidación y Envío */}
          <div className="solicitud-summary-bar mt-4">
            <div className="summary-info">
              <div>
                <span className="text-muted">Total de ítems:</span>{' '}
                <strong>{listaSolicitud.length}</strong>
              </div>
              <div className="summary-total">
                <span>Monto Total Estimado:</span>
                <span className="total-amount">${totalGeneral.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-lg d-flex align-items-center gap-2"
              disabled={listaSolicitud.length === 0}
            >
              <Send size={18} />
              <span>Enviar Solicitud Final</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PlanComprasABM;