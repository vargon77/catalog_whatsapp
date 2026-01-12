<!-- src/lib/components/reportes/ExportarExcel.svelte -->
<script>
  import { Download, Loader2 } from 'lucide-svelte';
  import { generarReporteExcel, descargarExcel } from '$lib/utils/exportExcel';
  
  export let datosReporte = [];
  export let estadisticas = {};
  export let filtrosAplicados = {};
  
  let exportando = false;
  
  async function exportar() {
    if (datosReporte.length === 0) {
      alert('No hay datos para exportar. Aplica filtros y genera un reporte primero.');
      return;
    }
    
    exportando = true;
    
    try {
      const buffer = await generarReporteExcel(datosReporte, estadisticas, filtrosAplicados);
      descargarExcel(buffer, 'reporte_ventas');
    } catch (error) {
      console.error('Error exportando a Excel:', error);
      alert('Error al generar el archivo Excel. Por favor, intenta de nuevo.');
    } finally {
      exportando = false;
    }
  }
</script>

<button
  on:click={exportar}
  disabled={exportando || datosReporte.length === 0}
  class="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
  title={datosReporte.length === 0 ? 'Genera un reporte primero' : 'Exportar a Excel'}
>
  {#if exportando}
    <Loader2 class="w-5 h-5 animate-spin" />
    Exportando...
  {:else}
    <Download class="w-5 h-5" />
    Exportar a Excel
  {/if}
</button>