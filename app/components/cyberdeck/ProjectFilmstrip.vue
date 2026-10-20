<script setup lang="ts">
import { computed, ref } from 'vue'

interface ProjectItem {
  id: string | number
  title: string
  shortDesc: string
  description: string
  image: string
  preview_images?: string[]
  technologies: string[]
  link?: string
  liveUrl?: string
  features?: string[]
  is_organization?: boolean
  github_org?: string | null
}

const props = defineProps<{
  projects: ProjectItem[]
}>()

const activeCategory = ref('All')
const selectedProject = ref<ProjectItem | null>(null)
const isModalOpen = ref(false)
const currentIndex = ref(0)
const reelContainer = ref<HTMLDivElement | null>(null)

const categories = ['All', 'Full-Stack', 'Cloud & API', 'Systems']

const filteredProjects = computed(() => {
  if (activeCategory.value === 'All') return props.projects
  return props.projects.filter(p => {
    const text = (p.technologies.join(' ') + ' ' + p.description).toLowerCase()
    if (activeCategory.value === 'Full-Stack') return text.includes('vue') || text.includes('nuxt') || text.includes('react')
    if (activeCategory.value === 'Cloud & API') return text.includes('go') || text.includes('node') || text.includes('api') || text.includes('docker')
    if (activeCategory.value === 'Systems') return text.includes('postgres') || text.includes('redis') || text.includes('k8s') || text.includes('kubernetes')
    return true
  })
})

const openBlueprint = (p: ProjectItem) => {
  selectedProject.value = p
  isModalOpen.value = true
}

const closeModal = () => {
  isModalOpen.value = false
  selectedProject.value = null
}

const scrollReel = (direction: 'prev' | 'next') => {
  if (!reelContainer.value) return
  const cardWidth = reelContainer.value.clientWidth * 0.85
  if (direction === 'prev') {
    reelContainer.value.scrollBy({ left: -cardWidth, behavior: 'smooth' })
    currentIndex.value = Math.max(0, currentIndex.value - 1)
  } else {
    reelContainer.value.scrollBy({ left: cardWidth, behavior: 'smooth' })
    currentIndex.value = Math.min(filteredProjects.value.length - 1, currentIndex.value + 1)
  }
}
</script>

