<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'

const props = defineProps<{
  activeMode: string
}>()

const emit = defineEmits<{
  (e: 'select-mode', mode: string): void
  (e: 'open-palette'): void
  (e: 'open-ai'): void
}>()

interface DockItem {
  id: string
  label: string
  icon: string
  hotkey: string
  badge?: string
}

const dockItems: DockItem[] = [
  { id: 'workstation', label: 'Workstation', icon: 'material-symbols-light:terminal', hotkey: '1' },
  { id: 'projects', label: 'Projects Filmstrip', icon: 'carbon:application-web', hotkey: '2' },
  { id: 'topology', label: 'System Topology', icon: 'carbon:network-4', hotkey: '3' },
  { id: 'flightlog', label: 'Flight Log', icon: 'carbon:milestone', hotkey: '4' },
  { id: 'transmit', label: 'Transmit Comms', icon: 'carbon:send-alt', hotkey: '5' },
]

const hoveredIndex = ref<number | null>(null)

const handleKeyDown = (e: KeyboardEvent) => {
  // Only trigger if not typing in input or textarea
  const target = e.target as HTMLElement
  if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
    return
  }

  if (['1', '2', '3', '4', '5'].includes(e.key)) {
    const idx = parseInt(e.key) - 1
    const item = dockItems[idx]
    if (item) {
      e.preventDefault()
      emit('select-mode', item.id)
    }
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
})
</script>

<template>
  <div class="fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-40 pointer-events-none select-none">
    <div class="pointer-events-auto p-1.5 sm:p-2 rounded-2xl sm:rounded-full bg-[#08120c]/85 border border-emerald-500/25 backdrop-blur-2xl shadow-2xl shadow-black/80 flex items-center gap-1 sm:gap-2">
      
      <!-- Dock Navigation Items -->
      <button
        v-for="(item, idx) in dockItems"
        :key="item.id"
        @click="emit('select-mode', item.id)"
        @mouseenter="hoveredIndex = idx"
        @mouseleave="hoveredIndex = null"
        :aria-label="item.label"
        class="group relative p-2.5 sm:p-3 rounded-xl sm:rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer"
        :class="activeMode === item.id 
          ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-500/35 border border-emerald-400/40' 
          : 'text-slate-400 hover:text-white hover:bg-white/[0.06] border border-transparent'"
      >
        <Icon :name="item.icon" size="20" class="sm:text-[22px] transition-transform duration-200 group-hover:scale-115" />

        <!-- Active Dot Indicator -->
        <span
          v-if="activeMode === item.id"
          class="absolute -bottom-1 w-1.5 h-1.5 rounded-full bg-emerald-300 shadow-[0_0_8px_#34d399]"
        ></span>

        <!-- Tooltip Label -->
        <div class="absolute -top-10 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-lg bg-[#050907] border border-white/10 text-[11px] font-mono font-medium text-white shadow-xl opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all pointer-events-none whitespace-nowrap flex items-center gap-1.5">
          <span>{{ item.label }}</span>
          <kbd class="px-1 py-0.2 rounded bg-white/10 text-[9px] text-emerald-400 border border-white/10">{{ item.hotkey }}</kbd>
        </div>
      </button>

      <!-- Divider -->
      <div class="h-6 w-px bg-white/10 mx-0.5 sm:mx-1"></div>

      <!-- Quick Search / Command Palette -->
      <button
        @click="emit('open-palette')"
        aria-label="Command Center"
        class="group relative p-2.5 sm:p-3 rounded-xl sm:rounded-full text-slate-400 hover:text-emerald-300 hover:bg-emerald-500/10 border border-transparent transition-all duration-200 cursor-pointer"
      >
        <Icon name="carbon:search" size="20" class="transition-transform duration-200 group-hover:scale-110" />
        <div class="absolute -top-10 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-lg bg-[#050907] border border-white/10 text-[11px] font-mono text-white shadow-xl opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all pointer-events-none whitespace-nowrap flex items-center gap-1">
          <span>Search</span>
          <kbd class="px-1 py-0.2 rounded bg-white/10 text-[9px] text-slate-400 border border-white/10">⌘K</kbd>
        </div>
      </button>

      <!-- Quick Copilot Trigger -->
      <button
        @click="emit('open-ai')"
        aria-label="AI Copilot"
        class="group relative p-2.5 sm:p-3 rounded-xl sm:rounded-full text-slate-400 hover:text-emerald-300 hover:bg-emerald-500/10 border border-transparent transition-all duration-200 cursor-pointer"
      >
        <Icon name="carbon:bot" size="20" class="transition-transform duration-200 group-hover:scale-110" />
        <div class="absolute -top-10 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-lg bg-[#050907] border border-white/10 text-[11px] font-mono text-white shadow-xl opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all pointer-events-none whitespace-nowrap">
          <span>Copilot</span>
        </div>
      </button>

    </div>
  </div>
</template>
