<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import CyberdeckMenubar from '~/components/cyberdeck/CyberdeckMenubar.vue'
import CyberdeckDock from '~/components/cyberdeck/CyberdeckDock.vue'
import type { UserSettingsModel } from '~/types/settings'

const activeMode = useState<string>('cyberdeck-active-mode', () => 'workstation')
const isScrolled = ref(false)
const commandPaletteRef = ref<any>(null)
const aiAssistantRef = ref<any>(null)
const route = useRoute()

const { data: dataUser } = await useFetch<BaseResponse<UserSettingsModel>>('/api/settings', {
  watch: false,
})
const user = computed(() => dataUser.value?.data)

const sectionOrder = [
  { id: 'workstation', mode: 'workstation' },
  { id: 'projects', mode: 'projects' },
  { id: 'topology', mode: 'topology' },
  { id: 'flightlog', mode: 'flightlog' },
  { id: 'transmit', mode: 'transmit' },
]

let rafId: number | null = null

const switchMode = (mode: string) => {
  activeMode.value = mode
  if (route.path !== '/') {
    navigateTo(`/#${mode}`)
    return
  }
  const el = document.getElementById(mode)
  if (el) {
    el.scrollIntoView({ behavior: 'smooth' })
  }
}

const updateActiveSection = () => {
  if (route.path !== '/') return
  if (rafId !== null) return
  rafId = requestAnimationFrame(() => {
    isScrolled.value = window.scrollY > 20

    if (window.scrollY < 200) {
      activeMode.value = 'workstation'
      rafId = null
      return
    }

    const scrollBottom = window.innerHeight + window.scrollY
    const docHeight = document.documentElement.scrollHeight
    if (docHeight - scrollBottom < 100) {
      activeMode.value = 'transmit'
      rafId = null
      return
    }

    const focalY = window.innerHeight * 0.35
    for (const sec of sectionOrder) {
      const el = document.getElementById(sec.id)
      if (!el) continue
      const rect = el.getBoundingClientRect()
      if (rect.top <= focalY && rect.bottom > focalY) {
        activeMode.value = sec.mode
        break
      }
    }
    rafId = null
  })
}

onMounted(() => {
  window.addEventListener('scroll', updateActiveSection, { passive: true })
  if (window.location.hash) {
    const target = window.location.hash.replace('#', '')
    if (sectionOrder.some(s => s.id === target)) {
      activeMode.value = target
    }
  }
  updateActiveSection()
})

onUnmounted(() => {
  window.removeEventListener('scroll', updateActiveSection)
  if (rafId !== null) cancelAnimationFrame(rafId)
})
</script>

<template>
  <div class="min-h-screen bg-[#050807] text-slate-100 relative overflow-x-hidden selection:bg-emerald-500/30 selection:text-emerald-200 font-sans">
    
    <!-- Ambient Background Lighting -->
    <div class="fixed inset-0 pointer-events-none z-0 ambient-canvas">
      <div class="absolute inset-0 subtle-grid opacity-25"></div>
    </div>

    <!-- Cyberdeck Menubar HUD (Top) -->
    <CyberdeckMenubar
      :activeMode="activeMode"
      :cvUrl="user?.cv_url"
      @select-mode="switchMode"
      @open-palette="commandPaletteRef?.open()"
    />

    <!-- Main Viewport Slot -->
    <main class="relative z-10 pt-16 sm:pt-20 pb-28">
      <slot></slot>
    </main>

    <!-- Floating Raycast-Style Cyberdeck Dock (Bottom) -->
    <CyberdeckDock
      :activeMode="activeMode"
      @select-mode="switchMode"
      @open-palette="commandPaletteRef?.open()"
      @open-ai="aiAssistantRef?.toggle()"
    />

    <!-- Global Developer Command Palette (Ctrl + K) -->
    <CommandPalette
      ref="commandPaletteRef"
      :userEmail="user?.email"
      :cvUrl="user?.cv_url"
      :githubUrl="user?.github_profile"
      :linkedinUrl="user?.linkedin_profile"
      @open-ai="aiAssistantRef?.open()"
    />

    <!-- AI Copilot Assistant -->
    <AIAssistant ref="aiAssistantRef" />

  </div>
</template>