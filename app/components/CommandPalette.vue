<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'

const isOpen = ref(false)
const searchQuery = ref('')
const selectedIndex = ref(0)
const searchInput = ref<HTMLInputElement | null>(null)

const props = defineProps<{
  userEmail?: string
  cvUrl?: string
  githubUrl?: string
  linkedinUrl?: string
}>()

const emit = defineEmits<{
  (e: 'open-ai'): void
}>()

interface CommandItem {
  id: string
  title: string
  subtitle?: string
  category: 'Navigation' | 'Quick Actions' | 'Connect'
  icon: string
  action: () => void
}

const copyEmail = () => {
  navigator.clipboard.writeText(props.userEmail || 'contact@eka-dev.cloud')
  alert('Email address copied to clipboard!')
}

const navigateTo = (hash: string) => {
  isOpen.value = false
  const el = document.querySelector(hash)
  if (el) {
    el.scrollIntoView({ behavior: 'smooth' })
  }
}

const commands: CommandItem[] = [
  // Navigation
  { id: 'nav-workstation', title: 'Workstation Stage', subtitle: 'Interactive CLI & telemetry radar', category: 'Navigation', icon: 'material-symbols-light:terminal', action: () => navigateTo('#workstation') },
  { id: 'nav-projects', title: 'Projects Filmstrip', subtitle: 'Curated production deployments & blueprints', category: 'Navigation', icon: 'carbon:application-web', action: () => navigateTo('#projects') },
  { id: 'nav-topology', title: 'System Topology', subtitle: 'Multi-tier stack & node inspector', category: 'Navigation', icon: 'carbon:network-4', action: () => navigateTo('#topology') },
  { id: 'nav-flightlog', title: 'Flight Log', subtitle: 'Mission sorties & engineering history', category: 'Navigation', icon: 'carbon:milestone', action: () => navigateTo('#flightlog') },
  { id: 'nav-transmit', title: 'Transmit Comms', subtitle: 'Encrypted inquiry & direct gateway', category: 'Navigation', icon: 'carbon:send-alt', action: () => navigateTo('#transmit') },

  
  // Quick Actions
  { id: 'act-resume', title: 'Download Resume / CV', subtitle: 'PDF format', category: 'Quick Actions', icon: 'carbon:document-download', action: () => { if (props.cvUrl) window.open(props.cvUrl, '_blank') } },
  { id: 'act-copy-email', title: 'Copy Email Address', subtitle: props.userEmail || 'contact@eka-dev.cloud', category: 'Quick Actions', icon: 'carbon:copy', action: copyEmail },
  { id: 'act-ai', title: 'Ask Portfolio AI Copilot', subtitle: 'Interactive Gemini assistant', category: 'Quick Actions', icon: 'carbon:bot', action: () => { isOpen.value = false; emit('open-ai') } },

  // Connect
  { id: 'conn-github', title: 'GitHub Profile', subtitle: 'View open-source repositories', category: 'Connect', icon: 'line-md:github', action: () => window.open(props.githubUrl || 'https://github.com', '_blank') },
  { id: 'conn-linkedin', title: 'LinkedIn Profile', subtitle: 'Connect professionally', category: 'Connect', icon: 'jam:linkedin', action: () => window.open(props.linkedinUrl || 'https://linkedin.com', '_blank') }
]

const filteredCommands = computed(() => {
  if (!searchQuery.value.trim()) return commands
  const q = searchQuery.value.toLowerCase()
  return commands.filter(c => c.title.toLowerCase().includes(q) || c.subtitle?.toLowerCase().includes(q) || c.category.toLowerCase().includes(q))
})

