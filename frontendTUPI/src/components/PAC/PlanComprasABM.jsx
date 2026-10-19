import React, { useState } from 'react';
import './PlanComprasABM.css';

// Diccionario de opciones dependientes de la categoría
const bienesPorRubro = {
  'INFORMÁTICA': [
    'Computadora Básica (Ofimática)',
    'Computadora Intermedia',
    'Computadora Avanzada (Diseño/Desarrollo)',
    'Monitor LED 24"',
    'Impresora Láser B/N',
    'Lector de tarjetas USB',
    'Disco Sólido SSD 1TB',
    'Memoria RAM 16GB DDR4'
  ],
  'LIMPIEZA': [
    'Escoba de cerdas duras',
    'Lavandina concentrada x 5L',
    'Detergente líquido x 5L',
    'Bolsas de consorcio 90x100 (Paquete x50)',
    'Trapos de piso (algodón)',
    'Desodorante de piso x 5L',
    'Papel higiénico en rollo x 300m'
  ],
  'MANTENIMIENTO': [
    'Pintura Látex Interior Blanca x 20L',
    'Focos LED 15W',
    'Cinta aisladora PVC',
    'Silicona selladora transparente',
    'Rodillo antigota 22cm',
    'Cable tipo taller 3x2.5mm x 100m'
  ],
  'LIBRERÍA': [
    'Resma Papel A4 80gr x 500 hojas',
    'Resma Papel Oficio 80gr x 500 hojas',
    'Bolígrafos trazo fino (Azul)',
    'Biblioratos A4 lomo ancho',
    'Folios transparentes x 100',
    'Marcadores para pizarra blanca (Surtidos)'
  ]
};

