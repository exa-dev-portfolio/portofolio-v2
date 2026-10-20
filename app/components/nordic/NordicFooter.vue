<script setup lang="ts">
const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}
</script>

<template>
  <footer class="pt-12 pb-16 border-t border-white/10 text-xs text-zinc-500 font-sans">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <p class="text-zinc-400 font-medium">© {{ new Date().getFullYear() }} Eka. Built with craft.</p>
        <p class="text-[11px] text-zinc-600 mt-0.5">Nuxt 4 • Vue 3 • Tailwind CSS • Three.js</p>
      </div>

      <div class="flex items-center gap-4 text-zinc-400">
        <NuxtLink to="/privacy" class="hover:text-white transition-colors">Privacy</NuxtLink>
        <NuxtLink to="/terms" class="hover:text-white transition-colors">Terms</NuxtLink>
        <button
          @click="scrollToTop"
          class="hover:text-white transition-colors flex items-center gap-1 cursor-pointer"
        >
          <span>Top</span>
          <Icon name="carbon:arrow-up" size="13" />
        </button>
      </div>
    </div>
  </footer>
</template>
