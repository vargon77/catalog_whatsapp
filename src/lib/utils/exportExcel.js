// src/lib/utils/exportExcel.js
import ExcelJS from 'exceljs';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

/**
 * Genera un archivo Excel con el reporte completo
 */
export async function generarReporteExcel(datos, estadisticas, filtros) {
  const workbook = new ExcelJS.Workbook();
  
  // Configurar propiedades del archivo
  workbook.creator = 'CatálogoExpress';
  workbook.created = new Date();
  
  // 1. Hoja de Resumen
  agregarHojaResumen(workbook, estadisticas, filtros);
  
  // 2. Hoja de Pedidos Detallados
  agregarHojaPedidos(workbook, datos);
  
  // 3. Hoja de Productos Vendidos
  agregarHojaProductos(workbook, datos, estadisticas);
  
  // 4. Hoja de Top Clientes
  agregarHojaClientes(workbook, estadisticas);
  
  // Generar archivo
  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
}

/**
 * Hoja 1: Resumen General
 */
function agregarHojaResumen(workbook, estadisticas, filtros) {
  const sheet = workbook.addWorksheet('Resumen General', {
    views: [{ state: 'frozen', ySplit: 1 }]
  });
  
  // Título
  sheet.mergeCells('A1:D1');
  const titleCell = sheet.getCell('A1');
  titleCell.value = '📊 RESUMEN GENERAL DE VENTAS';
  titleCell.font = { size: 16, bold: true, color: { argb: 'FF2563EB' } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  titleCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFDBEAFE' }
  };
  sheet.getRow(1).height = 30;
  
  // Información de filtros
  let row = 3;
  sheet.getCell(`A${row}`).value = 'Periodo:';
  sheet.getCell(`A${row}`).font = { bold: true };
  sheet.getCell(`B${row}`).value = filtros.fechaInicio && filtros.fechaFin
    ? `${filtros.fechaInicio} a ${filtros.fechaFin}`
    : 'Todos los registros';
  row++;
  
  if (filtros.estados?.length) {
    sheet.getCell(`A${row}`).value = 'Estados:';
    sheet.getCell(`A${row}`).font = { bold: true };
    sheet.getCell(`B${row}`).value = filtros.estados.join(', ');
    row++;
  }
  
  row += 2;
  
  // Métricas principales
  const metricas = [
    ['💰 Total de Ventas', `$${estadisticas.totalVentas?.toFixed(2) || '0.00'}`],
    ['📦 Total de Pedidos', estadisticas.totalPedidos || 0],
    ['🎯 Ticket Promedio', `$${estadisticas.ticketPromedio?.toFixed(2) || '0.00'}`],
  ];
  
  metricas.forEach(([label, value]) => {
    sheet.getCell(`A${row}`).value = label;
    sheet.getCell(`A${row}`).font = { bold: true, size: 12 };
    sheet.getCell(`B${row}`).value = value;
    sheet.getCell(`B${row}`).font = { size: 12, color: { argb: 'FF059669' } };
    row++;
  });
  
  row += 2;
  
  // Pedidos por estado
  sheet.getCell(`A${row}`).value = 'Distribución por Estado';
  sheet.getCell(`A${row}`).font = { bold: true, size: 12 };
  row++;
  
  if (estadisticas.pedidosPorEstado) {
    Object.entries(estadisticas.pedidosPorEstado).forEach(([estado, cantidad]) => {
      sheet.getCell(`A${row}`).value = estado.charAt(0).toUpperCase() + estado.slice(1);
      sheet.getCell(`B${row}`).value = cantidad;
      row++;
    });
  }
  
  // Ajustar anchos
  sheet.getColumn('A').width = 30;
  sheet.getColumn('B').width = 20;
  sheet.getColumn('C').width = 15;
  sheet.getColumn('D').width = 15;
}

/**
 * Hoja 2: Pedidos Detallados
 */
