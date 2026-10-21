<script setup lang="ts">
import {ref} from 'vue'
import type {Journey} from "~/types/journey";
import {useToastCustom} from "~/composables/useToastCustom";

definePageMeta({
  layout: 'dashboard',
  breadCrumb: [
    {title: 'Work'}
  ]
})

const {
  hasMore,
  cursor,
  journeys,
  fetchJourneys,
  isLoading,
  deleteJourney
} = useJourney()

const searchQuery = ref('')
const canLoadMore = ref(false)
const toast = useToastCustom()
const viewMode = ref<'grid' | 'list'>('grid')
const {debounce} = useDebounce()
const isSearching = ref(false)

// Fetch initial journeys on SSR/CSR
const {data} = await useAsyncData('journeys', async () => {
  return await fetchJourneys(false, '')
})

// Watch for search changes and reset
watch([searchQuery], () => {
  debounce(
      "search-journeys",
      async (query: string) => {
        isSearching.value = true
        cursor.value = null
        canLoadMore.value = false
        try {
          await fetchJourneys(false, query)
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
            fetchJourneys(true, searchQuery.value)
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
      journeys.value = data.value.data
      hasMore.value = data.value.has_next

      if (data.value.data.length > 0) {
        cursor.value = data.value.data.at(-1)!.id as any
      }
    }
    canLoadMore.value = true
    setupIntersectionObserver()
  })
}

const getStatusColor = (isCurrent: boolean) => {
  if (isCurrent) {
    return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
  }
  return 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'
}

const getStatusText = (isCurrent: boolean) => {
  return isCurrent ? 'Current' : 'Past'
}

const formatDateRange = (startDate: string, endDate?: string) => {
  const start = new Date(startDate).toLocaleDateString('en-US', {month: 'short', year: 'numeric'})
  if (!endDate) return `${start} - Present`
  const end = new Date(endDate).toLocaleDateString('en-US', {month: 'short', year: 'numeric'})
  return `${start} - ${end}`
}

const openJourney = (journey: Journey) => {
  navigateTo(`/dashboard/journeys/${journey.id}`)
}

const deleteJourneyHandler = async (id: number) => {
  toast.showConfirmationToast(
      'Delete Journey',
      'Are you sure you want to delete this journey? This action cannot be undone.',
      async () => {
        const success = await deleteJourney(id)
        if (success) {
          cursor.value = null
          canLoadMore.value = false
          try {
            await fetchJourneys(false, '')
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
        <h1 class="text-4xl font-black text-white mb-2">Manage Work Experience</h1>
        <p class="text-white/60">Track and showcase your professional journey and career milestones.</p>
      </div>

      <!-- Add New Journey Button -->
      <button
          @click="navigateTo('/dashboard/journeys/new')"
          class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-zinc-950 font-semibold hover:bg-zinc-200 transition-all whitespace-nowrap text-sm cursor-pointer shadow-sm">
        <Icon name="carbon:add" size="18"/>
        Add Experience
      </button>
    </div>

    <!-- Filters Section -->
    <div class="bg-[#141417] border border-white/10 rounded-2xl p-4 sm:p-5 mb-8">
      <div class="flex items-center gap-4">
        <!-- Search -->
        <div class="relative flex-1">
          <Icon name="carbon:search" size="18"
                class="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-zinc-400"/>
          <input
              v-model="searchQuery"
              type="text"
              placeholder="Search by title or company..."
              class="w-full pl-10 pr-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-zinc-500 focus:outline-none focus:border-white/30 focus:bg-white/10 transition-all text-sm"
          />
        </div>

        <!-- View Mode Toggle -->
        <div class="flex gap-2">
          <button
              @click="viewMode = 'grid'"
              :class="[
                'p-2 rounded-xl transition-all cursor-pointer',
                viewMode === 'grid'
                  ? 'bg-white text-zinc-950 font-semibold shadow-sm'
                  : 'bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10 border border-white/10'
              ]"
          >
            <Icon name="carbon:grid" size="18"/>
          </button>
          <button
              @click="viewMode = 'list'"
              :class="[
                'p-2 rounded-xl transition-all cursor-pointer',
                viewMode === 'list'
                  ? 'bg-white text-zinc-950 font-semibold shadow-sm'
                  : 'bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10 border border-white/10'
              ]"
          >
            <Icon name="carbon:list" size="18"/>
          </button>
        </div>
      </div>
    </div>

    <!-- Grid View -->
    <div v-if="viewMode === 'grid'" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <!-- Skeleton Loading -->
      <div v-if="isSearching || isLoading" v-for="i in 6" :key="`skeleton-${i}`"
           class="bg-[#141417] border border-white/10 rounded-2xl p-6 animate-pulse">
        <div class="space-y-3">
          <div class="h-6 bg-white/10 rounded w-3/4"></div>
          <div class="h-4 bg-white/10 rounded w-full"></div>
          <div class="h-4 bg-white/10 rounded w-2/3"></div>
          <div class="flex gap-2 mt-4">
            <div class="h-6 bg-white/10 rounded w-20"></div>
            <div class="h-6 bg-white/10 rounded w-20"></div>
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

      <!-- Journeys -->
      <div
          v-for="journey in journeys"
          @click="openJourney(journey)"
          :key="journey.id"
          v-else
          class="group flex flex-col justify-between bg-[#141417] border border-white/10 rounded-2xl overflow-hidden hover:border-white/25 transition-all duration-300 cursor-pointer p-6"
      >
        <div>
          <!-- Header -->
          <div class="flex items-start justify-between gap-3 mb-4">
            <div class="flex-1 min-w-0">
              <h3 class="text-base font-bold text-white group-hover:text-zinc-200 transition-colors tracking-tight">
                {{ journey.title }}
              </h3>
              <p class="text-xs text-zinc-300 font-medium mt-0.5">{{ journey.company }}</p>
              <p v-if="journey.location" class="text-[11px] text-zinc-500 font-mono">{{ journey.location }}</p>
            </div>
            <span
                :class="['px-2.5 py-0.5 rounded-full text-xs font-mono font-medium border shrink-0', getStatusColor(journey.is_current)]">
              {{ getStatusText(journey.is_current) }}
            </span>
          </div>

          <!-- Date Range -->
          <p class="text-xs font-mono text-zinc-400 mb-3">{{ formatDateRange(journey.start_date, journey.end_date) }}</p>

          <!-- Description -->
          <p class="text-xs text-zinc-400 mb-4 line-clamp-2 leading-relaxed">{{ journey.description }}</p>

          <!-- Responsibilities -->
          <div class="mb-4">
            <p class="text-xs font-mono text-zinc-400 mb-2">Key Responsibilities:</p>
            <ul class="space-y-1">
              <li v-for="(resp, idx) in journey.key_responsibilities.slice(0, 2)" :key="idx"
                  class="text-xs text-zinc-400 line-clamp-1">• {{ resp }}
              </li>
              <li v-if="journey.key_responsibilities.length > 2" class="text-xs font-mono text-zinc-500">
                +{{ journey.key_responsibilities.length - 2 }} more
              </li>
            </ul>
          </div>
        </div>

        <!-- Footer -->
        <div class="flex items-center justify-end pt-4 border-t border-white/10 mt-auto">
          <div class="flex gap-1.5">
            <button
                @click.stop="openJourney(journey)"
                class="p-2 rounded-xl cursor-pointer bg-white/5 hover:bg-white/15 text-zinc-400 hover:text-white transition-all"
                title="Edit Experience"
            >
              <Icon name="carbon:pen" size="15"/>
            </button>
            <button
                @click.stop="deleteJourneyHandler(journey.id || 0)"
                class="p-2 rounded-xl cursor-pointer bg-white/5 hover:bg-rose-500/20 text-zinc-400 hover:text-rose-400 transition-all"
                title="Delete Experience"
            >
              <Icon name="carbon:trash-can" size="15"/>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- List View -->
    <div v-else class="space-y-3">
      <!-- Skeleton Loading -->
      <div v-if="isSearching" v-for="i in 6" :key="`skeleton-${i}`"
           class="flex items-center gap-4 p-4 bg-[#141417] border border-white/10 rounded-2xl animate-pulse">
        <div class="flex-1 min-w-0 space-y-2">
          <div class="h-5 bg-white/10 rounded w-1/3"></div>
          <div class="h-4 bg-white/10 rounded w-1/2"></div>
          <div class="h-4 bg-white/10 rounded w-2/5"></div>
        </div>
        <div class="text-right shrink-0 space-y-2">
          <div class="h-6 bg-white/10 rounded w-20"></div>
          <div class="flex gap-2">
            <div class="w-8 h-8 bg-white/10 rounded"></div>
            <div class="w-8 h-8 bg-white/10 rounded"></div>
          </div>
        </div>
      </div>

      <!-- Journeys -->
      <div
          v-for="journey in journeys"
          :key="journey.id"
          @click="openJourney(journey)"
          v-else
          class="group flex items-center justify-between gap-4 p-4 bg-[#141417] border border-white/10 rounded-2xl hover:border-white/20 hover:bg-[#18181c] transition-all duration-300 cursor-pointer"
      >
        <!-- Content -->
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-3 mb-1">
            <h3 class="text-sm font-bold text-white group-hover:text-zinc-200 transition-colors tracking-tight">
              {{ journey.title }}
            </h3>
            <span
                :class="['px-2.5 py-0.5 rounded-full text-xs font-mono font-medium border shrink-0', getStatusColor(journey.is_current)]">
              {{ getStatusText(journey.is_current) }}
            </span>
          </div>
          <p class="text-xs text-zinc-300 mb-1 font-medium">{{ journey.company }}
            <span v-if="journey.location" class="text-zinc-500 font-mono"> • {{ journey.location }}</span>
          </p>
          <p class="text-xs font-mono text-zinc-500">{{ formatDateRange(journey.start_date, journey.end_date) }}</p>
        </div>

        <!-- Meta -->
        <div class="shrink-0 flex gap-1.5">
          <button
              @click.stop="openJourney(journey)"
              class="p-2 rounded-xl cursor-pointer bg-white/5 hover:bg-white/15 text-zinc-400 hover:text-white transition-all"
              title="Edit Experience"
          >
            <Icon name="carbon:pen" size="15"/>
          </button>
          <button
              @click.stop="deleteJourneyHandler(journey.id || 0)"
              class="p-2 rounded-xl cursor-pointer bg-white/5 hover:bg-rose-500/20 text-zinc-400 hover:text-rose-400 transition-all"
              title="Delete Experience"
          >
            <Icon name="carbon:trash-can" size="15"/>
          </button>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-if="journeys.length === 0" class="flex flex-col items-center justify-center py-20 rounded-2xl bg-[#141417] border border-white/10">
      <div class="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-zinc-500 mb-4">
        <Icon name="mdi:briefcase" size="24"/>
      </div>
      <h3 class="text-base font-bold text-white mb-1 tracking-tight">No work experience found</h3>
      <p class="text-xs text-zinc-400 text-center mb-6 max-w-sm">Start by adding your first professional role or career milestone.</p>
      <button
          @click="navigateTo('/dashboard/journeys/new')"
          class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-zinc-950 font-semibold hover:bg-zinc-200 transition-all shadow-sm text-sm cursor-pointer">
        <Icon name="carbon:add" size="18"/>
        Add Your First Experience
      </button>
    </div>

    <!-- Loading Indicator (Initial Load) -->
    <div v-if="isLoading && journeys.length === 0 && !isSearching"
         class="flex flex-col items-center justify-center py-20">
      <div class="w-10 h-10 border-2 border-white/20 border-t-white rounded-full animate-spin mb-4"></div>
      <p class="text-zinc-400 text-xs font-mono">Loading journeys...</p>
    </div>

    <!-- Scroll Trigger for Infinite Scroll (Load More) -->
    <div ref="scrollTriggerRef" class="h-10 flex items-center justify-center">
      <div v-if="isLoading && journeys.length > 0 && !isSearching && canLoadMore"
           class="flex items-center gap-2 text-white/60 text-sm">
        <Icon name="icon-park-outline:loading-four" size="16" class="animate-spin"/>
        <p>Loading more journeys...</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
</style>

