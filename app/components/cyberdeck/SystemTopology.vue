<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Skill } from '~/types/skill'

const props = defineProps<{
  skills: Skill[]
}>()

const searchQuery = ref('')
const selectedSkill = ref<Skill | null>(null)

// Group skills by architecture tier
const architectureTiers = computed(() => {
  const all = props.skills

  const client = all.filter(s => {
    const n = (s.name + ' ' + (s.category?.name || '')).toLowerCase()
    return n.includes('vue') || n.includes('nuxt') || n.includes('typescript') || n.includes('react') || n.includes('css') || n.includes('flutter') || n.includes('front')
  })

  const backend = all.filter(s => {
    const n = (s.name + ' ' + (s.category?.name || '')).toLowerCase()
    return n.includes('go') || n.includes('node') || n.includes('express') || n.includes('api') || n.includes('grpc') || n.includes('back')
  })

  const storage = all.filter(s => {
    const n = (s.name + ' ' + (s.category?.name || '')).toLowerCase()
    return n.includes('postgres') || n.includes('sql') || n.includes('redis') || n.includes('vector') || n.includes('data')
  })

  const devops = all.filter(s => {
    const n = (s.name + ' ' + (s.category?.name || '')).toLowerCase()
    return n.includes('docker') || n.includes('k8s') || n.includes('kubernetes') || n.includes('gcp') || n.includes('cloud') || n.includes('git') || n.includes('linux') || n.includes('devops')
  })

  return [
    {
      id: 'tier-client',
      title: 'Tier 01: Client & Reactive Edge',
      badge: 'FRONTEND & WEBGL',
      color: 'from-emerald-500/20 to-teal-500/10',
      borderColor: 'border-emerald-500/30',
      items: client.length ? client : props.skills.slice(0, 6)
    },
    {
      id: 'tier-backend',
      title: 'Tier 02: High-Concurrency Core',
      badge: 'MICROSERVICES & RUNTIME',
      color: 'from-teal-500/20 to-emerald-500/10',
      borderColor: 'border-teal-500/30',
      items: backend.length ? backend : props.skills.slice(6, 12)
    },
    {
      id: 'tier-storage',
      title: 'Tier 03: Data & Vector Storage',
      badge: 'PERSISTENCE & CACHE',
      color: 'from-emerald-500/20 to-cyan-500/10',
      borderColor: 'border-emerald-500/30',
      items: storage.length ? storage : props.skills.slice(12, 18)
    },
    {
      id: 'tier-devops',
      title: 'Tier 04: Cloud & Orchestration',
      badge: 'INFRA & CI/CD',
      color: 'from-teal-500/20 to-emerald-500/10',
      borderColor: 'border-teal-500/30',
      items: devops.length ? devops : props.skills.slice(18, 24)
    }
  ]
})

const selectNode = (skill: Skill) => {
  selectedSkill.value = skill
}
</script>

<template>
  <section class="py-12 sm:py-16 px-4 sm:px-6 max-w-7xl mx-auto">
    
    <!-- Section Header -->
    <div class="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
      <div>
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-mono mb-2">
          <span>MODULE_03</span>
          <span class="text-white/30">•</span>
          <span>SYSTEM_TOPOLOGY_MATRIX</span>
        </div>
        <h2 class="text-2xl sm:text-4xl font-extrabold text-white font-heading tracking-tight">
          Engineering Stack & System Topology
        </h2>
        <p class="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl">
          Multi-tier architecture topology showing interconnected runtimes, persistence layers, and cloud infrastructure.
        </p>
      </div>

      <!-- Live Search Filter -->
      <div class="relative w-full sm:w-72">
        <Icon name="carbon:search" size="16" class="absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-400" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Lookup technology node..."
          class="w-full pl-9 pr-4 py-2 rounded-xl bg-[#08120c] border border-white/10 text-xs font-mono text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/50"
        />
      </div>
    </div>

    <!-- 4-Tier Topology Architecture Matrix -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
      <div
        v-for="tier in architectureTiers"
        :key="tier.id"
        class="rounded-3xl bg-[#08120c]/90 border p-5 sm:p-6 shadow-xl backdrop-blur-xl relative overflow-hidden"
        :class="tier.borderColor"
      >
        <!-- Tier Header -->
        <div class="flex items-center justify-between pb-3 mb-4 border-b border-white/10">
          <div>
            <h3 class="text-sm sm:text-base font-bold font-heading text-white flex items-center gap-2">
              <span class="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399]"></span>
              {{ tier.title }}
            </h3>
          </div>
          <span class="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-mono text-emerald-300">
            {{ tier.badge }}
          </span>
        </div>

        <!-- Node Grid -->
        <div class="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          <button
            v-for="skill in tier.items"
            :key="skill.id"
            @click="selectNode(skill)"
            class="p-2.5 sm:p-3 rounded-2xl bg-white/[0.03] hover:bg-emerald-500/15 border border-white/5 hover:border-emerald-400/40 text-left transition-all duration-200 cursor-pointer group flex items-center gap-2.5"
            :class="selectedSkill?.id === skill.id ? 'border-emerald-400 bg-emerald-500/20' : ''"
          >
            <!-- Skill Icon or Fallback -->
            <div class="w-7 h-7 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <Icon v-if="skill.icon" :name="skill.icon" size="16" class="text-emerald-300" />
              <Icon v-else name="carbon:code" size="16" class="text-emerald-300" />
            </div>

            <div class="min-w-0">
              <p class="text-xs font-semibold text-slate-200 group-hover:text-white truncate">
                {{ skill.name }}
              </p>
              <span class="text-[10px] font-mono text-emerald-400/80 block">
                {{ skill.level || 'Mastery' }}
              </span>
            </div>
          </button>
        </div>

      </div>
    </div>

    <!-- Interactive Node Inspector Drawer / Banner -->
    <div
      v-if="selectedSkill"
      class="mt-6 p-5 rounded-2xl bg-[#060e09] border border-emerald-500/40 shadow-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-mono text-xs"
    >
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300 text-lg">
          <Icon v-if="selectedSkill.icon" :name="selectedSkill.icon" size="22" />
          <Icon v-else name="carbon:chip" size="22" />
        </div>
        <div>
          <h4 class="text-sm font-bold text-white">{{ selectedSkill.name }}</h4>
          <p class="text-[11px] text-slate-400 mt-0.5">Tier: {{ selectedSkill.category?.name || 'Core Production Architecture' }}</p>
        </div>
      </div>

      <div class="flex items-center gap-3">
        <span class="px-3 py-1 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-bold">
          Proficiency: {{ selectedSkill.level || 'Production Ready' }}
        </span>
        <button
          @click="selectedSkill = null"
          class="p-1 rounded-lg text-slate-500 hover:text-white"
        >
          <Icon name="carbon:close" size="16" />
        </button>
      </div>
    </div>

  </section>
</template>