const PlanComprasABM = () => {
  // Estado para controlar qué categoría está seleccionada y mostrar los bienes correspondientes en el datalist
  const [rubroSeleccionado, setRubroSeleccionado] = useState('INFORMÁTICA');

  // Datos mockeados con mucha variedad para la presentación
  const [items] = useState([
    {
      id: 1,
      dependencia: 'OFICINA RECTORADO',
      inciso: 4,
      partidaPrincipal: 3,
      partidaParcial: 6,
      rubro: 'INFORMÁTICA',
      descripcion: 'Lector de tarjetas TP-Link USB-A para SD y microSD 5Gbps',
      cantidad: 1,
      montoUnitario: 33089,
      subtotal: 33089,
      fechaCompra: 'a definir'
    },
    {
      id: 2,
      dependencia: 'SECRETARÍA GENERAL',
      inciso: 2,
      partidaPrincipal: 1,
      partidaParcial: 1,
      rubro: 'LIMPIEZA',
      descripcion: 'Lavandina concentrada x 5L',
      cantidad: 10,
      montoUnitario: 4500,
      subtotal: 45000,
      fechaCompra: '2026-02-15'
    },
    {
      id: 3,
      dependencia: 'DIRECCIÓN DE SISTEMAS',
      inciso: 4,
      partidaPrincipal: 3,
      partidaParcial: 6,
      rubro: 'INFORMÁTICA',
      descripcion: 'Computadora Avanzada (Diseño/Desarrollo) - Core i7, 32GB RAM',
      cantidad: 2,
      montoUnitario: 1250000,
      subtotal: 2500000,
      fechaCompra: '2026-03-01'
    },
    {
      id: 4,
      dependencia: 'OFICINA RECTORADO',
      inciso: 2,
      partidaPrincipal: 9,
      partidaParcial: 2,
      rubro: 'LIBRERÍA',
      descripcion: 'Resma Papel A4 80gr x 500 hojas',
      cantidad: 50,
      montoUnitario: 6800,
      subtotal: 340000,
      fechaCompra: '2026-01-20'
    },
    {
      id: 5,
      dependencia: 'MANTENIMIENTO Y OBRAS',
      inciso: 2,
      partidaPrincipal: 5,
      partidaParcial: 4,
      rubro: 'MANTENIMIENTO',
      descripcion: 'Pintura Látex Interior Blanca x 20L',
      cantidad: 5,
      montoUnitario: 58000,
      subtotal: 290000,
      fechaCompra: '2026-04-10'
    },
    {
      id: 6,
      dependencia: 'SECRETARÍA ACADÉMICA',
      inciso: 2,
      partidaPrincipal: 9,
      partidaParcial: 2,
      rubro: 'LIBRERÍA',
      descripcion: 'Marcadores para pizarra blanca (Surtidos)',
      cantidad: 20,
      montoUnitario: 1200,
      subtotal: 24000,
      fechaCompra: '2026-02-05'
    },
    {
      id: 7,
      dependencia: 'DIRECCIÓN DE SISTEMAS',
      inciso: 4,
      partidaPrincipal: 3,
      partidaParcial: 6,
      rubro: 'INFORMÁTICA',
      descripcion: 'Monitor LED 24" FHD IPS',
      cantidad: 4,
      montoUnitario: 185000,
      subtotal: 740000,
      fechaCompra: '2026-03-01'
    }
  ]);

  // Función auxiliar para darle color dinámico al badge según el rubro
  const getBadgeColor = (rubro) => {
    switch(rubro) {
      case 'INFORMÁTICA': return 'badge-blue';
      case 'LIMPIEZA': return 'badge-green'; // Asegúrate de agregar esta clase en el CSS si quieres variedad, o usa solo blue
      case 'MANTENIMIENTO': return 'badge-orange';
      case 'LIBRERÍA': return 'badge-purple';
      default: return 'badge-blue';
    }
  };

  return (
    <div className="abm-container">
      <div className="abm-header">
        <h1 className="abm-title">Plan Anual de Compras 2026</h1>
        <p className="abm-subtitle">Gestión y carga de requerimientos consolidados de la dependencia</p>
      </div>

      {/* Tarjeta del Formulario de Carga */}
      <div className="abm-card">
        <div className="card-header">
          <h2 className="card-title">Cargar Nuevo Requerimiento</h2>
        </div>
        
        <form className="abm-form">
          <div className="form-grid">
            
            <div className="form-group">
              <label>Dependencia / Área</label>
              <select className="form-control">
                <option>OFICINA RECTORADO</option>
                <option>SECRETARÍA GENERAL</option>
                <option>SECRETARÍA ACADÉMICA</option>
                <option>DIRECCIÓN DE SISTEMAS</option>
                <option>MANTENIMIENTO Y OBRAS</option>
              </select>
            </div>

            <div className="form-group">
              <label>Rubro / Categoría</label>
              <select 
                className="form-control"
                value={rubroSeleccionado}
                onChange={(e) => setRubroSeleccionado(e.target.value)}
              >
                <option value="INFORMÁTICA">INFORMÁTICA</option>
                <option value="LIMPIEZA">LIMPIEZA</option>
                <option value="MANTENIMIENTO">MANTENIMIENTO</option>
                <option value="LIBRERÍA">LIBRERÍA</option>
              </select>
            </div>

            <div className="form-group col-span-2">
              <label>Bien / Descripción (Seleccione o escriba el detalle)</label>
              <input 
                type="text" 
                list="lista-bienes" 
                placeholder="Ej: Computadora intermedia..." 
                className="form-control" 
              />
              <datalist id="lista-bienes">
                {bienesPorRubro[rubroSeleccionado]?.map((bien, index) => (
                  <option key={index} value={bien} />
                ))}
              </datalist>
            </div>

            <div className="form-group form-group-sm">
              <label>Inciso</label>
              <select className="form-control">
                {[1,2,3,4,5,6,7,8,9].map(num => <option key={num} value={num}>{num}</option>)}
              </select>
            </div>

            <div className="form-group form-group-sm">
              <label>Part. Princ.</label>
              <select className="form-control">
                {[1,2,3,4,5,6,7,8,9].map(num => <option key={num} value={num}>{num}</option>)}
              </select>
            </div>

            <div className="form-group form-group-sm">
              <label>Part. Parc.</label>
              <select className="form-control">
                {[1,2,3,4,5,6,7,8,9].map(num => <option key={num} value={num}>{num}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label>Cantidad</label>
              <input type="number" min="1" defaultValue="1" className="form-control text-center" />
            </div>

            <div className="form-group">
              <label>Monto Unit. Est.</label>
              <div className="input-with-prefix">
                <span className="prefix">$</span>
                <input type="number" placeholder="0.00" className="form-control" />
              </div>
            </div>

            <div className="form-group">
              <label>Fecha Est. Compra</label>
              <input type="date" className="form-control" />
            </div>

            <div className="form-group col-span-2">
              <label>Link de Referencia (Opcional)</label>
              <input type="url" placeholder="https://..." className="form-control" />
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-secondary">Limpiar Formulario</button>
            <button type="button" className="btn btn-primary">Agregar al Plan</button>
          </div>
        </form>
      </div>

      {/* Tarjeta de la Tabla de Resultados */}
      <div className="abm-card">
        <div className="table-wrapper">
          <table className="abm-table">
            <thead>
              <tr>
                <th>Dependencia / Área</th>
                <th className="text-center">Inciso</th>
                <th className="text-center">P.Princ</th>
                <th className="text-center">P.Parc</th>
                <th>Rubro</th>
                <th>Descripción del Bien</th>
                <th className="text-center">Cant.</th>
                <th className="text-right">Unitario</th>
                <th className="text-right">Subtotal</th>
                <th className="text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>{item.dependencia}</td>
                  <td className="text-center text-gray">{item.inciso}</td>
                  <td className="text-center text-gray">{item.partidaPrincipal}</td>
                  <td className="text-center text-gray">{item.partidaParcial}</td>
                  <td>
                    {/* Se usa el badge azul general, pero con la función queda listo si agregas más colores al CSS */}
                    <span className="badge badge-blue">{item.rubro}</span>
                  </td>
                  <td className="cell-truncate" title={item.descripcion}>{item.descripcion}</td>
                  <td className="text-center font-medium">{item.cantidad}</td>
                  <td className="text-right text-gray">
                    ${item.montoUnitario.toLocaleString('es-AR')}
                  </td>
                  <td className="text-right font-bold">
                    ${item.subtotal.toLocaleString('es-AR')}
                  </td>
                  <td className="text-center">
                    <button className="action-btn edit" title="Editar">Editar</button>
                    <button className="action-btn delete" title="Eliminar">Borrar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PlanComprasABM;