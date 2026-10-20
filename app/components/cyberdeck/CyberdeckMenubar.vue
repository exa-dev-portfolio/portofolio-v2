<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'

const props = defineProps<{
  activeMode: string
  cvUrl?: string
}>()

const emit = defineEmits<{
  (e: 'select-mode', mode: string): void
  (e: 'open-palette'): void
}>()

const { isApkStoreEnabled } = useFeatureFlag()
const currentTime = ref('')
let timer: number | null = null

const updateClock = () => {
  const now = new Date()
  currentTime.value = now.toLocaleTimeString('en-US', {
    timeZone: 'Asia/Jakarta',
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

onMounted(() => {
  updateClock()
  timer = window.setInterval(updateClock, 1000)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})

const modeItems = [
  { id: 'workstation', label: 'Workstation', num: '01' },
  { id: 'projects', label: 'Projects', num: '02' },
  { id: 'topology', label: 'Topology', num: '03' },
  { id: 'flightlog', label: 'Flight Log', num: '04' },
  { id: 'transmit', label: 'Transmit', num: '05' },
]
</script>

<template>
  <header class="fixed top-0 inset-x-0 z-50 px-3 sm:px-6 py-2.5 sm:py-3 pointer-events-none select-none">
    <div class="max-w-7xl mx-auto flex items-center justify-between pointer-events-auto">
      
      <!-- Left: System Identity & Status -->
      <div class="flex items-center gap-3">
        <button
          @click="emit('select-mode', 'workstation')"
          class="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#08120c]/80 border border-emerald-500/25 backdrop-blur-xl hover:border-emerald-400/50 transition-all cursor-pointer group"
        >
          <span class="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#10b981] animate-pulse"></span>
          <span class="font-mono font-bold text-xs text-white tracking-wide">EKA.OS</span>
          <span class="hidden sm:inline text-[10px] font-mono text-emerald-400/80 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-500/20">v2.6</span>
        </button>

        <!-- Live Clock & Telemetry -->
        <div class="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#08120c]/60 border border-white/5 backdrop-blur-md text-[11px] font-mono text-slate-300">
          <Icon name="carbon:time" size="13" class="text-emerald-400" />
          <span>{{ currentTime }} <span class="text-slate-500 text-[10px]">WIB</span></span>
          <span class="w-1 h-1 rounded-full bg-slate-600"></span>
          <span class="text-emerald-400/90 flex items-center gap-1">
            <span class="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400"></span> 18ms
          </span>
        </div>
      </div>

      <!-- Center: Workstation Module Switcher (Desktop) -->
      <nav class="hidden lg:flex items-center gap-1 p-1 rounded-full bg-[#08120c]/80 border border-white/10 backdrop-blur-xl shadow-lg">
        <button
          v-for="item in modeItems"
          :key="item.id"
          @click="emit('select-mode', item.id)"
          class="relative px-3.5 py-1.5 rounded-full text-xs font-mono tracking-wide transition-all duration-200 flex items-center gap-1.5 cursor-pointer"
          :class="activeMode === item.id
            ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold shadow-md shadow-emerald-500/30 border border-emerald-400/40'
            : 'text-slate-300 hover:text-white hover:bg-white/[0.04] border border-transparent'"
        >
          <span class="text-[10px] opacity-60 font-mono">{{ item.num }}</span>
          <span>{{ item.label }}</span>
        </button>
      </nav>

      <!-- Right: Quick Tools -->
      <div class="flex items-center gap-2">
        <!-- APK Store link if enabled -->
        <NuxtLink
          v-if="isApkStoreEnabled"
          to="/apps"
          class="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 hover:border-emerald-400 hover:bg-emerald-500/20 text-xs font-mono text-emerald-300 transition-all cursor-pointer"
        >
          <Icon name="carbon:application-mobile" size="14" class="text-emerald-400" />
          <span>Apps</span>
        </NuxtLink>

        <!-- Command Palette Trigger -->
        <button
          @click="emit('open-palette')"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#08120c]/80 border border-white/10 hover:border-emerald-500/40 hover:bg-emerald-500/10 backdrop-blur-xl text-xs font-mono text-slate-300 hover:text-white transition-all cursor-pointer"
        >
          <Icon name="carbon:search" size="13" class="text-emerald-400" />
          <span class="hidden sm:inline">Search</span>
          <kbd class="text-[9px] bg-white/10 px-1.5 py-0.5 rounded border border-white/10 text-slate-300">⌘K</kbd>
        </button>

        <!-- CV Download -->
        <a
          v-if="cvUrl"
          :href="cvUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-xs font-mono font-semibold text-white shadow-md shadow-emerald-500/25 transition-all cursor-pointer"
        >
          <span>CV</span>
          <Icon name="carbon:download" size="13" />
        </a>
      </div>

    </div>
  </header>
</template>
