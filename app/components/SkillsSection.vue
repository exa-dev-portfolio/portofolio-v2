<script setup lang="ts">
import type { Skill } from '~/types/skill'
import { computed, ref } from 'vue'

const props = defineProps<{
  skills: Skill[]
}>()

const { onMouseMove } = useSpotlight()

const searchQuery = ref('')
const selectedCategory = ref('All')

// Automatic intelligent categorization fallback
const getCategoryForSkill = (name: string): string => {
  const n = name.toLowerCase()
  if (n.includes('nuxt') || n.includes('next') || n.includes('react') || n.includes('vue') || n.includes('flutter') || n.includes('dart') || n.includes('javascript') || n.includes('typescript') || n.includes('tailwind') || n.includes('html') || n.includes('css')) {
    return 'Frontend & Mobile'
  }
  if (n.includes('kuber') || n.includes('docker') || n.includes('kong') || n.includes('pub/sub') || n.includes('aws') || n.includes('gcp') || n.includes('cloud') || n.includes('ci/cd') || n.includes('linux')) {
    return 'Cloud & DevOps'
  }
  if (n.includes('sql') || n.includes('mongo') || n.includes('redis') || n.includes('bigquery') || n.includes('bigtable') || n.includes('rabbit') || n.includes('kafka') || n.includes('database')) {
    return 'Databases & Queues'
  }
  return 'Backend & APIs'
}

// Prioritize official database-backed category_name, fallback to intelligent heuristics
const resolveSkillCategory = (skill: Skill): string => {
  if (skill.category_name && skill.category_name.trim()) {
    return skill.category_name.trim()
  }
  return getCategoryForSkill(skill.name)
}

const categories = computed(() => {
  const cats = new Set<string>()
  props.skills.forEach(s => {
    const cat = resolveSkillCategory(s)
    if (cat) cats.add(cat)
  })
  return ['All', ...Array.from(cats).sort()]
})

const filteredSkills = computed(() => {
  return props.skills.filter(s => {
    const matchesSearch = !searchQuery.value.trim() || s.name.toLowerCase().includes(searchQuery.value.toLowerCase())
    if (!matchesSearch) return false

    if (selectedCategory.value === 'All') return true
    const cat = resolveSkillCategory(s)
    return cat === selectedCategory.value
  })
})

const getCategoryCount = (cat: string) => {
  if (cat === 'All') return props.skills.length
  return props.skills.filter(s => resolveSkillCategory(s) === cat).length
}
</script>

<template>
  <section id="stack" class="py-20 sm:py-24 relative overflow-hidden" aria-labelledby="skills-heading">
    <div class="container mx-auto px-4 sm:px-6">
      
      <!-- Section Header -->
      <Motion
        :initial="{ opacity: 0, y: 20 }"
        :while-in-view="{ opacity: 1, y: 0 }"
        :viewport="{ once: true, amount: 0.15 }"
        :transition="{ duration: 0.45, ease: 'easeOut' }"
        class="text-center max-w-3xl mx-auto mb-10 sm:mb-12"
      >
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-mono mb-4">
          <Icon name="carbon:code" size="14" />
          <span>TECH ECOSYSTEM</span>
        </div>
        <h2 id="skills-heading" class="text-3xl sm:text-4xl lg:text-5xl font-heading font-black text-white tracking-tight mb-4">
          Skills & <span class="text-gradient-cyan">Technologies</span>
        </h2>
        <p class="text-slate-300 text-base sm:text-lg font-normal leading-relaxed">
          The comprehensive stack of languages, frameworks, cloud tooling, and databases I leverage to engineer high-impact solutions.
        </p>
      </Motion>

      <!-- Category Filter Pills Bar -->
      <div class="flex flex-wrap items-center justify-center gap-2 mb-8 max-w-4xl mx-auto">
        <button
          v-for="cat in categories"
          :key="cat"
          @click="selectedCategory = cat"
          class="px-3.5 py-1.5 rounded-full text-xs font-medium tracking-wide transition-all duration-200 flex items-center gap-1.5 cursor-pointer"
          :class="selectedCategory === cat
            ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm shadow-cyan-500/10'
            : 'bg-white/[0.03] text-slate-400 hover:text-white hover:bg-white/[0.06] border border-white/[0.06]'"
        >
          <span>{{ cat }}</span>
          <span
            class="text-[10px] px-1.5 py-0.2 rounded-full font-mono"
            :class="selectedCategory === cat ? 'bg-cyan-500/30 text-cyan-200' : 'bg-white/10 text-slate-500'"
          >
            {{ getCategoryCount(cat) }}
          </span>
        </button>
      </div>

      <!-- Search Filter bar -->
      <div v-if="skills.length > 8" class="max-w-md mx-auto mb-10">
        <div class="relative">
          <Icon name="carbon:search" size="18" class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search technologies (e.g. Vue, Go, Docker)..."
            class="w-full pl-11 pr-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/50 focus:bg-white/[0.07] transition-all"
          />
          <button
            v-if="searchQuery"
            @click="searchQuery = ''"
            class="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono text-slate-400 hover:text-white px-2 py-1 rounded"
          >
            Clear
          </button>
        </div>
      </div>

      <!-- Skills Grid with Linear Spotlight Effect -->
      <Motion
        :initial="{ opacity: 0, y: 20 }"
        :while-in-view="{ opacity: 1, y: 0 }"
        :viewport="{ once: true, amount: 0.1 }"
        :transition="{ duration: 0.5, ease: 'easeOut' }"
        class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5 sm:gap-4"
      >
        <div
          v-for="skill in filteredSkills"
          :key="skill.id"
          @mousemove="onMouseMove"
          class="spotlight-card group rounded-2xl p-4 sm:p-5 flex flex-col items-center justify-center gap-3 cursor-pointer"
          :style="{
            '--skill-color': skill.color || '#3b82f6',
          }"
        >
          <!-- Subtle top color accent on hover -->
          <div 
            class="absolute top-0 left-0 right-0 h-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            :style="{ backgroundColor: skill.color || '#38bdf8' }"
          ></div>

          <!-- Skill Icon Container with Halo -->
          <div
            class="w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform duration-200 shadow-sm"
            :style="{
              backgroundColor: `${skill.color || '#38bdf8'}14`,
              border: `1px solid ${skill.color || '#38bdf8'}25`
            }"
          >
            <Icon
              :name="skill.icon || 'carbon:code'"
              size="28"
              class="sm:size-8"
              :style="{ color: skill.color || '#38bdf8' }"
            />
          </div>

          <!-- Skill Name -->
          <span class="text-xs sm:text-sm font-medium text-slate-200 group-hover:text-white transition-colors text-center truncate max-w-full">
            {{ skill.name }}
          </span>

          <!-- Subtle category pill badge on hover -->
          <span class="text-[9px] font-mono text-slate-500 group-hover:text-cyan-400 transition-colors">
            {{ resolveSkillCategory(skill) }}
          </span>
        </div>
      </Motion>

      <!-- Empty State if no search matches -->
      <div v-if="filteredSkills.length === 0" class="text-center py-12 text-slate-500">
        <Icon name="carbon:search-locate" size="32" class="mx-auto mb-2 text-slate-600" />
        <p class="text-sm">No technologies found in {{ selectedCategory }} matching "{{ searchQuery }}"</p>
      </div>

    </div>
  </section>
</template>
