<script setup lang="ts">
import { computed, ref, onMounted, onBeforeUnmount } from 'vue'
import type { UserSettingsModel } from '~/types/settings'
import AppleMusicCard from '~/components/AppleMusicCard.vue'

const props = defineProps<{
  user?: UserSettingsModel
  projectCount?: number
  experienceYears?: number
}>()

// Live Digital Clock for Jakarta (WIB / UTC+7)
const currentTime = ref('')
let timer: NodeJS.Timeout | null = null

const updateClock = () => {
  const now = new Date()
  currentTime.value = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Jakarta',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(now)
}

onMounted(() => {
  updateClock()
  timer = setInterval(updateClock, 1000)
})

onBeforeUnmount(() => {
  if (timer) clearInterval(timer)
})

const activeCraftTab = ref<'architecture' | 'principles'>('architecture')

const scrollTo = (id: string) => {
  const el = document.getElementById(id)
  if (el) {
    el.scrollIntoView({ behavior: 'smooth' })
  }
}

const competencies = [
  { label: 'Frontend Architecture', sub: 'Vue 3 • Nuxt • React • Vite', icon: 'carbon:application-web' },
  { label: 'Backend Microservices', sub: 'Golang • gRPC • Node.js • REST', icon: 'carbon:data-base' },
  { label: 'Cloud Infrastructure', sub: 'Kubernetes • Docker • Linux • CI/CD', icon: 'carbon:cloud-app' },
  { label: 'Mobile Engineering', sub: 'Flutter • iOS • Android', icon: 'carbon:devices' },
]
</script>

