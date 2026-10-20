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
}

const props = defineProps<{
  projects: ProjectItem[]
}>()

const activeCategory = ref('All')
const selectedProject = ref<ProjectItem | null>(null)

const categories = ['All', 'Full-Stack', 'Backend & Cloud', 'Mobile']

const filteredProjects = computed(() => {
  if (activeCategory.value === 'All') return props.projects
  return props.projects.filter(p => {
    const text = (p.technologies.join(' ') + ' ' + p.description).toLowerCase()
    if (activeCategory.value === 'Full-Stack') return text.includes('vue') || text.includes('nuxt') || text.includes('react')
    if (activeCategory.value === 'Backend & Cloud') return text.includes('go') || text.includes('node') || text.includes('docker') || text.includes('postgres') || text.includes('api')
    if (activeCategory.value === 'Mobile') return text.includes('flutter') || text.includes('mobile') || text.includes('android') || text.includes('ios')
    return true
  })
})

const openModal = (p: ProjectItem) => {
  selectedProject.value = p
}

const closeModal = () => {
  selectedProject.value = null
}
</script>

<template>
  <section class="space-y-8">
    
    <!-- Section Header & Category Filters -->
    <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-2 border-b border-white/10">
      <div>
        <span class="text-xs font-mono uppercase tracking-wider text-zinc-500 block">Selected Work</span>
        <h2 class="text-2xl sm:text-3xl font-bold text-white tracking-tight mt-1">Featured Projects</h2>
      </div>

      <!-- Category Filter Pills -->
      <div class="flex items-center gap-1.5 flex-wrap">
        <button
          v-for="cat in categories"
          :key="cat"
          @click="activeCategory = cat"
          class="px-3 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer"
          :class="activeCategory === cat ? 'bg-white text-black font-semibold' : 'text-zinc-400 hover:text-white hover:bg-white/5'"
        >
          {{ cat }}
        </button>
      </div>
    </div>

    <!-- 2-Column Responsive Minimalist Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div
        v-for="project in filteredProjects"
        :key="project.id"
        class="rounded-2xl bg-[#141417]/70 border border-white/10 p-4 sm:p-5 flex flex-col justify-between group hover:border-white/25 transition-all duration-300"
      >
        <div>
          <!-- Screenshot Preview -->
          <div
            @click="openModal(project)"
            class="relative rounded-xl overflow-hidden aspect-video bg-black/60 border border-white/10 mb-4 cursor-pointer"
          >
            <img
              :src="project.image"
              :alt="project.title"
              class="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500"
              loading="lazy"
            />
            <div class="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors"></div>
          </div>

          <!-- Project Meta -->
          <div class="space-y-2">
            <div class="flex items-center justify-between gap-2">
              <h3
                @click="openModal(project)"
                class="text-lg font-bold text-white group-hover:text-zinc-200 transition-colors cursor-pointer"
              >
                {{ project.title }}
              </h3>
              <button
                @click="openModal(project)"
                class="text-zinc-500 hover:text-white text-xs font-mono flex items-center gap-1 cursor-pointer"
              >
                <span>Details</span>
                <Icon name="carbon:arrow-up-right" size="12" />
              </button>
            </div>

            <p class="text-xs sm:text-sm text-zinc-400 leading-relaxed line-clamp-2">
              {{ project.shortDesc || project.description }}
            </p>
          </div>
        </div>

        <!-- Tech Stack Tags & External Links -->
        <div class="pt-4 mt-4 border-t border-white/10 flex items-center justify-between gap-2 flex-wrap">
          <div class="flex flex-wrap gap-1.5">
            <span
              v-for="tech in project.technologies.slice(0, 3)"
              :key="tech"
              class="px-2 py-0.5 rounded-md bg-white/5 text-[10px] font-mono text-zinc-300 border border-white/5"
            >
              {{ tech }}
            </span>
            <span v-if="project.technologies.length > 3" class="text-[10px] font-mono text-zinc-500 py-0.5">
              +{{ project.technologies.length - 3 }}
            </span>
          </div>

          <div class="flex items-center gap-2">
            <a
              v-if="project.link"
              :href="project.link"
              target="_blank"
              rel="noopener noreferrer"
              class="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
              title="GitHub Repository"
            >
              <Icon name="line-md:github" size="16" />
            </a>
            <a
              v-if="project.liveUrl"
              :href="project.liveUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
              title="Live Demo"
            >
              <Icon name="carbon:launch" size="16" />
            </a>
          </div>
        </div>

      </div>
    </div>

    <!-- Case Study Details Modal -->
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0 scale-98"
      enter-to-class="opacity-100 scale-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-98"
    >
      <div
        v-if="selectedProject"
        class="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6"
        @click.self="closeModal"
      >
        <div class="max-w-2xl w-full bg-[#141417] border border-white/10 rounded-2xl shadow-2xl p-6 max-h-[90vh] overflow-y-auto space-y-5">
          
          <div class="flex items-center justify-between pb-3 border-b border-white/10">
            <h3 class="text-xl font-bold text-white">{{ selectedProject.title }}</h3>
            <button
              @click="closeModal"
              class="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <Icon name="carbon:close" size="18" />
            </button>
          </div>

          <div class="rounded-xl overflow-hidden border border-white/10">
            <img :src="selectedProject.image" :alt="selectedProject.title" class="w-full object-cover max-h-72" />
          </div>

          <p class="text-sm text-zinc-300 leading-relaxed font-sans">{{ selectedProject.description }}</p>

          <div class="space-y-2">
            <h4 class="text-xs font-mono uppercase text-zinc-400 font-semibold">Technologies:</h4>
            <div class="flex flex-wrap gap-1.5">
              <span
                v-for="tech in selectedProject.technologies"
                :key="tech"
                class="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-zinc-300 text-xs font-mono"
              >
                {{ tech }}
              </span>
            </div>
          </div>

          <div v-if="selectedProject.features?.length" class="space-y-2 pt-2">
            <h4 class="text-xs font-mono uppercase text-zinc-400 font-semibold">Key Highlights:</h4>
            <ul class="space-y-1 text-xs text-zinc-300 list-disc list-inside">
              <li v-for="(feat, idx) in selectedProject.features" :key="idx">{{ feat }}</li>
            </ul>
          </div>

          <div class="pt-4 border-t border-white/10 flex items-center justify-end gap-3 text-xs">
            <button
              @click="closeModal"
              class="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white cursor-pointer"
            >
              Close
            </button>
            <a
              v-if="selectedProject.liveUrl"
              :href="selectedProject.liveUrl"
              target="_blank"
              class="px-4 py-2 rounded-xl bg-white text-black font-semibold hover:bg-zinc-200 transition-colors"
            >
              Visit Live Platform ↗
            </a>
          </div>

        </div>
      </div>
    </Transition>

  </section>
</template>
