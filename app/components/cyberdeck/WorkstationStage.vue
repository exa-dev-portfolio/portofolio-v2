<script setup lang="ts">
import { computed, ref } from 'vue'
import type { UserSettingsModel } from '~/types/settings'

const props = defineProps<{
  user?: UserSettingsModel
  projectCount?: number
  experienceYears?: number
}>()

const emit = defineEmits<{
  (e: 'navigate', mode: string): void
}>()

// Terminal Console State
interface TerminalLine {
  type: 'cmd' | 'output' | 'error' | 'success'
  text: string
}

const terminalHistory = ref<TerminalLine[]>([
  { type: 'output', text: 'EKA.OS v2.6.4 Workstation Console initialized.' },
  { type: 'output', text: 'Type "help" or click suggested commands below.' },
])

const terminalInput = ref('')

const runCommand = (cmd: string) => {
  const cleanCmd = cmd.trim().toLowerCase()
  terminalHistory.value.push({ type: 'cmd', text: `eka@station:~$ ${cmd}` })

  switch (cleanCmd) {
    case 'help':
      terminalHistory.value.push({
        type: 'output',
        text: 'Available commands:\n  • bio      : Output developer philosophy & background\n  • stack    : Print core cloud & UI runtime stack\n  • stats    : Show production metrics & uptime\n  • projects : Navigate to Projects Filmstrip\n  • clear    : Reset terminal window',
      })
      break
    case 'bio':
      terminalHistory.value.push({
        type: 'success',
        text: 'Eka | Full-Stack Architect with 5+ years of engineering experience across Golang, Nuxt 4, Vue 3, PostgreSQL, Docker, and Kubernetes. Obsessed with high-concurrency systems and buttery UI performance.',
      })
      break
    case 'stack':
      terminalHistory.value.push({
        type: 'output',
        text: 'Core Stack: Golang • Nuxt 4 / Vue 3 • TypeScript • PostgreSQL • Redis • Docker • Kubernetes • GCP • Three.js',
      })
      break
    case 'stats':
      terminalHistory.value.push({
        type: 'success',
        text: `Metrics: ${props.experienceYears || 5}+ Years XP • ${props.projectCount || 30}+ Projects • 99.99% Cloud Uptime • <15ms p99 Latency`,
      })
      break
    case 'projects':
      terminalHistory.value.push({ type: 'output', text: 'Switching viewport to Projects Filmstrip...' })
      emit('navigate', 'projects')
      break
    case 'contact':
    case 'transmit':
      terminalHistory.value.push({ type: 'output', text: 'Opening encrypted transmission channel...' })
      emit('navigate', 'transmit')
      break
    case 'clear':
      terminalHistory.value = []
      break
    default:
      terminalHistory.value.push({
        type: 'error',
        text: `Command not found: "${cmd}". Type "help" for a list of valid commands.`,
      })
  }

  terminalInput.value = ''
}

const quickCommands = ['bio', 'stack', 'stats', 'projects', 'clear']
</script>

