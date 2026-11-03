import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Search, ShoppingCart, Trash2, Send, Save, Loader2, ArrowLeft, Building2, ChevronDown, Check, MessageSquare } from 'lucide-react';
import Swal from 'sweetalert2';
import './PlanComprasABM.css';

const TRIMESTRES_OPCIONES = [
  '1ER TRIMESTRE',
  '2DO TRIMESTRE',
  '3ER TRIMESTRE',
  '4TO TRIMESTRE'
];

const PlanComprasABM = ({ solicitudAEditar = null, onCancelarEdicion = null, onGuardadoExitoso = null }) => {
  const { fetchAuth, token, user } = useAuth();

  // Estados de catálogo y áreas
  const [rubros, setRubros] = useState([]);
  const [rubroSeleccionado, setRubroSeleccionado] = useState('');
  const [areas, setAreas] = useState([]);
  const [areaSeleccionada, setAreaSeleccionada] = useState('');
  const [bienesCatalogo, setBienesCatalogo] = useState([]);

  // Buscador de Áreas en el Dropdown
  const [busquedaAreaText, setBusquedaAreaText] = useState('');
  const [isAreaDropdownOpen, setIsAreaDropdownOpen] = useState(false);
  const dropdownAreaRef = useRef(null);

  const [busquedaTexto, setBusquedaTexto] = useState('');
  const [filtroInciso, setFiltroInciso] = useState('TODOS');
  const [solicitudItems, setSolicitudItems] = useState({});

  const [planEstado, setPlanEstado] = useState({ habilitado: true, mensaje: '' });
  const [nroConvocatoria, setNroConvocatoria] = useState('CDC:2026/01');
  const [observacionGeneral, setObservacionGeneral] = useState(''); // 🎯 Estado de la observación general
  const [loadingRubros, setLoadingRubros] = useState(true);
  const [loadingAreas, setLoadingAreas] = useState(true);
  const [loadingBienes, setLoadingBienes] = useState(false);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittingAction, setSubmittingAction] = useState(null);

  const esModoEdicion = Boolean(solicitudAEditar && (solicitudAEditar.id || solicitudAEditar.solicitud_id));

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownAreaRef.current && !dropdownAreaRef.current.contains(event.target)) {
        setIsAreaDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Cargar estado del plan, rubros y áreas disponibles por UOC
  useEffect(() => {
    const currentToken = token || localStorage.getItem('tupi_token') || localStorage.getItem('token');
    if (!currentToken) return;

    fetchAuth('/plan-compras/estado')
      .then((res) => res.json())
      .then((data) => setPlanEstado(data))
      .catch((err) => console.error('Error estado plan:', err.message));

    // Cargar áreas solicitantes de la UOC / Dependencia del usuario
    setLoadingAreas(true);
    const usuarioLogueado = user || JSON.parse(localStorage.getItem('tupi_user')) || JSON.parse(localStorage.getItem('usuario')) || {};
    const depId = usuarioLogueado.dependencia_id || '';

    fetchAuth(`/plan-compras/areas?dependencia_id=${depId}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          const unicas = [];
          const nombresVistos = new Set();
          
          data.forEach(item => {
            const claveUnica = `${(item.nombre || '').toLowerCase().trim()}_${item.dependencia_id}`;
            if (!nombresVistos.has(claveUnica)) {
              nombresVistos.add(claveUnica);
              unicas.push(item);
            }
          });

          setAreas(unicas);
          if (!esModoEdicion && unicas.length > 0) {
            setAreaSeleccionada(unicas[0].id ?? unicas[0].area_id);
          }
        } else {
          setAreas([]);
        }
      })
      .catch((err) => console.error('Error al obtener áreas:', err.message))
      .finally(() => setLoadingAreas(false));

    // Cargar catálogo de rubros
    setLoadingRubros(true);
    fetchAuth('/plan-compras/rubros')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setRubros(data);
          const primerRubro = data[0].rubro_id ?? data[0].id ?? data[0];
          setRubroSeleccionado(primerRubro);
        } else {
          setRubros([]);
        }
      })
      .catch(() => {
        Swal.fire('Error', 'No se pudieron obtener los rubros.', 'error');
      })
      .finally(() => setLoadingRubros(false));

    if (esModoEdicion && solicitudAEditar) {
      setNroConvocatoria(solicitudAEditar.nro_convocatoria || 'CDC:2026/01');
      setObservacionGeneral(solicitudAEditar.observaciones || solicitudAEditar.observacion || '');
      if (solicitudAEditar.area_id) {
        setAreaSeleccionada(solicitudAEditar.area_id);
      }
      
      const itemsMap = {};
      const renglones = solicitudAEditar.renglones || solicitudAEditar.registros || [];

      renglones.forEach((r) => {
        const idBien = parseInt(r.bien_id || r.id, 10);
        if (!idBien) return;

        const precioUnit = parseFloat(r.precio_unitario) || 0;
        const cant = parseInt(r.cantidad, 10) || 1;

        itemsMap[idBien] = {
          bien_id: idBien,
          descripcion: r.bien_descripcion || r.descripcion || 'Bien Seleccionado',
          inciso: r.inciso || 'Bienes',
          partida_principal: r.partida_principal || 'Partida',
          cantidad_solicitada: cant,
          precio_unitario: precioUnit,
          trimestre: r.trimestre || '1ER TRIMESTRE',
          observacion: r.observacion || '',
          subtotal: cant * precioUnit
        };
      });
      setSolicitudItems(itemsMap);
    } else {
      setNroConvocatoria('CDC:2026/01');
      setObservacionGeneral('');
      setSolicitudItems({});
    }
  }, [token, solicitudAEditar, esModoEdicion, user]);

  // Helper para normalizar texto
  const limpiarTexto = (str) => {
    if (!str) return '';
    return str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  };

  // Áreas filtradas con búsqueda ultra flexible
  const areasFiltradasBuscador = useMemo(() => {
    const busquedaLimpia = limpiarTexto(busquedaAreaText);
    if (!busquedaLimpia) return areas;

    const palabrasBusqueda = busquedaLimpia.split(' ');

    return areas.filter((a) => {
      const nombreLimpio = limpiarTexto(a.nombre);
      const depLimpia = limpiarTexto(a.dependencia_nombre);
      const textoCompleto = `${nombreLimpio} ${depLimpia}`;

      return palabrasBusqueda.every((palabra) => textoCompleto.includes(palabra));
    });
  }, [areas, busquedaAreaText]);

  // Objeto del área actualmente seleccionada
  const objetoAreaSeleccionada = useMemo(() => {
    return areas.find(a => (a.id ?? a.area_id) === parseInt(areaSeleccionada, 10));
  }, [areas, areaSeleccionada]);

  // Cargar bienes filtrados por el rubro
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
    const idBien = parseInt(bien.bien_id ?? bien.id, 10);

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
            inciso: bien.inciso || 'Bienes',
            partida_principal: bien.partida_principal || 'Partida',
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
    if (!areaSeleccionada) {
      Swal.fire({
        icon: 'warning',
        title: 'Área Solicitante requerida',
        text: 'Debe seleccionar el área o dependencia a la cual se asignará la solicitud.'
      });
      return;
    }

    const itemsAEnviar = Object.values(solicitudItems);
    if (itemsAEnviar.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Solicitud Vacía',
        text: 'Debe seleccionar al menos un producto del catálogo antes de enviar.'
      });
      return;
    }

    const esBorrador = nuevoEstado === 'BORRADOR';

    Swal.fire({
      title: esModoEdicion
        ? (esBorrador ? '¿Guardar cambios en Borrador?' : '¿Reenviar Solicitud?')
        : (esBorrador ? '¿Guardar como Borrador?' : '¿Enviar Solicitud?'),
      text: esBorrador
        ? 'La solicitud mantendrá los cambios actualizados.'
        : 'Se registrará la solicitud y se enviará a evaluación presupuestaria.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#0284c7',
      cancelButtonColor: '#64748b',
      confirmButtonText: esBorrador ? 'Sí, guardar' : (esModoEdicion ? 'Sí, reenviar' : 'Sí, enviar solicitud'),
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

    const itemsFormateados = itemsAEnviar.map((i) => ({
      bien_id: parseInt(i.bien_id, 10),
      cantidad: parseInt(i.cantidad_solicitada, 10) || 1,
      cantidad_solicitada: parseInt(i.cantidad_solicitada, 10) || 1,
      precio_unitario: parseFloat(i.precio_unitario) || 0,
      trimestre: i.trimestre || '1ER TRIMESTRE',
      observacion: i.observacion ? i.observacion.trim() : ''
    }));

    const payload = {
      nro_convocatoria: nroConvocatoria.trim() || 'CDC:2026/01',
      area_id: parseInt(areaSeleccionada, 10),
      observaciones: observacionGeneral.trim(), // 🎯 Envío de la observación general
      estado: nuevoEstado,
      renglones: itemsFormateados,
      bienes_seleccionados: itemsFormateados
    };

    try {
      const url = esModoEdicion 
        ? `/plan-compras/solicitudes/${solicitudAEditar.id}`
        : '/plan-compras/solicitudes';

      const method = esModoEdicion ? 'PUT' : 'POST';

      const res = await fetchAuth(url, {
        method,
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (res.ok) {
        Swal.fire({
          icon: 'success',
          title: esModoEdicion ? '¡Solicitud Actualizada!' : '¡Nueva Solicitud Creada!',
          text: nuevoEstado === 'BORRADOR'
            ? 'Borrador guardado correctamente.'
            : (esModoEdicion ? 'La solicitud fue reenviada a revisión.' : 'Su solicitud fue enviada exitosamente.'),
          confirmButtonColor: '#0284c7'
        });

        if (onGuardadoExitoso) {
          onGuardadoExitoso();
        } else {
          setSolicitudItems({});
          setObservacionGeneral('');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      } else {
        Swal.fire({
          icon: 'error',
          title: `Error ${res.status}`,
          text: data.error || data.mensaje || 'Respuesta no válida del servidor.'
        });
      }
    } catch (err) {
      console.error('Error en fetchAuth:', err);
      Swal.fire({
        icon: 'error',
        title: 'Error de Conexión',
        text: 'No se pudo conectar con el servidor.'
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
      {esModoEdicion && (
        <div className="mb-3">
          <button type="button" className="btn-tupi btn-tupi-descarga" onClick={onCancelarEdicion}>
            <ArrowLeft size={16} />
            <span>Volver al Historial</span>
          </button>
        </div>
      )}

      <div className="abm-header">
        <div>
          <h1 className="abm-title">
            {esModoEdicion ? `Edición de Solicitud #${solicitudAEditar.id}` : 'Nueva Solicitud de Compra'}
          </h1>
          <p className="abm-subtitle">
            {esModoEdicion 
              ? 'Agregue, quite o modifique la cantidad y observaciones de los bienes requeridos.' 
              : 'Seleccione del catálogo los bienes y cantidades requeridas para su dependencia'}
          </p>
        </div>
      </div>

      {/* BLOQUE 1: Datos Generales (Convocatoria, Área y Observaciones Generales) */}
      <div className="abm-card mb-4 overflow-visible">
        <div className="card-header">
          <h2 className="card-title">1. Datos Generales de la Solicitud</h2>
        </div>
        
        <div className="card-body-padding">
          <div className="abm-form grid-datos-generales">
            {/* Columna 1: Convocatoria */}
            <div className="form-group mb-0">
              <label>Nro. Convocatoria / Ref. Interna</label>
              <input
                type="text"
                className="form-control"
                disabled={isSubmitting}
                value={nroConvocatoria}
                onChange={(e) => setNroConvocatoria(e.target.value)}
                placeholder="Ej: CDC:2026/01"
              />
            </div>

            {/* Columna 2: Selector de Área */}
            <div className="form-group mb-0 form-group-dropdown-wrapper" ref={dropdownAreaRef}>
              <label className="d-flex align-items-center gap-1">
                <Building2 size={15} /> Área / Unidad Origen (*)
              </label>
              {loadingAreas ? (
                <p className="text-muted small mt-2">Cargando áreas...</p>
              ) : (
                <div className="searchable-select-container">
                  <button
                    type="button"
                    className="searchable-select-trigger form-control text-start d-flex justify-content-between align-items-center"
                    disabled={isSubmitting}
                    onClick={() => setIsAreaDropdownOpen(!isAreaDropdownOpen)}
                  >
                    <span className="text-truncate">
                      {objetoAreaSeleccionada 
                        ? `${objetoAreaSeleccionada.nombre} ${objetoAreaSeleccionada.dependencia_nombre ? `(${objetoAreaSeleccionada.dependencia_nombre})` : ''}`
                        : '-- Seleccionar Área --'}
                    </span>
                    <ChevronDown size={16} className={`ms-2 flex-shrink-0 transition-transform ${isAreaDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isAreaDropdownOpen && (
                    <div className="searchable-select-dropdown shadow-lg">
                      <div className="searchable-input-wrapper">
                        <Search size={15} className="searchable-search-icon" />
                        <input
                          type="text"
                          className="form-control searchable-search-input"
                          placeholder="Buscar por palabra clave (ej: estudios, patrimonio, tics)..."
                          autoFocus
                          value={busquedaAreaText}
                          onChange={(e) => setBusquedaAreaText(e.target.value)}
                        />
                      </div>

                      <div className="searchable-options-list">
                        {areasFiltradasBuscador.length === 0 ? (
                          <div className="searchable-no-results">
                            No se encontraron áreas o dependencias coincidentes.
                          </div>
                        ) : (
                          areasFiltradasBuscador.map((a) => {
                            const idA = a.id ?? a.area_id;
                            const esSeleccionado = parseInt(areaSeleccionada, 10) === idA;

                            return (
                              <div
                                key={idA}
                                className={`searchable-option-item ${esSeleccionado ? 'selected' : ''}`}
                                onClick={() => {
                                  setAreaSeleccionada(idA);
                                  setIsAreaDropdownOpen(false);
                                  setBusquedaAreaText('');
                                }}
                              >
                                <div className="option-content">
                                  <span className="option-title">{a.nombre}</span>
                                  {a.dependencia_nombre && (
                                    <span className="option-badge">
                                      <Building2 size={11} /> {a.dependencia_nombre}
                                    </span>
                                  )}
                                </div>
                                {esSeleccionado && (
                                  <div className="option-check-icon">
                                    <Check size={16} />
                                  </div>
                                )}
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Columna 3: Input de Observaciones Generales a la derecha */}
            <div className="form-group mb-0">
              <label className="d-flex align-items-center gap-1">
                <MessageSquare size={15} /> Observaciones Generales
              </label>
              <input
                type="text"
                className="form-control"
                disabled={isSubmitting}
                value={observacionGeneral}
                onChange={(e) => setObservacionGeneral(e.target.value)}
                placeholder="Observaciones o notas adicionales..."
              />
            </div>
          </div>
        </div>
      </div>

      {/* BLOQUE 2: Catálogo de Bienes */}
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
                  const idR = r.rubro_id ?? r.id ?? r;
                  const nombreR = r.rubro_nombre ?? r.nombre ?? r.desc ?? r;
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
                placeholder="Buscar bien para agregar..."
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
                  const idBien = parseInt(bien.bien_id ?? bien.id, 10);
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

      {/* BLOQUE 3: Detalle de Ítems */}
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
                    No ha seleccionado productos aún. Marque las casillas en el catálogo superior para comenzar.
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
                        title="Quitar bien"
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
                  <span>{esModoEdicion ? 'Reenviar Solicitud' : 'Enviar Solicitud'}</span>
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