<!-- src/lib/components/pedidos/ModalDetalles.svelte -->
<script>
  import { createEventDispatcher, onMount } from 'svelte';
  import { 
    X, User, Phone, Mail, MapPin, Package, Calendar,
    CreditCard, Truck, FileText, Clock, ExternalLink,
    CheckCircle, XCircle, MessageCircle, Edit
  } from 'lucide-svelte';
  import { CONFIG_ESTADOS, obtenerColorEstado } from '$lib/pedidos/estadosCliente';
  import TimelineEstados from './TimelineEstados.svelte';
  import MensajePagoGenerator from './MensajePagoGenerator.svelte';
  import FormularioCostosEnvio from './FormularioCostosEnvio.svelte';
  
  export let pedido;
  
  const dispatch = createEventDispatcher();
  let loading = false;
  let historial = [];
  let configuracion = null;
  let mostrarMensajePago = false;
  let mostrarEditarCostos = false;
  
  onMount(async () => {
    await cargarHistorial();
    await cargarConfiguracion();
  });
  
  async function cargarHistorial() {
    try {
      const res = await fetch(`/api/pedidos/${pedido.id}/historial`);
      const result = await res.json();
      if (result.success) {
        historial = result.data || [];
      }
    } catch (err) {
      console.error('Error cargando historial:', err);
    }
  }
  
  async function cargarConfiguracion() {
    try {
      const res = await fetch('/api/configuracion');
      const result = await res.json();
      if (result.success) {
        configuracion = result.data;
      }
    } catch (err) {
      console.error('Error cargando configuración:', err);
    }
  }
  
  function formatCurrency(amount) {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  }
  
  function formatDate(date) {
    return new Date(date).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  
  function abrirWhatsApp() {
    const config = CONFIG_ESTADOS[pedido.estado];
    const mensaje = `Hola ${pedido.cliente_nombre}, tu pedido #${pedido.numero_pedido} está *${config.label}*. ${config.descripcion}`;
    const url = `https://wa.me/${pedido.cliente_whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(mensaje)}`;
    window.open(url, '_blank');
  }
  
  function accionRapida(tipo) {
    dispatch('accion', { tipo, pedido });
    dispatch('close');
  }
  
  $: colores = obtenerColorEstado(pedido.estado);
  $: configEstado = CONFIG_ESTADOS[pedido.estado];
  $: cuentasPago = configuracion?.cuentas_pago 
    ? (typeof configuracion.cuentas_pago === 'string' 
        ? JSON.parse(configuracion.cuentas_pago) 
        : configuracion.cuentas_pago)
    : [];
</script>

<!-- Modal Backdrop -->
<div class="fixed inset-0 z-50 overflow-y-auto">
  <div class="flex items-center justify-center min-h-screen px-4 py-4">
    <!-- Backdrop -->
    <div 
      class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
      on:click={() => dispatch('close')}
    ></div>

    <!-- Modal -->
    <div class="relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
      <!-- Header Sticky -->
      <div class="px-6 py-4 border-b border-gray-200 bg-white sticky top-0 z-20">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 {colores.bg} rounded-full flex items-center justify-center">
              <span class="text-2xl">{configEstado?.icon}</span>
            </div>
            <div>
              <h3 class="text-xl font-bold text-gray-900">
                Pedido #{pedido.numero_pedido}
              </h3>
              <div class="flex items-center gap-2 mt-1">
                <span class="px-3 py-1 text-xs font-semibold rounded-full {colores.bg} {colores.text} border {colores.border}">
                  {configEstado?.label}
                </span>
                {#if pedido.esperando_validacion}
                  <span class="px-3 py-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-800 border border-amber-200 animate-pulse">
                    ⏳ Validación pendiente
                  </span>
                {/if}
              </div>
            </div>
          </div>
          
          <button
            on:click={() => dispatch('close')}
            class="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X class="w-6 h-6" />
          </button>
        </div>
      </div>

      <!-- Content Scrollable -->
      <div class="flex-1 overflow-y-auto px-6 py-4">
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <!-- Columna Principal -->
          <div class="lg:col-span-2 space-y-6">
            
            <!-- Información del Cliente -->
            <div class="bg-white border border-gray-200 rounded-lg p-4">
              <h4 class="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <User class="w-4 h-4" />
                Información del Cliente
              </h4>
              
              <div class="space-y-3">
                <div class="flex items-center gap-3 text-sm">
                  <User class="w-4 h-4 text-gray-400" />
                  <span class="font-medium text-gray-900">{pedido.cliente_nombre}</span>
                </div>
                
                <div class="flex items-center gap-3 text-sm">
                  <Phone class="w-4 h-4 text-gray-400" />
                  <a 
                    href="https://wa.me/{pedido.cliente_whatsapp.replace(/\D/g, '')}"
                    target="_blank"
                    class="text-green-600 hover:text-green-700 flex items-center gap-1"
                  >
                    {pedido.cliente_whatsapp}
                    <ExternalLink class="w-3 h-3" />
                  </a>
                </div>
                
                {#if pedido.cliente_email}
                  <div class="flex items-center gap-3 text-sm">
                    <Mail class="w-4 h-4 text-gray-400" />
                    <a href="mailto:{pedido.cliente_email}" class="text-primary-600 hover:text-primary-700">
                      {pedido.cliente_email}
                    </a>
                  </div>
                {/if}
                
                {#if pedido.cliente_direccion}
                  <div class="flex items-start gap-3 text-sm">
                    <MapPin class="w-4 h-4 text-gray-400 mt-0.5" />
                    <span class="text-gray-700">{pedido.cliente_direccion}</span>
                  </div>
                {/if}
              </div>
            </div>
            
            <!-- Productos -->
            <div class="bg-white border border-gray-200 rounded-lg p-4">
              <h4 class="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Package class="w-4 h-4" />
                Productos ({pedido.items?.length || 0})
              </h4>
              
              <div class="space-y-3">
                {#if pedido.items && pedido.items.length > 0}
                  {#each pedido.items as item}
                    <div class="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                      {#if item.imagen_url}
                        <img 
                          src={item.imagen_url} 
                          alt={item.producto_nombre}
                          class="w-16 h-16 object-cover rounded-lg"
                        />
                      {:else}
                        <div class="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                          <Package class="w-8 h-8 text-gray-400" />
                        </div>
                      {/if}
                      
                      <div class="flex-1 min-w-0">
                        <p class="font-medium text-gray-900 truncate">{item.producto_nombre}</p>
                        <p class="text-sm text-gray-500">
                          {formatCurrency(item.precio_unitario)} × {item.cantidad}
                        </p>
                        {#if item.producto_sku}
                          <p class="text-xs text-gray-400">SKU: {item.producto_sku}</p>
                        {/if}
                      </div>
                      
                      <div class="text-right">
                        <p class="font-semibold text-gray-900">{formatCurrency(item.subtotal)}</p>
                      </div>
                    </div>
                  {/each}
                {:else}
                  <p class="text-sm text-gray-500 text-center py-4">No hay productos</p>
                {/if}
              </div>
            </div>
            
            <!-- Resumen de Costos -->
            <div class="bg-white border border-gray-200 rounded-lg p-4">
              <div class="flex items-center justify-between mb-4">
                <h4 class="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <CreditCard class="w-4 h-4" />
                  Resumen de Pago
                </h4>
                
                {#if pedido.estado === 'confirmado' && pedido.editable}
                  <button
                    on:click={() => mostrarEditarCostos = !mostrarEditarCostos}
                    class="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
                  >
                    <Edit class="w-4 h-4" />
                    Editar costos
                  </button>
                {/if}
              </div>
              
              {#if mostrarEditarCostos}
                <FormularioCostosEnvio 
                  {pedido} 
                  on:guardado={() => {
                    mostrarEditarCostos = false;
                    dispatch('accion');
                  }}
                />
              {:else}
                <div class="space-y-2">
                  <div class="flex justify-between text-sm">
                    <span class="text-gray-600">Subtotal:</span>
                    <span class="font-medium">{formatCurrency(pedido.subtotal || 0)}</span>
                  </div>
                  
                  {#if pedido.factura && pedido.impuesto > 0}
                    <div class="flex justify-between text-sm">
                      <span class="text-gray-600">IVA (16%):</span>
                      <span class="font-medium">{formatCurrency(pedido.impuesto || 0)}</span>
                    </div>
                  {/if}
                  
                  {#if pedido.envio}
                    <div class="flex justify-between text-sm">
                      <span class="text-gray-600">Envío:</span>
                      <span class="font-medium">{formatCurrency(pedido.costo_envio || 0)}</span>
                    </div>
                  {/if}
                  
                  <div class="border-t border-gray-200 pt-2 mt-2">
                    <div class="flex justify-between">
                      <span class="text-base font-semibold text-gray-900">Total:</span>
                      <span class="text-xl font-bold text-primary-700">
                        {formatCurrency(pedido.total || 0)}
                      </span>
                    </div>
                  </div>
                  
                  {#if pedido.metodo_pago}
                    <div class="bg-blue-50 rounded-lg p-3 mt-3">
                      <p class="text-sm text-blue-800">
                        <span class="font-medium">Método de pago:</span> {pedido.metodo_pago}
                      </p>
                    </div>
                  {/if}
                </div>
              {/if}
            </div>
            
            <!-- Comprobante de Pago -->
            {#if pedido.constancia_pago_url}
              <div class="bg-white border border-gray-200 rounded-lg p-4">
                <h4 class="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <FileText class="w-4 h-4" />
                  Comprobante de Pago
                </h4>
                
                <img 
                  src={pedido.constancia_pago_url}
                  alt="Comprobante"
                  class="w-full rounded-lg border border-gray-300"
                />
                
                {#if pedido.motivo_rechazo_pago}
                  <div class="bg-red-50 border border-red-200 rounded-lg p-3 mt-3">
                    <p class="text-sm font-medium text-red-800 mb-1">❌ Pago rechazado:</p>
                    <p class="text-sm text-red-700">{pedido.motivo_rechazo_pago}</p>
                  </div>
                {/if}
              </div>
            {/if}
            
            <!-- Guía de Envío -->
            {#if pedido.guia_envio}
              <div class="bg-white border border-gray-200 rounded-lg p-4">
                <h4 class="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Truck class="w-4 h-4" />
                  Información de Envío
                </h4>
                
                <div class="space-y-2 text-sm">
                  <div class="flex justify-between">
                    <span class="text-gray-600">Paquetería:</span>
                    <span class="font-medium">{pedido.guia_envio.paqueteria}</span>
                  </div>
                  
                  {#if pedido.guia_envio.numero}
                    <div class="flex justify-between">
                      <span class="text-gray-600">Guía:</span>
                      <span class="font-medium">{pedido.guia_envio.numero}</span>
                    </div>
                  {/if}
                  
                  {#if pedido.guia_envio.url_rastreo}
                    <div class="flex justify-between items-center">
                      <span class="text-gray-600">Rastreo:</span>
                      <a 
                        href={pedido.guia_envio.url_rastreo}
                        target="_blank"
                        class="text-primary-600 hover:text-primary-700 flex items-center gap-1"
                      >
                        Ver tracking
                        <ExternalLink class="w-3 h-3" />
                      </a>
                    </div>
                  {/if}
                  
                  {#if pedido.guia_envio.fecha_estimada}
                    <div class="flex justify-between">
                      <span class="text-gray-600">Entrega estimada:</span>
                      <span class="font-medium">
                        {new Date(pedido.guia_envio.fecha_estimada).toLocaleDateString('es-MX')}
                      </span>
                    </div>
                  {/if}
                </div>
              </div>
            {/if}
            
            <!-- Notas -->
            {#if pedido.notas || pedido.motivo_cancelacion}
              <div class="bg-white border border-gray-200 rounded-lg p-4">
                <h4 class="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <FileText class="w-4 h-4" />
                  Notas
                </h4>
                
                {#if pedido.notas}
                  <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-3">
                    <p class="text-sm text-yellow-800">{pedido.notas}</p>
                  </div>
                {/if}
                
                {#if pedido.motivo_cancelacion}
                  <div class="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p class="text-sm font-medium text-red-800 mb-1">Motivo de cancelación:</p>
                    <p class="text-sm text-red-700">{pedido.motivo_cancelacion}</p>
                  </div>
                {/if}
              </div>
            {/if}
          </div>
          
          <!-- Columna Lateral -->
          <div class="space-y-6">
            
            <!-- Información General -->
            <div class="bg-white border border-gray-200 rounded-lg p-4">
              <h4 class="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Clock class="w-4 h-4" />
                Información
              </h4>
              
              <div class="space-y-3 text-sm">
                <div>
                  <p class="text-gray-600 mb-1">Fecha de creación:</p>
                  <p class="font-medium">{formatDate(pedido.created_at)}</p>
                </div>
                
                {#if pedido.fecha_confirmado}
                  <div>
                    <p class="text-gray-600 mb-1">Confirmado:</p>
                    <p class="font-medium">{formatDate(pedido.fecha_confirmado)}</p>
                  </div>
                {/if}
                
                {#if pedido.fecha_pagado}
                  <div>
                    <p class="text-gray-600 mb-1">Pagado:</p>
                    <p class="font-medium">{formatDate(pedido.fecha_pagado)}</p>
                  </div>
                {/if}
                
                {#if pedido.fecha_enviado}
                  <div>
                    <p class="text-gray-600 mb-1">Enviado:</p>
                    <p class="font-medium">{formatDate(pedido.fecha_enviado)}</p>
                  </div>
                {/if}
                
                {#if pedido.fecha_recibido}
                  <div>
                    <p class="text-gray-600 mb-1">Recibido:</p>
                    <p class="font-medium">{formatDate(pedido.fecha_recibido)}</p>
                  </div>
                {/if}
                
                <div class="pt-3 border-t border-gray-200">
                  <div class="flex items-center gap-2">
                    {#if pedido.factura}
                      <span class="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">✓ Factura</span>
                    {/if}
                    {#if pedido.envio}
                      <span class="text-xs px-2 py-1 bg-green-100 text-green-800 rounded">✓ Envío</span>
                    {/if}
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Historial -->
            {#if historial.length > 0}
              <div class="bg-white border border-gray-200 rounded-lg p-4 max-h-96 overflow-y-auto">
                <TimelineEstados {pedido} {historial} />
              </div>
            {/if}
            
            <!-- Generador de Mensaje de Pago -->
            {#if pedido.estado === 'confirmado' && cuentasPago.length > 0}
              <div class="bg-white border border-gray-200 rounded-lg p-4">
                <button
                  on:click={() => mostrarMensajePago = !mostrarMensajePago}
                  class="w-full text-left text-sm font-semibold text-gray-900 mb-4 flex items-center justify-between"
                >
                  <span class="flex items-center gap-2">
                    <MessageCircle class="w-4 h-4" />
                    Mensaje de Pago
                  </span>
                  <span class="text-primary-600">{mostrarMensajePago ? '▼' : '▶'}</span>
                </button>
                
                {#if mostrarMensajePago}
                  <MensajePagoGenerator {pedido} cuentas={cuentasPago} />
                {/if}
              </div>
            {/if}
          </div>
        </div>
      </div>

      <!-- Footer Sticky -->
      <div class="px-6 py-4 bg-gray-50 border-t border-gray-200 sticky bottom-0 flex flex-wrap gap-2">
        <button
          on:click={abrirWhatsApp}
          class="btn-primary flex items-center gap-2 bg-green-600 hover:bg-green-700"
        >
          <MessageCircle class="w-4 h-4" />
          Enviar WhatsApp
        </button>
        
        <button
          on:click={() => dispatch('close')}
          class="btn-secondary"
        >
          Cerrar
        </button>
      </div>
    </div>
  </div>
</div>