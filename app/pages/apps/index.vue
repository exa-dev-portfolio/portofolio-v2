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

      <!-- Search & Status Filter Bar -->
      <div class="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 mb-8">
        <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <!-- Search Input -->
          <div class="relative w-full sm:w-72">
            <UIcon name="i-carbon-search" class="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search apps or package..."
              class="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900/80 border border-white/10 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
            />
          </div>

          <!-- Status Filter Pills -->
          <div class="flex items-center gap-1 p-1 rounded-xl bg-slate-900/80 border border-white/10 self-start sm:self-auto">
            <button
              @click="selectedStatusFilter = 'all'"
              :class="[
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer',
                selectedStatusFilter === 'all'
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/25'
                  : 'text-slate-400 hover:text-white'
              ]"
            >
              All ({{ counts.all }})
            </button>
            <button
              @click="selectedStatusFilter = 'production'"
              :class="[
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer',
                selectedStatusFilter === 'production'
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/25'
                  : 'text-slate-400 hover:text-emerald-400'
              ]"
            >
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>Full Release ({{ counts.production }})</span>
            </button>
            <button
              @click="selectedStatusFilter = 'development'"
              :class="[
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer',
                selectedStatusFilter === 'development'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/25'
                  : 'text-slate-400 hover:text-amber-400'
              ]"
            >
              <span class="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              <span>Development ({{ counts.development }})</span>
            </button>
          </div>
        </div>

        <div class="text-xs text-slate-400 flex items-center gap-2">
          <span>Showing {{ filteredApps.length }} of {{ apps.length }} apps</span>
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

                  <!-- Status Badge -->
                  <span
                    :class="[
                      'inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold font-mono border',
                      (app.status || 'development') === 'production'
                        ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                        : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                    ]"
                  >
                    <span
                      :class="[
                        'w-1.5 h-1.5 rounded-full',
                        (app.status || 'development') === 'production' ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'
                      ]"
                    />
                    {{ (app.status || 'development') === 'production' ? 'Full Release' : 'Development' }}
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
              class="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-medium text-sm shadow-lg shadow-cyan-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              <UIcon name="i-carbon-download" class="w-4 h-4" />
              <span>Download APK</span>
            </a>

            <!-- Official Store Channels (TestFlight / Google Play) -->
            <button
              @click="openBetaModal(app)"
              class="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-white text-xs font-semibold border border-white/10 hover:border-cyan-500/30 transition-all cursor-pointer"
            >
              <UIcon name="i-carbon-badge" class="w-3.5 h-3.5 text-cyan-400" />
              <span>Official Store Invite (iOS & Android)</span>
            </button>

            <!-- Secondary Actions: QR Code & Details -->
            <div class="grid grid-cols-2 gap-2">
              <button
                @click="openQrModal(app)"
                class="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 text-xs font-medium border border-white/5 transition-colors cursor-pointer"
              >
                <UIcon name="i-carbon-qr-code" class="w-3.5 h-3.5 text-cyan-400" />
                <span>Scan QR</span>
              </button>
              <button
                @click="openDetailModal(app)"
                class="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 text-xs font-medium border border-white/5 transition-colors cursor-pointer"
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
      <div class="bg-slate-900 border border-white/10 rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative max-h-[88vh] flex flex-col">
        <button
          @click="selectedAppDetail = null"
          class="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors z-10 cursor-pointer"
        >
          <UIcon name="i-carbon-close" class="w-5 h-5" />
        </button>

        <!-- Header -->
        <div class="flex items-center gap-4 pb-4 border-b border-white/10 shrink-0">
          <div class="w-14 h-14 rounded-2xl bg-slate-800 border border-white/10 p-1 flex items-center justify-center shrink-0">
            <img
              v-if="selectedAppDetail.icon_url"
              :src="selectedAppDetail.icon_url"
              class="w-full h-full object-cover rounded-xl"
            />
            <UIcon v-else name="i-carbon-application-mobile" class="w-7 h-7 text-cyan-400" />
          </div>
          <div class="min-w-0 pr-8">
            <div class="flex items-center gap-2 mb-1">
              <h2 class="text-xl font-bold text-white truncate">{{ selectedAppDetail.app_name }}</h2>
              <span
                :class="[
                  'text-[10px] px-2.5 py-0.5 rounded-full font-mono font-bold uppercase tracking-wider border flex items-center gap-1 shrink-0',
                  (selectedAppDetail.status || 'development') === 'production'
                    ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                    : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                ]"
              >
                <span
                  :class="[
                    'w-1.5 h-1.5 rounded-full',
                    (selectedAppDetail.status || 'development') === 'production' ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'
                  ]"
                />
                {{ (selectedAppDetail.status || 'development') === 'production' ? 'Full Release' : 'Development' }}
              </span>
            </div>
            <p class="text-xs text-slate-400 font-mono truncate">{{ selectedAppDetail.package_name }}</p>
          </div>
        </div>

        <!-- Scrollable Content Body -->
        <div class="space-y-4 pt-4 overflow-y-auto pr-1">
          <!-- Development Mode Banner -->
          <div
            v-if="(selectedAppDetail.status || 'development') === 'development'"
            class="flex items-center gap-2.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs"
          >
            <UIcon name="i-carbon-warning-alt" class="w-4 h-4 shrink-0 text-amber-400" />
            <span>This build is currently in <strong>Development / Testing</strong> status. You can download and test this APK directly on your device.</span>
          </div>
          <!-- Multi-version Switcher (if app has multiple releases) -->
          <div v-if="selectedAppDetail.releases && selectedAppDetail.releases.length > 1">
            <h4 class="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Available Versions</h4>
            <div class="flex items-center gap-2 overflow-x-auto pb-1">
              <button
                v-for="(rel, idx) in selectedAppDetail.releases"
                :key="rel.id || idx"
                @click="selectedReleaseIndex = idx"
                :class="[
                  'px-3 py-1.5 rounded-xl text-xs font-mono font-medium transition-all shrink-0 cursor-pointer',
                  selectedReleaseIndex === idx
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/25'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700/80 border border-white/5'
                ]"
              >
                v{{ rel.version_name || rel.tag_name }}
                <span v-if="idx === 0" class="ml-1 text-[10px] opacity-75 font-sans">(latest)</span>
              </button>
            </div>
          </div>

          <!-- Active Release Details -->
          <div>
            <h4 class="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Release Information</h4>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs bg-slate-950/80 p-3 rounded-xl border border-white/5 font-mono">
              <div>
                <span class="text-slate-400 block text-[10px] uppercase font-sans">Version</span>
                <span class="text-cyan-400 font-bold">v{{ currentRelease?.version_name || selectedAppDetail.latest_version_name }}</span>
              </div>
              <div>
                <span class="text-slate-400 block text-[10px] uppercase font-sans">Build Code</span>
                <span class="text-slate-200">{{ currentRelease?.version_code || selectedAppDetail.latest_version_code }}</span>
              </div>
              <div>
                <span class="text-slate-400 block text-[10px] uppercase font-sans">File Size</span>
                <span class="text-slate-200">{{ formatFileSize(currentRelease?.file_size_bytes) }}</span>
              </div>
              <div>
                <span class="text-slate-400 block text-[10px] uppercase font-sans">Min / Target SDK</span>
                <span class="text-slate-200">{{ currentRelease?.target_sdk ? `API ${currentRelease.target_sdk}` : (currentRelease?.min_sdk ? `SDK ${currentRelease.min_sdk}+` : '-') }}</span>
              </div>
            </div>
          </div>

          <!-- Checksum -->
          <div v-if="currentRelease?.sha256_hash">
            <h4 class="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">SHA-256 Checksum</h4>
            <div class="text-[11px] font-mono text-slate-400 bg-slate-950/80 p-2.5 rounded-xl border border-white/5 break-all flex items-center justify-between gap-2">
              <span class="truncate">{{ currentRelease.sha256_hash }}</span>
              <button
                @click="copyUrl(currentRelease.sha256_hash)"
                class="text-cyan-400 hover:text-cyan-300 shrink-0 cursor-pointer"
                title="Copy SHA-256 Hash"
              >
                <UIcon :name="copied ? 'i-carbon-checkmark' : 'i-carbon-copy'" class="w-4 h-4" />
              </button>
            </div>
          </div>

          <!-- Release Notes & Changelog (Rendered Markdown) -->
          <div>
            <div class="flex items-center justify-between mb-2">
              <h4 class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Release Notes & Changelog</h4>
              <span v-if="currentRelease?.published_at" class="text-[11px] text-slate-400">
                Released on {{ formatDate(currentRelease.published_at) }}
              </span>
            </div>

            <!-- Beautiful Markdown Output -->
            <div
              v-if="currentRelease?.changelog"
              class="bg-slate-950/70 p-4 rounded-xl border border-white/10 changelog-prose max-h-72 overflow-y-auto"
              v-html="renderMarkdown(currentRelease.changelog)"
            />
            <div
              v-else
              class="bg-slate-950/50 p-6 rounded-xl border border-white/5 text-xs text-slate-400 italic text-center"
            >
              No release notes provided for this version.
            </div>
          </div>
        </div>

        <!-- Footer / Download Action -->
        <div class="mt-4 pt-4 border-t border-white/10 flex items-center justify-between gap-3 shrink-0">
          <div class="text-xs text-slate-400">
            Total app downloads: <span class="text-emerald-400 font-bold font-mono">{{ selectedAppDetail.download_count }}x</span>
          </div>
          <div class="flex items-center gap-2">
            <button
              @click="openBetaModal(selectedAppDetail)"
              class="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold border border-white/10 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <UIcon name="i-carbon-badge" class="w-4 h-4 text-cyan-400" />
              <span>Store Invite</span>
            </button>
            <a
              :href="`/api/v1/apps/${selectedAppDetail.package_name}/download`"
              class="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-semibold shadow-lg shadow-cyan-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <UIcon name="i-carbon-download" class="w-4 h-4" />
              <span>Download APK</span>
            </a>
          </div>
        </div>
      </div>
    </div>

    <!-- Official Store Invite Modal -->
    <div
      v-if="betaModalApp"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
      @click.self="closeBetaModal"
    >
      <div class="bg-slate-900 border border-white/10 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
        <button
          @click="closeBetaModal"
          class="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <UIcon name="i-carbon-close" class="w-5 h-5" />
        </button>

        <div class="flex items-center gap-3 mb-4">
          <div class="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
            <UIcon name="i-carbon-security" class="w-5 h-5" />
          </div>
          <div>
            <h3 class="text-base font-bold text-white">Official Store Invite</h3>
            <p class="text-xs text-slate-400">{{ betaModalApp.app_name }} • 14-Day Testing Pass</p>
          </div>
        </div>

        <!-- Step 1: Choose platform & Input Email -->
        <div v-if="betaStep === 1" class="space-y-4">
          <p class="text-xs text-slate-300 leading-relaxed">
            Get an official invite sent directly to your inbox to install securely via Apple TestFlight or Google Play Testing Track.
          </p>

          <!-- Platform Selector Tabs -->
          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1.5">Select Your Platform</label>
            <div class="grid grid-cols-2 gap-2">
              <button
                type="button"
                @click="setBetaPlatform('ios')"
                :class="[
                  'p-3 rounded-xl border text-left transition-all cursor-pointer',
                  betaPlatform === 'ios'
                    ? 'bg-cyan-500/10 border-cyan-500 text-white shadow-sm'
                    : 'bg-slate-950/50 border-white/10 text-slate-400 hover:border-white/20'
                ]"
              >
                <div class="flex items-center gap-2 font-semibold text-xs mb-1">
                  <UIcon name="i-carbon-apple" class="w-4 h-4 text-cyan-400" />
                  <span>iOS TestFlight</span>
                </div>
                <div class="text-[10px] text-slate-400 font-mono">
                  {{ iosSlots.remaining }} / {{ iosSlots.max }} slots free
                </div>
              </button>

              <button
                type="button"
                @click="setBetaPlatform('android')"
                :class="[
                  'p-3 rounded-xl border text-left transition-all cursor-pointer',
                  betaPlatform === 'android'
                    ? 'bg-cyan-500/10 border-cyan-500 text-white shadow-sm'
                    : 'bg-slate-950/50 border-white/10 text-slate-400 hover:border-white/20'
                ]"
              >
                <div class="flex items-center gap-2 font-semibold text-xs mb-1">
                  <UIcon name="i-carbon-logo-google" class="w-4 h-4 text-emerald-400" />
                  <span>Google Play</span>
                </div>
                <div class="text-[10px] text-slate-400 font-mono">
                  {{ androidSlots.remaining }} / {{ androidSlots.max }} slots free
                </div>
              </button>
            </div>
          </div>

          <!-- Email Input -->
          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1.5">
              {{ betaPlatform === 'ios' ? 'Apple ID / Email *' : 'Google Account Email *' }}
            </label>
            <input
              v-model="betaEmail"
              type="email"
              required
              placeholder="e.g. name@example.com"
              class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
            />
            <p class="text-[11px] text-slate-500 mt-1">
              A 6-digit confirmation code will be sent to verify your email.
            </p>
          </div>

          <div v-if="betaError" class="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
            {{ betaError }}
          </div>

          <button
            @click="submitRequestOtp"
            :disabled="betaLoading || !betaEmail"
            class="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold text-xs transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-cyan-500/20"
          >
            <UIcon v-if="betaLoading" name="i-carbon-renew" class="w-4 h-4 animate-spin" />
            <span>{{ betaLoading ? 'Sending Confirmation Code...' : 'Send Verification Code' }}</span>
          </button>
        </div>

        <!-- Step 2: OTP Verification -->
        <div v-else-if="betaStep === 2" class="space-y-4">
          <p class="text-xs text-slate-300 leading-relaxed">
            We sent a 6-digit code to <strong class="text-white">{{ betaEmail }}</strong>. Enter it below to activate your 14-day official pass:
          </p>

          <div>
            <input
              v-model="betaOtp"
              type="text"
              maxlength="6"
              placeholder="123456"
              class="w-full px-4 py-3 rounded-xl bg-slate-950 border border-cyan-500/40 text-center font-mono font-bold text-xl tracking-[0.4em] text-cyan-300 focus:outline-none focus:border-cyan-400"
            />
          </div>

          <div v-if="betaError" class="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
            {{ betaError }}
          </div>

          <div class="flex items-center gap-2">
            <button
              @click="submitVerifyOtp"
              :disabled="betaLoading || betaOtp.length !== 6"
              class="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold text-xs transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-cyan-500/20"
            >
              <UIcon v-if="betaLoading" name="i-carbon-renew" class="w-4 h-4 animate-spin" />
              <span>{{ betaLoading ? 'Verifying...' : 'Verify & Activate Pass' }}</span>
            </button>
            <button
              @click="betaStep = 1"
              class="px-3 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs hover:bg-slate-700 transition-colors cursor-pointer"
            >
              Back
            </button>
          </div>
        </div>

        <!-- Step 3: Success Confirmation -->
        <div v-else-if="betaStep === 3" class="text-center space-y-4 py-2">
          <div class="w-14 h-14 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
            <UIcon name="i-carbon-checkmark-filled" class="w-8 h-8" />
          </div>

          <div>
            <h4 class="text-base font-bold text-white mb-1">Access Pass Activated!</h4>
            <p class="text-xs text-slate-300 leading-relaxed max-w-sm mx-auto">
              {{ betaSuccessMessage }}
            </p>
          </div>

          <div class="p-3 bg-slate-950/80 rounded-xl border border-white/5 text-left text-xs space-y-1 font-mono">
            <div>Platform: <strong class="text-white">{{ betaPlatform === 'ios' ? 'Apple TestFlight' : 'Google Play Track' }}</strong></div>
            <div>Valid Until: <strong class="text-emerald-400">{{ formatDate(betaExpiresAt) }}</strong> (14 Days)</div>
            <div>Recipient: <strong class="text-slate-300">{{ betaEmail }}</strong></div>
          </div>

          <p class="text-[11px] text-slate-400 italic">
            Check your inbox now for the official email from {{ betaPlatform === 'ios' ? 'Apple' : 'Google' }} to complete device installation.
          </p>

          <button
            @click="closeBetaModal"
            class="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-colors cursor-pointer"
          >
            Done
          </button>
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

