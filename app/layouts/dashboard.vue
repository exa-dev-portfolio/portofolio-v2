<script setup lang="ts">
import {ref, computed} from 'vue'
import {useBreadCrumbStore} from "~/stores/bread-crumb"
import {jwtDecode} from 'jwt-decode'

const isSidebarOpen = ref(false)
const breadCrumbStore = useBreadCrumbStore()
const route = useRoute()

// Decode user data from JWT token
const getUserFromToken = () => {
  try {
    // Use useCookie for consistent cookie handling
    const tokenCookie = useCookie('token', {
      maxAge: 86400,
      path: '/',
      sameSite: 'lax',
      secure: import.meta.env.PROD,
      readonly: true,
    })

    const token = tokenCookie.value

    if (token) {
      const decoded: any = jwtDecode(token)
      return {
        name: decoded.name || 'User',
        email: decoded.email || '',
        id: decoded.sub || ''
      }
    }
  } catch (error) {
    console.error('Failed to decode token:', error)
  }

  return null
}

const tokenData = getUserFromToken()

const user = {
  name: tokenData?.name || '',
  email: tokenData?.email || '',
  role: 'Full-Stack Developer',
  avatar: 'https://via.placeholder.com/150'
}

const menuItems = [
  {name: 'Dashboard', icon: 'carbon:dashboard', href: '/dashboard'},
  {name: 'Projects', icon: 'carbon:folder-open', href: '/dashboard/projects'},
  {name: 'Apps (APK)', icon: 'carbon:application-mobile', href: '/dashboard/apps'},
  {name: 'Work', icon: 'mdi:briefcase', href: '/dashboard/journeys'},
  {name: 'Skills', icon: 'carbon:skill-level', href: '/dashboard/skills'},
  {name: 'Messages', icon: 'carbon:email', href: '/dashboard/messages'},
  {name: 'Apply', icon: 'carbon:send', href: '/dashboard/apply'},
  {name: 'Lowongan', icon: 'carbon:search', href: '/dashboard/jobs'},
  {name: 'Analytics', icon: 'carbon:chart-bar', href: '/dashboard/analytics'},
]

const { isApkStoreEnabled } = useFeatureFlag()
const displayMenuItems = computed(() => {
  return menuItems.filter((item) => {
    if (item.href === '/dashboard/apps' && !isApkStoreEnabled.value) {
      return false
    }
    return true
  })
})

const toggleSidebar = () => {
  isSidebarOpen.value = !isSidebarOpen.value
}

const closeSidebar = () => {
  isSidebarOpen.value = false
}

const handleLogout = async () => {
  try {
    // Call logout API endpoint
    await $fetch('/api/users/logout', {
      method: 'POST',
      credentials: 'include'
    })
  } catch (error) {
    console.error('Logout API error:', error)
  } finally {
    // Clear cookie
    const tokenCookie = useCookie('token', {
      maxAge: 86400,
      path: '/',
      sameSite: 'lax',
      secure: import.meta.env.PROD,
    })
    tokenCookie.value = null

    // Redirect to login page
    await navigateTo('/login')
  }
}

// Generate initials from first two words of name
const getInitials = (name: string): string => {
  const words = name.trim().split(/\s+/)
  if (words.length >= 2) {
    // Ambil huruf pertama dari 2 kata pertama
    return (words[0]!.charAt(0) + words[1]!.charAt(0)).toUpperCase()
  } else if (words.length === 1) {
    // Jika hanya 1 kata, ambil 2 huruf pertama dari kata itu
    return words[0]!.substring(0, 2).toUpperCase()
  }
  return 'U'
}

// Generate consistent color based on name
const getAvatarColor = (name: string) => {
  const colors = [
    {from: '#3b82f6', to: '#2563eb'},  // blue
    {from: '#a855f7', to: '#9333ea'},  // purple
    {from: '#ec4899', to: '#db2777'},  // pink
    {from: '#10b981', to: '#059669'},  // green
    {from: '#f97316', to: '#ea580c'},  // orange
    {from: '#ef4444', to: '#dc2626'},  // red
    {from: '#06b6d4', to: '#0891b2'},  // cyan
    {from: '#6366f1', to: '#4f46e5'}   // indigo
  ]

  // Create consistent hash from name
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }

  const index = Math.abs(hash) % colors.length
  return colors[index]
}

