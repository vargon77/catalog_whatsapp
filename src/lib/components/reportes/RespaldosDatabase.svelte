<!-- src/lib/components/reportes/RespaldosDatabase.svelte -->
<script>
  import { Download, Database, Package, Users, Settings, Archive, CheckCircle2, Loader2, AlertCircle } from 'lucide-svelte';
  import { format } from 'date-fns';
  import { es } from 'date-fns/locale';
  
  let generando = '';
  let mensaje = { tipo: '', texto: '', visible: false };
  let ultimosRespaldos = {};
  
  // Cargar últimos respaldos desde localStorage
  function cargarUltimosRespaldos() {
    try {
      const stored = localStorage.getItem('ultimos_respaldos');
      if (stored) {
        ultimosRespaldos = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error cargando respaldos:', error);
    }
  }
  
  // Guardar información de respaldo
  function guardarRespaldo(tipo) {
    ultimosRespaldos[tipo] = {
      fecha: new Date().toISOString(),
      exito: true
    };
    localStorage.setItem('ultimos_respaldos', JSON.stringify(ultimosRespaldos));
  }
  
  function mostrarMensaje(tipo, texto) {
    mensaje = { tipo, texto, visible: true };
    setTimeout(() => { mensaje.visible = false; }, 5000);
  }
  
  async function generarRespaldo(tipo) {
    generando = tipo;
    
    try {
      let data = [];
      let filename = '';
      
      switch(tipo) {
        case 'pedidos':
          const resPedidos = await fetch('/api/pedidos?limit=1000');
          const resultPedidos = await resPedidos.json();
          data = resultPedidos.success ? resultPedidos.data : [];
          filename = `respaldo_pedidos_${format(new Date(), 'yyyy-MM-dd_HHmm')}.json`;
          break;
          
        case 'productos':
          const resProductos = await fetch('/api/productos');
          data = await resProductos.json();
          filename = `respaldo_productos_${format(new Date(), 'yyyy-MM-dd_HHmm')}.json`;
          break;
          
        case 'configuracion':
          const resConfig = await fetch('/api/configuracion');
          const resultConfig = await resConfig.json();
          data = resultConfig.success ? resultConfig.data : {};
          filename = `respaldo_configuracion_${format(new Date(), 'yyyy-MM-dd_HHmm')}.json`;
          break;
          
        case 'categorias':
          const resCat = await fetch('/api/categorias');
          const resultCat = await resCat.json();
          data = resultCat.success ? resultCat.data : [];
          filename = `respaldo_categorias_${format(new Date(), 'yyyy-MM-dd_HHmm')}.json`;
          break;
          
        case 'marcas':
          const resMarcas = await fetch('/api/marcas');
          const resultMarcas = await resMarcas.json();
          data = resultMarcas.success ? resultMarcas.data : [];
          filename = `respaldo_marcas_${format(new Date(), 'yyyy-MM-dd_HHmm')}.json`;
          break;
      }
      
      // Crear y descargar archivo JSON
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      // Guardar info del respaldo
      guardarRespaldo(tipo);
      cargarUltimosRespaldos();
      
      mostrarMensaje('success', `Respaldo de ${tipo} descargado correctamente`);
      
    } catch (error) {
      console.error('Error generando respaldo:', error);
      mostrarMensaje('error', `Error al generar respaldo: ${error.message}`);
    } finally {
      generando = '';
    }
  }
  
  async function respaldarTodo() {
    generando = 'completo';
    
    try {
      // Obtener todos los datos en paralelo
      const [
        resPedidos,
        resProductos,
        resConfig,
        resCategorias,
        resMarcas
      ] = await Promise.all([
        fetch('/api/pedidos?limit=1000'),
        fetch('/api/productos'),
        fetch('/api/configuracion'),
        fetch('/api/categorias'),
        fetch('/api/marcas')
      ]);
      
      const pedidos = await resPedidos.json();
      const productos = await resProductos.json();
      const config = await resConfig.json();
      const categorias = await resCategorias.json();
      const marcas = await resMarcas.json();
      
      const respaldoCompleto = {
        fecha: new Date().toISOString(),
        version: '1.0',
        datos: {
          pedidos: pedidos.success ? pedidos.data : pedidos,
          productos: Array.isArray(productos) ? productos : productos.data,
          configuracion: config.success ? config.data : config,
          categorias: categorias.success ? categorias.data : [],
          marcas: marcas.success ? marcas.data : []
        }
      };
      
      // Descargar archivo JSON completo
      const filename = `respaldo_completo_${format(new Date(), 'yyyy-MM-dd_HHmm')}.json`;
      const blob = new Blob([JSON.stringify(respaldoCompleto, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      // Guardar info
      guardarRespaldo('completo');
      cargarUltimosRespaldos();
      
      mostrarMensaje('success', '✅ Respaldo completo descargado correctamente');
      
    } catch (error) {
      console.error('Error generando respaldo completo:', error);
      mostrarMensaje('error', `Error: ${error.message}`);
    } finally {
      generando = '';
    }
  }
  
  function formatFecha(fecha) {
    if (!fecha) return 'Nunca';
    try {
      return format(new Date(fecha), "dd/MM/yyyy 'a las' HH:mm", { locale: es });
    } catch {
      return 'Fecha inválida';
    }
  }
  
  // Cargar al montar
  cargarUltimosRespaldos();
  
  const opciones = [
    {
      id: 'pedidos',
      nombre: 'Pedidos',
      descripcion: 'Todos los pedidos con sus detalles',
      icon: Database,
      color: 'blue'
    },
    {
      id: 'productos',
      nombre: 'Productos',
      descripcion: 'Catálogo completo de productos',
      icon: Package,
      color: 'green'
    },
    {
      id: 'categorias',
      nombre: 'Categorías',
      descripcion: 'Todas las categorías de productos',
      icon: Package,
      color: 'purple'
    },
    {
      id: 'marcas',
      nombre: 'Marcas',
      descripcion: 'Todas las marcas registradas',
      icon: Package,
      color: 'amber'
    },
    {
      id: 'configuracion',
      nombre: 'Configuración',
      descripcion: 'Configuración general del sistema',
      icon: Settings,
      color: 'gray'
    }
  ];
</script>

<div class="space-y-6">
  
  <!-- Mensajes -->
  {#if mensaje.visible}
    <div class="fixed top-20 right-4 z-50 max-w-md animate-slide-in">
      <div class={`rounded-lg shadow-lg p-4 flex items-start gap-3 ${
        mensaje.tipo === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
      }`}>
        {#if mensaje.tipo === 'success'}
          <CheckCircle2 class="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
        {:else}
          <AlertCircle class="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
        {/if}
        <span class={mensaje.tipo === 'success' ? 'text-green-700' : 'text-red-700'}>
          {mensaje.texto}
        </span>
      </div>
    </div>
  {/if}
  
  <!-- Header -->
  <div class="flex items-center justify-between">
    <div>
      <h2 class="text-2xl font-bold text-gray-900 flex items-center gap-2">
        <Archive class="w-7 h-7 text-primary-600" />
        Respaldos de Base de Datos
      </h2>
      <p class="text-gray-600 mt-1">
        Exporta y respalda tu información en formato JSON
      </p>
    </div>
  </div>
  
  <!-- Respaldo Completo -->
  <div class="bg-gradient-to-r from-primary-50 to-primary-100 rounded-xl p-6 border-2 border-primary-200">
    <div class="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
      <div class="flex items-start gap-4">
        <div class="w-14 h-14 bg-primary-600 rounded-xl flex items-center justify-center flex-shrink-0">
          <Archive class="w-7 h-7 text-white" />
        </div>
        <div>
          <h3 class="text-lg font-bold text-gray-900 mb-1">
            Respaldo Completo
          </h3>
          <p class="text-sm text-gray-700">
            Exporta toda la información del sistema en un solo archivo
          </p>
          {#if ultimosRespaldos.completo}
            <p class="text-xs text-gray-600 mt-2">
              Último respaldo: {formatFecha(ultimosRespaldos.completo.fecha)}
            </p>
          {/if}
        </div>
      </div>
      
      <button
        on:click={respaldarTodo}
        disabled={generando !== ''}
        class="btn-primary flex items-center gap-2 whitespace-nowrap"
      >
        {#if generando === 'completo'}
          <Loader2 class="w-5 h-5 animate-spin" />
          Generando...
        {:else}
          <Download class="w-5 h-5" />
          Respaldar Todo
        {/if}
      </button>
    </div>
  </div>
  
  <!-- Respaldos Individuales -->
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    {#each opciones as opcion}
      {@const colorClasses = {
        blue: 'bg-blue-100 text-blue-600',
        green: 'bg-green-100 text-green-600',
        purple: 'bg-purple-100 text-purple-600',
        amber: 'bg-amber-100 text-amber-600',
        gray: 'bg-gray-100 text-gray-600'
      }}
      
      <div class="bg-white rounded-lg border border-gray-200 p-5 hover:shadow-md transition-shadow">
        <div class="flex items-start gap-3 mb-4">
          <div class="w-12 h-12 rounded-lg {colorClasses[opcion.color]} flex items-center justify-center flex-shrink-0">
            <svelte:component this={opcion.icon} class="w-6 h-6" />
          </div>
          <div class="flex-1 min-w-0">
            <h3 class="font-semibold text-gray-900 mb-1">
              {opcion.nombre}
            </h3>
            <p class="text-sm text-gray-600">
              {opcion.descripcion}
            </p>
          </div>
        </div>
        
        {#if ultimosRespaldos[opcion.id]}
          <div class="text-xs text-gray-500 mb-3 flex items-center gap-1">
            <CheckCircle2 class="w-3 h-3 text-green-600" />
            <span>
              {formatFecha(ultimosRespaldos[opcion.id].fecha)}
            </span>
          </div>
        {/if}
        
        <button
          on:click={() => generarRespaldo(opcion.id)}
          disabled={generando !== ''}
          class="w-full btn-secondary flex items-center justify-center gap-2 text-sm"
        >
          {#if generando === opcion.id}
            <Loader2 class="w-4 h-4 animate-spin" />
            Generando...
          {:else}
            <Download class="w-4 h-4" />
            Descargar
          {/if}
        </button>
      </div>
    {/each}
  </div>
  
  <!-- Información -->
  <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
    <div class="flex items-start gap-3">
      <svg class="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
      </svg>
      <div class="text-sm text-blue-800">
        <p class="font-medium mb-1">💾 Acerca de los respaldos</p>
        <ul class="list-disc list-inside space-y-1 text-blue-700">
          <li>Los archivos se descargan en formato JSON</li>
          <li>Guarda los respaldos en un lugar seguro</li>
          <li>Se recomienda hacer respaldos semanalmente</li>
          <li>Los datos se exportan tal como están en la base de datos</li>
        </ul>
      </div>
    </div>
  </div>
</div>