const { renderMarkdown } = useMarkdown();

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
const selectedReleaseIndex = ref(0);
const loadingDetail = ref(false);
const copied = ref(false);

// Beta Tester Modal State
const betaModalApp = ref<any>(null);
const betaStep = ref(1);
const betaPlatform = ref<"ios" | "android">("ios");
const betaEmail = ref("");
const betaOtp = ref("");
const betaLoading = ref(false);
const betaError = ref<string | null>(null);
const betaSuccessMessage = ref("");
const betaExpiresAt = ref<string | null>(null);

const iosSlots = ref({ remaining: 50, max: 50 });
const androidSlots = ref({ remaining: 50, max: 50 });

const selectedStatusFilter = ref<"all" | "production" | "development">("all");

const counts = computed(() => {
  const all = apps.value.length;
  const production = apps.value.filter((a: any) => a.status === "production").length;
  const development = apps.value.filter((a: any) => (a.status || "development") === "development").length;
  return { all, production, development };
});

const filteredApps = computed(() => {
  let list = apps.value;
  if (selectedStatusFilter.value !== "all") {
    list = list.filter((app: any) => (app.status || "development") === selectedStatusFilter.value);
  }
  if (!searchQuery.value.trim()) return list;
  const q = searchQuery.value.toLowerCase();
  return list.filter(
    (app: any) =>
      app.app_name?.toLowerCase().includes(q) ||
      app.package_name?.toLowerCase().includes(q) ||
      app.repo_slug?.toLowerCase().includes(q)
  );
});