<template>
  <section class="min-h-[calc(100vh-5rem)] flex items-center justify-center py-6 sm:py-10 px-4 sm:px-6">
    <div class="max-w-7xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
      
      <!-- Left Column (7 cols): Main Cyberdeck Command Stage -->
      <div class="lg:col-span-7 flex flex-col gap-5">
        
        <!-- System Badge Status -->
        <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-mono self-start shadow-sm shadow-emerald-500/20">
          <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]"></span>
          <span>DEV_ENV: CLOUD_DISTRIBUTED</span>
          <span class="text-white/30">•</span>
          <span class="text-white/80">READY_FOR_DISPATCH</span>
        </div>

        <!-- Dramatic Headline -->
        <div class="space-y-2">
          <h1 class="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.1] font-heading">
            Engineering
            <span class="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-mint-400 drop-shadow-[0_0_30px_rgba(16,185,129,0.3)]">
              Resilient Scale
            </span>
            & Intuitive UI.
          </h1>
          <p class="text-sm sm:text-base text-slate-300 font-sans leading-relaxed max-w-2xl">
            Hi, I'm <strong class="text-white font-semibold">{{ user?.name || 'Eka' }}</strong>. Full-stack architect specializing in high-concurrency microservices, robust cloud infrastructure, and silky reactive client applications.
          </p>
        </div>

        <!-- Engineering Philosophy Block -->
        <div class="p-4 rounded-2xl bg-[#08120c]/90 border border-emerald-500/20 shadow-xl backdrop-blur-xl relative overflow-hidden group">
          <div class="absolute -right-10 -bottom-10 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
          
          <div class="flex items-center justify-between mb-2">
            <span class="text-[11px] font-mono text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Icon name="carbon:chip" size="14" />
              Core Architectural Tenet
            </span>
            <span class="text-[10px] font-mono text-slate-400">p99 Target &lt; 15ms</span>
          </div>
          <p class="text-xs sm:text-sm text-slate-300 leading-relaxed italic">
            "Resilience over complexity. Optimize for deterministic latency, self-healing services, and clean asynchronous data flow from database to DOM."
          </p>
        </div>

        <!-- Interactive Workstation Terminal -->
        <div class="rounded-2xl bg-[#060b08] border border-emerald-500/30 shadow-2xl overflow-hidden font-mono text-xs">
          <!-- Terminal Header -->
          <div class="px-4 py-2.5 bg-[#0a150f] border-b border-emerald-500/20 flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="w-3 h-3 rounded-full bg-red-500/80"></span>
              <span class="w-3 h-3 rounded-full bg-amber-500/80"></span>
              <span class="w-3 h-3 rounded-full bg-emerald-500/80"></span>
              <span class="ml-2 text-slate-400 text-[11px]">station@eka-cloud:~</span>
            </div>
            <span class="text-[10px] text-emerald-400/80 font-mono">BASH / ZSH</span>
          </div>

          <!-- Terminal Output Box -->
          <div class="p-4 max-h-48 overflow-y-auto space-y-1.5 text-slate-300 selection:bg-emerald-500/40">
            <div v-for="(line, idx) in terminalHistory" :key="idx" class="leading-relaxed">
              <span v-if="line.type === 'cmd'" class="text-emerald-400 font-bold">{{ line.text }}</span>
              <span v-else-if="line.type === 'success'" class="text-mint-300">{{ line.text }}</span>
              <span v-else-if="line.type === 'error'" class="text-red-400">{{ line.text }}</span>
              <span v-else class="text-slate-300 whitespace-pre-line">{{ line.text }}</span>
            </div>
          </div>

          <!-- Terminal Quick Action Chips -->
          <div class="px-4 py-2 border-t border-white/5 bg-[#08120c]/60 flex items-center gap-1.5 flex-wrap">
            <span class="text-[10px] text-slate-500 uppercase mr-1">Quick Run:</span>
            <button
              v-for="chip in quickCommands"
              :key="chip"
              @click="runCommand(chip)"
              class="px-2 py-0.5 rounded bg-white/5 hover:bg-emerald-500/20 text-emerald-300 border border-white/10 hover:border-emerald-500/30 text-[10px] font-mono transition-colors cursor-pointer"
            >
              {{ chip }}
            </button>
          </div>

          <!-- Terminal Input Row -->
          <form @submit.prevent="runCommand(terminalInput)" class="px-4 py-2.5 bg-[#050807] border-t border-emerald-500/20 flex items-center gap-2">
            <span class="text-emerald-400 font-bold shrink-0">eka@station:~$</span>
            <input
              v-model="terminalInput"
              type="text"
              placeholder="Type command ('help', 'bio', 'projects')..."
              class="w-full bg-transparent text-white placeholder:text-slate-600 focus:outline-none text-xs font-mono"
            />
            <button type="submit" class="text-emerald-400 hover:text-white px-2 py-1 rounded bg-white/5 border border-white/10 text-[10px]">
              ↵
            </button>
          </form>
        </div>

        <!-- Quick Dispatch Action Buttons -->
        <div class="flex items-center gap-3 pt-1 flex-wrap">
          <button
            @click="emit('navigate', 'projects')"
            class="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs sm:text-sm shadow-lg shadow-emerald-500/25 flex items-center gap-2 transition-all cursor-pointer"
          >
            <span>Explore Projects Filmstrip</span>
            <Icon name="carbon:arrow-right" size="16" />
          </button>

          <button
            @click="emit('navigate', 'transmit')"
            class="px-5 py-2.5 rounded-xl bg-[#08120c] hover:bg-white/10 text-emerald-300 hover:text-white border border-emerald-500/30 text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer"
          >
            <span>Transmit Inquiry</span>
            <Icon name="carbon:send-alt" size="14" />
          </button>
        </div>

      </div>

      <!-- Right Column (5 cols): Telemetry Matrix & Profile HUD -->
      <div class="lg:col-span-5 flex flex-col gap-5">
        
        <!-- Profile Identity Card -->
        <div class="p-5 rounded-3xl bg-[#08120c]/90 border border-emerald-500/25 shadow-2xl backdrop-blur-2xl relative overflow-hidden">
          <div class="flex items-center gap-4">
            <div class="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border-2 border-emerald-500/40 shadow-lg shadow-emerald-500/20 shrink-0">
              <img
                :src="user?.avatar_url || '/images/avatar.webp'"
                :alt="user?.name || 'Developer Avatar'"
                class="w-full h-full object-cover"
                loading="eager"
              />
              <div class="absolute inset-0 bg-gradient-to-t from-emerald-950/60 to-transparent"></div>
            </div>

            <div class="flex flex-col min-w-0">
              <div class="flex items-center gap-2">
                <span class="text-base sm:text-lg font-heading font-bold text-white truncate">{{ user?.name || 'Eka' }}</span>
                <span class="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]"></span>
              </div>
              <p class="text-xs font-mono text-emerald-400 truncate">{{ user?.job_title || 'Full Stack & Cloud Engineer' }}</p>
              <p class="text-[11px] text-slate-400 mt-1 flex items-center gap-1.5 font-mono">
                <Icon name="carbon:location" size="12" class="text-emerald-400" />
                Jakarta, Indonesia (WIB GMT+7)
              </p>
            </div>
          </div>

          <!-- Availability & Work Mode -->
          <div class="mt-4 pt-4 border-t border-white/10 grid grid-cols-2 gap-2 text-[11px] font-mono">
            <div class="p-2.5 rounded-xl bg-white/[0.03] border border-white/5">
              <span class="text-slate-400 block text-[10px]">STATUS</span>
              <span class="text-emerald-300 font-semibold flex items-center gap-1 mt-0.5">
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                Open for Hire
              </span>
            </div>
            <div class="p-2.5 rounded-xl bg-white/[0.03] border border-white/5">
              <span class="text-slate-400 block text-[10px]">TIMEZONE</span>
              <span class="text-white font-semibold mt-0.5 block">UTC+7 (Jakarta)</span>
            </div>
          </div>
        </div>

        <!-- 4 Metric Telemetry Gauges -->
        <div class="grid grid-cols-2 gap-3 font-mono">
          <div class="p-4 rounded-2xl bg-[#08120c]/80 border border-emerald-500/20 shadow-lg">
            <span class="text-2xl sm:text-3xl font-extrabold text-white block">{{ experienceYears || 5 }}+</span>
            <span class="text-[11px] text-emerald-400/90 font-medium mt-1 block">Years Production XP</span>
          </div>

          <div class="p-4 rounded-2xl bg-[#08120c]/80 border border-emerald-500/20 shadow-lg">
            <span class="text-2xl sm:text-3xl font-extrabold text-white block">{{ projectCount || 30 }}+</span>
            <span class="text-[11px] text-emerald-400/90 font-medium mt-1 block">Completed Systems</span>
          </div>

          <div class="p-4 rounded-2xl bg-[#08120c]/80 border border-emerald-500/20 shadow-lg">
            <span class="text-2xl sm:text-3xl font-extrabold text-white block">99.99%</span>
            <span class="text-[11px] text-emerald-400/90 font-medium mt-1 block">Service Uptime Target</span>
          </div>

          <div class="p-4 rounded-2xl bg-[#08120c]/80 border border-emerald-500/20 shadow-lg">
            <span class="text-2xl sm:text-3xl font-extrabold text-white block">&lt; 15ms</span>
            <span class="text-[11px] text-emerald-400/90 font-medium mt-1 block">p99 Gateway Latency</span>
          </div>
        </div>

        <!-- Live Audio / Engineering Playlist Telemetry -->
        <div class="p-3.5 rounded-2xl bg-[#08120c]/90 border border-emerald-500/20 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Icon name="carbon:music" size="18" />
            </div>
            <div>
              <p class="text-xs font-mono font-semibold text-white">Focus Channel</p>
              <p class="text-[10px] font-mono text-emerald-400/90">Deep Work Synthwave & Lo-Fi</p>
            </div>
          </div>

          <!-- Animated Equalizer Bars -->
          <div class="flex items-end gap-1 h-5 px-2">
            <span class="w-1 bg-emerald-400 rounded-full animate-pulse h-3"></span>
            <span class="w-1 bg-emerald-300 rounded-full animate-bounce h-5" style="animation-delay: 0.15s"></span>
            <span class="w-1 bg-teal-400 rounded-full animate-bounce h-4" style="animation-delay: 0.3s"></span>
            <span class="w-1 bg-emerald-400 rounded-full animate-pulse h-2"></span>
          </div>
        </div>

      </div>

    </div>
  </section>
</template>
