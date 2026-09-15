<script setup lang="ts">
import { computed, ref } from 'vue'
import type { SubApp } from '~/types/project'

interface PreviewImage {
  url: string;
  title?: string;
  caption?: string;
}

interface Project {
  id?: number;
  title: string;
  shortDesc: string;
  description: string;
  image: string;
  preview_images?: PreviewImage[];
  technologies: string[];
  link?: string;
  liveUrl?: string;
  details: string;
  features: string[];
  is_organization?: boolean;
  github_org?: string | null;
  sub_apps?: SubApp[];
}

const getAppTypeBadge = (type?: string) => {
  switch (type) {
    case 'mobile':
      return { label: 'Mobile App', icon: 'carbon:mobile', bgClass: 'bg-emerald-500/15 border border-emerald-500/30', textClass: 'text-emerald-400' }
    case 'web':
      return { label: 'Web App', icon: 'carbon:application-web', bgClass: 'bg-blue-500/15 border border-blue-500/30', textClass: 'text-blue-400' }
    case 'backend':
      return { label: 'Backend / API', icon: 'carbon:server-proxy', bgClass: 'bg-indigo-500/15 border border-indigo-500/30', textClass: 'text-indigo-400' }
    case 'pos':
      return { label: 'POS / Kiosk', icon: 'carbon:store', bgClass: 'bg-amber-500/15 border border-amber-500/30', textClass: 'text-amber-400' }
    default:
      return { label: 'Service / Tool', icon: 'carbon:cube', bgClass: 'bg-purple-500/15 border border-purple-500/30', textClass: 'text-purple-400' }
  }
}

const props = defineProps<{
  projects: Project[]
}>()

const { onMouseMove } = useSpotlight()

const selectedProject = ref<Project | null>(null)
const isModalOpen = ref(false)
const copied = ref(false)
const activeSlideIndex = ref(0)

const modalSlides = computed(() => {
  if (!selectedProject.value) return []
  const slides: PreviewImage[] = [
    {
      url: selectedProject.value.image || '/images/project-preview.webp',
      title: 'Cover Overview',
      caption: selectedProject.value.shortDesc || selectedProject.value.title
    }
  ]
  if (selectedProject.value.preview_images?.length) {
    slides.push(...selectedProject.value.preview_images)
  }
  return slides
})

const activeSlide = computed(() => {
  if (!modalSlides.value.length) return null
  return modalSlides.value[activeSlideIndex.value] || modalSlides.value[0]
})

const prevSlide = () => {
  if (modalSlides.value.length <= 1) return
  activeSlideIndex.value = (activeSlideIndex.value - 1 + modalSlides.value.length) % modalSlides.value.length
}

const nextSlide = () => {
  if (modalSlides.value.length <= 1) return
  activeSlideIndex.value = (activeSlideIndex.value + 1) % modalSlides.value.length
}

const setSlide = (index: number) => {
  activeSlideIndex.value = index
}

const openProjectModal = (project: Project) => {
  selectedProject.value = project
  activeSlideIndex.value = 0
  isModalOpen.value = true
  copied.value = false
}

const closeModal = () => {
  isModalOpen.value = false
  selectedProject.value = null
  activeSlideIndex.value = 0
}

const copyToClipboard = (text?: string) => {
  if (text) {
    navigator.clipboard.writeText(text)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  }
}

</script>

