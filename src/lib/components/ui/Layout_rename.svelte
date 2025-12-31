<script>
  import Header from './Header.svelte';
  import Footer from './Footer.svelte';
</script>

<div class="min-h-screen bg-gray-50 flex flex-col">
  <Header />
  
  <main class="flex-grow container mx-auto px-4 py-8">
    <slot />
  </main>
  
  <Footer />
</div>