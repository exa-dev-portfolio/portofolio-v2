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
  { label: 'Cloud & Infrastructure', sub: 'Kubernetes • Docker • Linux • CI/CD', icon: 'carbon:cloud-app' },
  { label: 'Mobile Engineering', sub: 'Flutter • iOS • Android', icon: 'carbon:devices' },
]
</script>

<template>
  <section class="space-y-12 sm:space-y-16">
    
    <!-- 1. Top Header & Narrative -->
    <div class="space-y-6">
      
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
          <span class="text-white font-semibold tabular-nums">{{ currentTime || '18:50:00' }} WIB</span>
        </div>
      </div>

      <!-- Main Headline & Narrative -->
      <div class="space-y-4 max-w-4xl">
        <h1 class="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-[1.12]">
          Building scalable backends, resilient cloud systems, and thoughtful web interfaces.
        </h1>
        <p class="text-base sm:text-lg text-zinc-400 leading-relaxed font-normal pt-1 max-w-3xl">
          I'm <strong class="text-white font-medium">{{ user?.name || 'Eka' }}</strong>, a software engineer with {{ experienceYears || 5 }}+ years of experience architecting high-concurrency microservices in Golang and engineering fluid, reactive user experiences with Vue, Nuxt, and TypeScript.
        </p>
      </div>

      <!-- Primary Action Buttons -->
      <div class="flex items-center gap-3 flex-wrap pt-1">
        <button
          @click="scrollTo('projects')"
          class="px-5 py-2.5 rounded-full bg-white text-black font-semibold text-xs sm:text-sm shadow-md hover:bg-zinc-200 transition-colors cursor-pointer flex items-center gap-2"
        >
          <span>View Projects</span>
          <Icon name="carbon:arrow-down" size="14" />
        </button>

        <button
          @click="scrollTo('contact')"
          class="px-5 py-2.5 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-white font-medium text-xs sm:text-sm transition-colors cursor-pointer"
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

    <!-- 2. Rich Bento Showcase Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
      
      <!-- Bento Tile 1 (Left 5 Cols): Developer Portrait & Core Disciplines -->
      <div class="lg:col-span-5 flex flex-col justify-between p-5 sm:p-6 rounded-2xl bg-[#141417]/70 border border-white/10 hover:border-white/20 transition-all space-y-5">
        
        <!-- Portrait Image with Ambient Overlay -->
        <div class="relative rounded-xl overflow-hidden aspect-[4/3] bg-zinc-900 border border-white/10 group">
          <img
            src="/images/about.webp"
            alt="Eka Developer Profile"
            class="w-full h-full object-cover object-top group-hover:scale-103 transition-transform duration-700"
            loading="lazy"
          />
          <div class="absolute inset-0 bg-gradient-to-t from-[#141417] via-transparent to-transparent opacity-90"></div>

          <!-- Bottom Floating Persona Pill -->
          <div class="absolute bottom-3 left-3 right-3 flex items-center justify-between p-2.5 rounded-xl bg-[#09090b]/85 border border-white/10 backdrop-blur-md">
            <div class="flex items-center gap-2">
              <span class="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span class="text-xs font-semibold text-white tracking-wide">Eka • Software Engineer</span>
            </div>
            <span class="text-[10px] font-mono text-zinc-400 bg-white/5 px-2 py-0.5 rounded border border-white/10">
              {{ user?.location || 'Jakarta, ID' }}
            </span>
          </div>
        </div>

        <!-- Core Disciplines List -->
        <div class="space-y-2.5">
          <span class="text-[11px] font-mono uppercase tracking-wider text-zinc-500 font-semibold block">Core Disciplines</span>
          <div class="grid grid-cols-1 gap-2">
            <div
              v-for="item in competencies"
              :key="item.label"
              class="flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/15 transition-colors"
            >
              <div class="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-zinc-300 shrink-0">
                <Icon :name="item.icon" size="14" />
              </div>
              <div class="min-w-0">
                <p class="text-xs font-semibold text-white truncate">{{ item.label }}</p>
                <p class="text-[10px] font-mono text-zinc-400 truncate">{{ item.sub }}</p>
              </div>
            </div>
          </div>
        </div>

      </div>

      <!-- Bento Tile 2 (Right 7 Cols): Interactive Engineering Craft & Metrics -->
      <div class="lg:col-span-7 flex flex-col justify-between gap-6">
        
        <!-- Craft Terminal & Architecture Snippet -->
        <div class="p-5 sm:p-6 rounded-2xl bg-[#141417]/70 border border-white/10 hover:border-white/20 transition-all flex-1 flex flex-col justify-between space-y-4">
          
          <!-- Tab Bar -->
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

            <span class="text-[10px] font-mono text-zinc-500 uppercase tracking-widest hidden sm:block">Production Tested</span>
          </div>

          <!-- Tab Content 1: Go Architecture Snippet -->
          <div v-if="activeCraftTab === 'architecture'" class="space-y-3 font-mono text-xs">
            <div class="p-3.5 rounded-xl bg-black/60 border border-white/5 text-zinc-300 leading-relaxed overflow-x-auto">
              <p class="text-zinc-500">// Scalable gRPC & HTTP microservice pattern</p>
              <p><span class="text-purple-400">type</span> <span class="text-white font-semibold">EngineService</span> <span class="text-purple-400">struct</span> {</p>
              <p class="pl-4">Cluster   *k8s.ClientPool</p>
              <p class="pl-4">Telemetry *metrics.PrometheusRecorder</p>
              <p class="pl-4">Cache     *redis.DistributedRing</p>
              <p>}</p>
              <p class="pt-1"><span class="text-purple-400">func</span> (s *<span class="text-white font-semibold">EngineService</span>) <span class="text-blue-400">Serve</span>(ctx context.Context) <span class="text-purple-400">error</span> {</p>
              <p class="pl-4 text-emerald-400">// Zero downtime rolling updates & sub-10ms P99</p>
              <p class="pl-4"><span class="text-purple-400">return</span> s.Cluster.GracefulDeploy(ctx, &amp;s.Telemetry)</p>
              <p>}</p>
            </div>
            <p class="text-xs text-zinc-400 font-sans leading-relaxed">
              Prioritizing typed API boundaries, stateless compute, and automatic graceful degradation under traffic surges.
            </p>
          </div>

          <!-- Tab Content 2: Engineering Principles -->
          <div v-else class="space-y-3 font-sans text-xs">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div class="p-3 rounded-xl bg-black/60 border border-white/5 space-y-1">
                <p class="font-semibold text-white flex items-center gap-1.5">
                  <Icon name="carbon:meter" size="14" class="text-zinc-400" />
                  <span>Sub-100ms Latency</span>
                </p>
                <p class="text-[11px] text-zinc-400">Optimized query plans, Redis tiered caching, and compact payload transfers.</p>
              </div>

              <div class="p-3 rounded-xl bg-black/60 border border-white/5 space-y-1">
                <p class="font-semibold text-white flex items-center gap-1.5">
                  <Icon name="carbon:security" size="14" class="text-zinc-400" />
                  <span>Strict Type Safety</span>
                </p>
                <p class="text-[11px] text-zinc-400">End-to-end contracts across backend and frontend using TypeScript and Protobuf.</p>
              </div>

              <div class="p-3 rounded-xl bg-black/60 border border-white/5 space-y-1">
                <p class="font-semibold text-white flex items-center gap-1.5">
                  <Icon name="carbon:restart" size="14" class="text-zinc-400" />
                  <span>Zero-Downtime CI/CD</span>
                </p>
                <p class="text-[11px] text-zinc-400">Automated GitHub Actions, image hardening, and blue/green canary deployments.</p>
              </div>

              <div class="p-3 rounded-xl bg-black/60 border border-white/5 space-y-1">
                <p class="font-semibold text-white flex items-center gap-1.5">
                  <Icon name="carbon:clean" size="14" class="text-zinc-400" />
                  <span>Maintainable DX</span>
                </p>
                <p class="text-[11px] text-zinc-400">Self-documenting domain layers, modular architecture, and high test coverage.</p>
              </div>
            </div>
          </div>

        </div>

        <!-- 4-Stat Metric Row -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div class="p-3.5 sm:p-4 rounded-xl bg-[#141417]/70 border border-white/10 text-center sm:text-left">
            <span class="text-2xl font-bold text-white block tracking-tight">{{ experienceYears || 5 }}+</span>
            <span class="text-[11px] text-zinc-400 mt-0.5 block font-medium">Years Exp</span>
          </div>

          <div class="p-3.5 sm:p-4 rounded-xl bg-[#141417]/70 border border-white/10 text-center sm:text-left">
            <span class="text-2xl font-bold text-white block tracking-tight">{{ projectCount || 30 }}+</span>
            <span class="text-[11px] text-zinc-400 mt-0.5 block font-medium">Projects</span>
          </div>

          <div class="p-3.5 sm:p-4 rounded-xl bg-[#141417]/70 border border-white/10 text-center sm:text-left">
            <span class="text-2xl font-bold text-white block tracking-tight">99.9%</span>
            <span class="text-[11px] text-zinc-400 mt-0.5 block font-medium">Uptime SLA</span>
          </div>

          <div class="p-3.5 sm:p-4 rounded-xl bg-[#141417]/70 border border-white/10 text-center sm:text-left">
            <span class="text-2xl font-bold text-white block tracking-tight">100+</span>
            <span class="text-[11px] text-zinc-400 mt-0.5 block font-medium">PRs Merged</span>
          </div>
        </div>

      </div>

    </div>

    <!-- 3. Featured Apple Music Section (Coding Soundtracks) -->
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
          <span>MusicKit API</span>
        </span>
      </div>

      <!-- Real Live Apple Music Card -->
      <AppleMusicCard />
    </div>

  </section>
</template>
