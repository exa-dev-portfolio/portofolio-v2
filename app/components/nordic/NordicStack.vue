<script setup lang="ts">
import { computed } from 'vue'
import type { Skill } from '~/types/skill'

const props = defineProps<{
  skills: Skill[]
}>()

const categories = computed(() => {
  const all = props.skills

  const backend = all.filter(s => {
    const n = (s.name + ' ' + (s.category?.name || '')).toLowerCase()
    return n.includes('go') || n.includes('node') || n.includes('express') || n.includes('api') || n.includes('grpc') || n.includes('back')
  })

  const frontend = all.filter(s => {
    const n = (s.name + ' ' + (s.category?.name || '')).toLowerCase()
    return n.includes('vue') || n.includes('nuxt') || n.includes('typescript') || n.includes('react') || n.includes('css') || n.includes('flutter') || n.includes('front')
  })

  const database = all.filter(s => {
    const n = (s.name + ' ' + (s.category?.name || '')).toLowerCase()
    return n.includes('postgres') || n.includes('sql') || n.includes('redis') || n.includes('vector') || n.includes('data')
  })

  const devops = all.filter(s => {
    const n = (s.name + ' ' + (s.category?.name || '')).toLowerCase()
    return n.includes('docker') || n.includes('k8s') || n.includes('kubernetes') || n.includes('gcp') || n.includes('cloud') || n.includes('git') || n.includes('linux') || n.includes('devops')
  })

  return [
    {
      title: 'Backend & Systems',
      desc: 'High-concurrency microservices, REST & gRPC APIs',
      items: backend.length ? backend : props.skills.slice(0, 6)
    },
    {
      title: 'Frontend & Reactive UI',
      desc: 'Modern web apps, component architectures, and mobile',
      items: frontend.length ? frontend : props.skills.slice(6, 12)
    },
    {
      title: 'Databases & Storage',
      desc: 'Relational persistence, vector search, and caching',
      items: database.length ? database : props.skills.slice(12, 18)
    },
    {
      title: 'Cloud & Infrastructure',
      desc: 'Container orchestration, CI/CD pipelines, and Linux',
      items: devops.length ? devops : props.skills.slice(18, 24)
    }
  ]
})
</script>

<template>
  <section class="space-y-8">
    
    <!-- Section Header -->
    <div class="pb-2 border-b border-white/10">
      <span class="text-xs font-mono uppercase tracking-wider text-zinc-500 block">Technical Stack</span>
      <h2 class="text-2xl sm:text-3xl font-bold text-white tracking-tight mt-1">Skills & Tooling</h2>
      <p class="text-xs sm:text-sm text-zinc-400 mt-1 max-w-xl">
        Technologies and runtime environments I use daily to architect resilient production software.
      </p>
    </div>

    <!-- 4 Bento Cards Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
      <div
        v-for="cat in categories"
        :key="cat.title"
        class="p-5 sm:p-6 rounded-2xl bg-[#141417]/70 border border-white/10 space-y-4 hover:border-white/20 transition-colors"
      >
        <div>
          <h3 class="text-base sm:text-lg font-bold text-white tracking-tight">{{ cat.title }}</h3>
          <p class="text-xs text-zinc-400 mt-0.5">{{ cat.desc }}</p>
        </div>

        <div class="flex flex-wrap gap-2">
          <div
            v-for="item in cat.items"
            :key="item.id"
            class="px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/5 hover:border-white/15 text-zinc-300 hover:text-white text-xs flex items-center gap-2 transition-colors cursor-default"
          >
            <Icon v-if="item.icon" :name="item.icon" size="14" class="text-zinc-400" />
            <Icon v-else name="carbon:code" size="14" class="text-zinc-400" />
            <span class="font-medium">{{ item.name }}</span>
            <span v-if="item.level" class="text-[10px] text-zinc-500 font-mono pl-1 border-l border-white/10">{{ item.level }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Architectural Pipeline Workflow Banner -->
    <div class="p-5 rounded-2xl bg-[#141417]/50 border border-white/10">
      <div class="flex items-center justify-between pb-3 mb-3 border-b border-white/10">
        <div class="flex items-center gap-2">
          <Icon name="carbon:flow-stream" size="15" class="text-white" />
          <span class="text-xs font-mono uppercase tracking-wider text-zinc-400 font-semibold">End-to-End Delivery Pipeline</span>
        </div>
        <span class="text-[11px] font-mono text-zinc-500">Autonomous & Repeatable</span>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div class="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
          <span class="text-[10px] font-mono text-zinc-500">01 / ARCHITECTURE</span>
          <p class="text-xs font-semibold text-white">Domain Modeling</p>
          <p class="text-[11px] text-zinc-400">Clean architecture, typed Protobuf contracts, and database schema migrations.</p>
        </div>

        <div class="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
          <span class="text-[10px] font-mono text-zinc-500">02 / BACKEND & DATA</span>
          <p class="text-xs font-semibold text-white">Go Microservices</p>
          <p class="text-[11px] text-zinc-400">Stateless services, Redis caching, PostgreSQL persistence, and gRPC streaming.</p>
        </div>

        <div class="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
          <span class="text-[10px] font-mono text-zinc-500">03 / FRONTEND</span>
          <p class="text-xs font-semibold text-white">Fluid Vue 3 & Nuxt</p>
          <p class="text-[11px] text-zinc-400">SSR rendering, reactive state management, tactile micro-interactions, and 60fps animations.</p>
        </div>

        <div class="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
          <span class="text-[10px] font-mono text-zinc-500">04 / DEVOPS</span>
          <p class="text-xs font-semibold text-white">Kubernetes & CI/CD</p>
          <p class="text-[11px] text-zinc-400">Zero-downtime rolling deploys, Docker image hardening, and automated test pipelines.</p>
        </div>
      </div>
    </div>

  </section>
</template>
