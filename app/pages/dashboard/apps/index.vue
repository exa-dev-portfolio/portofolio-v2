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
const showModal = ref(false);
const submitting = ref(false);
const syncingId = ref<string | null>(null);
const showSecret = ref<Record<string, boolean>>({});
const webhookUrl = ref("");

// Delete confirmation modal state
const repoToDelete = ref<any>(null);
const deleting = ref(false);

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
    const [reposRes, jobsRes] = await Promise.all([
      $axios.get("/api/v1/admin/apk/repositories"),
      $axios.get("/api/v1/admin/apk/jobs?limit=15"),
    ]);

    repositories.value = reposRes.data?.data || [];
    syncJobs.value = jobsRes.data?.data || [];
  } catch (err: any) {
    console.error("Failed to load APK dashboard data:", err);
    toast.showErrorToast("Failed to Load Data", "An error occurred while loading repository data");
  } finally {
    loading.value = false;
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
