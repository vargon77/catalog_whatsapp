<!-- src/lib/components/reportes/RespaldosDB.svelte -->
<script>
  import { Database, Download, Loader2, CheckCircle2, Package, Users, ShoppingBag, Settings } from 'lucide-svelte';
  import ExcelJS from 'exceljs';
  import { format } from 'date-fns';
  
  let exportando = false;
  let exportandoTodo = false;
  let ultimoRespaldo = null;
  let progreso = {
    paso: '',
    porcentaje: 0
  };
  
  // Cargar último respaldo del localStorage
  if (typeof localStorage !== 'undefined') {
    const ultimo = localStorage.getItem('ultimo_respaldo');
    if (ultimo) {
      ultimoRespaldo = JSON.parse(ultimo);
    }
  }
  
  const tiposRespaldo = [
    {
      id: 'pedidos',
      nombre: 'Pedidos Completos',
      descripcion: 'Todos los pedidos con items y clientes',
      icon: ShoppingBag,
      color: 'blue'
    },
    {
      id: 'productos',
      nombre: 'Catálogo de Productos',
      descripcion: 'Productos, categorías y marcas',
      icon: Package,
      color: 'green'
    },
    {
      id: 'clientes',
      nombre: 'Base de Clientes',
      descripcion: 'Información de todos los clientes',
      icon: Users,
      color: 'purple'
    },
    {
      id: 'configuracion',
      nombre: 'Configuración',
      descripcion: 'Settings y preferencias del sistema',
      icon: Settings,
      color: 'amber'
    }
  ];
  
  async function exportarPedidos() {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Pedidos');
    
    // Headers
    sheet.columns = [
      { header: 'ID', key: 'id', width: 15 },
      { header: 'Número Pedido', key: 'numero_pedido', width: 15 },
      { header: 'Fecha', key: 'fecha', width: 20 },
      { header: 'Cliente', key: 'cliente_nombre', width: 25 },
      { header: 'WhatsApp', key: 'cliente_whatsapp', width: 15 },
      { header: 'Email', key: 'cliente_email', width: 25 },
      { header: 'Dirección', key: 'cliente_direccion', width: 30 },
      { header: 'Estado', key: 'estado', width: 12 },
      { header: 'Subtotal', key: 'subtotal', width: 12 },
      { header: 'Impuesto', key: 'impuesto', width: 12 },
      { header: 'Total', key: 'total', width: 12 },
      { header: 'Notas', key: 'notas', width: 30 }
    ];
    
    // Estilo headers
    sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    sheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF2563EB' }
    };
    
    // Obtener datos
    const res = await fetch('/api/pedidos?limit=10000');
    const result = await res.json();
    const pedidos = result.data || [];
    
    pedidos.forEach(pedido => {
      sheet.addRow({
        id: pedido.id,
        numero_pedido: pedido.numero_pedido,
        fecha: format(new Date(pedido.created_at), 'yyyy-MM-dd HH:mm'),
        cliente_nombre: pedido.cliente_nombre,
        cliente_whatsapp: pedido.cliente_whatsapp,
        cliente_email: pedido.cliente_email,
        cliente_direccion: pedido.cliente_direccion,
        estado: pedido.estado,
        subtotal: pedido.subtotal,
        impuesto: pedido.impuesto,
        total: pedido.total,
        notas: pedido.notas
      });
    });
    
    return workbook;
  }
  
  async function exportarProductos() {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Productos');
    
    sheet.columns = [
      { header: 'ID', key: 'id', width: 15 },
      { header: 'Nombre', key: 'nombre', width: 30 },
      { header: 'SKU', key: 'sku', width: 15 },
      { header: 'Descripción', key: 'descripcion', width: 40 },
      { header: 'Categoría', key: 'categoria', width: 20 },
      { header: 'Marca', key: 'marca', width: 20 },
      { header: 'Precio', key: 'precio', width: 12 },
      { header: 'Precio Oferta', key: 'precio_oferta', width: 12 },
      { header: 'Stock', key: 'stock', width: 10 },
      { header: 'Destacado', key: 'destacado', width: 10 },
      { header: 'Activo', key: 'activo', width: 10 }
    ];
    
    sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    sheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF10B981' }
    };
    
    const res = await fetch('/api/productos');
    const productos = await res.json();
    
    (Array.isArray(productos) ? productos : []).forEach(prod => {
      sheet.addRow({
        id: prod.id,
        nombre: prod.nombre,
        sku: prod.sku,
        descripcion: prod.descripcion_larga,
        categoria: prod.categoria?.nombre,
        marca: prod.marca?.nombre,
        precio: prod.precio,
        precio_oferta: prod.precio_oferta,
        stock: prod.stock,
        destacado: prod.destacado ? 'Sí' : 'No',
        activo: prod.activo ? 'Sí' : 'No'
      });
    });
    
    return workbook;
  }
  
  async function exportarClientes() {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Clientes');
    
    sheet.columns = [
      { header: 'ID', key: 'id', width: 15 },
      { header: 'Nombre', key: 'nombre', width: 30 },
      { header: 'WhatsApp', key: 'whatsapp', width: 15 },
      { header: 'Email', key: 'email', width: 25 },
      { header: 'Teléfono', key: 'telefono', width: 15 },
      { header: 'Dirección', key: 'direccion', width: 35 },
      { header: 'Fecha Registro', key: 'fecha', width: 20 }
    ];
    
    sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    sheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF7C3AED' }
    };
    
    const res = await fetch('/api/clientes?busqueda=a'); // Truco para obtener todos
    const result = await res.json();
    const clientes = result.data || [];
    
    clientes.forEach(cliente => {
      sheet.addRow({
        id: cliente.id,
        nombre: cliente.nombre,
        whatsapp: cliente.whatsapp,
        email: cliente.email,
        telefono: cliente.telefono,
        direccion: cliente.direccion,
        fecha: cliente.created_at ? format(new Date(cliente.created_at), 'yyyy-MM-dd') : ''
      });
    });
    
    return workbook;
  }
  
  async function exportarConfiguracion() {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Configuración');
    
    const res = await fetch('/api/configuracion');
    const result = await res.json();
    const config = result.data;
    
    sheet.columns = [
      { header: 'Parámetro', key: 'parametro', width: 30 },
      { header: 'Valor', key: 'valor', width: 50 }
    ];
    
    sheet.getRow(1).font = { bold: true };
    
    Object.entries(config).forEach(([key, value]) => {
      if (typeof value !== 'object') {
        sheet.addRow({
          parametro: key,
          valor: String(value)
        });
      }
    });
    
    return workbook;
  }
  
  async function exportarIndividual(tipo) {
    exportando = true;
    progreso = { paso: `Exportando ${tipo}...`, porcentaje: 50 };
    
    try {
      let workbook;
      
      switch(tipo) {
        case 'pedidos':
          workbook = await exportarPedidos();
          break;
        case 'productos':
          workbook = await exportarProductos();
          break;
        case 'clientes':
          workbook = await exportarClientes();
          break;
        case 'configuracion':
          workbook = await exportarConfiguracion();
          break;
      }
      
      const buffer = await workbook.xlsx.writeBuffer();
      const fecha = format(new Date(), 'yyyy-MM-dd_HHmm');
      descargarArchivo(buffer, `respaldo_${tipo}_${fecha}.xlsx`);
      
      actualizarUltimoRespaldo(tipo);
      
    } catch (error) {
      console.error('Error exportando:', error);
      alert('Error al generar el respaldo');
    } finally {
      exportando = false;
      progreso = { paso: '', porcentaje: 0 };
    }
  }
  
  async function exportarTodo() {
    exportandoTodo = true;
    
    try {
      progreso = { paso: 'Exportando pedidos...', porcentaje: 20 };
      const wbPedidos = await exportarPedidos();
      
      progreso = { paso: 'Exportando productos...', porcentaje: 40 };
      const wbProductos = await exportarProductos();
      
      progreso = { paso: 'Exportando clientes...', porcentaje: 60 };
      const wbClientes = await exportarClientes();
      
      progreso = { paso: 'Exportando configuración...', porcentaje: 80 };
      const wbConfig = await exportarConfiguracion();
      
      progreso = { paso: 'Generando archivos...', porcentaje: 90 };
      
      // Descargar cada archivo
      const fecha = format(new Date(), 'yyyy-MM-dd_HHmm');
      
      const buffers = await Promise.all([
        wbPedidos.xlsx.writeBuffer(),
        wbProductos.xlsx.writeBuffer(),
        wbClientes.xlsx.writeBuffer(),
        wbConfig.xlsx.writeBuffer()
      ]);
      
      descargarArchivo(buffers[0], `respaldo_pedidos_${fecha}.xlsx`);
      setTimeout(() => descargarArchivo(buffers[1], `respaldo_productos_${fecha}.xlsx`), 500);
      setTimeout(() => descargarArchivo(buffers[2], `respaldo_clientes_${fecha}.xlsx`), 1000);
      setTimeout(() => descargarArchivo(buffers[3], `respaldo_config_${fecha}.xlsx`), 1500);
      
      actualizarUltimoRespaldo('completo');
      
    } catch (error) {
      console.error('Error exportando todo:', error);
      alert('Error al generar los respaldos');
    } finally {
      exportandoTodo = false;
      progreso = { paso: '', porcentaje: 0 };
    }
  }
  
  function descargarArchivo(buffer, nombre) {
    const blob = new Blob([buffer], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = nombre;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }
  
  function actualizarUltimoRespaldo(tipo) {
    const info = {
      tipo,
      fecha: new Date().toISOString()
    };
    ultimoRespaldo = info;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('ultimo_respaldo', JSON.stringify(info));
    }
  }
  
  function getColorClass(color) {
    const colors = {
      blue: 'bg-blue-100 text-blue-600',
      green: 'bg-green-100 text-green-600',
      purple: 'bg-purple-100 text-purple-600',
      amber: 'bg-amber-100 text-amber-600'
    };
    return colors[color] || colors.blue;
  }