// Get avatar background style
const getAvatarStyle = (name: string) => {
  const color = getAvatarColor(name)
  return {
    background: `linear-gradient(135deg, ${color!.from} 0%, ${color!.to} 100%)`
  }
}

watchEffect(
    () => {
      if (route.meta.breadCrumb) {
        breadCrumbStore.setBreadCrumb(route.meta.breadCrumb as Array<{ title: string; link?: string }>)
      }
    }
)

useHead({
  title: computed(() => {
    const list = breadCrumbStore.listBreadCrumbs
    if (list && list.length > 1) {
      const activeCrumb = list[list.length - 1]
      if (activeCrumb?.title) {
        return `${activeCrumb.title} | Dashboard`
      }
    }
    return 'Dashboard | Eka Dev'
  })
})


</script>

<template>
  <div class="flex h-screen bg-[#0a0f1a]">
    <!-- Sidebar - Desktop (hidden on mobile) -->
    <aside
        class="w-64 bg-[#0f1520] border-r border-white/10 flex-col h-screen overflow-y-auto fixed left-0 top-0 bottom-0 hidden lg:flex z-40">
      <!-- Logo -->
      <div class="p-6 border-b border-white/10">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center border border-white/5">
            <Icon name="carbon:terminal" size="24" class="text-primary"/>
          </div>
          <span class="font-bold text-white text-lg">Eka Dev.</span>
        </div>
      </div>

      <!-- User Profile -->
      <div class="p-6 border-b border-white/10">
        <div class="flex items-center gap-3 mb-4">
          <div
              class="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
              :style="getAvatarStyle(user.name)">
            {{ getInitials(user.name) }}
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-white font-semibold text-sm truncate">{{ user.name }}</p>
            <p class="text-white/50 text-xs truncate">{{ user.role }}</p>
          </div>
        </div>
      </div>

      <!-- Navigation Menu -->
      <nav class="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        <NuxtLink
            v-for="item in displayMenuItems"
            :key="item.href"
            :to="item.href"
            class="flex items-center gap-3 px-4 py-3 rounded-lg text-white/70 hover:bg-white/5 hover:text-white transition-all duration-300 group"
            active-class="bg-primary/10 text-primary"
        >
          <Icon :name="item.icon" size="20" class="group-hover:scale-110 transition-transform"/>
          <span class="text-sm font-medium">{{ item.name }}</span>
        </NuxtLink>
      </nav>

      <!-- Footer -->
      <div class="p-4 border-t border-white/10 space-y-2">
        <NuxtLink
            to="/dashboard/settings"
            class="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-white/70 hover:bg-white/5 hover:text-white transition-all text-sm font-medium"
        >
          <Icon name="carbon:settings" size="20"/>
          <span>Settings</span>
        </NuxtLink>
        <button
            @click="handleLogout"
            class="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-white/70 hover:bg-red-500/10 hover:text-red-400 transition-all text-sm font-medium">
          <Icon name="carbon:logout" size="20"/>
          <span>Log Out</span>
        </button>
      </div>
    </aside>

    <!-- Mobile Sidebar Overlay -->
    <Transition
        enter-active-class="transition duration-300 ease-out"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition duration-200 ease-in"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
    >
      <div
          v-show="isSidebarOpen"
          class="fixed inset-0 bg-black/50 lg:hidden z-30"
          @click="closeSidebar"
      ></div>
    </Transition>

    <!-- Sidebar - Mobile (slide in from left) -->
    <Transition
        enter-active-class="transition duration-300 ease-out"
        enter-from-class="-translate-x-full"
        enter-to-class="translate-x-0"
        leave-active-class="transition duration-200 ease-in"
        leave-from-class="translate-x-0"
        leave-to-class="-translate-x-full"
    >
      <aside
          v-show="isSidebarOpen"
          class="w-64 bg-[#0f1520] border-r border-white/10 flex flex-col h-screen overflow-y-auto fixed left-0 top-0 bottom-0 lg:hidden z-40"
      >
        <!-- Logo -->
        <div class="p-6 border-b border-white/10 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center border border-white/5">
              <Icon name="carbon:terminal" size="24" class="text-primary"/>
            </div>
            <span class="font-bold text-white text-lg">Eka Dev.</span>
          </div>
          <button @click="closeSidebar"
                  class="p-2 rounded-lg hover:bg-white/5 text-white/50 hover:text-white transition-all lg:hidden">
            <Icon name="carbon:close" size="20"/>
          </button>
        </div>

        <!-- User Profile -->
        <div class="p-6 border-b border-white/10">
          <div class="flex items-center gap-3 mb-4">
            <div
                class="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
                :style="getAvatarStyle(user.name)">
              {{ getInitials(user.name) }}
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-white font-semibold text-sm truncate">{{ user.name }}</p>
              <p class="text-white/50 text-xs truncate">{{ user.role }}</p>
            </div>
          </div>
        </div>

        <!-- Navigation Menu -->
        <nav class="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          <NuxtLink
              v-for="item in displayMenuItems"
              :key="item.href"
              :to="item.href"
              @click="closeSidebar"
              class="flex items-center gap-3 px-4 py-3 rounded-lg text-white/70 hover:bg-white/5 hover:text-white transition-all duration-300 group"
              active-class="bg-primary/10 text-primary"
          >
            <Icon :name="item.icon" size="20" class="group-hover:scale-110 transition-transform"/>
            <span class="text-sm font-medium">{{ item.name }}</span>
          </NuxtLink>
        </nav>

        <!-- Footer -->
        <div class="p-4 border-t border-white/10 space-y-2">
          <NuxtLink
              to="/dashboard/settings"
              @click="closeSidebar"
              class="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-white/70 hover:bg-white/5 hover:text-white transition-all text-sm font-medium"
          >
            <Icon name="carbon:settings" size="20"/>
            <span>Settings</span>
          </NuxtLink>
          <button
              @click="handleLogout"
              class="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-white/70 hover:bg-red-500/10 hover:text-red-400 transition-all text-sm font-medium">
            <Icon name="carbon:logout" size="20"/>
            <span>Log Out</span>
          </button>
        </div>
      </aside>
    </Transition>

    <!-- Main Content -->
    <div class="flex-1 flex flex-col ml-0 lg:ml-64 h-screen">
      <!-- Top Navigation Bar -->
      <header class="h-16 border-b border-white/10 bg-[#0f1520] flex items-center px-4 lg:px-8">
        <!-- Mobile Menu Button -->
        <button
            @click="toggleSidebar"
            class="lg:hidden p-2 rounded-lg hover:bg-white/5 text-white/70 hover:text-white transition-all mr-4"
        >
          <Icon name="carbon:menu" size="24"/>
        </button>

        <div class="flex-1 flex items-center gap-4">
          <div class="flex items-center gap-2 text-white/50 text-sm">
            <slot name="breadcrumb">
              <template v-for="(crumb, index) in breadCrumbStore.listBreadCrumbs" :key="index">
                <NuxtLink
                    v-if="crumb.link"
                    :to="crumb.link"
                    class="hover:text-white transition-colors"
                >
                  {{ crumb.title }}
                </NuxtLink>
                <span v-else class="text-white">{{ crumb.title }}</span>
                <Icon
                    v-if="index < breadCrumbStore.listBreadCrumbs.length - 1"
                    name="material-symbols:chevron-right"
                    size="16"
                    class="hidden sm:block"
                />
              </template>
            </slot>
          </div>
        </div>
      </header>

      <!-- Page Content -->
      <main class="flex-1 overflow-y-auto">
        <slot></slot>
      </main>
    </div>
  </div>
</template>

<style scoped>
/* Custom scrollbar */
::-webkit-scrollbar {
  width: 6px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.2);
}
</style>

