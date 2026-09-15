<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'

const isMobileMenuOpen = ref(false)
const activeSection = ref('')
const isScrolled = ref(false)
const commandPaletteRef = ref<any>(null)

const navItems = [
  { name: 'About', href: '#about', icon: 'carbon:user-avatar' },
  { name: 'Skills', href: '#stack', icon: 'carbon:code' },
  { name: 'Journey', href: '#work', icon: 'carbon:milestone' },
  { name: 'Projects', href: '#project', icon: 'carbon:application-web' },
  { name: 'Contact', href: '#contact', icon: 'carbon:email' }
]

const sectionOrder = [
  { id: 'about', href: '#about' },
  { id: 'stack', href: '#stack' },
  { id: 'work', href: '#work' },
  { id: 'project', href: '#project' },
  { id: 'contact', href: '#contact' }
]

let rafId: number | null = null

const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value
}

const closeMobileMenu = () => {
  isMobileMenuOpen.value = false
}

const updateActiveSection = () => {
  if (rafId !== null) return
  rafId = requestAnimationFrame(() => {
    isScrolled.value = window.scrollY > 20

    // 1. Hero top section (no nav link active)
    if (window.scrollY < 200) {
      activeSection.value = ''
      rafId = null
      return
    }

    // 2. Near bottom of page (activate Contact immediately)
    const scrollBottom = window.innerHeight + window.scrollY
    const docHeight = document.documentElement.scrollHeight
    if (docHeight - scrollBottom < 100) {
      activeSection.value = '#contact'
      rafId = null
      return
    }

    // 3. Focal line detection (at 35% viewport height from top)
    const focalY = window.innerHeight * 0.35
    let matched = ''

    for (const section of sectionOrder) {
      const el = document.getElementById(section.id)
      if (!el) continue

      const rect = el.getBoundingClientRect()
      if (rect.top <= focalY && rect.bottom > focalY) {
        matched = section.href
        break
      }
    }

    // 4. Secondary fallback: check whichever section has the closest top above 45% viewport height
    if (!matched) {
      for (const section of sectionOrder) {
        const el = document.getElementById(section.id)
        if (!el) continue
        const rect = el.getBoundingClientRect()
        if (rect.top <= window.innerHeight * 0.45 && rect.bottom > 80) {
          matched = section.href
        }
      }
    }

    if (matched) {
      activeSection.value = matched
    }

    rafId = null
  })
}

onMounted(() => {
  window.addEventListener('scroll', updateActiveSection, { passive: true })
  
  if (window.location.hash) {
    activeSection.value = window.location.hash
  }
  updateActiveSection()
  
  setTimeout(updateActiveSection, 300)
  setTimeout(updateActiveSection, 1000)
})

onUnmounted(() => {
  window.removeEventListener('scroll', updateActiveSection)
  if (rafId !== null) cancelAnimationFrame(rafId)
})
</script>