const currentRelease = computed(() => {
  if (!selectedAppDetail.value) return null;
  if (selectedAppDetail.value.releases && selectedAppDetail.value.releases.length > 0) {
    return selectedAppDetail.value.releases[selectedReleaseIndex.value] || selectedAppDetail.value.releases[0];
  }
  return selectedAppDetail.value.latest_release;
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

const openDetailModal = async (app: any) => {
  selectedAppDetail.value = { ...app };
  selectedReleaseIndex.value = 0;
  copied.value = false;
  loadingDetail.value = true;
  try {
    const res = await $fetch<{ success: boolean; data: any }>(`/api/v1/apps/${app.package_name}`);
    if (res?.success && res.data) {
      selectedAppDetail.value = res.data;
    }
  } catch (err) {
    console.error("Failed to load full app releases:", err);
  } finally {
    loadingDetail.value = false;
  }
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

const openBetaModal = async (app: any) => {
  betaModalApp.value = app;
  betaStep.value = 1;
  betaEmail.value = "";
  betaOtp.value = "";
  betaError.value = null;
  betaPlatform.value = "ios";
  await fetchBetaSlots(app);
};

const closeBetaModal = () => {
  betaModalApp.value = null;
  betaStep.value = 1;
  betaEmail.value = "";
  betaOtp.value = "";
  betaError.value = null;
};

const setBetaPlatform = (platform: "ios" | "android") => {
  betaPlatform.value = platform;
  betaError.value = null;
};

const fetchBetaSlots = async (app: any) => {
  try {
    const [iosRes, androidRes] = await Promise.all([
      $fetch<any>(`/api/v1/apps/${app.package_name}/beta/slots?platform=ios`),
      $fetch<any>(`/api/v1/apps/${app.package_name}/beta/slots?platform=android`),
    ]);
    if (iosRes?.data) {
      iosSlots.value = {
        remaining: iosRes.data.remaining_slots,
        max: iosRes.data.max_slots,
      };
    }
    if (androidRes?.data) {
      androidSlots.value = {
        remaining: androidRes.data.remaining_slots,
        max: androidRes.data.max_slots,
      };
    }
  } catch (err) {
    console.error("Failed to fetch beta slot info:", err);
  }
};

const submitRequestOtp = async () => {
  if (!betaEmail.value || !betaModalApp.value) return;
  betaLoading.value = true;
  betaError.value = null;
  try {
    const res = await $fetch<any>(`/api/v1/apps/${betaModalApp.value.package_name}/beta/request-otp`, {
      method: "POST",
      body: {
        email: betaEmail.value,
        platform: betaPlatform.value,
      },
    });

    if (res?.data?.already_active) {
      betaSuccessMessage.value = res.data.message;
      betaExpiresAt.value = res.data.expires_at;
      betaStep.value = 3;
    } else {
      betaStep.value = 2;
    }
  } catch (err: any) {
    betaError.value = err?.data?.message || err?.message || "Failed to send verification code";
  } finally {
    betaLoading.value = false;
  }
};

const submitVerifyOtp = async () => {
  if (!betaOtp.value || betaOtp.value.length !== 6 || !betaModalApp.value) return;
  betaLoading.value = true;
  betaError.value = null;
  try {
    const res = await $fetch<any>(`/api/v1/apps/${betaModalApp.value.package_name}/beta/verify-otp`, {
      method: "POST",
      body: {
        email: betaEmail.value,
        platform: betaPlatform.value,
        otp: betaOtp.value,
      },
    });

    betaSuccessMessage.value = res?.data?.message || "Beta pass activated successfully!";
    betaExpiresAt.value = res?.data?.expires_at || null;
    betaStep.value = 3;
    if (betaModalApp.value) {
      fetchBetaSlots(betaModalApp.value);
    }
  } catch (err: any) {
    betaError.value = err?.data?.message || err?.message || "Invalid or expired verification code";
  } finally {
    betaLoading.value = false;
  }
};
</script>
