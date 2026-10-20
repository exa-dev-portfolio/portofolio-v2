<script setup lang="ts">
import { ref } from 'vue';
import type { UserSettingsModel } from "~/types/settings";

defineProps<{
  user?: UserSettingsModel | null;
}>();

const quickPills = [
  { label: 'Go / Microservices', icon: 'logos:go' },
  { label: 'Vue / Nuxt 4', icon: 'logos:vue' },
  { label: 'Flutter Mobile', icon: 'logos:flutter' },
  { label: 'Cloud / K8s', icon: 'logos:kubernetes' },
  { label: 'PostgreSQL', icon: 'logos:postgresql' },
  { label: 'Redis Cache', icon: 'logos:redis' }
];

// Interactive IDE tabs state
const activeTab = ref<'go' | 'vue' | 'yaml'>('go');
const copiedCode = ref(false);

const copyCode = () => {
  const code = codeSnippets[activeTab.value];
  navigator.clipboard.writeText(code);
  copiedCode.value = true;
  setTimeout(() => {
    copiedCode.value = false;
  }, 2000);
};

const codeSnippets = {
  go: `// High-Throughput Event-Driven Microservice
package main

func (s *WorkerEngine) HandleDispatch(ctx context.Context, job Job) error {
    select {
    case s.queue <- job:
        telemetry.Inc("jobs.dispatched", 1)
        return nil
    case <-time.After(25 * time.Millisecond):
        return ErrBackpressureThrottle
    }
}`,
  vue: `<!-- Reactive Fluid Web Architecture (Nuxt 4) -->
<script setup lang="ts">
const { data: telemetry } = await useFetch('/api/cluster/live', {
  lazy: true,
  transform: (res) => res.data.metrics
});
const isOptimal = computed(() => telemetry.value?.p99 < 8);
<\/script>`,
  yaml: `# Kubernetes Auto-Scale Zero-Downtime Blueprint
apiVersion: apps/v1
kind: Deployment
metadata:
  name: core-api-service
spec:
  replicas: 3
  strategy:
    rollingUpdate:
      maxSurge: 25%
      maxUnavailable: 0`
};

const codeLanguages = {
  go: 'Go 1.23 • High Concurrency',
  vue: 'Nuxt 4 + Vue 3 • Ultra Fluid',
  yaml: 'Kubernetes • Zero-Downtime'
};
</script>

