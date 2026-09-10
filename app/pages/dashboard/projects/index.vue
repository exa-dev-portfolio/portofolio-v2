<script setup lang="ts">
import {ref} from 'vue'
import type {Project} from "~/types/project";
import {useToastCustom} from "~/composables/useToastCustom";

definePageMeta({
  layout: 'dashboard',
  breadCrumb: [
    {title: 'Projects'}
  ]
})

const {
  hasMore,
  cursor,
  projects,
  fetchProjects,
  isLoading,
  deleteProject
} = useProject()

const searchQuery = ref('')
const canLoadMore = ref(false)
const toast = useToastCustom()
const viewMode = ref<'grid' | 'list'>('grid')
const {debounce} = useDebounce()
const isSearching = ref(false)

// Fetch initial projects on SSR/CSR
const {data} = await useAsyncData('projects', async () => {
  return await fetchProjects(false, '')
})

// Watch for search changes and reset
watch([searchQuery], () => {
  debounce(
      "search-projects",
      async (query: string) => {
        isSearching.value = true
        cursor.value = null
        canLoadMore.value = false
        try {
          await fetchProjects(false, query)
        } finally {
          isSearching.value = false
          canLoadMore.value = true
        }
      }, 500,
      searchQuery.value
  )
}, {immediate: false})

// Load more on client side only (infinite scroll)
const scrollTriggerRef = ref<HTMLElement>()

// Intersection Observer setup (client-side only)
const setupIntersectionObserver = () => {
  if (import.meta.server || !scrollTriggerRef.value) return

  const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && hasMore.value && !isLoading.value && canLoadMore.value && !isSearching.value) {
            fetchProjects(true, searchQuery.value)
          }
        })
      },
      {
        root: null,
        rootMargin: '100px',
        threshold: 0.1,
      }
  )

  observer.observe(scrollTriggerRef.value)

  onUnmounted(() => {
    observer.disconnect()
  })
}

// Setup observer on client-side only
if (import.meta.client) {
  onMounted(() => {
    if (data.value) {
      projects.value = data.value.data
      hasMore.value = data.value.has_next

      if (data.value.data.length > 0) {
        cursor.value = data.value.data.at(-1)!.id as any
      }
    }
    canLoadMore.value = true
    setupIntersectionObserver()
  })
}

const getStatusColor = (status: boolean) => {
  if (status) {
    return 'bg-green-500/20 text-green-400 border-green-500/40'
  }
  return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40'
}

const getStatusText = (status: boolean) => {
  return status ? 'Published' : 'Draft'
}

const openProject = (project: Project) => {
  navigateTo(`/dashboard/projects/${project.id}`)
}

const deleteProjectHandler = async (id: number) => {
  toast.showConfirmationToast(
      'Delete Skill',
      'Are you sure you want to delete this skill? This action cannot be undone.',
      async () => {
        const success = await deleteProject(id)
        if (success) {
          cursor.value = null
          canLoadMore.value = false
          try {
            await fetchProjects(false, '')
          } finally {
            canLoadMore.value = true
            isSearching.value = false
          }
        }
      }
  )
}
</script>