<template>
  <section id="project" class="py-20 sm:py-24 relative overflow-hidden" aria-labelledby="projects-heading">
    <div class="container mx-auto px-4 sm:px-6">
      
      <!-- Section Header -->
      <Motion
        :initial="{ opacity: 0, y: 20 }"
        :while-in-view="{ opacity: 1, y: 0 }"
        :viewport="{ once: true, amount: 0.15 }"
        :transition="{ duration: 0.45, ease: 'easeOut' }"
        class="text-center max-w-3xl mx-auto mb-10 sm:mb-12"
      >
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-mono mb-4">
          <Icon name="carbon:application-web" size="14" />
          <span>PORTFOLIO SHOWCASE</span>
        </div>
        <h2 id="projects-heading" class="text-3xl sm:text-4xl lg:text-5xl font-heading font-black text-white tracking-tight mb-4">
          Featured <span class="text-gradient-primary">Engineering Projects</span>
        </h2>
        <p class="text-slate-300 text-base sm:text-lg font-normal leading-relaxed">
          A showcase of full-stack web applications, scalable backend microservices, and mobile products engineered for real-world reliability.
        </p>
      </Motion>

      <!-- Projects Grid with Linear Spotlight & Browser Mockup -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
        <Motion
          v-for="(project, index) in projects"
          :key="project.id ?? index"
          :initial="{ opacity: 0, y: 20 }"
          :while-in-view="{ opacity: 1, y: 0 }"
          :viewport="{ once: true, amount: 0.1 }"
          :transition="{
            duration: 0.45,
            delay: (index % 3) * 0.08,
            ease: 'easeOut'
          }"
          @click="openProjectModal(project)"
          @mousemove="onMouseMove"
          class="spotlight-card group rounded-3xl overflow-hidden cursor-pointer flex flex-col justify-between"
        >
          <!-- Browser Mockup Window Frame -->
          <div>
            <div class="px-4 py-2.5 bg-[#0a0f1d] border-b border-white/[0.08] flex items-center justify-between">
              <!-- Window dots -->
              <div class="flex items-center gap-1.5">
                <div class="w-2.5 h-2.5 rounded-full bg-[#ff5f56]/80"></div>
                <div class="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]/80"></div>
                <div class="w-2.5 h-2.5 rounded-full bg-[#27c93f]/80"></div>
              </div>

              <!-- URL bar mock -->
              <div class="px-3 py-0.5 rounded-md bg-white/[0.03] border border-white/[0.05] text-[10px] font-mono text-slate-400 max-w-[170px] truncate flex items-center gap-1">
                <Icon name="carbon:locked" size="10" class="text-emerald-400 shrink-0" />
                <span>{{ project.liveUrl ? project.liveUrl.replace('https://', '') : 'preview.internal' }}</span>
              </div>

              <!-- Status indicator -->
              <span
                v-if="project.liveUrl"
                class="inline-flex items-center gap-1 text-[10px] font-mono text-emerald-400"
              >
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>LIVE</span>
              </span>
              <span
                v-else-if="project.is_organization"
                class="inline-flex items-center gap-1 text-[10px] font-mono text-purple-400"
              >
                <span class="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
                <span>ECOSYSTEM</span>
              </span>
              <span v-else class="text-[10px] font-mono text-slate-500">CASE</span>
            </div>

            <!-- Project Banner Image -->
            <div class="relative w-full aspect-[16/9] overflow-hidden bg-slate-950 flex items-center justify-center">
              <NuxtImg
                :src="project.image || '/images/project-preview.webp'"
                :alt="project.title"
                class="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500"
                loading="lazy"
                width="600"
                height="340"
              />
              <div class="absolute inset-0 bg-gradient-to-t from-[#0d1424] via-[#0d1424]/10 to-transparent pointer-events-none"></div>

              <!-- Org / Multi-App Badge overlay -->
              <div
                v-if="project.is_organization"
                class="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-[#090e1a]/90 backdrop-blur-md border border-purple-500/40 text-[11px] font-mono font-medium text-purple-300 shadow-lg flex items-center gap-1.5"
              >
                <Icon name="carbon:enterprise" size="13" class="text-purple-400" />
                <span>Suite &middot; {{ project.sub_apps?.length || 0 }} Apps</span>
              </div>

              <!-- Hover explore icon -->
              <div class="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 group-hover:scale-105 transition-all duration-200">
                <Icon name="carbon:arrow-up-right" size="16" />
              </div>
            </div>
          </div>

          <!-- Project Details Container -->
          <div class="p-5 sm:p-6 flex-1 flex flex-col justify-between">
            <div>
              <div class="flex items-center justify-between gap-2 mb-1.5">
                <h3 class="text-xl font-heading font-bold text-white group-hover:text-blue-400 transition-colors truncate flex items-center gap-2">
                  <span>{{ project.title }}</span>
                  <span
                    v-if="project.is_organization"
                    class="px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-purple-500/20 text-purple-300 border border-purple-500/30 shrink-0"
                    title="GitHub Organization Suite"
                  >
                    ORG
                  </span>
                </h3>
              </div>

              <p class="text-slate-300 text-sm leading-relaxed mb-5 line-clamp-2 font-normal">
                {{ project.shortDesc || project.description }}
              </p>
            </div>

            <!-- Technology Chips & Action -->
            <div class="pt-3.5 border-t border-white/[0.06] flex items-center justify-between gap-2">
              <div class="flex flex-wrap gap-1.5">
                <span
                  v-for="tech in project.technologies.slice(0, 3)"
                  :key="tech"
                  class="px-2 py-0.5 rounded-md text-[11px] font-mono font-medium bg-blue-500/10 text-blue-300 border border-blue-500/20"
                >
                  {{ tech }}
                </span>
                <span
                  v-if="project.technologies.length > 3"
                  class="px-2 py-0.5 rounded-md text-[11px] font-mono text-slate-500 bg-white/[0.02]"
                >
                  +{{ project.technologies.length - 3 }}
                </span>
              </div>

              <span class="text-xs font-mono text-blue-400 group-hover:translate-x-1 transition-transform flex items-center gap-1 shrink-0">
                <span>Details</span>
                <Icon name="carbon:chevron-right" size="14" />
              </span>
            </div>
          </div>
        </Motion>
      </div>

    </div>

    <!-- Project Details Modal -->
    <UModal
      v-model:open="isModalOpen"
      :ui="{
        content: 'w-full max-w-4xl bg-[#090e1a] border border-white/15 shadow-2xl rounded-3xl overflow-hidden',
        header: 'p-6 sm:p-8 bg-[#0c1424] border-b border-white/10',
        body: 'p-6 sm:p-8 max-h-[70vh] overflow-y-auto',
        footer: 'p-4 sm:p-6 bg-[#0c1424] border-t border-white/10'
      }"
    >
      <template #title>
        <div class="flex flex-col gap-1">
          <span class="text-xs font-mono text-blue-400 uppercase tracking-wider">PROJECT ARCHITECTURE DEEP DIVE</span>
          <h2 class="text-2xl sm:text-3xl font-heading font-black text-white">
            {{ selectedProject?.title }}
          </h2>
        </div>
      </template>

      <template #body>
        <div class="space-y-8">
          <!-- Interactive Project Showcase & Gallery Carousel -->
          <div class="space-y-3">
            <!-- Main Display Frame -->
            <div class="relative rounded-2xl overflow-hidden border border-white/15 bg-slate-950 shadow-2xl group h-64 sm:h-84 md:h-96">
              <!-- Active Image -->
              <NuxtImg
                v-if="activeSlide"
                :key="activeSlide.url"
                :src="activeSlide.url"
                :alt="activeSlide.title || selectedProject?.title || 'Project Preview'"
                class="w-full h-full object-cover transition-all duration-300"
                width="900"
                height="500"
              />

              <!-- Top Floating Pill Badges -->
              <div class="absolute top-4 inset-x-4 flex items-center justify-between pointer-events-none">
                <div class="flex items-center gap-2">
                  <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-950/80 backdrop-blur-md border border-white/20 text-xs font-mono font-medium text-blue-300 shadow-lg">
                    <Icon name="carbon:screen" size="14" class="text-blue-400" />
                    <span>{{ activeSlide?.title || 'Feature Preview' }}</span>
                  </span>
                </div>

                <span v-if="modalSlides.length > 1" class="px-2.5 py-1 rounded-full bg-slate-950/80 backdrop-blur-md border border-white/20 text-xs font-mono font-medium text-slate-300 shadow-lg">
                  {{ activeSlideIndex + 1 }} / {{ modalSlides.length }}
                </span>
              </div>

              <!-- Prev / Next Navigation Arrows (Only if multiple slides) -->
              <div v-if="modalSlides.length > 1" class="absolute inset-y-0 inset-x-3 flex items-center justify-between pointer-events-none">
                <button
                  @click.stop="prevSlide"
                  class="pointer-events-auto w-10 h-10 rounded-full bg-slate-950/70 hover:bg-blue-600/90 text-white/80 hover:text-white backdrop-blur-md border border-white/20 flex items-center justify-center transition-all duration-200 cursor-pointer shadow-lg hover:scale-110 active:scale-95"
                  title="Previous image"
                >
                  <Icon name="carbon:chevron-left" size="20" />
                </button>
                <button
                  @click.stop="nextSlide"
                  class="pointer-events-auto w-10 h-10 rounded-full bg-slate-950/70 hover:bg-blue-600/90 text-white/80 hover:text-white backdrop-blur-md border border-white/20 flex items-center justify-center transition-all duration-200 cursor-pointer shadow-lg hover:scale-110 active:scale-95"
                  title="Next image"
                >
                  <Icon name="carbon:chevron-right" size="20" />
                </button>
              </div>

              <!-- Bottom Caption Bar (If caption exists) -->
              <div
                v-if="activeSlide?.caption"
                class="absolute bottom-0 inset-x-0 p-3.5 sm:p-4 bg-gradient-to-t from-slate-950/95 via-slate-950/75 to-transparent border-t border-white/5"
              >
                <p class="text-xs sm:text-sm text-slate-200 font-normal leading-relaxed flex items-center gap-2">
                  <Icon name="carbon:information-filled" size="16" class="text-blue-400 shrink-0" />
                  <span>{{ activeSlide.caption }}</span>
                </p>
              </div>
            </div>

            <!-- Thumbnail Navigation Strip -->
            <div v-if="modalSlides.length > 1" class="flex items-center gap-2.5 overflow-x-auto pb-1 pt-0.5 px-0.5 scrollbar-thin scrollbar-thumb-white/10">
              <button
                v-for="(slide, sIdx) in modalSlides"
                :key="sIdx"
                @click="setSlide(sIdx)"
                class="relative w-20 sm:w-24 aspect-[16/9] rounded-xl overflow-hidden bg-slate-950 border transition-all duration-200 shrink-0 cursor-pointer focus:outline-none flex items-center justify-center"
                :class="activeSlideIndex === sIdx
                  ? 'border-blue-500 ring-2 ring-blue-500/40 opacity-100 scale-102 shadow-md shadow-blue-500/20'
                  : 'border-white/10 opacity-50 hover:opacity-100 hover:border-white/30'"
                :title="slide.title || `Slide ${sIdx + 1}`"
              >
                <img
                  :src="slide.url"
                  :alt="slide.title || `Thumbnail ${sIdx + 1}`"
                  class="w-full h-full object-contain"
                />
                <span
                  v-if="sIdx === 0"
                  class="absolute top-1 left-1 px-1 rounded bg-black/70 text-[9px] font-mono text-blue-300"
                >
                  Cover
                </span>
              </button>
            </div>
          </div>

          <!-- Quick Metrics Bar -->
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div class="p-4 rounded-xl bg-white/[0.03] border border-white/10 flex items-center gap-3">
              <div class="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                <Icon name="carbon:code" size="20" />
              </div>
              <div>
                <p class="text-[10px] font-mono uppercase text-slate-400">Stack</p>
                <p class="text-xs sm:text-sm font-semibold text-white">{{ selectedProject?.technologies.length || 0 }} Technologies</p>
              </div>
            </div>

            <div class="p-4 rounded-xl bg-white/[0.03] border border-white/10 flex items-center gap-3">
              <div class="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0">
                <Icon name="carbon:star" size="20" />
              </div>
              <div>
                <p class="text-[10px] font-mono uppercase text-slate-400">Features</p>
                <p class="text-xs sm:text-sm font-semibold text-white">{{ selectedProject?.features.length || 0 }} Key Features</p>
              </div>
            </div>

            <div class="p-4 rounded-xl bg-white/[0.03] border border-white/10 flex items-center gap-3">
              <div 
                class="w-10 h-10 rounded-lg border flex items-center justify-center shrink-0"
                :class="selectedProject?.liveUrl ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-slate-500/10 border-slate-500/20 text-slate-400'"
              >
                <Icon :name="selectedProject?.liveUrl ? 'carbon:network-4' : 'carbon:document'" size="20" />
              </div>
              <div>
                <p class="text-[10px] font-mono uppercase text-slate-400">Status</p>
                <p class="text-xs sm:text-sm font-semibold text-white">{{ selectedProject?.liveUrl ? 'Live Production' : 'Completed Project' }}</p>
              </div>
            </div>
          </div>

          <!-- Organization Suite Header (if is_organization) -->
          <div
            v-if="selectedProject?.is_organization"
            class="p-5 rounded-2xl bg-gradient-to-r from-purple-950/40 via-[#0d1424] to-blue-950/30 border border-purple-500/30 shadow-xl"
          >
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div class="flex items-center gap-3.5">
                <div class="w-12 h-12 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-300 shrink-0 shadow-inner">
                  <Icon name="carbon:enterprise" size="24" />
                </div>
                <div>
                  <div class="flex items-center gap-2">
                    <span class="text-[11px] font-mono uppercase tracking-wider text-purple-400 font-semibold">GitHub Organization Ecosystem</span>
                    <span class="px-2 py-0.5 rounded-full text-[10px] font-mono bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      {{ selectedProject?.sub_apps?.length || 0 }} Applications
                    </span>
                  </div>
                  <h4 class="text-base sm:text-lg font-bold text-white mt-0.5">
                    {{ selectedProject.github_org ? selectedProject.github_org.replace(/^https?:\/\/github\.com\//, '') : selectedProject.title }}
                  </h4>
                </div>
              </div>

              <a
                v-if="selectedProject?.github_org"
                :href="selectedProject.github_org"
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-xs font-mono font-medium text-white transition-all duration-200 self-start sm:self-auto cursor-pointer"
              >
                <Icon name="line-md:github" size="16" />
                <span>Visit Org GitHub</span>
                <Icon name="carbon:arrow-up-right" size="14" />
              </a>
            </div>
          </div>

          <!-- Connected Applications Suite Grid (if sub_apps exists) -->
          <div v-if="selectedProject?.sub_apps?.length" class="space-y-3">
            <div class="flex items-center justify-between">
              <h3 class="text-sm font-mono uppercase text-slate-400 tracking-wider flex items-center gap-2">
                <Icon name="carbon:apps" size="16" class="text-purple-400" />
                <span>Ecosystem Applications ({{ selectedProject.sub_apps.length }})</span>
              </h3>
              <span class="text-xs text-slate-400 font-mono">Multi-App Architecture</span>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              <div
                v-for="(app, aIdx) in selectedProject.sub_apps"
                :key="aIdx"
                class="p-4 rounded-2xl bg-white/[0.025] hover:bg-white/[0.045] border border-white/10 hover:border-purple-500/40 transition-all duration-200 flex flex-col justify-between group/app"
              >
                <div>
                  <div class="flex items-start justify-between gap-3 mb-2">
                    <div class="flex items-center gap-2.5">
                      <div class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" :class="getAppTypeBadge(app.app_type || app.type).bgClass">
                        <Icon :name="getAppTypeBadge(app.app_type || app.type).icon" size="18" :class="getAppTypeBadge(app.app_type || app.type).textClass" />
                      </div>
                      <div>
                        <h4 class="text-sm font-bold text-white group-hover/app:text-purple-300 transition-colors">
                          {{ app.name }}
                        </h4>
                        <span class="text-[10px] font-mono text-slate-400 uppercase">
                          {{ getAppTypeBadge(app.app_type || app.type).label }}
                        </span>
                      </div>
                    </div>
                  </div>

                  <p v-if="app.description" class="text-xs text-slate-300 leading-relaxed line-clamp-2 mb-3">
                    {{ app.description }}
                  </p>

                  <div v-if="app.technologies?.length" class="flex flex-wrap gap-1.5 mb-3">
                    <span
                      v-for="t in app.technologies"
                      :key="t"
                      class="px-2 py-0.5 rounded text-[10px] font-mono bg-white/[0.04] text-slate-300 border border-white/10"
                    >
                      {{ t }}
                    </span>
                  </div>
                </div>

                <!-- Action Buttons: Demo & Repo -->
                <div class="pt-3 border-t border-white/[0.06] flex items-center justify-end gap-2">
                  <a
                    v-if="app.repo_url"
                    :href="app.repo_url"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono text-slate-300 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="View Source Repository"
                  >
                    <Icon name="line-md:github" size="14" />
                    <span>Repo</span>
                  </a>

                  <a
                    v-if="app.live_url || app.demo_url"
                    :href="app.live_url || app.demo_url"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="px-3 py-1.5 rounded-lg bg-blue-600/30 hover:bg-blue-600/50 border border-blue-500/40 text-xs font-mono text-blue-300 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="Launch Live Demo"
                  >
                    <Icon name="carbon:launch" size="14" />
                    <span>Live Demo</span>
                  </a>
                </div>
              </div>
            </div>
          </div>

          <!-- Project Overview Description -->
          <div>
            <h3 class="text-sm font-mono uppercase text-slate-400 tracking-wider mb-2 flex items-center gap-2">
              <Icon name="carbon:align-box-top-left" size="16" class="text-blue-400" />
              <span>Project Architecture & Overview</span>
            </h3>
            <div class="p-5 rounded-2xl bg-white/[0.02] border border-white/10">
              <p class="text-slate-200 text-sm sm:text-base leading-relaxed font-normal">
                {{ selectedProject?.details || selectedProject?.description }}
              </p>
            </div>
          </div>

          <!-- Key Features Checklist -->
          <div v-if="selectedProject?.features?.length">
            <h3 class="text-sm font-mono uppercase text-slate-400 tracking-wider mb-3 flex items-center gap-2">
              <Icon name="carbon:checkbox-checked" size="16" class="text-emerald-400" />
              <span>Key Features & Functional Highlights</span>
            </h3>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div
                v-for="(feature, idx) in selectedProject?.features"
                :key="idx"
                class="flex items-start gap-3 p-3.5 rounded-xl bg-white/[0.02] border border-white/10"
              >
                <Icon name="carbon:checkmark-filled" size="18" class="text-emerald-400 shrink-0 mt-0.5" />
                <span class="text-xs sm:text-sm text-slate-200 leading-relaxed">{{ feature }}</span>
              </div>
            </div>
          </div>

          <!-- Tech Stack Badges -->
          <div v-if="selectedProject?.technologies?.length">
            <h3 class="text-sm font-mono uppercase text-slate-400 tracking-wider mb-3 flex items-center gap-2">
              <Icon name="carbon:terminal" size="16" class="text-cyan-400" />
              <span>Built With</span>
            </h3>
            <div class="flex flex-wrap gap-2 p-4 rounded-2xl bg-white/[0.02] border border-white/10">
              <span
                v-for="tech in selectedProject?.technologies"
                :key="tech"
                class="px-3 py-1.5 rounded-lg text-xs font-mono font-medium bg-blue-500/10 text-blue-300 border border-blue-500/30"
              >
                {{ tech }}
              </span>
            </div>
          </div>

          <!-- Live Preview Link Bar -->
          <div v-if="selectedProject?.liveUrl" class="p-4 rounded-2xl bg-blue-500/5 border border-blue-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
                <Icon name="carbon:link" size="20" />
              </div>
              <div class="min-w-0">
                <p class="text-[10px] font-mono uppercase text-blue-300">Live URL</p>
                <p class="text-xs font-mono text-slate-300 truncate max-w-xs sm:max-w-md">{{ selectedProject.liveUrl }}</p>
              </div>
            </div>

            <div class="flex items-center gap-2">
              <button
                @click="copyToClipboard(selectedProject?.liveUrl)"
                class="px-3 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-mono text-slate-300 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Icon :name="copied ? 'carbon:checkmark' : 'carbon:copy'" size="14" :class="copied ? 'text-emerald-400' : 'text-slate-400'" />
                <span>{{ copied ? 'Copied!' : 'Copy' }}</span>
              </button>

              <a
                :href="selectedProject.liveUrl"
                target="_blank"
                rel="noopener noreferrer"
                class="btn-primary-gradient px-4 py-2 rounded-xl text-xs font-semibold text-white flex items-center gap-1.5 cursor-pointer"
              >
                <span>Launch Live</span>
                <Icon name="carbon:arrow-up-right" size="14" />
              </a>
            </div>
          </div>

        </div>
      </template>

      <template #footer>
        <div class="flex items-center justify-between w-full">
          <div class="flex items-center gap-2">
            <a
              v-if="selectedProject?.is_organization && selectedProject?.github_org"
              :href="selectedProject.github_org"
              target="_blank"
              rel="noopener noreferrer"
              class="btn-secondary-subtle px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-white flex items-center gap-2"
            >
              <Icon name="carbon:enterprise" size="18" class="text-purple-400" />
              <span>GitHub Organization</span>
              <Icon name="carbon:arrow-up-right" size="14" />
            </a>
            <a
              v-else-if="selectedProject?.link"
              :href="selectedProject.link"
              target="_blank"
              rel="noopener noreferrer"
              class="btn-secondary-subtle px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-white flex items-center gap-2"
            >
              <Icon name="line-md:github" size="18" />
              <span>View Source Code</span>
            </a>
          </div>

          <UButton
            color="neutral"
            variant="outline"
            size="md"
            @click="closeModal"
            class="rounded-xl px-5 cursor-pointer text-slate-300 hover:text-white"
          >
            Close
          </UButton>
        </div>
      </template>
    </UModal>

  </section>
</template>