<template>
  <section class="relative pt-6 pb-16 md:pt-10 md:pb-24 overflow-hidden" aria-label="Hero section">
    <div class="container mx-auto px-4 sm:px-6">
      
      <!-- Top Bento Status Bar / Live Telemetry Pill Row -->
      <div class="animate-hero-1 mb-8 flex flex-wrap items-center gap-2.5 sm:gap-3">
        <!-- Availability Beacon -->
        <div class="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-emerald-950/50 border border-emerald-500/30 shadow-sm shadow-emerald-500/10 backdrop-blur-md">
          <span class="relative flex h-2 w-2">
            <span class="radar-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-80"></span>
            <span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
          </span>
          <span class="text-xs font-mono font-medium tracking-wide text-emerald-200">
            {{ user?.open_to_opportunities ? 'Available for New Projects & Roles' : 'Full-Stack Developer & Engineer' }}
          </span>
        </div>

        <!-- Location Badge -->
        <div class="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.08] text-xs font-mono text-slate-300">
          <Icon name="carbon:location" size="13" class="text-emerald-400" />
          <span>{{ user?.location || 'Indonesia • UTC+7' }}</span>
        </div>

        <!-- Metric Accent Pill -->
        <div class="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-mono text-emerald-300">
          <Icon name="carbon:flash" size="13" class="text-emerald-400" />
          <span>High-Scale • Clean Architecture</span>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
        
        <!-- Left Column: Bold Typography, Pitch, CTAs & Socials (7 cols) -->
        <div class="lg:col-span-7 flex flex-col items-start z-10">
          
          <!-- Main Headline -->
          <div class="animate-hero-2">
            <h1 class="text-4xl sm:text-5xl lg:text-6xl font-heading font-black tracking-tight leading-[1.12] mb-6 text-white">
              Hi, I'm <span class="text-gradient-primary">Eka</span>.<br />
              Architecting <span class="text-gradient-cyan">Scalable</span><br class="hidden sm:inline" />
              Systems & Web Apps.
            </h1>
          </div>

          <!-- Subtitle / Bio -->
          <div class="animate-hero-3">
            <p class="text-slate-300 text-base sm:text-lg leading-relaxed max-w-xl mb-8 font-normal">
              Senior Full-Stack Software Engineer bridging high-concurrency backend services, responsive modern web architectures, and native mobile apps. Driven by clean code, cloud automation, and exceptional UX.
            </p>
          </div>

          <!-- Interactive CTAs -->
          <div class="animate-hero-4 w-full sm:w-auto">
            <div class="flex flex-wrap items-center gap-3.5 mb-8">
              <a
                href="#project"
                class="btn-primary-gradient px-6 py-3 rounded-xl font-semibold text-sm tracking-wide text-white inline-flex items-center justify-center gap-2 group cursor-pointer w-full sm:w-auto"
                aria-label="View featured projects"
              >
                <span>Explore Projects</span>
                <Icon name="carbon:arrow-right" size="16" class="group-hover:translate-x-1 transition-transform" />
              </a>

              <a
                href="#contact"
                class="btn-secondary-subtle px-5 py-3 rounded-xl font-semibold text-sm tracking-wide text-slate-200 hover:text-white inline-flex items-center justify-center gap-2 cursor-pointer w-full sm:w-auto"
                aria-label="Get in touch"
              >
                <Icon name="carbon:chat" size="16" class="text-emerald-400" />
                <span>Contact Me</span>
              </a>
            </div>
          </div>

          <!-- Social Links & Stack Summary -->
          <div class="animate-hero-5 pt-4 border-t border-white/[0.08] w-full max-w-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <!-- Social Dock -->
            <div class="flex items-center gap-2.5">
              <span class="text-xs font-mono text-emerald-400/80 uppercase mr-1">Connect:</span>
              
              <a
                :href="user?.github_profile ?? 'https://github.com'"
                target="_blank"
                rel="noopener noreferrer"
                class="w-9 h-9 rounded-lg bg-white/5 border border-white/10 hover:border-emerald-500/40 hover:bg-emerald-500/10 flex items-center justify-center text-slate-400 hover:text-emerald-300 transition-colors"
                aria-label="GitHub Profile"
              >
                <Icon name="line-md:github" size="20" />
              </a>

              <a
                :href="user?.linkedin_profile ?? 'https://www.linkedin.com'"
                target="_blank"
                rel="noopener noreferrer"
                class="w-9 h-9 rounded-lg bg-white/5 border border-white/10 hover:border-emerald-500/40 hover:bg-emerald-500/10 flex items-center justify-center text-slate-400 hover:text-emerald-300 transition-colors"
                aria-label="LinkedIn Profile"
              >
                <Icon name="jam:linkedin" size="20" />
              </a>

              <a
                :href="`mailto:${user?.email ?? 'contact@eka-dev.cloud'}`"
                target="_blank"
                rel="noopener noreferrer"
                class="w-9 h-9 rounded-lg bg-white/5 border border-white/10 hover:border-emerald-500/40 hover:bg-emerald-500/10 flex items-center justify-center text-slate-400 hover:text-emerald-300 transition-colors"
                aria-label="Send an Email"
              >
                <Icon name="carbon:email" size="20" />
              </a>
            </div>

            <!-- Quick Pill Highlights -->
            <div class="hidden sm:flex items-center gap-2">
              <span class="px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-[11px] font-mono text-emerald-300">
                Go • Nuxt 4 • K8s • Flutter
              </span>
            </div>
          </div>

        </div>

        <!-- Right Column: Interactive Modern Glass Terminal / IDE Bento (5 cols) -->
        <div class="lg:col-span-5 relative flex justify-center lg:justify-end animate-hero-card">
          <div class="relative w-full max-w-lg">
            
            <!-- Ambient Behind-Card Glow -->
            <div class="absolute -inset-1 rounded-3xl bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-transparent blur-xl pointer-events-none"></div>

            <!-- Clean Elevated IDE Container with Subtle Emerald Rim Light -->
            <div class="relative rounded-2xl bg-[#08120c]/90 border border-emerald-500/20 shadow-2xl shadow-emerald-950/40 overflow-hidden backdrop-blur-xl">
              
              <!-- macOS Window Header Bar & Interactive Tabs -->
              <div class="px-4 py-3 bg-[#0c1a11] border-b border-white/[0.08] flex items-center justify-between">
                <!-- Mac traffic lights -->
                <div class="flex items-center gap-1.5">
                  <div class="w-3 h-3 rounded-full bg-[#ff5f56]/90"></div>
                  <div class="w-3 h-3 rounded-full bg-[#ffbd2e]/90"></div>
                  <div class="w-3 h-3 rounded-full bg-[#27c93f]/90"></div>
                </div>

                <!-- Interactive Tab Switcher -->
                <div class="flex items-center gap-1 bg-[#050c07] p-1 rounded-lg border border-white/5">
                  <button
                    @click="activeTab = 'go'"
                    class="px-2.5 py-1 rounded-md text-[11px] font-mono transition-all flex items-center gap-1.5 cursor-pointer"
                    :class="activeTab === 'go' 
                      ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 font-medium shadow-sm' 
                      : 'text-slate-400 hover:text-slate-200'"
                  >
                    <Icon name="logos:go" size="13" />
                    <span>server.go</span>
                  </button>

                  <button
                    @click="activeTab = 'vue'"
                    class="px-2.5 py-1 rounded-md text-[11px] font-mono transition-all flex items-center gap-1.5 cursor-pointer"
                    :class="activeTab === 'vue' 
                      ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 font-medium shadow-sm' 
                      : 'text-slate-400 hover:text-slate-200'"
                  >
                    <Icon name="logos:vue" size="12" />
                    <span>Arch.vue</span>
                  </button>

                  <button
                    @click="activeTab = 'yaml'"
                    class="px-2.5 py-1 rounded-md text-[11px] font-mono transition-all flex items-center gap-1.5 cursor-pointer"
                    :class="activeTab === 'yaml' 
                      ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 font-medium shadow-sm' 
                      : 'text-slate-400 hover:text-slate-200'"
                  >
                    <Icon name="logos:kubernetes" size="12" />
                    <span>scale.yaml</span>
                  </button>
                </div>

                <!-- Status Dot -->
                <div class="flex items-center gap-1.5 text-[10px] font-mono text-emerald-400">
                  <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span class="hidden sm:inline">LIVE</span>
                </div>
              </div>

              <!-- Main Code Canvas -->
              <div class="p-4 sm:p-5 space-y-3">
                
                <!-- Code Snippet Box with Syntax Highlighting & Real Copy Action -->
                <div class="relative bg-[#050c07] rounded-xl p-4 border border-white/5 font-mono text-xs leading-relaxed text-slate-300 overflow-x-auto">
                  <!-- Snippet Header & Copy Action -->
                  <div class="flex items-center justify-between text-[11px] text-slate-500 mb-3 border-b border-white/5 pb-2">
                    <span class="text-emerald-400/90 font-mono flex items-center gap-1.5">
                      <span class="text-emerald-400">//</span>
                      <span>{{ codeLanguages[activeTab] }}</span>
                    </span>

                    <button
                      @click="copyCode"
                      class="px-2.5 py-1 rounded-md bg-white/[0.04] hover:bg-emerald-500/10 border border-white/10 hover:border-emerald-500/30 text-slate-300 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer text-[10px]"
                      :title="'Copy snippet'"
                    >
                      <Icon :name="copiedCode ? 'carbon:checkmark' : 'carbon:copy'" size="12" :class="copiedCode ? 'text-emerald-400' : 'text-slate-400'" />
                      <span>{{ copiedCode ? 'Copied!' : 'Copy Code' }}</span>
                    </button>
                  </div>

                  <!-- Code Content -->
                  <pre class="font-mono text-slate-300 whitespace-pre overflow-x-auto selection:bg-emerald-500/30"><code>{{ codeSnippets[activeTab] }}</code></pre>
                </div>

                <!-- Realistic IDE Status Bar -->
                <div class="px-3 py-2 rounded-xl bg-[#050c07] border border-white/5 flex items-center justify-between text-[11px] font-mono text-slate-400">
                  <div class="flex items-center gap-3">
                    <span class="flex items-center gap-1 text-slate-300">
                      <Icon name="carbon:branch" size="13" class="text-emerald-400" />
                      <span>main*</span>
                    </span>
                    <span class="flex items-center gap-1 text-emerald-400">
                      <Icon name="carbon:checkmark-outline" size="13" />
                      <span>0 Errors • p99: 4ms</span>
                    </span>
                  </div>

                  <div class="flex items-center gap-3 text-slate-500 text-[10px]">
                    <span class="hidden sm:inline">UTF-8</span>
                    <span>Spaces: 2</span>
                    <span class="text-emerald-400 font-medium">Synced</span>
                  </div>
                </div>

                <!-- Interactive Tech Badges Grid in Bento Header -->
                <div class="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 border-t border-white/5">
                  <div 
                    v-for="pill in quickPills" 
                    :key="pill.label"
                    class="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-white/[0.02] border border-white/[0.06] hover:border-emerald-500/30 hover:bg-emerald-500/5 text-xs font-medium text-slate-300 transition-colors"
                  >
                    <Icon :name="pill.icon" size="15" />
                    <span class="truncate text-[11px] font-mono">{{ pill.label }}</span>
                  </div>
                </div>

              </div>

            </div>
          </div>
        </div>

      </div>

      <!-- Scroll Indicator -->
      <div class="mt-12 md:mt-16 flex justify-center">
        <a 
          href="#about"
          class="flex flex-col items-center gap-2 text-slate-400 hover:text-emerald-400 transition-colors group cursor-pointer"
          aria-label="Scroll to About section"
        >
          <span class="text-[10px] font-mono tracking-[0.2em] uppercase font-medium">Scroll to explore</span>
          <div class="w-5 h-8 rounded-full border border-white/20 group-hover:border-emerald-400/50 flex justify-center p-1 transition-colors">
            <div class="w-1 h-2 bg-emerald-400 rounded-full animate-bounce"></div>
          </div>
        </a>
      </div>

    </div>
  </section>
</template>

<style scoped>
@keyframes hero-fade-up {
  from {
    opacity: 0;
    transform: translateY(14px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-hero-1 {
  animation: hero-fade-up 0.45s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

.animate-hero-2 {
  animation: hero-fade-up 0.45s cubic-bezier(0.16, 1, 0.3, 1) 0.08s forwards;
  opacity: 0;
}

.animate-hero-3 {
  animation: hero-fade-up 0.45s cubic-bezier(0.16, 1, 0.3, 1) 0.16s forwards;
  opacity: 0;
}

.animate-hero-4 {
  animation: hero-fade-up 0.45s cubic-bezier(0.16, 1, 0.3, 1) 0.24s forwards;
  opacity: 0;
}

.animate-hero-5 {
  animation: hero-fade-up 0.45s cubic-bezier(0.16, 1, 0.3, 1) 0.32s forwards;
  opacity: 0;
}

.animate-hero-card {
  animation: hero-fade-up 0.55s cubic-bezier(0.16, 1, 0.3, 1) 0.12s forwards;
  opacity: 0;
}
</style>