const handleKeyDown = (e: KeyboardEvent) => {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault()
    isOpen.value = !isOpen.value
  }

  if (!isOpen.value) return

  if (e.key === 'Escape') {
    isOpen.value = false
  } else if (e.key === 'ArrowDown') {
    e.preventDefault()
    selectedIndex.value = (selectedIndex.value + 1) % filteredCommands.value.length
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    selectedIndex.value = (selectedIndex.value - 1 + filteredCommands.value.length) % filteredCommands.value.length
  } else if (e.key === 'Enter') {
    e.preventDefault()
    const item = filteredCommands.value[selectedIndex.value]
    if (item) {
      item.action()
      isOpen.value = false
    }
  }
}

watch(isOpen, (val) => {
  if (val) {
    searchQuery.value = ''
    selectedIndex.value = 0
    setTimeout(() => {
      searchInput.value?.focus()
    }, 50)
  }
})

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
})

defineExpose({
  open: () => { isOpen.value = true }
})
</script>

<template>
  <div>
    <!-- Backdrop & Modal Container -->
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="isOpen"
        class="fixed inset-0 bg-black/75 backdrop-blur-sm z-[100] flex items-start justify-center pt-20 sm:pt-28 px-4"
        @click.self="isOpen = false"
      >
        <!-- Command Dialog -->
        <div class="w-full max-w-xl bg-[#08120c] border border-white/15 rounded-2xl shadow-2xl overflow-hidden shadow-black/80">
          
          <!-- Search Header -->
          <div class="relative flex items-center px-4 py-3.5 border-b border-white/10 bg-[#050907]">
            <Icon name="carbon:search" size="20" class="text-emerald-400 shrink-0 mr-3" />
            <input
              ref="searchInput"
              v-model="searchQuery"
              type="text"
              placeholder="Type a command, search project, or jump to section..."
              class="w-full bg-transparent text-sm text-white placeholder:text-slate-500 focus:outline-none"
            />
            <span class="text-[10px] font-mono px-2 py-0.5 rounded bg-white/10 text-slate-400 border border-white/10 shrink-0">
              ESC
            </span>
          </div>

          <!-- Command Items List -->
          <div class="max-h-[360px] overflow-y-auto p-2 space-y-1">
            <div
              v-for="(item, index) in filteredCommands"
              :key="item.id"
              @click="item.action(); isOpen = false"
              @mouseenter="selectedIndex = index"
              class="px-3.5 py-2.5 rounded-xl flex items-center justify-between cursor-pointer transition-colors"
              :class="selectedIndex === index ? 'bg-emerald-500/15 text-white border border-emerald-500/30' : 'text-slate-300 hover:bg-white/[0.04] border border-transparent'"
            >
              <div class="flex items-center gap-3 min-w-0">
                <div 
                  class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border"
                  :class="selectedIndex === index ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300' : 'bg-white/[0.03] border-white/[0.06] text-slate-400'"
                >
                  <Icon :name="item.icon" size="18" />
                </div>

                <div class="min-w-0">
                  <p class="text-xs sm:text-sm font-medium truncate">{{ item.title }}</p>
                  <p v-if="item.subtitle" class="text-[11px] text-slate-400 truncate">{{ item.subtitle }}</p>
                </div>
              </div>

              <span class="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-slate-400 border border-white/5 shrink-0">
                {{ item.category }}
              </span>
            </div>

            <!-- Empty State -->
            <div v-if="filteredCommands.length === 0" class="py-10 text-center text-slate-500">
              <Icon name="carbon:search-locate" size="28" class="mx-auto mb-2 text-slate-600" />
              <p class="text-xs">No matching commands found for "{{ searchQuery }}"</p>
            </div>
          </div>

          <!-- Dialog Footer Help Bar -->
          <div class="px-4 py-2.5 bg-[#050907] border-t border-white/10 flex items-center justify-between text-[11px] font-mono text-slate-500">
            <div class="flex items-center gap-3">
              <span><kbd class="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-slate-400">↑</kbd> <kbd class="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-slate-400">↓</kbd> Navigate</span>
              <span><kbd class="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-slate-400">↵</kbd> Select</span>
            </div>
            <span>Portfolio Command Center</span>
          </div>

        </div>
      </div>
    </Transition>
  </div>
</template>