</script>

<div class="space-y-6">
  
  <!-- Header -->
  <div class="flex items-center justify-between">
    <div class="flex items-center gap-3">
      <Database class="w-6 h-6 text-primary-600" />
      <div>
        <h3 class="text-lg font-semibold text-gray-900">Respaldos de Base de Datos</h3>
        <p class="text-sm text-gray-600">Exporta tus datos de forma segura</p>
      </div>
    </div>
    
    {#if ultimoRespaldo}
      <div class="text-xs text-gray-500 text-right">
        <p>Último respaldo:</p>
        <p class="font-medium">{ultimoRespaldo.tipo}</p>
        <p>{format(new Date(ultimoRespaldo.fecha), 'dd/MM/yyyy HH:mm')}</p>
      </div>
    {/if}
  </div>
  
  <!-- Respaldo completo -->
  <div class="bg-gradient-to-r from-primary-50 to-primary-100 rounded-xl p-6 border-2 border-primary-200">
    <div class="flex items-center justify-between">
      <div>
        <h4 class="text-lg font-bold text-gray-900 mb-2">Respaldo Completo</h4>
        <p class="text-sm text-gray-700 mb-4">
          Exporta todos los datos del sistema en un solo paso
        </p>
        {#if exportandoTodo}
          <div class="flex items-center gap-2 text-sm text-primary-700">
            <Loader2 class="w-4 h-4 animate-spin" />
            <span>{progreso.paso} ({progreso.porcentaje}%)</span>
          </div>
        {/if}
      </div>
      
      <button
        on:click={exportarTodo}
        disabled={exportandoTodo || exportando}
        class="btn-primary flex items-center gap-2 disabled:opacity-50"
      >
        {#if exportandoTodo}
          <Loader2 class="w-5 h-5 animate-spin" />
          Exportando...
        {:else}
          <Download class="w-5 h-5" />
          Respaldar Todo
        {/if}
      </button>
    </div>
  </div>
  
  <!-- Respaldos individuales -->
  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
    {#each tiposRespaldo as tipo}
      <div class="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
        <div class="flex items-start justify-between mb-3">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-lg {getColorClass(tipo.color)} flex items-center justify-center">
              <svelte:component this={tipo.icon} class="w-6 h-6" />
            </div>
            <div>
              <h5 class="font-semibold text-gray-900">{tipo.nombre}</h5>
              <p class="text-xs text-gray-600">{tipo.descripcion}</p>
            </div>
          </div>
        </div>
        
        <button
          on:click={() => exportarIndividual(tipo.id)}
          disabled={exportando || exportandoTodo}
          class="w-full btn-outline flex items-center justify-center gap-2 text-sm disabled:opacity-50"
        >
          {#if exportando && progreso.paso.includes(tipo.nombre)}
            <Loader2 class="w-4 h-4 animate-spin" />
            Exportando...
          {:else}
            <Download class="w-4 h-4" />
            Exportar
          {/if}
        </button>
      </div>
    {/each}
  </div>
  
  <!-- Información -->
  <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
    <div class="flex items-start gap-3">
      <CheckCircle2 class="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
      <div class="text-sm text-blue-800">
        <p class="font-medium mb-2">💡 Acerca de los respaldos</p>
        <ul class="list-disc list-inside space-y-1 text-blue-700">
          <li>Los archivos se descargan en formato Excel (.xlsx)</li>
          <li>Recomendamos hacer respaldos semanales</li>
          <li>Guarda los archivos en un lugar seguro</li>
          <li>Los respaldos no incluyen imágenes (solo URLs)</li>
        </ul>
      </div>
    </div>
  </div>
  
</div>