<template>
  <section class="space-y-10 sm:space-y-12">
    
    <!-- 1. Studio Masthead -->
    <div class="space-y-6 pt-2">
      
      <!-- Top Meta Pill & Live Clock -->
      <div class="flex items-center justify-between flex-wrap gap-3">
        <div class="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-white/[0.04] border border-white/10 text-xs text-zinc-300 backdrop-blur-md">
          <span class="relative flex h-2 w-2">
            <span class="radar-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
          </span>
          <span class="font-medium text-white">Available for new opportunities</span>
          <span class="text-zinc-600">•</span>
          <span class="text-zinc-400">Full-Stack & Cloud Systems</span>
        </div>

        <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/10 text-xs font-mono text-zinc-400">
          <Icon name="carbon:time" size="13" class="text-zinc-400" />
          <span>Jakarta (UTC+7):</span>
          <span class="text-white font-semibold tabular-nums">{{ currentTime || '19:15:00' }} WIB</span>
        </div>
      </div>

      <!-- Main Headline & Narrative -->
      <div class="space-y-4 max-w-4xl">
        <h1 class="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-[1.12]">
          Building scalable backends, resilient cloud systems, and thoughtful web interfaces.
        </h1>
        <p class="text-base sm:text-lg text-zinc-400 leading-relaxed font-normal pt-1 max-w-3xl">
          I'm <strong class="text-white font-medium">{{ user?.name || 'Eka Syafrino' }}</strong>, a software engineer with {{ experienceYears || 5 }}+ years of experience architecting high-concurrency microservices in Golang and engineering fluid, reactive user experiences with Vue, Nuxt, and TypeScript.
        </p>
      </div>

      <!-- Primary Action Buttons & Quick Anchors -->
      <div class="flex items-center gap-3 flex-wrap pt-1">
        <button
          @click="scrollTo('projects')"
          class="px-5 py-2.5 rounded-full bg-white text-black font-semibold text-xs sm:text-sm shadow-md hover:bg-zinc-200 transition-colors cursor-pointer flex items-center gap-2"
        >
          <span>Explore Featured Works</span>
          <Icon name="carbon:arrow-down" size="14" />
        </button>

        <button
          @click="scrollTo('music')"
          class="px-4 py-2.5 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-white font-medium text-xs sm:text-sm transition-colors cursor-pointer flex items-center gap-1.5"
        >
          <Icon name="carbon:music" size="13" class="text-[#fa243c]" />
          <span>Apple Music</span>
        </button>

        <button
          @click="scrollTo('stack')"
          class="px-4 py-2.5 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-zinc-300 hover:text-white font-medium text-xs sm:text-sm transition-colors cursor-pointer"
        >
          Tech Stack (29)
        </button>

        <button
          @click="scrollTo('contact')"
          class="px-4 py-2.5 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-zinc-300 hover:text-white font-medium text-xs sm:text-sm transition-colors cursor-pointer"
        >
          Get in touch
        </button>

        <a
          v-if="user?.cv_url"
          :href="user.cv_url"
          target="_blank"
          rel="noopener noreferrer"
          class="px-4 py-2.5 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-zinc-400 hover:text-white font-mono text-xs transition-colors flex items-center gap-1.5"
        >
          <span>Resume</span>
          <Icon name="carbon:download" size="12" />
        </a>
      </div>

    </div>

    <!-- 2. Integrated Developer Dossier & Live Telemetry Bento -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-stretch">
      
      <!-- Developer Dossier Card (Left 6 Cols) -->
      <div class="lg:col-span-6 flex flex-col justify-between p-5 sm:p-6 rounded-2xl bg-[#141417]/70 border border-white/10 hover:border-white/20 transition-all space-y-5">
        
        <!-- Persona Header: Avatar Squircle + Bio Info -->
        <div class="flex items-center gap-4">
          <div class="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden bg-zinc-900 border border-white/15 shrink-0 shadow-lg group">
            <img
              src="/images/about.webp"
              alt="Eka Syafrino"
              class="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
            <span class="absolute bottom-1 right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-[#141417]"></span>
          </div>

          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-2">
              <h2 class="text-base sm:text-lg font-bold text-white truncate">{{ user?.name || 'Moh. Eka Syafrino' }}</h2>
              <span class="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-mono">
                Active
              </span>
            </div>
            <p class="text-xs text-zinc-400 mt-0.5">Full-Stack Engineer & Cloud Architect</p>
            <p class="text-[11px] font-mono text-zinc-500 mt-0.5 flex items-center gap-1">
              <Icon name="carbon:location" size="12" />
              <span>{{ user?.location || 'Jakarta, Indonesia' }} (UTC+7)</span>
            </p>
          </div>
        </div>

        <!-- Core Disciplines Matrix -->
        <div class="space-y-2">
          <span class="text-[10px] font-mono uppercase tracking-wider text-zinc-500 font-semibold block">Core Disciplines</span>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div
              v-for="item in competencies"
              :key="item.label"
              class="flex items-center gap-2.5 p-2 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/15 transition-colors"
            >
              <div class="w-6 h-6 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-zinc-300 shrink-0">
                <Icon :name="item.icon" size="12" />
              </div>
              <div class="min-w-0">
                <p class="text-xs font-semibold text-white truncate">{{ item.label }}</p>
                <p class="text-[10px] font-mono text-zinc-400 truncate">{{ item.sub }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- 4 Fast Production Metrics -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-white/5">
          <div class="p-2.5 rounded-xl bg-black/40 border border-white/5 text-center">
            <span class="text-lg font-bold text-white block tracking-tight">{{ experienceYears || 5 }}+</span>
            <span class="text-[10px] text-zinc-400 block font-medium">Years Exp</span>
          </div>

          <div class="p-2.5 rounded-xl bg-black/40 border border-white/5 text-center">
            <span class="text-lg font-bold text-white block tracking-tight">{{ projectCount || 30 }}+</span>
            <span class="text-[10px] text-zinc-400 block font-medium">Projects</span>
          </div>

          <div class="p-2.5 rounded-xl bg-black/40 border border-white/5 text-center">
            <span class="text-lg font-bold text-white block tracking-tight">99.9%</span>
            <span class="text-[10px] text-zinc-400 block font-medium">Uptime SLA</span>
          </div>

          <div class="p-2.5 rounded-xl bg-black/40 border border-white/5 text-center">
            <span class="text-lg font-bold text-white block tracking-tight">29</span>
            <span class="text-[10px] text-zinc-400 block font-medium">Verified Tools</span>
          </div>
        </div>

      </div>

      <!-- Engineering Philosophy & System Code Card (Right 6 Cols) -->
      <div class="lg:col-span-6 flex flex-col justify-between p-5 sm:p-6 rounded-2xl bg-[#141417]/70 border border-white/10 hover:border-white/20 transition-all space-y-4">
        
        <!-- Tab Switcher -->
        <div class="flex items-center justify-between pb-3 border-b border-white/10">
          <div class="flex items-center gap-2">
            <button
              @click="activeCraftTab = 'architecture'"
              class="px-3 py-1 rounded-lg text-xs font-mono transition-colors cursor-pointer flex items-center gap-1.5"
              :class="activeCraftTab === 'architecture' ? 'bg-white text-black font-semibold' : 'text-zinc-400 hover:text-white bg-white/5'"
            >
              <Icon name="carbon:code" size="13" />
              <span>architecture.go</span>
            </button>

            <button
              @click="activeCraftTab = 'principles'"
              class="px-3 py-1 rounded-lg text-xs font-mono transition-colors cursor-pointer flex items-center gap-1.5"
              :class="activeCraftTab === 'principles' ? 'bg-white text-black font-semibold' : 'text-zinc-400 hover:text-white bg-white/5'"
            >
              <Icon name="carbon:rule" size="13" />
              <span>principles.md</span>
            </button>
          </div>

          <span class="text-[10px] font-mono text-zinc-500 uppercase tracking-widest hidden sm:block">Production Core</span>
        </div>

        <!-- Tab 1: Code Architecture -->
        <div v-if="activeCraftTab === 'architecture'" class="space-y-3 font-mono text-xs flex-1 flex flex-col justify-center">
          <div class="p-3.5 rounded-xl bg-black/70 border border-white/5 text-zinc-300 leading-relaxed overflow-x-auto">
            <p class="text-zinc-500">// Scalable Go gRPC & HTTP microservice pattern</p>
            <p><span class="text-purple-400">type</span> <span class="text-white font-semibold">ServiceNode</span> <span class="text-purple-400">struct</span> {</p>
            <p class="pl-4">Cluster   *k8s.Pool</p>
            <p class="pl-4">Telemetry *metrics.Prometheus</p>
            <p class="pl-4">Cache     *redis.DistributedRing</p>
            <p>}</p>
            <p class="pt-1"><span class="text-purple-400">func</span> (s *<span class="text-white font-semibold">ServiceNode</span>) <span class="text-blue-400">Serve</span>(ctx context.Context) <span class="text-purple-400">error</span> {</p>
            <p class="pl-4 text-emerald-400">// Sub-10ms P99 & zero-downtime rolling deploys</p>
            <p class="pl-4"><span class="text-purple-400">return</span> s.Cluster.GracefulDeploy(ctx, &amp;s.Telemetry)</p>
            <p>}</p>
          </div>
          <p class="text-xs text-zinc-400 font-sans leading-relaxed">
            Prioritizing strict type boundaries, stateless compute, and automated graceful degradation under traffic spikes.
          </p>
        </div>

        <!-- Tab 2: Principles -->
        <div v-else class="space-y-2.5 font-sans text-xs flex-1 flex flex-col justify-center">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div class="p-2.5 rounded-xl bg-black/60 border border-white/5 space-y-1">
              <p class="font-semibold text-white flex items-center gap-1.5 text-xs">
                <Icon name="carbon:meter" size="13" class="text-zinc-400" />
                <span>Sub-100ms Latency</span>
              </p>
              <p class="text-[11px] text-zinc-400">Optimized query plans, Redis tiered caching, and compact payload transfers.</p>
            </div>

            <div class="p-2.5 rounded-xl bg-black/60 border border-white/5 space-y-1">
              <p class="font-semibold text-white flex items-center gap-1.5 text-xs">
                <Icon name="carbon:security" size="13" class="text-zinc-400" />
                <span>Strict Type Safety</span>
              </p>
              <p class="text-[11px] text-zinc-400">End-to-end contracts across backend and frontend using TypeScript and Protobuf.</p>
            </div>

            <div class="p-2.5 rounded-xl bg-black/60 border border-white/5 space-y-1">
              <p class="font-semibold text-white flex items-center gap-1.5 text-xs">
                <Icon name="carbon:restart" size="13" class="text-zinc-400" />
                <span>Zero-Downtime CI/CD</span>
              </p>
              <p class="text-[11px] text-zinc-400">Automated GitHub Actions, image hardening, and blue/green canary deployments.</p>
            </div>

            <div class="p-2.5 rounded-xl bg-black/60 border border-white/5 space-y-1">
              <p class="font-semibold text-white flex items-center gap-1.5 text-xs">
                <Icon name="carbon:clean" size="13" class="text-zinc-400" />
                <span>Maintainable DX</span>
              </p>
              <p class="text-[11px] text-zinc-400">Self-documenting domain layers, modular architecture, and high test coverage.</p>
            </div>
          </div>
        </div>

      </div>

    </div>

    <!-- 3. Apple Music Live Centerpiece Showcase -->
    <div id="music" class="space-y-4 pt-2">
      <div class="flex items-center justify-between pb-2 border-b border-white/10">
        <div>
          <div class="flex items-center gap-2">
            <Icon name="carbon:music" size="14" class="text-[#fa243c]" />
            <span class="text-xs font-mono uppercase tracking-wider text-zinc-500 font-semibold">Live Music Synchronization</span>
          </div>
          <h2 class="text-xl sm:text-2xl font-bold text-white tracking-tight mt-1">Now Playing on Apple Music</h2>
        </div>

        <span class="text-xs font-mono text-zinc-400 hidden sm:inline-flex items-center gap-1.5">
          <span class="w-1.5 h-1.5 rounded-full bg-[#fa243c] animate-ping"></span>
          <span>MusicKit API Sync</span>
        </span>
      </div>

      <!-- Real Live Apple Music Card -->
      <AppleMusicCard />
    </div>

  </section>
</template>
