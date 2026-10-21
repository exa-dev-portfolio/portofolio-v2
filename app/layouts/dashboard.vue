<script setup lang="ts">
import { ref, computed, watchEffect } from 'vue'
import { useBreadCrumbStore } from '~/stores/bread-crumb'
import { jwtDecode } from 'jwt-decode'

const isSidebarOpen = ref(false)
const breadCrumbStore = useBreadCrumbStore()
const route = useRoute()

// Decode user data from JWT token
const getUserFromToken = () => {
  try {
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
        id: decoded.sub || '',
      }
    }
  } catch (error) {
    console.error('Failed to decode token:', error)
  }

  return null
}

const tokenData = getUserFromToken()

const user = {
  name: tokenData?.name || 'Administrator',
  email: tokenData?.email || '',
  role: 'Full-Stack Developer',
}

const menuItems = [
  { name: 'Dashboard', icon: 'carbon:dashboard', href: '/dashboard' },
  { name: 'Projects', icon: 'carbon:folder-open', href: '/dashboard/projects' },
  { name: 'Apps (APK)', icon: 'carbon:application-mobile', href: '/dashboard/apps' },
  { name: 'Work', icon: 'mdi:briefcase', href: '/dashboard/journeys' },
  { name: 'Skills', icon: 'carbon:skill-level', href: '/dashboard/skills' },
  { name: 'Messages', icon: 'carbon:email', href: '/dashboard/messages' },
  { name: 'Apply', icon: 'carbon:send', href: '/dashboard/apply' },
  { name: 'Lowongan', icon: 'carbon:search', href: '/dashboard/jobs' },
  { name: 'Analytics', icon: 'carbon:chart-bar', href: '/dashboard/analytics' },
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
    await $fetch('/api/users/logout', {
      method: 'POST',
      credentials: 'include',
    })
  } catch (error) {
    console.error('Logout API error:', error)
  } finally {
    const tokenCookie = useCookie('token', {
      maxAge: 86400,
      path: '/',
      sameSite: 'lax',
      secure: import.meta.env.PROD,
    })
    tokenCookie.value = null
    await navigateTo('/login')
  }
}

// Generate initials from first two words of name
const getInitials = (name: string): string => {
  const words = name.trim().split(/\s+/)
  if (words.length >= 2) {
    return (words[0]!.charAt(0) + words[1]!.charAt(0)).toUpperCase()
  } else if (words.length === 1) {
    return words[0]!.substring(0, 2).toUpperCase()
  }
  return 'ED'
}

const isRouteActive = (href: string) => {
  if (href === '/dashboard') {
    return route.path === '/dashboard'
  }
  return route.path.startsWith(href)
}

watchEffect(() => {
  if (route.meta.breadCrumb) {
    breadCrumbStore.setBreadCrumb(route.meta.breadCrumb as Array<{ title: string; link?: string }>)
  }
})

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
  }),
})
</script>