function agregarHojaPedidos(workbook, pedidos) {
  const sheet = workbook.addWorksheet('Pedidos Detallados');
  
  // Headers
  const headers = [
    'Nº Pedido',
    'Fecha',
    'Cliente',
    'WhatsApp',
    'Estado',
    'Productos',
    'Subtotal',
    'Impuesto',
    'Total'
  ];
  
  sheet.getRow(1).values = headers;
  
  // Estilo de headers
  sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  sheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF2563EB' }
  };
  sheet.getRow(1).height = 20;
  
  // Datos
  pedidos.forEach((pedido, index) => {
    const row = sheet.getRow(index + 2);
    row.values = [
      pedido.numero_pedido || pedido.id,
      format(new Date(pedido.created_at), 'dd/MM/yyyy HH:mm', { locale: es }),
      pedido.cliente_nombre,
      pedido.cliente_whatsapp,
      pedido.estado.toUpperCase(),
      pedido.items?.length || 0,
      parseFloat(pedido.subtotal || pedido.total || 0),
      parseFloat(pedido.impuesto || 0),
      parseFloat(pedido.total || 0)
    ];
    
    // Formato de moneda
    row.getCell(7).numFmt = '$#,##0.00';
    row.getCell(8).numFmt = '$#,##0.00';
    row.getCell(9).numFmt = '$#,##0.00';
    
    // Color según estado
    const colorEstado = {
      'pendiente': 'FFFEF3C7',
      'confirmado': 'FFBFDBFE',
      'enviado': 'FFC7D2FE',
      'entregado': 'FFD1FAE5',
      'cancelado': 'FFFECACA'
    };
    
    row.getCell(5).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: colorEstado[pedido.estado] || 'FFFFFFFF' }
    };
  });
  
  // Totales
  const totalRow = sheet.getRow(pedidos.length + 3);
  totalRow.getCell(1).value = 'TOTALES:';
  totalRow.getCell(1).font = { bold: true };
  totalRow.getCell(7).value = { formula: `SUM(G2:G${pedidos.length + 1})` };
  totalRow.getCell(8).value = { formula: `SUM(H2:H${pedidos.length + 1})` };
  totalRow.getCell(9).value = { formula: `SUM(I2:I${pedidos.length + 1})` };
  totalRow.font = { bold: true };
  totalRow.getCell(7).numFmt = '$#,##0.00';
  totalRow.getCell(8).numFmt = '$#,##0.00';
  totalRow.getCell(9).numFmt = '$#,##0.00';
  
  // Ajustar anchos
  sheet.columns.forEach((column, index) => {
    if (index === 0) column.width = 15;
    else if (index === 1) column.width = 18;
    else if (index === 2) column.width = 25;
    else if (index === 3) column.width = 15;
    else column.width = 12;
  });
  
  // Filtros
  sheet.autoFilter = {
    from: 'A1',
    to: `I1`
  };
}

/**
 * Hoja 3: Productos Vendidos
 */
function agregarHojaProductos(workbook, pedidos, estadisticas) {
  const sheet = workbook.addWorksheet('Productos Vendidos');
  
  // Headers
  const headers = ['Producto', 'Cantidad Vendida', 'Total Ventas'];
  sheet.getRow(1).values = headers;
  sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  sheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF059669' }
  };
  
  // Datos
  if (estadisticas.topProductos) {
    estadisticas.topProductos.forEach((producto, index) => {
      const row = sheet.getRow(index + 2);
      row.values = [
        producto.nombre,
        producto.cantidad,
        producto.total
      ];
      row.getCell(3).numFmt = '$#,##0.00';
    });
  }
  
  // Ajustar anchos
  sheet.getColumn(1).width = 40;
  sheet.getColumn(2).width = 18;
  sheet.getColumn(3).width = 18;
}

/**
 * Hoja 4: Top Clientes
 */
function agregarHojaClientes(workbook, estadisticas) {
  const sheet = workbook.addWorksheet('Top Clientes');
  
  // Headers
  const headers = ['Cliente', 'WhatsApp', 'Pedidos', 'Total Compras'];
  sheet.getRow(1).values = headers;
  sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  sheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF7C3AED' }
  };
  
  // Datos
  if (estadisticas.topClientes) {
    estadisticas.topClientes.forEach((cliente, index) => {
      const row = sheet.getRow(index + 2);
      row.values = [
        cliente.nombre,
        cliente.whatsapp,
        cliente.pedidos,
        cliente.total
      ];
      row.getCell(4).numFmt = '$#,##0.00';
    });
  }
  
  // Ajustar anchos
  sheet.getColumn(1).width = 30;
  sheet.getColumn(2).width = 18;
  sheet.getColumn(3).width = 12;
  sheet.getColumn(4).width = 18;
}

/**
 * Descargar el archivo Excel
 */
export function descargarExcel(buffer, nombreBase = 'reporte') {
  const fecha = format(new Date(), 'yyyy-MM-dd_HHmm');
  const nombreArchivo = `${nombreBase}_${fecha}.xlsx`;
  
  const blob = new Blob([buffer], { 
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
  });
  
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = nombreArchivo;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}