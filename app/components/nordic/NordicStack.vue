<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Skill } from '~/types/skill'

const props = defineProps<{
  skills: Skill[]
}>()

const searchQuery = ref('')
const activeFilter = ref<string>('All')

// Descriptions for the 4 core categories
const categoryMeta: Record<string, { desc: string; icon: string }> = {
  'Backend & APIs': {
    desc: 'High-throughput microservices, REST & gRPC APIs, and robust application logic',
    icon: 'carbon:data-base',
  },
  'Frontend & Mobile': {
    desc: 'Modern reactive web apps, responsive UI architecture, and mobile engineering',
    icon: 'carbon:application-web',
  },
  'Databases & Queues': {
    desc: 'Relational persistence, distributed in-memory caching, and asynchronous message brokers',
    icon: 'carbon:bare-metal-server',
  },
  'Cloud & DevOps': {
    desc: 'Container orchestration, API gateways, CI/CD pipelines, and cloud infrastructure',
    icon: 'carbon:cloud-app',
  },
}

// Dynamically group 100% of skills from API by category_name
const categories = computed(() => {
  const map = new Map<string, { id: number; title: string; color: string; desc: string; icon: string; items: Skill[] }>()

  props.skills.forEach(skill => {
    const catName = skill.category_name || 'Other Tools'
    if (!map.has(catName)) {
      const meta = categoryMeta[catName] || { desc: 'Specialized technologies and tooling', icon: 'carbon:code' }
      map.set(catName, {
        id: skill.category_id || 99,
        title: catName,
        color: skill.category_color || '#3b82f6',
        desc: meta.desc,
        icon: meta.icon,
        items: [],
      })
    }
    map.get(catName)!.items.push(skill)
  })

  // Sort by category_id (1: Frontend, 2: Backend, 3: Cloud, 4: Databases)
  const list = Array.from(map.values()).sort((a, b) => a.id - b.id)

  // Apply search query filter if user is searching
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase().trim()
    return list.map(cat => ({
      ...cat,
      items: cat.items.filter(item => item.name.toLowerCase().includes(q)),
    })).filter(cat => cat.items.length > 0)
  }

  // Apply active category filter tab if not 'All'
  if (activeFilter.value !== 'All') {
    return list.filter(cat => cat.title === activeFilter.value)
  }

  return list
})

// Unique category list for filter tabs with accurate counts
const categoryTabs = computed(() => {
  const counts: Record<string, number> = {}
  props.skills.forEach(s => {
    const cat = s.category_name || 'Other'
    counts[cat] = (counts[cat] || 0) + 1
  })

  const tabs = [
    { title: 'All', count: props.skills.length },
    ...Object.keys(counts).map(cat => ({
      title: cat,
      count: counts[cat],
    })),
  ]

  return tabs
})

const totalSkillsCount = computed(() => props.skills.length)
</script>

<template>
  <section class="space-y-8">
    
    <!-- Section Header & Filter Controls -->
    <div class="space-y-4 pb-2 border-b border-white/10">
      <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div class="flex items-center gap-2">
            <span class="text-xs font-mono uppercase tracking-wider text-zinc-500 font-semibold block">Technical Stack</span>
            <span class="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-mono text-zinc-300">
              {{ totalSkillsCount }} Verified Technologies
            </span>
          </div>
          <h2 class="text-2xl sm:text-3xl font-bold text-white tracking-tight mt-1">Skills & Tooling Arsenal</h2>
        </div>

        <!-- Search Input -->
        <div class="relative w-full sm:w-64">
          <Icon name="carbon:search" size="14" class="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search technology..."
            class="w-full pl-9 pr-8 py-1.5 rounded-xl bg-white/[0.04] border border-white/10 focus:border-white/30 focus:outline-none text-xs text-white placeholder-zinc-500 font-sans transition-colors"
          />
          <button
            v-if="searchQuery"
            @click="searchQuery = ''"
            class="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white text-xs cursor-pointer"
          >
            ✕
          </button>
        </div>
      </div>

      <!-- Category Filter Pills -->
      <div class="flex items-center gap-1.5 flex-wrap pt-1">
        <button
          v-for="tab in categoryTabs"
          :key="tab.title"
          @click="activeFilter = tab.title"
          class="px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5"
          :class="activeFilter === tab.title ? 'bg-white text-black font-semibold shadow-sm' : 'bg-white/[0.03] text-zinc-400 hover:text-white hover:bg-white/[0.07] border border-white/5'"
        >
          <span>{{ tab.title }}</span>
          <span
            class="text-[10px] px-1.5 py-0.2 rounded-full"
            :class="activeFilter === tab.title ? 'bg-black/15 text-black font-bold' : 'bg-white/10 text-zinc-400'"
          >
            {{ tab.count }}
          </span>
        </button>
      </div>
    </div>

    <!-- Grouped Categories Grid - 100% Skills Rendered -->
    <div class="space-y-6">
      <div
        v-for="cat in categories"
        :key="cat.title"
        class="p-5 sm:p-6 rounded-2xl bg-[#141417]/70 border border-white/10 space-y-4 hover:border-white/20 transition-all duration-300 group"
      >
        <!-- Category Card Header -->
        <div class="flex items-start justify-between gap-3 pb-3 border-b border-white/5">
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white shrink-0">
              <Icon :name="cat.icon" size="16" />
            </div>
            <div>
              <div class="flex items-center gap-2">
                <h3 class="text-base sm:text-lg font-bold text-white tracking-tight">{{ cat.title }}</h3>
                <span class="text-[11px] font-mono text-zinc-400">({{ cat.items.length }} skills)</span>
              </div>
              <p class="text-xs text-zinc-400 mt-0.5">{{ cat.desc }}</p>
            </div>
          </div>
        </div>

        <!-- Skills Pills Matrix -->
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5">
          <div
            v-for="item in cat.items"
            :key="item.id"
            class="px-3 py-2 rounded-xl bg-white/[0.03] border border-white/5 hover:border-white/20 hover:bg-white/[0.07] text-zinc-300 hover:text-white text-xs flex items-center gap-2.5 transition-all duration-200 cursor-default group/skill"
          >
            <div
              class="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 transition-transform group-hover/skill:scale-110"
              :style="{ color: item.color || '#ffffff' }"
            >
              <Icon v-if="item.icon" :name="item.icon" size="16" />
              <Icon v-else name="carbon:code" size="16" />
            </div>
            <div class="min-w-0 flex-1">
              <p class="font-medium text-white truncate text-xs">{{ item.name }}</p>
            </div>
            <span
              class="w-1.5 h-1.5 rounded-full shrink-0 opacity-40 group-hover/skill:opacity-100 transition-opacity"
              :style="{ backgroundColor: item.color || '#ffffff' }"
            ></span>
          </div>
        </div>
      </div>

      <!-- Empty Search Fallback -->
      <div v-if="categories.length === 0" class="p-12 text-center rounded-2xl bg-[#141417]/50 border border-white/10 space-y-2">
        <Icon name="carbon:search" size="24" class="text-zinc-500 mx-auto" />
        <p class="text-sm font-semibold text-white">No technologies found matching "{{ searchQuery }}"</p>
        <p class="text-xs text-zinc-400">Try clearing the search query or selecting a different category.</p>
        <button
          @click="searchQuery = ''; activeFilter = 'All'"
          class="mt-2 px-3 py-1 rounded-full bg-white text-black font-semibold text-xs cursor-pointer"
        >
          Reset Filter
        </button>
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