<template>
  <div class="min-h-screen bg-[#070b14] text-slate-100 relative overflow-x-hidden selection:bg-blue-500/25 selection:text-blue-200">
    <!-- Zero-Cost Static Ambient Lighting Background -->
    <div class="fixed inset-0 pointer-events-none z-0 ambient-canvas">
      <div class="absolute inset-0 subtle-grid opacity-30"></div>
    </div>

    <!-- Header / Floating Island Navbar (Fixed) -->
    <header class="fixed top-0 left-0 right-0 z-50 w-full px-4 sm:px-6 py-3 sm:py-4 pointer-events-none">
      <div class="container mx-auto max-w-6xl pointer-events-auto">
        <div 
          class="flex items-center justify-between px-4 sm:px-6 py-2.5 sm:py-3 rounded-2xl sm:rounded-full transition-all duration-300"
          :class="isScrolled 
            ? 'frosted-nav' 
            : 'bg-[#0b1120]/60 border border-white/[0.06] backdrop-blur-md shadow-md shadow-black/20'"
        >
          <!-- Brand Logo -->
          <NuxtLink to="/" class="flex items-center gap-3 shrink-0 group">
            <div class="relative w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 p-[1px] shadow-sm shadow-blue-500/20 group-hover:shadow-blue-500/40 transition-shadow">
              <div class="w-full h-full bg-[#080d1a] rounded-[11px] flex items-center justify-center">
                <Icon name="material-symbols-light:terminal" size="22" class="text-blue-400 group-hover:scale-105 transition-transform" />
              </div>
            </div>
            <div class="flex flex-col">
              <span class="font-heading font-bold text-sm sm:text-base tracking-tight text-white flex items-center gap-1.5">
                Eka Dev<span class="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
              </span>
              <span class="text-[9px] sm:text-[10px] text-slate-400 font-mono tracking-wider uppercase -mt-0.5">Full-Stack Engineer</span>
            </div>
          </NuxtLink>

          <!-- Desktop Navigation Dock -->
          <nav class="hidden md:flex items-center gap-1 p-1 bg-white/[0.03] border border-white/[0.06] rounded-full">
            <NuxtLink
              v-for="item in navItems"
              :key="item.href"
              :to="item.href"
              @click="activeSection = item.href"
              class="relative px-3.5 py-1.5 rounded-full text-xs lg:text-sm font-medium tracking-wide transition-all duration-200 flex items-center gap-1.5"
              :class="activeSection === item.href
                ? 'text-white bg-gradient-to-r from-blue-600 to-indigo-600 border border-blue-400/50 shadow-md shadow-blue-500/30 font-semibold'
                : 'text-slate-300 hover:text-white hover:bg-white/[0.06] border border-transparent'"
            >
              <Icon 
                :name="item.icon" 
                size="15" 
                :class="activeSection === item.href ? 'text-cyan-200 drop-shadow-[0_0_6px_rgba(56,189,248,0.8)]' : 'text-slate-400'" 
              />
              <span>{{ item.name }}</span>
              <span 
                v-if="activeSection === item.href" 
                class="w-1.5 h-1.5 rounded-full bg-cyan-300 shadow-[0_0_8px_#38bdf8] animate-pulse"
              ></span>
            </NuxtLink>
          </nav>

          <!-- Desktop Right Actions -->
          <div class="hidden md:flex items-center gap-2.5">
            <!-- Quick Command Palette Trigger -->
            <button
              @click="commandPaletteRef?.open()"
              class="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] hover:border-blue-500/40 hover:bg-blue-500/10 text-xs font-mono text-slate-400 hover:text-white transition-all cursor-pointer"
              title="Press Ctrl+K or Cmd+K to open Command Palette"
            >
              <Icon name="carbon:search" size="13" class="text-blue-400" />
              <span>Search</span>
              <kbd class="text-[10px] bg-white/10 px-1.5 py-0.5 rounded border border-white/10 text-slate-300">Ctrl K</kbd>
            </button>

            <a
              href="#contact"
              class="btn-primary-gradient px-4 py-2 rounded-full text-xs font-semibold tracking-wide text-white flex items-center gap-2 cursor-pointer"
            >
              <span>Get in Touch</span>
              <Icon name="carbon:send-alt" size="14" />
            </a>
          </div>

          <!-- Mobile Action Cluster (Search + Menu Toggle) -->
          <div class="md:hidden flex items-center gap-2">
            <button
              @click="commandPaletteRef?.open()"
              class="w-9 h-9 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
              aria-label="Open search command palette"
            >
              <Icon name="carbon:search" size="16" class="text-blue-400" />
            </button>

            <button
              @click="toggleMobileMenu"
              class="relative w-9 h-9 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-slate-200"
              aria-label="Toggle navigation menu"
            >
            <div class="relative w-5 h-4">
              <span
                class="absolute left-0 block w-full h-0.5 bg-current rounded-full transition-all duration-300"
                :class="isMobileMenuOpen ? 'top-1/2 -translate-y-1/2 rotate-45' : 'top-0'"
              ></span>
              <span
                class="absolute left-0 block w-full h-0.5 bg-current rounded-full transition-all duration-300"
                :class="isMobileMenuOpen ? 'opacity-0 translate-x-2' : 'top-1/2 -translate-y-1/2'"
              ></span>
              <span
                class="absolute left-0 block w-full h-0.5 bg-current rounded-full transition-all duration-300"
                :class="isMobileMenuOpen ? 'bottom-1/2 translate-y-1/2 -rotate-45' : 'bottom-0'"
              ></span>
            </div>
          </button>
        </div>
      </div>
    </div>
  </header>

    <!-- Mobile Menu Backdrop -->
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-show="isMobileMenuOpen"
        class="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
        @click="closeMobileMenu"
      ></div>
    </Transition>

    <!-- Mobile Menu Drawer (Slide Down) -->
    <Transition
      enter-active-class="transition duration-250 cubic-bezier(0.16, 1, 0.3, 1)"
      enter-from-class="opacity-0 -translate-y-4 scale-98"
      enter-to-class="opacity-100 translate-y-0 scale-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100 translate-y-0 scale-100"
      leave-to-class="opacity-0 -translate-y-4 scale-98"
    >
      <nav
        v-show="isMobileMenuOpen"
        class="md:hidden fixed top-20 left-4 right-4 z-50 max-w-md mx-auto"
      >
        <div class="bg-[#0c1222] border border-white/10 rounded-2xl shadow-2xl p-4 overflow-hidden">
          <div class="flex flex-col gap-1.5">
            <NuxtLink
              v-for="item in navItems"
              :key="item.href"
              :to="item.href"
              @click="activeSection = item.href; closeMobileMenu()"
              class="px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 flex items-center justify-between"
              :class="activeSection === item.href
                ? 'bg-gradient-to-r from-blue-600/30 to-indigo-600/30 text-white border border-blue-500/50 shadow-sm shadow-blue-500/20 font-semibold'
                : 'text-slate-300 hover:text-white hover:bg-white/5 border border-transparent'"
            >
              <div class="flex items-center gap-3">
                <Icon 
                  :name="item.icon" 
                  size="18" 
                  :class="activeSection === item.href ? 'text-cyan-300 drop-shadow-[0_0_6px_rgba(56,189,248,0.8)]' : 'text-slate-400'" 
                />
                <span :class="activeSection === item.href ? 'text-white font-semibold' : ''">{{ item.name }}</span>
                <span 
                  v-if="activeSection === item.href" 
                  class="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_#38bdf8] animate-pulse"
                ></span>
              </div>
              <Icon 
                name="carbon:chevron-right" 
                size="16" 
                :class="activeSection === item.href ? 'text-cyan-400' : 'text-slate-500'" 
              />
            </NuxtLink>

            <div class="pt-3 mt-2 border-t border-white/10">
              <a
                href="#contact"
                @click="closeMobileMenu"
                class="btn-primary-gradient w-full py-3 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Let's Talk</span>
                <Icon name="carbon:send-alt" size="16" />
              </a>
            </div>
          </div>
        </div>
      </nav>
    </Transition>

    <!-- Main Content -->
    <main class="relative z-10 pt-20 sm:pt-24">
      <slot></slot>
    </main>

    <!-- Global Developer Command Palette (Ctrl + K) -->
    <CommandPalette ref="commandPaletteRef" />
  </div>
</template>