<template>
  <div class="p-8">
    <!-- Page Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 mb-8">
      <div>
        <h1 class="text-4xl font-black text-white mb-2">Manage Projects</h1>
        <p class="text-white/60">Create, update, and manage your portfolio projects. Keep your best work front and
          center.</p>
      </div>

      <!-- Add New Project Button -->
      <button
          @click="navigateTo('/dashboard/projects/new')"
          class="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-white font-semibold hover:brightness-110 transition-all whitespace-nowrap">
        <Icon name="carbon:add" size="20"/>
        Add New Project
      </button>
    </div>

    <!-- Filters Section -->
    <div class="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 mb-8">
      <div class="flex items-center gap-4">
        <!-- Search -->
        <div class="relative flex-1">
          <Icon name="carbon:search" size="20"
                class="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50"/>
          <input
              v-model="searchQuery"
              type="text"
              placeholder="Search projects by name..."
              class="w-full pl-10 pr-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-white/40 focus:outline-none focus:border-primary/50 focus:bg-white/15 transition-all"
          />
        </div>

        <!-- View Mode Toggle -->
        <div class="flex gap-2">
          <button
              @click="viewMode = 'grid'"
              :class="[
                'p-2 rounded-lg transition-all',
                viewMode === 'grid'
                  ? 'bg-primary/20 text-primary border border-primary/40'
                  : 'bg-white/5 text-white/50 hover:bg-white/10 border border-white/10'
              ]"
          >
            <Icon name="carbon:grid" size="20"/>
          </button>
          <button
              @click="viewMode = 'list'"
              :class="[
                'p-2 rounded-lg transition-all',
                viewMode === 'list'
                  ? 'bg-primary/20 text-primary border border-primary/40'
                  : 'bg-white/5 text-white/50 hover:bg-white/10 border border-white/10'
              ]"
          >
            <Icon name="carbon:list" size="20"/>
          </button>
        </div>
      </div>


    </div>

    <!-- Grid View -->
    <div v-if="viewMode === 'grid'" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <!-- Skeleton Loading -->
      <div v-if="isSearching || isLoading" v-for="i in 6" :key="`skeleton-${i}`"
           class="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden animate-pulse">
        <div class="h-48 bg-white/10"></div>
        <div class="p-6 space-y-3">
          <div class="h-6 bg-white/10 rounded w-3/4"></div>
          <div class="h-4 bg-white/10 rounded w-full"></div>
          <div class="h-4 bg-white/10 rounded w-2/3"></div>
          <div class="flex gap-2 mt-4">
            <div class="h-6 bg-white/10 rounded px-2 w-16"></div>
            <div class="h-6 bg-white/10 rounded px-2 w-16"></div>
          </div>
          <div class="pt-4 border-t border-white/10 flex justify-between">
            <div class="h-4 bg-white/10 rounded w-1/3"></div>
            <div class="flex gap-2">
              <div class="w-8 h-8 bg-white/10 rounded"></div>
              <div class="w-8 h-8 bg-white/10 rounded"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Projects -->
      <div
          v-for="project in projects"
          :key="project.id"
          @click="openProject(project)"
          v-else
          class="group bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10 transition-all duration-300 cursor-pointer"
      >
          <!-- Image -->
          <div class="relative w-full aspect-[16/9] bg-slate-950 overflow-hidden flex items-center justify-center">
            <NuxtImg
                :src="project.preview_image"
                :alt="project.name"
                class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <!-- Org Badge -->
            <div v-if="project.is_organization" class="absolute top-4 left-4">
              <span class="px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-950/80 text-purple-300 border border-purple-500/40 backdrop-blur-md flex items-center gap-1.5 shadow-md">
                <Icon name="carbon:enterprise" size="13" class="text-purple-400" />
                <span>Org · {{ project.sub_apps?.length || 0 }} Apps</span>
              </span>
            </div>
            <!-- Status Badge -->
            <div class="absolute top-4 right-4">
              <span :class="['px-3 py-1 rounded-full text-xs font-semibold border', getStatusColor(project.status)]">
                {{ getStatusText(project.status) }}
              </span>
            </div>
          </div>

        <!-- Content -->
        <div class="p-6">
          <!-- Title -->
          <h3 class="text-lg font-bold text-white mb-2 group-hover:text-primary transition-colors">
            {{ project.name }}
          </h3>

          <!-- Description -->
          <p class="text-sm text-white/60 mb-4 line-clamp-2">{{ project.description }}</p>

          <!-- Technologies -->
          <div class="flex flex-wrap gap-2 mb-4">
            <span
                v-for="tech in project.technologies"
                :key="tech"
                class="px-2 py-1 text-xs font-medium bg-primary/15 text-primary border border-primary/30 rounded group-hover:bg-primary/25 transition-colors"
            >
              {{ tech }}
            </span>
          </div>

          <!-- Footer -->
          <div class="flex items-center justify-between pt-4 border-t border-white/10">
            <span class="text-xs text-white/50">{{
                project.created_at ? new Date(project.created_at).toLocaleDateString() : ''
              }}</span>
            <div class="flex gap-2">
              <button
                  @click.stop="openProject(project)"
                  class="p-2 rounded-lg cursor-pointer bg-white/5 hover:bg-primary/20 text-white/50 hover:text-primary transition-all">
                <Icon name="carbon:pen" size="16"/>
              </button>
              <button
                  @click.stop="deleteProjectHandler(project.id || 0)"
                  class="p-2 rounded-lg cursor-pointer bg-white/5 hover:bg-red-500/20 text-white/50 hover:text-red-400 transition-all">
                <Icon name="carbon:trash-can" size="16"/>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- List View -->
    <div v-else class="space-y-3">
      <!-- Skeleton Loading -->
      <div v-if="isSearching" v-for="i in 6" :key="`skeleton-${i}`"
           class="flex items-center gap-4 p-4 bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg animate-pulse">
        <div class="relative w-20 h-20 shrink-0 rounded-lg bg-white/10"></div>
        <div class="flex-1 min-w-0 space-y-2">
          <div class="h-5 bg-white/10 rounded w-1/3"></div>
          <div class="h-4 bg-white/10 rounded w-full"></div>
          <div class="flex gap-1">
            <div class="h-6 bg-white/10 rounded px-2 w-16"></div>
            <div class="h-6 bg-white/10 rounded px-2 w-16"></div>
          </div>
        </div>
        <div class="text-right shrink-0 space-y-2">
          <div class="h-4 bg-white/10 rounded w-20"></div>
          <div class="flex gap-2">
            <div class="w-8 h-8 bg-white/10 rounded"></div>
            <div class="w-8 h-8 bg-white/10 rounded"></div>
          </div>
        </div>
      </div>

      <!-- Projects -->
      <div
          v-for="project in projects"
          :key="project.id"
          v-else
          @click="openProject(project)"
          class="group flex items-center gap-4 p-4 bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg hover:border-primary/50 hover:bg-white/10 transition-all duration-300 cursor-pointer"
      >
        <!-- Image Thumbnail -->
        <div class="relative w-28 sm:w-32 aspect-[16/9] shrink-0 rounded-lg overflow-hidden bg-slate-950 flex items-center justify-center">
          <NuxtImg
              :src="project.preview_image || (typeof project.image === 'string' ? project.image : undefined)"
              :alt="project.name"
              class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>

        <!-- Content -->
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-3 mb-1">
            <h3 class="text-base font-bold text-white group-hover:text-primary transition-colors">
              {{ project.name }}
            </h3>
            <span
              v-if="project.is_organization"
              class="px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/40 inline-flex items-center gap-1 shrink-0"
            >
              <Icon name="carbon:enterprise" size="12" />
              <span>Org ({{ project.sub_apps?.length || 0 }} Apps)</span>
            </span>
            <span
                :class="['px-3 py-1 rounded-full text-xs font-semibold border shrink-0', getStatusColor(project.status)]">
              {{ getStatusText(project.status) }}
            </span>
          </div>
          <p class="text-sm text-white/60 mb-2 line-clamp-1">{{ project.description }}</p>
          <div class="flex flex-wrap gap-1">
            <span
                v-for="tech in project.technologies.slice(0, 3)"
                :key="tech"
                class="px-2 py-0.5 text-xs font-medium bg-primary/15 text-primary border border-primary/30 rounded"
            >
              {{ tech }}
            </span>
            <span v-if="project.technologies && project.technologies.length > 3" class="text-xs text-white/40">
              +{{ project.technologies.length - 3 }} more
            </span>
          </div>
        </div>

        <!-- Meta -->
        <div class="text-right shrink-0">
          <p class="text-xs text-white/50 mb-3">
            {{ project.created_at ? new Date(project.created_at).toLocaleDateString() : '' }}</p>
          <div class="flex gap-2">
            <button
                @click.stop="openProject(project)"
                class="p-2 rounded-lg cursor-pointer bg-white/5 hover:bg-primary/20 text-white/50 hover:text-primary transition-all">
              <Icon name="carbon:pen" size="16"/>
            </button>
            <button
                @click.stop="deleteProjectHandler(project.id || 0)"
                class="p-2 rounded-lg cursor-pointer bg-white/5 hover:bg-red-500/20 text-white/50 hover:text-red-400 transition-all">
              <Icon name="carbon:trash-can" size="16"/>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-if="projects.length === 0" class="flex flex-col items-center justify-center py-20">
      <Icon name="carbon:email" size="64" class="text-white/20 mb-6"/>
      <h3 class="text-xl font-bold text-white mb-2">No projects found</h3>
      <p class="text-white/60 text-center mb-6">Try adjusting your search or create a new project</p>
      <button
          @click="navigateTo('/dashboard/projects/new')"
          class="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-white font-semibold hover:brightness-110 transition-all">
        <Icon name="carbon:add" size="20"/>
        Create Your First Project
      </button>
    </div>

    <!-- Loading Indicator (Initial Load) -->
    <div v-if="isLoading && projects.length === 0 && !isSearching"
         class="flex flex-col items-center justify-center py-20">
      <div class="w-12 h-12 border-4 border-white/20 border-t-primary rounded-full animate-spin mb-4"></div>
      <p class="text-white/60 text-sm">Loading projects...</p>
    </div>

    <!-- Scroll Trigger for Infinite Scroll (Load More) -->
    <div ref="scrollTriggerRef" class="h-10 flex items-center justify-center">
      <div v-if="isLoading && projects.length > 0 && !isSearching && canLoadMore"
           class="flex items-center gap-2 text-white/60 text-sm">
        <Icon name="icon-park-outline:loading-four" size="16" class="animate-spin"/>
        <p>Loading more projects...</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
</style>