<template>
  <div class="flex h-screen bg-[#09090b] text-[#f4f4f5] font-sans antialiased selection:bg-white selection:text-black">
    <!-- Sidebar - Desktop (hidden on mobile) -->
    <aside
      class="w-64 bg-[#141417] border-r border-white/10 flex flex-col h-screen overflow-y-auto fixed left-0 top-0 bottom-0 hidden lg:flex z-40"
    >
      <!-- Logo -->
      <div class="p-5 border-b border-white/10">
        <NuxtLink to="/dashboard" class="flex items-center gap-3 group">
          <div class="w-10 h-10 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center text-white shadow-sm shrink-0 group-hover:border-white/30 transition-colors">
            <Icon name="carbon:terminal" size="20" class="text-white" />
          </div>
          <div class="flex flex-col min-w-0">
            <div class="flex items-center gap-1.5">
              <span class="font-bold text-white text-base tracking-tight">Eka Dev.</span>
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            </div>
            <span class="text-[10px] text-zinc-400 font-mono tracking-wider uppercase">Admin Console</span>
          </div>
        </NuxtLink>
      </div>

      <!-- User Profile -->
      <div class="p-4 border-b border-white/10">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center text-white font-mono font-bold text-xs shrink-0 shadow-inner">
            {{ getInitials(user.name) }}
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-white font-semibold text-sm truncate tracking-tight">{{ user.name }}</p>
            <p class="text-zinc-400 text-xs truncate font-mono">{{ user.role }}</p>
          </div>
        </div>
      </div>

      <!-- Navigation Menu -->
      <nav class="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <NuxtLink
          v-for="item in displayMenuItems"
          :key="item.href"
          :to="item.href"
          class="flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all duration-200 text-sm font-medium group cursor-pointer"
          :class="[
            isRouteActive(item.href)
              ? 'bg-white text-zinc-950 font-semibold shadow-sm'
              : 'text-zinc-400 hover:text-white hover:bg-white/5'
          ]"
        >
          <Icon
            :name="item.icon"
            size="18"
            :class="[
              isRouteActive(item.href)
                ? 'text-zinc-950'
                : 'text-zinc-400 group-hover:text-white group-hover:scale-105 transition-all'
            ]"
          />
          <span class="tracking-tight">{{ item.name }}</span>
        </NuxtLink>
      </nav>

      <!-- Footer -->
      <div class="p-3 border-t border-white/10 space-y-1">
        <NuxtLink
          to="/dashboard/settings"
          class="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all text-sm font-medium cursor-pointer"
          :class="isRouteActive('/dashboard/settings') ? 'bg-white text-zinc-950 font-semibold shadow-sm' : 'text-zinc-400 hover:bg-white/5 hover:text-white'"
        >
          <Icon name="carbon:settings" size="18" :class="isRouteActive('/dashboard/settings') ? 'text-zinc-950' : 'text-zinc-400'" />
          <span>Settings</span>
        </NuxtLink>
        <button
          @click="handleLogout"
          class="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-zinc-400 hover:bg-rose-500/10 hover:text-rose-400 transition-all text-sm font-medium cursor-pointer"
        >
          <Icon name="carbon:logout" size="18" />
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
        class="fixed inset-0 bg-black/70 backdrop-blur-xs lg:hidden z-30"
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
        class="w-64 bg-[#141417] border-r border-white/10 flex flex-col h-screen overflow-y-auto fixed left-0 top-0 bottom-0 lg:hidden z-40"
      >
        <!-- Logo -->
        <div class="p-5 border-b border-white/10 flex items-center justify-between">
          <NuxtLink to="/dashboard" @click="closeSidebar" class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center text-white shadow-sm shrink-0">
              <Icon name="carbon:terminal" size="18" class="text-white" />
            </div>
            <div class="flex flex-col min-w-0">
              <span class="font-bold text-white text-sm tracking-tight">Eka Dev.</span>
              <span class="text-[10px] text-zinc-400 font-mono tracking-wider uppercase">Console</span>
            </div>
          </NuxtLink>
          <button
            @click="closeSidebar"
            class="p-2 rounded-xl bg-white/5 border border-white/10 text-zinc-400 hover:text-white transition-all cursor-pointer"
            aria-label="Close sidebar"
          >
            <Icon name="carbon:close" size="18" />
          </button>
        </div>

        <!-- User Profile -->
        <div class="p-4 border-b border-white/10">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center text-white font-mono font-bold text-xs shrink-0 shadow-inner">
              {{ getInitials(user.name) }}
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-white font-semibold text-sm truncate tracking-tight">{{ user.name }}</p>
              <p class="text-zinc-400 text-xs truncate font-mono">{{ user.role }}</p>
            </div>
          </div>
        </div>

        <!-- Navigation Menu -->
        <nav class="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <NuxtLink
            v-for="item in displayMenuItems"
            :key="item.href"
            :to="item.href"
            @click="closeSidebar"
            class="flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all duration-200 text-sm font-medium group cursor-pointer"
            :class="[
              isRouteActive(item.href)
                ? 'bg-white text-zinc-950 font-semibold shadow-sm'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            ]"
          >
            <Icon
              :name="item.icon"
              size="18"
              :class="[
                isRouteActive(item.href)
                  ? 'text-zinc-950'
                  : 'text-zinc-400 group-hover:text-white group-hover:scale-105 transition-all'
              ]"
            />
            <span class="tracking-tight">{{ item.name }}</span>
          </NuxtLink>
        </nav>

        <!-- Footer -->
        <div class="p-3 border-t border-white/10 space-y-1">
          <NuxtLink
            to="/dashboard/settings"
            @click="closeSidebar"
            class="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all text-sm font-medium cursor-pointer"
            :class="isRouteActive('/dashboard/settings') ? 'bg-white text-zinc-950 font-semibold shadow-sm' : 'text-zinc-400 hover:bg-white/5 hover:text-white'"
          >
            <Icon name="carbon:settings" size="18" :class="isRouteActive('/dashboard/settings') ? 'text-zinc-950' : 'text-zinc-400'" />
            <span>Settings</span>
          </NuxtLink>
          <button
            @click="handleLogout"
            class="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-zinc-400 hover:bg-rose-500/10 hover:text-rose-400 transition-all text-sm font-medium cursor-pointer"
          >
            <Icon name="carbon:logout" size="18" />
            <span>Log Out</span>
          </button>
        </div>
      </aside>
    </Transition>

    <!-- Main Content -->
    <div class="flex-1 flex flex-col ml-0 lg:ml-64 h-screen min-w-0">
      <!-- Top Navigation Bar -->
      <header class="h-16 border-b border-white/10 bg-[#141417]/80 backdrop-blur-md sticky top-0 z-30 flex items-center px-4 lg:px-8 justify-between shrink-0">
        <!-- Mobile Menu Button & Breadcrumb -->
        <div class="flex items-center gap-3 min-w-0">
          <button
            @click="toggleSidebar"
            class="lg:hidden p-2 rounded-xl bg-white/5 border border-white/10 text-zinc-400 hover:text-white transition-all cursor-pointer"
            aria-label="Open sidebar"
          >
            <Icon name="carbon:menu" size="20" />
          </button>

          <div class="flex items-center gap-2 text-zinc-400 text-xs sm:text-sm font-medium min-w-0">
            <slot name="breadcrumb">
              <template v-for="(crumb, index) in breadCrumbStore.listBreadCrumbs" :key="index">
                <NuxtLink
                  v-if="crumb.link"
                  :to="crumb.link"
                  class="hover:text-white transition-colors truncate max-w-[120px] sm:max-w-none"
                >
                  {{ crumb.title }}
                </NuxtLink>
                <span v-else class="text-white truncate max-w-[140px] sm:max-w-none font-semibold">{{ crumb.title }}</span>
                <Icon
                  v-if="index < breadCrumbStore.listBreadCrumbs.length - 1"
                  name="material-symbols:chevron-right"
                  size="16"
                  class="text-zinc-600 shrink-0"
                />
              </template>
            </slot>
          </div>
        </div>

        <!-- Right Header Action: Live Site Link -->
        <div class="flex items-center gap-3">
          <NuxtLink
            to="/"
            target="_blank"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs font-mono text-zinc-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="View Public Portfolio"
          >
            <span>Live Site</span>
            <Icon name="carbon:arrow-up-right" size="12" />
          </NuxtLink>
        </div>
      </header>

      <!-- Page Content -->
      <main class="flex-1 overflow-y-auto bg-[#09090b]">
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