<template>
  <section class="py-12 sm:py-16 px-4 sm:px-6 max-w-7xl mx-auto">
    
    <!-- Section Header & Controls -->
    <div class="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
      <div>
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-mono mb-2">
          <span>MODULE_02</span>
          <span class="text-white/30">•</span>
          <span>DEPLOYMENT_REGISTRY</span>
        </div>
        <h2 class="text-2xl sm:text-4xl font-extrabold text-white font-heading tracking-tight">
          Production Architecture Filmstrip
        </h2>
        <p class="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl">
          Curated showcase of full-stack platforms, high-concurrency cloud engines, and resilient distributed applications.
        </p>
      </div>

      <!-- Reel Controls & Category Switcher -->
      <div class="flex items-center gap-3 flex-wrap">
        <!-- Categories -->
        <div class="flex items-center p-1 rounded-xl bg-[#08120c] border border-white/10">
          <button
            v-for="cat in categories"
            :key="cat"
            @click="activeCategory = cat; currentIndex = 0"
            class="px-3 py-1 rounded-lg text-xs font-mono transition-colors cursor-pointer"
            :class="activeCategory === cat ? 'bg-emerald-600 text-white font-semibold' : 'text-slate-400 hover:text-white'"
          >
            {{ cat }}
          </button>
        </div>

        <!-- Reel Arrows -->
        <div class="flex items-center gap-1.5">
          <button
            @click="scrollReel('prev')"
            aria-label="Previous Project"
            class="p-2 rounded-xl bg-[#08120c] border border-white/10 hover:border-emerald-500/40 text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <Icon name="carbon:chevron-left" size="18" />
          </button>
          <button
            @click="scrollReel('next')"
            aria-label="Next Project"
            class="p-2 rounded-xl bg-[#08120c] border border-white/10 hover:border-emerald-500/40 text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <Icon name="carbon:chevron-right" size="18" />
          </button>
        </div>
      </div>
    </div>

    <!-- Horizontal Project Filmstrip Container -->
    <div
      ref="reelContainer"
      class="flex gap-6 overflow-x-auto pb-6 scrollbar-thin scrollbar-thumb-emerald-500/30 scroll-smooth snap-x snap-mandatory"
      style="scrollbar-width: thin;"
    >
      <div
        v-for="(project, idx) in filteredProjects"
        :key="project.id"
        class="w-[88vw] sm:w-[580px] lg:w-[680px] shrink-0 snap-center rounded-3xl bg-[#08120c]/90 border border-emerald-500/25 shadow-2xl p-5 sm:p-6 flex flex-col justify-between relative overflow-hidden group hover:border-emerald-400/50 transition-all duration-300"
      >
        <!-- Top Reel Code & Status -->
        <div class="flex items-center justify-between border-b border-white/10 pb-3 mb-4 text-[11px] font-mono">
          <div class="flex items-center gap-2">
            <span class="text-emerald-400 font-bold">REEL #0{{ idx + 1 }}</span>
            <span class="text-white/20">|</span>
            <span class="text-slate-400">ID: PRJ-{{ project.id }}</span>
          </div>
          <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 text-[10px] border border-emerald-500/30 font-semibold">
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            LIVE PRODUCTION
          </span>
        </div>

        <!-- Project Body (Dual column: Preview + Meta) -->
        <div class="grid grid-cols-1 md:grid-cols-12 gap-5 mb-5 items-center">
          
          <!-- Screenshot Preview (7 cols) -->
          <div class="md:col-span-7 relative rounded-2xl overflow-hidden border border-white/10 aspect-video bg-black/60 group/img">
            <img
              :src="project.image"
              :alt="project.title"
              class="w-full h-full object-cover transition-transform duration-500 group-hover/img:scale-105"
              loading="lazy"
            />
            <div class="absolute inset-0 bg-gradient-to-t from-[#08120c] via-transparent to-transparent opacity-60"></div>
            
            <!-- Quick View Badge -->
            <button
              @click="openBlueprint(project)"
              class="absolute inset-0 m-auto w-12 h-12 rounded-full bg-emerald-600/90 text-white flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity shadow-lg shadow-emerald-500/40 cursor-pointer"
              title="Inspect Blueprint"
            >
              <Icon name="carbon:zoom-in" size="20" />
            </button>
          </div>

          <!-- Project Description & Highlights (5 cols) -->
          <div class="md:col-span-5 flex flex-col justify-between">
            <div>
              <h3 class="text-lg sm:text-xl font-heading font-bold text-white group-hover:text-emerald-300 transition-colors">
                {{ project.title }}
              </h3>
              <p class="text-xs text-slate-300 mt-2 line-clamp-3 leading-relaxed">
                {{ project.shortDesc || project.description }}
              </p>
            </div>

            <!-- Technology Chips -->
            <div class="mt-4 flex flex-wrap gap-1.5">
              <span
                v-for="tech in project.technologies.slice(0, 4)"
                :key="tech"
                class="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[10px] font-mono text-emerald-300"
              >
                {{ tech }}
              </span>
              <span v-if="project.technologies.length > 4" class="px-1.5 py-0.5 text-[10px] font-mono text-slate-400">
                +{{ project.technologies.length - 4 }}
              </span>
            </div>
          </div>

        </div>

        <!-- Project Card Bottom Actions -->
        <div class="pt-3 border-t border-white/10 flex items-center justify-between text-xs font-mono">
          <button
            @click="openBlueprint(project)"
            class="text-emerald-400 hover:text-emerald-300 flex items-center gap-1.5 font-semibold transition-colors cursor-pointer"
          >
            <Icon name="carbon:data-view-alt" size="16" />
            <span>Inspect Blueprint</span>
          </button>

          <div class="flex items-center gap-2">
            <a
              v-if="project.link"
              :href="project.link"
              target="_blank"
              rel="noopener noreferrer"
              class="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
              title="View Source Code"
            >
              <Icon name="line-md:github" size="16" />
            </a>
            <a
              v-if="project.liveUrl"
              :href="project.liveUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center gap-1 shadow-md shadow-emerald-500/20 transition-colors"
            >
              <span>Demo</span>
              <Icon name="carbon:launch" size="12" />
            </a>
          </div>
        </div>

      </div>
    </div>

    <!-- Interactive Blueprint Deep-Dive Modal -->
    <Transition
      enter-active-class="transition duration-250 ease-out"
      enter-from-class="opacity-0 scale-95"
      enter-to-class="opacity-100 scale-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-95"
    >
      <div
        v-if="isModalOpen && selectedProject"
        class="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6"
        @click.self="closeModal"
      >
        <div class="max-w-2xl w-full bg-[#08120c] border border-emerald-500/30 rounded-3xl shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
          
          <div class="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
            <div class="flex items-center gap-2">
              <span class="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
              <span class="text-xs font-mono text-emerald-400 font-bold uppercase">Architecture Blueprint</span>
            </div>
            <button
              @click="closeModal"
              class="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <Icon name="carbon:close" size="20" />
            </button>
          </div>

          <h3 class="text-2xl font-bold font-heading text-white">{{ selectedProject.title }}</h3>
          <p class="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">{{ selectedProject.description }}</p>

          <div class="my-5 rounded-2xl overflow-hidden border border-white/10">
            <img :src="selectedProject.image" :alt="selectedProject.title" class="w-full object-cover max-h-64" />
          </div>

          <!-- Tech Specs -->
          <div class="space-y-3 font-mono text-xs">
            <h4 class="text-emerald-400 uppercase font-bold text-[11px]">Runtime & Technologies:</h4>
            <div class="flex flex-wrap gap-2">
              <span
                v-for="tech in selectedProject.technologies"
                :key="tech"
                class="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 text-xs"
              >
                {{ tech }}
              </span>
            </div>

            <!-- Features Checklist -->
            <div v-if="selectedProject.features?.length" class="mt-4">
              <h4 class="text-emerald-400 uppercase font-bold text-[11px] mb-2">Key Engineering Features:</h4>
              <ul class="space-y-1.5 text-slate-300">
                <li v-for="(feat, idx) in selectedProject.features" :key="idx" class="flex items-start gap-2">
                  <Icon name="carbon:checkmark-outline" size="14" class="text-emerald-400 shrink-0 mt-0.5" />
                  <span>{{ feat }}</span>
                </li>
              </ul>
            </div>
          </div>

          <!-- Modal Actions -->
          <div class="mt-6 pt-4 border-t border-white/10 flex items-center justify-end gap-3 font-mono text-xs">
            <button
              @click="closeModal"
              class="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white"
            >
              Close
            </button>
            <a
              v-if="selectedProject.liveUrl"
              :href="selectedProject.liveUrl"
              target="_blank"
              class="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center gap-1.5"
            >
              <span>Visit Live Platform</span>
              <Icon name="carbon:launch" size="13" />
            </a>
          </div>

        </div>
      </div>
    </Transition>

  </section>
</template>
