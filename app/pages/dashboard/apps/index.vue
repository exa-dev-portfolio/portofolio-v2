<template>
  <div class="p-6 sm:p-8 max-w-7xl mx-auto space-y-8">
    <!-- Page Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
      <div>
        <h1 class="text-3xl sm:text-4xl font-black text-white tracking-tight mb-2 flex items-center gap-3">
          <span>APK Distribution Hub</span>
          <span class="text-xs font-mono px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
            {{ repositories.length }} Repos
          </span>
        </h1>
        <p class="text-white/60 text-sm sm:text-base">
          Manage GitHub repository integrations for automated APK releases, webhook ingestion, and MinIO storage.
        </p>
      </div>

      <!-- Action Buttons Cluster -->
      <div class="flex items-center gap-3">
        <NuxtLink
          to="/apps"
          target="_blank"
          class="inline-flex items-center cursor-pointer gap-2 px-4 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/10 border border-white/15 text-white font-medium text-sm transition-all whitespace-nowrap shadow-sm hover:border-cyan-500/40"
        >
          <Icon name="carbon:launch" size="18" class="text-cyan-400" />
          <span>View /apps</span>
        </NuxtLink>

        <button
          @click="openRegisterModal"
          class="inline-flex items-center cursor-pointer gap-2 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold text-sm transition-all whitespace-nowrap shadow-lg shadow-blue-500/20"
        >
          <Icon name="carbon:add" size="18" />
          <span>Register Repository</span>
        </button>
      </div>
    </div>

    <!-- Webhook Instructions Helper Box -->
    <div class="bg-[#0b1222]/80 backdrop-blur-md border border-white/10 rounded-2xl p-5 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
      <div class="flex items-start gap-3.5">
        <div class="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 flex-shrink-0 mt-0.5">
          <Icon name="carbon:information" size="20" />
        </div>
        <div>
          <span class="font-bold text-white text-sm">GitHub Webhook Setup:</span>
          <p class="text-xs text-white/60 mt-0.5">
            Configure webhook in GitHub: <code class="bg-white/10 px-2 py-0.5 rounded font-mono text-cyan-300 text-xs border border-white/10">{{ webhookUrl }}</code>
            with event <strong class="text-white">"Releases"</strong> and <strong class="text-white">"application/json"</strong>.
          </p>
        </div>
      </div>
      <button
        @click="copyText(webhookUrl)"
        class="flex-shrink-0 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-cyan-300 border border-white/10 font-mono text-xs flex items-center gap-2 transition-all cursor-pointer hover:border-cyan-500/40"
      >
        <Icon name="carbon:copy" size="15" />
        <span>Copy URL</span>
      </button>
    </div>

    <!-- Applications & Release Status Section -->
    <div class="bg-[#0b1222]/80 backdrop-blur-md border border-white/10 rounded-2xl shadow-xl overflow-hidden">
      <div class="p-6 border-b border-white/10 flex items-center justify-between">
        <div>
          <h2 class="text-base font-bold text-white flex items-center gap-2.5">
            <Icon name="carbon:application-mobile" size="20" class="text-cyan-400" />
            <span>Ingested Applications</span>
            <span class="text-xs font-mono text-white/50">({{ apps.length }})</span>
          </h2>
          <p class="text-xs text-white/50 mt-1">
            Toggle release status between <strong>Full Release (Production)</strong> and <strong>In Development (Testing)</strong>.
          </p>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="p-8 text-center text-white/60 text-xs">
        <Icon name="carbon:renew" size="20" class="animate-spin mx-auto mb-2 text-cyan-400" />
        <span>Loading applications...</span>
      </div>

      <!-- Empty State -->
      <div v-else-if="apps.length === 0" class="p-10 text-center">
        <div class="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-3 text-white/40">
          <Icon name="carbon:application-mobile" size="24" />
        </div>
        <p class="text-sm font-bold text-white">No applications ingested yet</p>
        <p class="text-xs text-white/50 mt-1">
          Sync one of your repositories below to automatically extract app metadata and APK binaries.
        </p>
      </div>

      <!-- Apps List -->
      <div v-else class="divide-y divide-white/5">
        <div
          v-for="app in apps"
          :key="app.id"
          class="p-6 flex flex-col md:flex-row md:items-center justify-between gap-5 hover:bg-white/[0.02] transition-colors"
        >
          <!-- Left: App Icon & Details -->
          <div class="flex items-center gap-4">
            <div class="w-14 h-14 rounded-2xl bg-slate-800 border border-white/10 p-1 flex-shrink-0 flex items-center justify-center overflow-hidden">
              <img
                v-if="app.icon_url"
                :src="app.icon_url"
                :alt="app.app_name"
                class="w-full h-full object-cover rounded-xl"
              />
              <Icon v-else name="carbon:application-mobile" size="24" class="text-cyan-400" />
            </div>

            <div class="space-y-1">
              <div class="flex items-center gap-2.5">
                <span class="text-base font-bold text-white">{{ app.app_name }}</span>
                <span
                  :class="[
                    'text-[10px] px-2.5 py-0.5 rounded-full font-mono font-bold uppercase tracking-wider border flex items-center gap-1.5',
                    app.status === 'production'
                      ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                      : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                  ]"
                >
                  <span
                    :class="[
                      'w-1.5 h-1.5 rounded-full',
                      app.status === 'production' ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'
                    ]"
                  />
                  {{ app.status === 'production' ? 'Full Release' : 'Development' }}
                </span>
              </div>

              <p class="text-xs text-white/50 font-mono">{{ app.package_name }}</p>

              <div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-white/60 pt-0.5">
                <span>Repo: <strong class="text-white font-mono">{{ app.repo_slug }}</strong></span>
                <span>Latest: <strong class="text-cyan-300 font-mono">v{{ app.latest_version_name }}</strong> ({{ app.latest_version_code }})</span>
                <span>Releases: <strong class="text-white">{{ app.release_count || 1 }}</strong></span>
                <span>Downloads: <strong class="text-emerald-400">{{ app.download_count || 0 }}x</strong></span>
              </div>
            </div>
          </div>

          <!-- Right: Actions & Status Switcher -->
          <div class="flex flex-wrap items-center gap-2.5 self-start md:self-center">
            <!-- Toggle Status Button -->
            <button
              @click="toggleAppStatus(app)"
              :disabled="updatingStatusId === app.id"
              :class="[
                'inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer disabled:opacity-50',
                app.status === 'production'
                  ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border-amber-500/30'
                  : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
              ]"
              :title="app.status === 'production' ? 'Switch to Development build' : 'Switch to Full Release'"
            >
              <Icon
                :name="updatingStatusId === app.id ? 'carbon:renew' : (app.status === 'production' ? 'carbon:chemistry' : 'carbon:checkmark-filled')"
                size="15"
                :class="updatingStatusId === app.id ? 'animate-spin' : ''"
              />
              <span>{{ updatingStatusId === app.id ? 'Updating...' : (app.status === 'production' ? 'Set to Development' : 'Set to Full Release') }}</span>
            </button>

            <!-- Manage Beta Testers -->
            <button
              @click="openTestersModal(app)"
              class="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-medium transition-colors cursor-pointer"
              title="Manage Official Store Beta Testers"
            >
              <Icon name="carbon:user-multiple" size="15" />
              <span>Testers</span>
            </button>

            <!-- Test Download -->
            <a
              :href="`/api/v1/apps/${app.package_name}/download`"
              class="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 hover:text-white border border-white/10 text-xs font-medium transition-colors"
              title="Download APK binary to test"
            >
              <Icon name="carbon:download" size="15" class="text-cyan-400" />
              <span>Test Download</span>
            </a>

            <!-- View in Showcase -->
            <NuxtLink
              to="/apps"
              target="_blank"
              class="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white border border-white/10 text-xs transition-colors"
              title="View on Public Showcase"
            >
              <Icon name="carbon:launch" size="16" />
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>

    <!-- Registered Repositories Section -->
    <div class="bg-[#0b1222]/80 backdrop-blur-md border border-white/10 rounded-2xl shadow-xl overflow-hidden">
      <div class="p-6 border-b border-white/10 flex items-center justify-between">
        <h2 class="text-base font-bold text-white flex items-center gap-2.5">
          <Icon name="carbon:logo-github" size="20" class="text-slate-400" />
          <span>Connected Repositories</span>
          <span class="text-xs font-mono text-white/50">({{ repositories.length }})</span>
        </h2>
        <button
          @click="fetchData"
          class="text-xs text-white/60 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer px-3 py-1.5 rounded-lg hover:bg-white/5"
        >
          <Icon name="carbon:renew" size="15" :class="loading ? 'animate-spin' : ''" />
          <span>Refresh</span>
        </button>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="p-12 text-center text-white/60 text-sm">
        <Icon name="carbon:renew" size="24" class="animate-spin mx-auto mb-3 text-primary" />
        <span>Loading repositories...</span>
      </div>

      <!-- Empty State -->
      <div v-else-if="repositories.length === 0" class="p-16 text-center">
        <div class="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4 text-white/40">
          <Icon name="carbon:folder" size="28" />
        </div>
        <p class="text-base font-bold text-white">No repositories connected yet</p>
        <p class="text-xs text-white/50 mt-1 max-w-sm mx-auto">
          Click the "Register Repository" button above to integrate your first Android application project.
        </p>
      </div>

      <!-- Table / Cards of Repositories -->
      <div v-else class="divide-y divide-white/5">
        <div
          v-for="repo in repositories"
          :key="repo.id"
          class="p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-5 hover:bg-white/[0.02] transition-colors"
        >
          <div class="space-y-2">
            <div class="flex items-center gap-3">
              <span class="text-base font-bold text-white font-mono tracking-tight">{{ repo.repo_slug }}</span>
              <span
                :class="[
                  'text-[10px] px-2.5 py-0.5 rounded-full font-mono font-semibold border',
                  repo.is_private
                    ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                    : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                ]"
              >
                {{ repo.is_private ? 'Private' : 'Public' }}
              </span>
            </div>

            <div class="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-white/60">
              <span class="flex items-center gap-1.5">
                <Icon name="carbon:filter" size="14" class="text-white/40" />
                <span>Filter: <code class="text-cyan-300 font-mono">{{ repo.asset_filter_regex }}</code></span>
              </span>
              <span class="flex items-center gap-1.5">
                <Icon name="carbon:application" size="14" class="text-white/40" />
                <span>Apps: <strong class="text-white">{{ repo.app_count || 0 }}</strong></span>
              </span>
              <span class="flex items-center gap-1.5">
                <Icon name="carbon:tag" size="14" class="text-white/40" />
                <span>Total Releases: <strong class="text-white">{{ repo.release_count || 0 }}</strong></span>
              </span>
            </div>

            <!-- Webhook Secret Snippet -->
            <div class="flex items-center gap-2 pt-1 text-xs text-white/50 font-mono">
              <span>Webhook Secret:</span>
              <span class="bg-black/40 px-2.5 py-0.5 rounded border border-white/10 text-white/80">
                {{ showSecret[repo.id] ? repo.webhook_secret : '••••••••••••••••••••' }}
              </span>
              <button
                @click="showSecret[repo.id] = !showSecret[repo.id]"
                class="text-white/50 hover:text-white cursor-pointer transition-colors p-1"
                title="Toggle Visibility"
              >
                <Icon :name="showSecret[repo.id] ? 'carbon:view-off' : 'carbon:view'" size="15" />
              </button>
              <button
                @click="copyText(repo.webhook_secret)"
                class="text-cyan-400 hover:text-cyan-300 cursor-pointer transition-colors p-1"
                title="Copy Secret"
              >
                <Icon name="carbon:copy" size="15" />
              </button>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex items-center gap-2.5 self-start lg:self-center">
            <button
              @click="triggerSync(repo)"
              :disabled="syncingId === repo.id"
              class="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/30 text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
            >
              <Icon
                :name="syncingId === repo.id ? 'carbon:renew' : 'carbon:cloud-download'"
                size="16"
                :class="syncingId === repo.id ? 'animate-spin' : ''"
              />
              <span>{{ syncingId === repo.id ? 'Syncing...' : 'Sync Now' }}</span>
            </button>

            <button
              @click="confirmDelete(repo)"
              class="p-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs transition-colors cursor-pointer"
              title="Delete Repository"
            >
              <Icon name="carbon:trash-can" size="16" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Recent Sync Activity Section -->
    <div class="bg-[#0b1222]/80 backdrop-blur-md border border-white/10 rounded-2xl shadow-xl overflow-hidden">
      <div class="p-6 border-b border-white/10 flex items-center justify-between">
        <h2 class="text-base font-bold text-white flex items-center gap-2.5">
          <Icon name="carbon:activity" size="20" class="text-slate-400" />
          <span>Recent Sync Activity & Logs</span>
        </h2>
      </div>

      <div v-if="syncJobs.length === 0" class="p-10 text-center text-xs text-white/50">
        No sync activity recorded yet.
      </div>

      <div v-else class="divide-y divide-white/5 text-xs font-mono">
        <div
          v-for="job in syncJobs"
          :key="job.id"
          class="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-white/[0.01]"
        >
          <div class="space-y-1.5">
            <div class="flex items-center gap-2.5">
              <span
                :class="[
                  'px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider',
                  job.status === 'completed' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : '',
                  job.status === 'processing' ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30 animate-pulse' : '',
                  job.status === 'pending' ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30' : '',
                  job.status === 'failed' ? 'bg-red-500/15 text-red-400 border border-red-500/30' : ''
                ]"
              >
                {{ job.status }}
              </span>
              <span class="text-white font-bold">{{ job.repo_slug }}</span>
              <span class="text-white/40">({{ job.event_type }})</span>
            </div>
            <p v-if="job.error_message" class="text-red-400 text-xs font-sans">
              Error: {{ job.error_message }}
            </p>
          </div>
          <div class="text-white/40 text-xs">
            {{ formatDate(job.created_at) }}
          </div>
        </div>
      </div>
    </div>

    <!-- Register Repository Modal -->
    <div
      v-if="showModal"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      @click.self="showModal = false"
    >
      <div class="bg-[#0c1222] border border-white/10 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
        <button
          @click="showModal = false"
          class="absolute top-4 right-4 text-white/50 hover:text-white transition-colors cursor-pointer"
        >
          <Icon name="carbon:close" size="20" />
        </button>

        <h3 class="text-lg font-bold text-white mb-1">Register GitHub Repository</h3>
        <p class="text-xs text-white/60 mb-5">
          Connect your Android project. A webhook secret will be automatically generated.
        </p>

        <form @submit.prevent="submitRegister" class="space-y-4">
          <div>
            <label class="block text-xs font-semibold text-white/80 mb-1.5">
              Repository Slug (owner/repo) *
            </label>
            <input
              v-model="form.repo_slug"
              type="text"
              placeholder="e.g. exa-dev-portfolio/my-android-app"
              required
              class="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/15 text-sm text-white focus:outline-none focus:border-primary font-mono placeholder:text-white/30"
            />
          </div>

          <div class="flex items-center gap-2.5 pt-1">
            <input
              v-model="form.is_private"
              type="checkbox"
              id="is_private"
              class="rounded bg-white/10 border-white/20 text-primary focus:ring-0 cursor-pointer"
            />
            <label for="is_private" class="text-xs text-white/80 select-none cursor-pointer">
              This repository is Private
            </label>
          </div>

          <div v-if="form.is_private">
            <label class="block text-xs font-semibold text-white/80 mb-1.5">
              GitHub Personal Access Token (PAT) *
            </label>
            <input
              v-model="form.access_token"
              type="password"
              placeholder="ghp_xxxxxxxxxxxx"
              required
              class="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/15 text-sm text-white focus:outline-none focus:border-primary font-mono placeholder:text-white/30"
            />
            <p class="text-[10px] text-white/50 mt-1">Requires <code>repo</code> scope to download release assets from private repositories.</p>
          </div>

          <div>
            <label class="block text-xs font-semibold text-white/80 mb-1.5">
              Asset Regex Filter
            </label>
            <input
              v-model="form.asset_filter_regex"
              type="text"
              placeholder=".*\.apk$"
              class="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/15 text-sm text-white focus:outline-none focus:border-primary font-mono placeholder:text-white/30"
            />
            <p class="text-[10px] text-white/50 mt-1">Regex pattern to filter APK binary files from GitHub release assets.</p>
          </div>

          <div class="pt-4 flex items-center justify-end gap-2.5 border-t border-white/10">
            <button
              type="button"
              @click="showModal = false"
              class="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-white/70 font-medium transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              :disabled="submitting"
              class="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-xs text-white font-semibold shadow-lg shadow-blue-500/20 disabled:opacity-50 transition-all cursor-pointer"
            >
              {{ submitting ? 'Saving...' : 'Save & Register' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Custom Delete Confirmation Modal -->
    <div
      v-if="repoToDelete"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      @click.self="repoToDelete = null"
    >
      <div class="bg-[#0c1222] border border-white/10 rounded-2xl max-w-sm w-full p-6 shadow-2xl relative">
        <div class="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-3 text-red-400">
          <Icon name="carbon:warning-alt" size="24" />
        </div>

        <h3 class="text-base font-bold text-white text-center mb-1">Delete Repository Integration?</h3>
        <p class="text-xs text-white/60 text-center mb-5 leading-relaxed">
          Are you sure you want to delete repository <span class="font-mono text-cyan-400 font-semibold">{{ repoToDelete.repo_slug }}</span>? All associated application metadata and APK release history will be permanently removed.
        </p>

        <div class="flex items-center gap-2.5">
          <button
            type="button"
            @click="repoToDelete = null"
            :disabled="deleting"
            class="flex-1 py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-white/70 font-medium transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            @click="executeDelete"
            :disabled="deleting"
            class="flex-1 py-2.5 px-3 rounded-xl bg-red-600 hover:bg-red-500 text-xs text-white font-semibold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 shadow-lg shadow-red-600/20 cursor-pointer"
          >
            <Icon v-if="deleting" name="carbon:renew" size="14" class="animate-spin" />
            <span>{{ deleting ? 'Deleting...' : 'Yes, Delete' }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Beta Testers Management Modal -->
    <div
      v-if="testersModalApp"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
      @click.self="testersModalApp = null"
    >
      <div class="bg-[#0c1222] border border-white/10 rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative max-h-[85vh] flex flex-col">
        <button
          @click="testersModalApp = null"
          class="absolute top-4 right-4 text-white/50 hover:text-white transition-colors cursor-pointer z-10"
        >
          <Icon name="carbon:close" size="20" />
        </button>

        <!-- Header -->
        <div class="flex items-center gap-3 pb-4 border-b border-white/10 shrink-0">
          <div class="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
            <Icon name="carbon:user-multiple" size="20" />
          </div>
          <div>
            <h3 class="text-base font-bold text-white">Beta Testers & Store Passes</h3>
            <p class="text-xs text-white/50">{{ testersModalApp.app_name }} • {{ testersList.length }} testers registered</p>
          </div>
        </div>

        <!-- Content -->
        <div class="py-4 overflow-y-auto space-y-3">
          <div v-if="loadingTesters" class="p-8 text-center text-xs text-white/50">
            <Icon name="carbon:renew" size="18" class="animate-spin mx-auto mb-2 text-cyan-400" />
            <span>Loading testers...</span>
          </div>

          <div v-else-if="testersList.length === 0" class="p-8 text-center text-xs text-white/50">
            No beta testers registered for this app yet.
          </div>

          <div v-else class="divide-y divide-white/5 font-mono text-xs">
            <div
              v-for="t in testersList"
              :key="t.id"
              class="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div class="space-y-1">
                <div class="flex items-center gap-2">
                  <span class="text-white font-sans font-medium">{{ t.email }}</span>
                  <span
                    :class="[
                      'text-[10px] px-2 py-0.5 rounded-full font-bold uppercase',
                      t.platform === 'ios'
                        ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                        : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    ]"
                  >
                    {{ t.platform === 'ios' ? 'iOS TestFlight' : 'Google Play' }}
                  </span>
                  <span
                    :class="[
                      'text-[10px] px-2 py-0.5 rounded font-bold uppercase',
                      t.status === 'active' ? 'bg-emerald-500/20 text-emerald-300' : (t.status === 'revoked' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-300')
                    ]"
                  >
                    {{ t.status }}
                  </span>
                </div>
                <div class="text-[11px] text-white/40 font-sans">
                  <span>Expires: {{ t.expires_at ? formatDate(t.expires_at) : '-' }}</span>
                  <span class="mx-2">•</span>
                  <span>Joined: {{ formatDate(t.created_at) }}</span>
                </div>
              </div>

              <div v-if="t.status === 'active'">
                <button
                  @click="revokeTester(t)"
                  class="px-2.5 py-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-[11px] transition-colors cursor-pointer"
                >
                  Revoke Access
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="pt-3 border-t border-white/10 text-right shrink-0">
          <button
            @click="testersModalApp = null"
            class="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-white transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useToastCustom } from "~/composables/useToastCustom";

definePageMeta({
  layout: "dashboard",
  breadCrumb: [
    { title: "Apps (APK)" },
  ],
});

const { isApkStoreEnabled } = useFeatureFlag();
if (!isApkStoreEnabled.value) {
  throw createError({
    statusCode: 404,
    statusMessage: "Page Not Found",
    fatal: true,
  });
}

const { $axios } = useNuxtApp() as any;
const toast = useToastCustom();

const loading = ref(true);
const repositories = ref<any[]>([]);
const syncJobs = ref<any[]>([]);
const apps = ref<any[]>([]);
const updatingStatusId = ref<string | null>(null);
const showModal = ref(false);
const submitting = ref(false);
const syncingId = ref<string | null>(null);
const showSecret = ref<Record<string, boolean>>({});
const webhookUrl = ref("");

// Delete confirmation modal state
const repoToDelete = ref<any>(null);
const deleting = ref(false);

// Beta testers modal state
const testersModalApp = ref<any>(null);
const testersList = ref<any[]>([]);
const loadingTesters = ref(false);

const form = ref({
  repo_slug: "",
  is_private: false,
  access_token: "",
  asset_filter_regex: ".*\\.apk$",
});

onMounted(() => {
  if (import.meta.client) {
    webhookUrl.value = `${window.location.origin}/api/v1/webhooks/github`;
  }
  fetchData();
});

const fetchData = async () => {
  loading.value = true;
  try {
    const [reposRes, jobsRes, appsRes] = await Promise.all([
      $axios.get("/api/v1/admin/apk/repositories"),
      $axios.get("/api/v1/admin/apk/jobs?limit=15"),
      $axios.get("/api/v1/admin/apk/apps"),
    ]);

    repositories.value = reposRes.data?.data || [];
    syncJobs.value = jobsRes.data?.data || [];
    apps.value = appsRes.data?.data || [];
  } catch (err: any) {
    console.error("Failed to load APK dashboard data:", err);
    toast.showErrorToast("Failed to Load Data", "An error occurred while loading repository data");
  } finally {
    loading.value = false;
  }
};

const toggleAppStatus = async (app: any) => {
  const newStatus = app.status === "production" ? "development" : "production";
  updatingStatusId.value = app.id;
  try {
    await $axios.patch(`/api/v1/admin/apk/apps/${app.id}/status`, {
      status: newStatus,
    });
    app.status = newStatus;
    toast.showSuccessToast(
      "Status Updated",
      `${app.app_name} is now marked as ${newStatus === "production" ? "Full Release" : "Development"}`
    );
  } catch (err: any) {
    toast.showErrorToast("Update Failed", err.response?.data?.message || "Failed to update status");
  } finally {
    updatingStatusId.value = null;
  }
};

const openTestersModal = async (app: any) => {
  testersModalApp.value = app;
  loadingTesters.value = true;
  testersList.value = [];
  try {
    const res = await $axios.get(`/api/v1/admin/apk/apps/${app.id}/testers`);
    testersList.value = res.data?.data || [];
  } catch (err: any) {
    toast.showErrorToast("Failed to Load Testers", err.response?.data?.message || "Error fetching testers");
  } finally {
    loadingTesters.value = false;
  }
};

const revokeTester = async (tester: any) => {
  try {
    await $axios.patch(`/api/v1/admin/apk/testers/${tester.id}/revoke`, {
      reason: "Revoked manually by administrator",
    });
    tester.status = "revoked";
    toast.showSuccessToast("Access Revoked", `Revoked access for ${tester.email}`);
  } catch (err: any) {
    toast.showErrorToast("Revoke Failed", err.response?.data?.message || "Error revoking tester access");
  }
};

const openRegisterModal = () => {
  form.value = {
    repo_slug: "",
    is_private: false,
    access_token: "",
    asset_filter_regex: ".*\\.apk$",
  };
  showModal.value = true;
};

const submitRegister = async () => {
  submitting.value = true;
  try {
    await $axios.post("/api/v1/admin/apk/repositories", {
      ...form.value,
      access_token: form.value.is_private ? form.value.access_token : null,
    });
    showModal.value = false;
    toast.showSuccessToast("Repository Registered", `Repository ${form.value.repo_slug} has been successfully registered`);
    await fetchData();
  } catch (err: any) {
    toast.showErrorToast("Registration Failed", err.response?.data?.message || "Failed to register repository");
  } finally {
    submitting.value = false;
  }
};

const triggerSync = async (repo: any) => {
  syncingId.value = repo.id;
  try {
    await $axios.post(`/api/v1/admin/apk/repositories/${repo.id}/sync`);
    toast.showInfoToast("Sync Initiated", `Worker is processing the latest release for ${repo.repo_slug}`);
    await fetchData();
  } catch (err: any) {
    toast.showErrorToast("Sync Failed", err.response?.data?.message || "Failed to initiate release synchronization");
  } finally {
    syncingId.value = null;
  }
};

const confirmDelete = (repo: any) => {
  repoToDelete.value = repo;
};

const executeDelete = async () => {
  if (!repoToDelete.value) return;
  deleting.value = true;
  try {
    await $axios.delete(`/api/v1/admin/apk/repositories/${repoToDelete.value.id}`);
    toast.showSuccessToast("Repository Deleted", `Repository ${repoToDelete.value.repo_slug} has been deleted`);
    repoToDelete.value = null;
    await fetchData();
  } catch (err: any) {
    toast.showErrorToast("Deletion Failed", err.response?.data?.message || "Failed to delete repository");
  } finally {
    deleting.value = false;
  }
};

const formatDate = (dateString?: string) => {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleString("en-US", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const copyText = (text: string) => {
  if (navigator?.clipboard) {
    navigator.clipboard.writeText(text);
    toast.showSuccessToast("Copied", "Copied to clipboard!");
  }
};
</script>
