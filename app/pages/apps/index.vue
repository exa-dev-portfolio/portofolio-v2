<template>
  <div class="min-h-screen bg-slate-950 text-slate-100 selection:bg-cyan-500 selection:text-white">
    <!-- Background glow decoration -->
    <div class="fixed inset-0 overflow-hidden pointer-events-none z-0">
      <div class="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-cyan-500/10 blur-[130px] rounded-full"></div>
      <div class="absolute top-1/3 -left-40 w-[500px] h-[500px] bg-blue-600/10 blur-[140px] rounded-full"></div>
      <div class="absolute bottom-10 right-0 w-[450px] h-[450px] bg-emerald-500/10 blur-[130px] rounded-full"></div>
    </div>

    <!-- Navigation Header -->
    <header class="relative z-10 border-b border-white/5 backdrop-blur-md bg-slate-950/70 sticky top-0">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <NuxtLink to="/" class="flex items-center gap-3 group">
          <div class="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform">
            <UIcon name="i-carbon-application-mobile" class="w-5 h-5" />
          </div>
          <div>
            <span class="text-base font-bold text-white tracking-wide">Eka<span class="text-cyan-400">.Apps</span></span>
            <span class="hidden sm:inline-block ml-2 text-xs px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-mono">APK Hub</span>
          </div>
        </NuxtLink>

        <div class="flex items-center gap-4">
          <NuxtLink to="/" class="text-sm text-slate-400 hover:text-white transition-colors flex items-center gap-1.5">
            <UIcon name="i-carbon-arrow-left" class="w-4 h-4" />
            <span>Back to Portfolio</span>
          </NuxtLink>
        </div>
      </div>
    </header>

    <main class="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
      <!-- Hero Section -->
      <div class="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
        <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-medium mb-4">
          <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>Self-Hosted & Realtime GitHub Sync</span>
        </div>
        <h1 class="text-3xl sm:text-5xl font-extrabold tracking-tight text-white mb-4">
          Personal <span class="bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent">Android App Store</span>
        </h1>
        <p class="text-slate-400 text-base sm:text-lg leading-relaxed">
          Curated collection of Android applications built and maintained by me. Download official APK release binaries directly or scan the QR Code on your mobile device for instant installation.
        </p>
      </div>

      <!-- Search & Status Bar -->
      <div class="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
        <div class="relative w-full sm:w-80">
          <UIcon name="i-carbon-search" class="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search apps or package name..."
            class="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900/80 border border-white/10 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
          />
        </div>
        <div class="text-xs text-slate-400 flex items-center gap-2">
          <span>Showing {{ filteredApps.length }} published applications</span>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="pending" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div v-for="i in 3" :key="i" class="h-64 rounded-2xl bg-slate-900/50 border border-white/5 animate-pulse"></div>
      </div>

      <!-- Empty State -->
      <div v-else-if="filteredApps.length === 0" class="text-center py-20 rounded-2xl border border-dashed border-white/10 bg-slate-900/30">
        <div class="w-16 h-16 rounded-2xl bg-slate-800/80 border border-white/10 flex items-center justify-center mx-auto mb-4 text-slate-400">
          <UIcon name="i-carbon-application-mobile" class="w-8 h-8" />
        </div>
        <h3 class="text-lg font-semibold text-white mb-1">No Applications Found</h3>
        <p class="text-slate-400 text-sm max-w-md mx-auto mb-6">
          {{ searchQuery ? 'No applications match your search query.' : 'Applications released on GitHub will automatically appear here once synchronized.' }}
        </p>
        <NuxtLink to="/dashboard/apps" class="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-sm font-medium transition-colors">
          <UIcon name="i-carbon-settings" class="w-4 h-4" />
          <span>Manage Repositories in Dashboard</span>
        </NuxtLink>
      </div>

      <!-- Apps Grid -->
      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div
          v-for="app in filteredApps"
          :key="app.id"
          class="group relative rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-900/50 border border-white/10 p-6 flex flex-col justify-between hover:border-cyan-500/40 hover:shadow-xl hover:shadow-cyan-500/5 transition-all duration-300"
        >
          <!-- Card Top: Icon & Basic Info -->
          <div>
            <div class="flex items-start gap-4 mb-4">
              <!-- App Icon -->
              <div class="w-16 h-16 rounded-2xl bg-slate-800 border border-white/10 p-1 flex-shrink-0 flex items-center justify-center shadow-md overflow-hidden group-hover:scale-105 transition-transform">
                <img
                  v-if="app.icon_url"
                  :src="app.icon_url"
                  :alt="app.app_name"
                  class="w-full h-full object-cover rounded-xl"
                  @error="(e: any) => e.target.style.display = 'none'"
                />
                <UIcon v-else name="i-carbon-application-mobile" class="w-8 h-8 text-cyan-400" />
              </div>

              <!-- Titles & Badges -->
              <div class="flex-1 min-w-0">
                <h3 class="text-lg font-bold text-white truncate group-hover:text-cyan-400 transition-colors">
                  {{ app.app_name }}
                </h3>
                <p class="text-xs text-slate-400 font-mono truncate mb-2">
                  {{ app.package_name }}
                </p>
                <div class="flex flex-wrap items-center gap-1.5">
                  <span class="inline-flex items-center px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 text-xs font-semibold font-mono">
                    v{{ app.latest_version_name || '1.0.0' }}
                  </span>
                  <span v-if="app.latest_release?.file_size_bytes" class="text-[11px] text-slate-400 font-mono">
                    {{ formatFileSize(app.latest_release.file_size_bytes) }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Description -->
            <p v-if="app.description" class="text-xs text-slate-400 line-clamp-2 mb-4">
              {{ app.description }}
            </p>
            <p v-else class="text-xs text-slate-500 italic mb-4">
              Synced from repository: {{ app.repo_slug }}
            </p>

            <!-- Metadata Pills -->
            <div class="grid grid-cols-2 gap-2 text-[11px] bg-slate-950/60 rounded-xl p-2.5 border border-white/5 mb-5 font-mono">
              <div class="text-slate-400">
                <span>Released: </span>
                <span class="text-slate-200">{{ formatDate(app.latest_release?.published_at) }}</span>
              </div>
              <div class="text-slate-400 text-right">
                <span>Downloads: </span>
                <span class="text-emerald-400 font-semibold">{{ app.download_count }}x</span>
              </div>
            </div>
          </div>

          <!-- Card Bottom: Actions -->
          <div class="space-y-2 pt-2 border-t border-white/5">
            <!-- Direct Download Button -->
            <a
              :href="`/api/v1/apps/${app.package_name}/download`"
              class="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-medium text-sm shadow-lg shadow-cyan-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <UIcon name="i-carbon-download" class="w-4 h-4" />
              <span>Download APK</span>
            </a>

            <!-- Secondary Actions: QR Code & Details -->
            <div class="grid grid-cols-2 gap-2">
              <button
                @click="openQrModal(app)"
                class="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 text-xs font-medium border border-white/5 transition-colors"
              >
                <UIcon name="i-carbon-qr-code" class="w-3.5 h-3.5 text-cyan-400" />
                <span>Scan QR</span>
              </button>
              <button
                @click="openDetailModal(app)"
                class="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 text-xs font-medium border border-white/5 transition-colors"
              >
                <UIcon name="i-carbon-document-view" class="w-3.5 h-3.5 text-blue-400" />
                <span>Changelog</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- QR Code Scanner Modal -->
    <div
      v-if="activeQrApp"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
      @click.self="activeQrApp = null"
    >
      <div class="bg-slate-900 border border-white/10 rounded-2xl max-w-sm w-full p-6 text-center shadow-2xl relative">
        <button
          @click="activeQrApp = null"
          class="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
        >
          <UIcon name="i-carbon-close" class="w-5 h-5" />
        </button>

        <div class="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mx-auto mb-3 text-cyan-400">
          <UIcon name="i-carbon-qr-code" class="w-6 h-6" />
        </div>

        <h3 class="text-lg font-bold text-white mb-1">Scan to Download on Mobile</h3>
        <p class="text-xs text-slate-400 mb-5">
          Point your Android camera or QR code scanner at this code to download <strong class="text-white">{{ activeQrApp.app_name }}</strong> directly to your device.
        </p>

        <!-- QR Code Display -->
        <div class="bg-white p-4 rounded-xl inline-block shadow-inner mb-4">
          <img
            :src="getQrCodeUrl(activeQrApp)"
            alt="QR Code Download APK"
            class="w-48 h-48 mx-auto"
          />
        </div>

        <p class="text-[11px] font-mono text-slate-400 break-all bg-slate-950/80 px-3 py-2 rounded-lg border border-white/5 mb-4">
          {{ getFullDownloadUrl(activeQrApp) }}
        </p>

        <button
          @click="copyUrl(getFullDownloadUrl(activeQrApp))"
          class="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 font-medium border border-white/10 flex items-center justify-center gap-1.5 transition-colors"
        >
          <UIcon :name="copied ? 'i-carbon-checkmark' : 'i-carbon-copy'" class="w-4 h-4 text-cyan-400" />
          <span>{{ copied ? 'Link Copied!' : 'Copy Download Link' }}</span>
        </button>
      </div>
    </div>

    <!-- App Detail / Changelog Modal -->
    <div
      v-if="selectedAppDetail"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
      @click.self="selectedAppDetail = null"
    >
      <div class="bg-slate-900 border border-white/10 rounded-2xl max-w-xl w-full p-6 shadow-2xl relative max-h-[85vh] overflow-y-auto">
        <button
          @click="selectedAppDetail = null"
          class="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
        >
          <UIcon name="i-carbon-close" class="w-5 h-5" />
        </button>

        <div class="flex items-center gap-4 mb-6 pb-4 border-b border-white/10">
          <div class="w-14 h-14 rounded-2xl bg-slate-800 border border-white/10 p-1 flex items-center justify-center">
            <img
              v-if="selectedAppDetail.icon_url"
              :src="selectedAppDetail.icon_url"
              class="w-full h-full object-cover rounded-xl"
            />
            <UIcon v-else name="i-carbon-application-mobile" class="w-7 h-7 text-cyan-400" />
          </div>
          <div>
            <h2 class="text-xl font-bold text-white">{{ selectedAppDetail.app_name }}</h2>
            <p class="text-xs text-slate-400 font-mono">{{ selectedAppDetail.package_name }}</p>
          </div>
        </div>

        <!-- Release Information -->
        <div class="space-y-4">
          <div>
            <h4 class="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Latest Release Information</h4>
            <div class="grid grid-cols-2 gap-2 text-xs bg-slate-950/80 p-3 rounded-xl border border-white/5 font-mono">
              <div>Version: <span class="text-cyan-400 font-bold">v{{ selectedAppDetail.latest_version_name }}</span> (Code: {{ selectedAppDetail.latest_version_code }})</div>
              <div>Size: <span class="text-slate-200">{{ formatFileSize(selectedAppDetail.latest_release?.file_size_bytes) }}</span></div>
              <div v-if="selectedAppDetail.latest_release?.min_sdk">Min Android: <span class="text-slate-200">SDK {{ selectedAppDetail.latest_release.min_sdk }}+</span></div>
              <div>Total Downloads: <span class="text-emerald-400 font-bold">{{ selectedAppDetail.download_count }}x</span></div>
            </div>
          </div>

          <div v-if="selectedAppDetail.latest_release?.sha256_hash">
            <h4 class="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">SHA-256 Checksum</h4>
            <div class="text-[11px] font-mono text-slate-400 bg-slate-950/80 p-2.5 rounded-xl border border-white/5 break-all flex items-center justify-between gap-2">
              <span class="truncate">{{ selectedAppDetail.latest_release.sha256_hash }}</span>
              <button @click="copyUrl(selectedAppDetail.latest_release.sha256_hash)" class="text-cyan-400 hover:text-cyan-300">
                <UIcon name="i-carbon-copy" class="w-4 h-4" />
              </button>
            </div>
          </div>

          <div>
            <h4 class="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Release Notes & Changelog</h4>
            <div class="bg-slate-950/60 p-4 rounded-xl border border-white/5 text-xs text-slate-300 whitespace-pre-wrap font-sans leading-relaxed max-h-56 overflow-y-auto">
              {{ selectedAppDetail.latest_release?.changelog || 'No release notes provided for this version.' }}
            </div>
          </div>
        </div>

        <div class="mt-6 pt-4 border-t border-white/10 flex items-center justify-end gap-3">
          <a
            :href="`/api/v1/apps/${selectedAppDetail.package_name}/download`"
            class="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-xs font-semibold shadow-lg shadow-cyan-500/20 hover:scale-105 transition-all"
          >
            Download APK Now
          </a>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";

const { isApkStoreEnabled } = useFeatureFlag();
if (!isApkStoreEnabled.value) {
  throw createError({
    statusCode: 404,
    statusMessage: "Page Not Found",
    fatal: true,
  });
}

useSeoMeta({
  title: "Android Apps & APK Releases | Eka Portfolio",
  description: "Download official Android APK release binaries directly from GitHub releases.",
  ogTitle: "Android Apps & APK Releases | Eka Portfolio",
  ogDescription: "Curated collection of Android applications ready for direct APK download with automated GitHub synchronization.",
});

const { data: response, pending } = await useFetch<any>("/api/v1/apps");

const apps = computed(() => response.value?.data || []);
const searchQuery = ref("");
const activeQrApp = ref<any>(null);
const selectedAppDetail = ref<any>(null);
const copied = ref(false);

const filteredApps = computed(() => {
  if (!searchQuery.value.trim()) return apps.value;
  const q = searchQuery.value.toLowerCase();
  return apps.value.filter(
    (app: any) =>
      app.app_name?.toLowerCase().includes(q) ||
      app.package_name?.toLowerCase().includes(q) ||
      app.repo_slug?.toLowerCase().includes(q)
  );
});

const formatFileSize = (bytes?: number) => {
  if (!bytes) return "0 MB";
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(1)} MB`;
};

const formatDate = (dateString?: string) => {
  if (!dateString) return "-";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const getFullDownloadUrl = (app: any) => {
  if (import.meta.client) {
    return `${window.location.origin}/api/v1/apps/${app.package_name}/download`;
  }
  return `/api/v1/apps/${app.package_name}/download`;
};

const getQrCodeUrl = (app: any) => {
  const url = getFullDownloadUrl(app);
  return `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(url)}&bgcolor=ffffff&color=020617&qzone=1`;
};

const openQrModal = (app: any) => {
  activeQrApp.value = app;
  copied.value = false;
};

const openDetailModal = (app: any) => {
  selectedAppDetail.value = app;
};

const copyUrl = (text: string) => {
  if (navigator?.clipboard) {
    navigator.clipboard.writeText(text);
    copied.value = true;
    setTimeout(() => {
      copied.value = false;
    }, 2000);
  }
};
</script>
