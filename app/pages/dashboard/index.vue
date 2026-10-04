<script setup lang="ts">
import {computed, ref} from 'vue'
import {useDashboardStats} from "~/composables/useDashboardStats";
import {useProject} from "~/composables/useProject";

definePageMeta({
  layout: 'dashboard',
  breadCrumb: []
})

const userName = ref('User')
const {fetchStats} = useDashboardStats()
const {fetchProjects} = useProject()

// Fetch data on server-side using useFetch
const {data: projectsData} = await useAsyncData(
    'dashboard-projects',
    async () => await fetchProjects(false, ''),
)

const {data: statsData,} = await useAsyncData(
    'dashboard-stats',
    async () => await fetchStats(),
)

// Extract data from responses
const projects = computed(() => {
  return projectsData.value?.data ?? []
})

const dashboardStats = computed(() => {
  return statsData.value ?? null
})

const getStatusLabel = (status: any) => {
  if (status === 'published' || status === true) return 'Published'
  if (status === 'archived') return 'Archived'
  return 'Draft'
}

const stats = computed(() => [
  {
    label: 'Total Projects',
    value: dashboardStats.value?.projects.total.toString() ?? '0',
    icon: 'carbon:folder-open',
    color: 'from-blue-500 to-blue-600'
  },
  {
    label: 'Published',
    value: dashboardStats.value?.projects.published.toString() ?? '0',
    icon: 'pepicons-pop:checkmark-circle-filled',
    color: 'from-green-500 to-green-600'
  },
  {
    label: 'In Draft',
    value: dashboardStats.value?.projects.draft.toString() ?? '0',
    icon: 'carbon:document-add',
    color: 'from-yellow-500 to-yellow-600'
  },
  {
    label: 'Archived',
    value: (dashboardStats.value?.projects.archived ?? 0).toString(),
    icon: 'carbon:archive',
    color: 'from-amber-500 to-orange-600'
  },
  {
    label: 'Total Skills',
    value: dashboardStats.value?.skills.total.toString() ?? '0',
    icon: 'carbon:view',
    color: 'from-purple-500 to-purple-600'
  }
])

const recentProjects = computed(() => {
  return projects.value
      .slice(0, 3)
      .map((p: any) => ({
        id: p.id,
        title: p.name,
        status: getStatusLabel(p.status),
        updatedAt: formatDate(p.updated_at)
      }))
})

// Set page title
useHead({
  title: "Dashboard Overview | Eka Dev",
});
</script>

<template>
  <div class="p-8">
    <!-- Welcome Section -->
    <div class="mb-10">
      <div class="flex items-center gap-3 mb-2">
        <h1 class="text-4xl font-black text-white tracking-tight">Dashboard Overview</h1>
        <span class="text-xs font-mono font-semibold px-2.5 py-1 rounded-full bg-primary/20 text-primary border border-primary/30">
          Admin Portal
        </span>
      </div>
      <p class="text-white/60">
        Welcome back, <span class="text-white font-medium">{{ userName }}</span>! 👋 Here's what's happening with your portfolio today.
      </p>
    </div>

    <!-- Stats Grid -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-12">
      <div
          v-for="stat in stats"
          :key="stat.label"
          class="group relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:border-primary/50 transition-all duration-300 overflow-hidden"
      >
        <!-- Background gradient -->
        <div
            :class="['absolute inset-0 bg-linear-to-br opacity-0 group-hover:opacity-5 transition-opacity', stat.color]"></div>

        <!-- Content -->
        <div class="relative z-10">
          <div class="flex items-start justify-between mb-4">
            <div :class="['w-12 h-12 rounded-lg flex items-center justify-center', `bg-linear-to-br ${stat.color}`]">
              <Icon :name="stat.icon" size="24" class="text-white"/>
            </div>
            <Icon name="carbon:arrow-up-right" size="20"
                  class="text-green-400 opacity-0 group-hover:opacity-100 transition-opacity"/>
          </div>

          <p class="text-3xl font-black text-white mb-1">{{ stat.value }}</p>
          <p class="text-sm text-white/60">{{ stat.label }}</p>
        </div>
      </div>
    </div>

    <!-- Recent Projects Section -->
    <div class="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden">
      <!-- Header -->
      <div class="p-6 border-b border-white/10 flex items-center justify-between">
        <div>
          <h2 class="text-2xl font-bold text-white">Recent Projects</h2>
          <p class="text-sm text-white/60 mt-1">Your latest updates</p>
        </div>
        <NuxtLink to="/dashboard/projects"
                  class="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-primary hover:bg-primary/10 transition-colors text-sm font-semibold">
          View All
          <Icon name="carbon:arrow-right" size="16"/>
        </NuxtLink>
      </div>

      <!-- Table -->
      <div class="overflow-x-auto">
        <!--        <table v-if="!isLoading" class="w-full">-->
        <table class="w-full">
          <thead>
          <tr class="border-b border-white/10">
            <th class="text-left px-6 py-4 text-xs font-semibold text-white/60 uppercase tracking-wider">Project</th>
            <th class="text-left px-6 py-4 text-xs font-semibold text-white/60 uppercase tracking-wider">Status</th>
            <th class="text-left px-6 py-4 text-xs font-semibold text-white/60 uppercase tracking-wider">Updated</th>
          </tr>
          </thead>
          <tbody>
          <tr
              v-for="project in recentProjects"
              :key="project.id"
              class="border-b border-white/10 hover:bg-white/5 transition-colors"
          >
            <td class="px-6 py-4">
              <p class="font-semibold text-white">{{ project.title }}</p>
            </td>
            <td class="px-6 py-4">
                <span :class="[
                  'px-3 py-1 rounded-full text-xs font-semibold border',
                  project.status === 'Published'
                    ? 'bg-green-500/20 text-green-400 border-green-500/40'
                    : project.status === 'Archived'
                      ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                      : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40'
                ]">
                  {{ project.status }}
                </span>
            </td>
            <td class="px-6 py-4 text-white/60 text-sm">{{ project.updatedAt }}</td>

          </tr>
          </tbody>
        </table>

        <!--        &lt;!&ndash; Loading skeleton &ndash;&gt;-->
        <!--        <div v-else class="space-y-3">-->
        <!--          <div v-for="i in 3" :key="i" class="animate-pulse">-->
        <!--            <div class="h-16 bg-white/5 rounded-lg"></div>-->
        <!--          </div>-->
        <!--        </div>-->
      </div>
    </div>
  </div>
</template>

<style scoped>
</style>

