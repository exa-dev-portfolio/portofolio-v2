<script setup lang="ts">
import { computed, ref } from "vue";
import { useToastCustom } from "~/composables/useToastCustom";

definePageMeta({
  layout: "dashboard",
  breadCrumb: [{ title: "Settings" }],
});

const {
  fetchSettings,
  updateProfileSettings,
  updateSocialLinks,
  uploadCV,
  bindApple,
  unbindApple,
  isLoading,
  isSaving,
} = useSettings();

const { authorizeAppleForBinding, isAppleLoading } = useAppleSignIn();

const appleAccount = ref<{
  apple_id: string | null;
  apple_email: string | null;
}>({
  apple_id: null,
  apple_email: null,
});

const toast = useToastCustom();

const profileForm = reactive({
  name: "",
  email: "",
  location: "",
  open_to_opportunities: false,
  job_notifications_enabled: true,
});

const socialLinksForm = ref({
  github_profile: "",
  linkedin_profile: "",
});

const cvFile = ref<File | null>(null);
const cvFileName = ref("");
const cvUrl = ref<string>("");
const showCVModal = ref(false);

const originalData = ref({
  name: "",
  email: "",
  location: "",
  open_to_opportunities: false,
  job_notifications_enabled: true,
  github_profile: "",
  linkedin_profile: "",
});

// Fetch settings on SSR/CSR
const { data: settingsData } = await useAsyncData("user-settings", async () => {
  return await fetchSettings();
});

// Watch data changes
watch(
  settingsData,
  (newData) => {
    if (newData) {
      profileForm.name = newData.name;
      profileForm.email = newData.email;
      profileForm.location = newData.location || "";
      profileForm.open_to_opportunities = newData.open_to_opportunities;
      profileForm.job_notifications_enabled =
        newData.job_notifications_enabled ?? true;

      socialLinksForm.value = {
        github_profile: newData.github_profile || "",
        linkedin_profile: newData.linkedin_profile || "",
      };

      cvUrl.value = newData.cv_url || "";

      originalData.value = {
        name: newData.name,
        email: newData.email,
        location: newData.location || "",
        open_to_opportunities: newData.open_to_opportunities,
        job_notifications_enabled: newData.job_notifications_enabled ?? true,
        github_profile: newData.github_profile || "",
        linkedin_profile: newData.linkedin_profile || "",
      };

      appleAccount.value = {
        apple_id: newData.apple_id || null,
        apple_email: newData.apple_email || null,
      };
    }
  },
  { immediate: true },
);

const profileHasChanges = computed(() => {
  return (
    profileForm.name !== originalData.value.name ||
    profileForm.email !== originalData.value.email ||
    profileForm.location !== originalData.value.location ||
    profileForm.open_to_opportunities !==
      originalData.value.open_to_opportunities ||
    profileForm.job_notifications_enabled !==
      originalData.value.job_notifications_enabled
  );
});

const socialLinksHaveChanges = computed(() => {
  return (
    socialLinksForm.value.github_profile !==
      originalData.value.github_profile ||
    socialLinksForm.value.linkedin_profile !==
      originalData.value.linkedin_profile
  );
});

const saveProfile = async () => {
  if (!profileHasChanges.value) {
    toast.showInfoToast("Info", "No changes to save");
    return;
  }

  const result = await updateProfileSettings({
    name: profileForm.name,
    email: profileForm.email,
    location: profileForm.location || null,
    open_to_opportunities: profileForm.open_to_opportunities,
    job_notifications_enabled: profileForm.job_notifications_enabled,
  });

  if (result) {
    originalData.value = {
      ...originalData.value,
      name: result.name,
      email: result.email,
      location: result.location || "",
      open_to_opportunities: result.open_to_opportunities,
      job_notifications_enabled: result.job_notifications_enabled,
    };
  }
};

const saveSocialLinks = async () => {
  if (!socialLinksHaveChanges.value) {
    toast.showInfoToast("Info", "No changes to save");
    return;
  }

  const result = await updateSocialLinks({
    github_profile: socialLinksForm.value.github_profile || null,
    linkedin_profile: socialLinksForm.value.linkedin_profile || null,
  });

  if (result) {
    originalData.value = {
      ...originalData.value,
      github_profile: result.github_profile || "",
      linkedin_profile: result.linkedin_profile || "",
    };
  }
};

const handleCVFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const files = target.files;
  if (files && files.length > 0) {
    const file = files[0];
    // Validate file type (PDF only)
    if (file!.type !== "application/pdf") {
      toast.showErrorToast("Error", "Only PDF files are allowed");
      return;
    }
    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file!.size > maxSize) {
      toast.showErrorToast("Error", "File size must be less than 5MB");
      return;
    }
    cvFile.value = file!;
    cvFileName.value = file!.name;
  }
};

const uploadCVFile = async () => {
  if (!cvFile.value) {
    toast.showErrorToast("Error", "Please select a file");
    return;
  }

  const result = await uploadCV(cvFile.value);
  if (result) {
    cvUrl.value = result;
    cvFile.value = null;
    cvFileName.value = "";
    // Reset file input
    const fileInput = document.querySelector(
      "#cvFileInput",
    ) as HTMLInputElement;
    if (fileInput) fileInput.value = "";
  }
};

const openCVModal = () => {
  showCVModal.value = true;
};

const closeCVModal = () => {
  showCVModal.value = false;
};

// Apple Music Integration Status & Test
const isTestingAppleMusic = ref(false);
const appleMusicStatusResult = ref<any>(null);

const testAppleMusicConnection = async () => {
  isTestingAppleMusic.value = true;
  try {
    const res = await $fetch<any>('/api/music');
    if (res?.data) {
      appleMusicStatusResult.value = res.data;
      toast.showSuccessToast('Success', 'Apple Music status synced successfully!');
    }
  } catch (err: any) {
    toast.showErrorToast('Error', err?.message || 'Failed to fetch Apple Music status');
  } finally {
    isTestingAppleMusic.value = false;
  }
};

const handleBindApple = async () => {
  const auth = await authorizeAppleForBinding();
  if (!auth) return;

  const result = await bindApple(auth.identityToken, auth.email);
  if (result) {
    appleAccount.value = {
      apple_id: result.apple_id || null,
      apple_email: result.apple_email || null,
    };
    if (settingsData.value) {
      settingsData.value.apple_id = result.apple_id;
      settingsData.value.apple_email = result.apple_email;
    }
  }
};

const handleUnbindApple = async () => {
  const confirmed = confirm("Apakah Anda yakin ingin memutuskan tautan akun Apple ini?");
  if (!confirmed) return;

  const result = await unbindApple();
  if (result) {
    appleAccount.value = {
      apple_id: null,
      apple_email: null,
    };
    if (settingsData.value) {
      settingsData.value.apple_id = null;
      settingsData.value.apple_email = null;
    }
  }
};
</script>

<template>
  <div class="p-8">
    <!-- Page Header -->
    <div class="mb-8">
      <h1 class="text-4xl font-black text-white mb-2">Settings</h1>
      <p class="text-white/60">Manage your profile and social links.</p>
    </div>

    <!-- Loading State -->
    <div
      v-if="isLoading && !settingsData"
      class="flex flex-col items-center justify-center py-20"
    >
      <div
        class="w-12 h-12 border-4 border-white/20 border-t-primary rounded-full animate-spin mb-4"
      ></div>
      <p class="text-white/60 text-sm">Loading settings...</p>
    </div>

    <!-- Content -->
    <div v-else class="space-y-8">
      <!-- Profile Settings -->
      <div
        class="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden"
      >
        <!-- Header -->
        <div class="px-6 py-4 border-b border-white/10 bg-white/5">
          <h2 class="text-2xl font-bold text-white flex items-center gap-3">
            <Icon name="carbon:user" size="24" class="text-primary" />
            Profile Settings
          </h2>
        </div>

        <!-- Content -->
        <div class="p-6 space-y-6">
          <!-- Name -->
          <div>
            <label class="block text-sm font-semibold text-white mb-2"
              >Full Name</label
            >
            <input
              v-model="profileForm.name"
              type="text"
              class="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-white/40 focus:outline-none focus:border-primary/50 focus:bg-white/15 transition-all"
            />
          </div>

          <!-- Email -->
          <div>
            <label class="block text-sm font-semibold text-white mb-2"
              >Email Address</label
            >
            <input
              v-model="profileForm.email"
              type="email"
              :disabled="true"
              class="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-white/40 focus:outline-none focus:border-primary/50 focus:bg-white/15 transition-all"
            />
          </div>

          <!-- Location -->
          <div>
            <label class="block text-sm font-semibold text-white mb-2"
              >Location</label
            >
            <input
              v-model="profileForm.location"
              type="text"
              placeholder="e.g. San Francisco, CA"
              class="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-white/40 focus:outline-none focus:border-primary/50 focus:bg-white/15 transition-all"
            />
          </div>

          <!-- Open to Work -->
          <div
            class="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl"
          >
            <label class="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                v-model="profileForm.open_to_opportunities"
                class="sr-only peer"
              />
              <div
                class="w-11 h-6 bg-white/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"
              ></div>
            </label>
            <label
              class="ml-4 flex flex-col cursor-pointer flex-1"
              @click="
                profileForm.open_to_opportunities =
                  !profileForm.open_to_opportunities
              "
            >
              <span class="text-sm font-semibold text-white"
                >Open to Work Opportunities</span
              >
              <p class="text-xs text-white/50 mt-1">
                Let recruiters and system know you are open to new
                opportunities.
              </p>
            </label>
          </div>

          <!-- Job Notifications Enabled -->
          <div
            class="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl"
          >
            <label class="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                v-model="profileForm.job_notifications_enabled"
                class="sr-only peer"
              />
              <div
                class="w-11 h-6 bg-white/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"
              ></div>
            </label>
            <label
              class="ml-4 flex flex-col cursor-pointer flex-1"
              @click="
                profileForm.job_notifications_enabled =
                  !profileForm.job_notifications_enabled
              "
            >
              <span class="text-sm font-semibold text-white"
                >Email Notifications</span
              >
              <p class="text-xs text-white/50 mt-1">
                Receive a summary email from Resend whenever AI finds new job
                matches.
              </p>
            </label>
          </div>

          <!-- Save Button -->
          <button
            @click="saveProfile"
            :disabled="isSaving || !profileHasChanges"
            class="px-6 py-3 rounded-lg bg-primary text-white font-semibold hover:brightness-110 disabled:opacity-50 transition-all flex items-center gap-2"
          >
            <Icon
              v-if="isSaving"
              name="icon-park-outline:loading-four"
              size="16"
              class="animate-spin"
            />
            <Icon v-else name="carbon:save" size="20" />
            {{ isSaving ? "Saving..." : "Save Profile" }}
          </button>
        </div>
      </div>

      <!-- Connected Accounts (Akun Terhubung) -->
      <div
        class="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden"
      >
        <!-- Header -->
        <div class="px-6 py-4 border-b border-white/10 bg-white/5 flex items-center justify-between">
          <h2 class="text-2xl font-bold text-white flex items-center gap-3">
            <Icon name="carbon:user-identification" size="24" class="text-primary" />
            Connected Accounts
          </h2>
          <span class="text-xs text-white/40">OAuth & Social Login</span>
        </div>

        <!-- Content -->
        <div class="p-6 space-y-4">
          <!-- Google Account -->
          <div
            class="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl gap-4"
          >
            <div class="flex items-center gap-3">
              <div
                class="w-11 h-11 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center shrink-0"
              >
                <Icon name="mdi:google" size="22" class="text-white" />
              </div>
              <div>
                <div class="flex items-center gap-2">
                  <p class="text-base font-semibold text-white">Google Account</p>
                  <span
                    class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                  >
                    <Icon name="carbon:checkmark-filled" size="12" /> Primary
                  </span>
                </div>
                <p class="text-xs text-white/50 mt-0.5">{{ profileForm.email || originalData.email }}</p>
              </div>
            </div>
            <div>
              <span
                class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white/5 text-white/70 border border-white/10"
              >
                <Icon name="carbon:locked" size="14" class="text-white/40" />
                Linked
              </span>
            </div>
          </div>

          <!-- Apple Account -->
          <div
            class="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl gap-4"
          >
            <div class="flex items-center gap-3">
              <div
                class="w-11 h-11 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center shrink-0"
              >
                <Icon name="mdi:apple" size="24" class="text-white" />
              </div>
              <div>
                <div class="flex items-center gap-2">
                  <p class="text-base font-semibold text-white">Apple ID</p>
                  <span
                    v-if="appleAccount.apple_id"
                    class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                  >
                    <Icon name="carbon:checkmark-filled" size="12" /> Connected
                  </span>
                  <span
                    v-else
                    class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20"
                  >
                    Not connected
                  </span>
                </div>
                <p v-if="appleAccount.apple_id" class="text-xs text-white/60 mt-0.5">
                  {{ appleAccount.apple_email || 'Connected with Apple ID' }}
                </p>
                <p v-else class="text-xs text-white/40 mt-0.5">
                  Link your Apple account to sign in securely with Apple ID
                </p>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <button
                v-if="appleAccount.apple_id"
                @click="handleUnbindApple"
                :disabled="isSaving || isAppleLoading"
                class="px-4 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Icon name="carbon:unlink" size="14" />
                Unbind Apple
              </button>
              <button
                v-else
                @click="handleBindApple"
                :disabled="isSaving || isAppleLoading"
                class="px-4 py-2 rounded-lg bg-black hover:bg-black/80 text-white border border-white/20 text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
              >
                <Icon
                  v-if="isAppleLoading"
                  name="icon-park-outline:loading-four"
                  size="14"
                  class="animate-spin"
                />
                <Icon v-else name="mdi:apple" size="16" />
                <span>{{ isAppleLoading ? 'Connecting...' : 'Bind Apple ID' }}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Social Links -->
      <div
        class="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden"
      >
        <!-- Header -->
        <div class="px-6 py-4 border-b border-white/10 bg-white/5">
          <h2 class="text-2xl font-bold text-white flex items-center gap-3">
            <Icon name="carbon:share" size="24" class="text-primary" />
            Social Links
          </h2>
        </div>

        <!-- Content -->
        <div class="p-6 space-y-4">
          <!-- GitHub -->
          <div>
            <label
              class="block text-sm font-semibold text-white mb-2 flex items-center gap-2"
            >
              <Icon name="carbon:logo-github" size="16" />
              GitHub Profile URL
            </label>
            <input
              v-model="socialLinksForm.github_profile"
              type="url"
              placeholder="https://github.com/username"
              class="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-white/40 focus:outline-none focus:border-primary/50 focus:bg-white/15 transition-all"
            />
          </div>

          <!-- LinkedIn -->
          <div>
            <label
              class="block text-sm font-semibold text-white mb-2 flex items-center gap-2"
            >
              <Icon name="carbon:logo-linkedin" size="16" />
              LinkedIn Profile URL
            </label>
            <input
              v-model="socialLinksForm.linkedin_profile"
              type="url"
              placeholder="https://linkedin.com/in/username"
              class="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-white/40 focus:outline-none focus:border-primary/50 focus:bg-white/15 transition-all"
            />
          </div>

          <!-- Save Button -->
          <button
            @click="saveSocialLinks"
            :disabled="isSaving || !socialLinksHaveChanges"
            class="w-full px-6 py-3 rounded-lg bg-primary text-white font-semibold hover:brightness-110 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
          >
            <Icon
              v-if="isSaving"
              name="icon-park-outline:loading-four"
              size="16"
              class="animate-spin"
            />
            <Icon v-else name="carbon:save" size="20" />
            {{ isSaving ? "Saving..." : "Save Social Links" }}
          </button>
        </div>
      </div>

      <!-- CV Upload -->
      <div
        class="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden"
      >
        <!-- Header -->
        <div class="px-6 py-4 border-b border-white/10 bg-white/5">
          <h2 class="text-2xl font-bold text-white flex items-center gap-3">
            <Icon name="carbon:document" size="24" class="text-primary" />
            CV/Resume
          </h2>
        </div>

        <!-- Content -->
        <div class="p-6 space-y-4">
          <!-- Current CV Preview -->
          <div
            v-if="cvUrl"
            class="bg-white/5 border border-white/10 rounded-lg p-4"
          >
            <div class="flex items-center justify-between mb-3">
              <div class="flex items-center gap-2">
                <Icon
                  name="carbon:document-pdf"
                  size="24"
                  class="text-red-400"
                />
                <div>
                  <p class="text-sm font-semibold text-white">Current CV</p>
                  <p class="text-xs text-white/50">PDF Document</p>
                </div>
              </div>
              <a
                :href="cvUrl"
                target="_blank"
                rel="noopener noreferrer"
                class="px-3 py-2 rounded-lg bg-primary hover:brightness-110 text-white text-xs font-medium transition-all flex items-center gap-1"
              >
                <Icon name="carbon:download" size="16" />
                Download
              </a>
              <button
                @click="openCVModal"
                class="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition-all flex items-center gap-1"
              >
                <Icon name="carbon:view" size="16" />
                Preview
              </button>
            </div>
          </div>

          <!-- CV File Input -->
          <div>
            <label class="block text-sm font-semibold text-white mb-2"
              >Upload CV (PDF)</label
            >
            <div class="flex items-center gap-3">
              <input
                id="cvFileInput"
                type="file"
                accept=".pdf"
                @change="handleCVFileSelect"
                class="hidden"
              />
              <label
                for="cvFileInput"
                class="flex-1 px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white cursor-pointer hover:bg-white/15 transition-all flex items-center gap-2"
              >
                <Icon name="carbon:cloud-upload" size="20" />
                <span>{{ cvFileName || "Choose PDF file..." }}</span>
              </label>
              <span class="text-xs text-white/50">Max 5MB</span>
            </div>
            <p class="text-xs text-white/40 mt-2">
              PDF files only. Maximum size: 5MB
            </p>
          </div>

          <!-- Upload Button -->
          <button
            @click="uploadCVFile"
            :disabled="isSaving || !cvFile"
            class="w-full px-6 py-3 rounded-lg bg-primary text-white font-semibold hover:brightness-110 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
          >
            <Icon
              v-if="isSaving"
              name="icon-park-outline:loading-four"
              size="16"
              class="animate-spin"
            />
            <Icon v-else name="carbon:upload" size="20" />
            {{ isSaving ? "Uploading..." : "Upload CV" }}
          </button>
        </div>
      </div>

      <!-- Apple Music (MusicKit) Integration -->
      <div
        class="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden"
      >
        <!-- Header -->
        <div class="px-6 py-4 border-b border-white/10 bg-white/5 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-[#fa243c] to-[#fa586a] flex items-center justify-center text-white">
              <Icon name="carbon:music" size="18" />
            </div>
            <div>
              <h2 class="text-xl font-bold text-white">Apple Music Integration</h2>
              <p class="text-xs text-white/50">Showcase Now Playing & Favorite Genres on portfolio</p>
            </div>
          </div>
          <span class="text-xs font-mono px-2.5 py-1 rounded-md bg-rose-500/10 border border-rose-500/20 text-rose-300">
            MusicKit API
          </span>
        </div>

        <!-- Content -->
        <div class="p-6 space-y-5">
          <!-- Guide Note -->
          <div class="p-4 rounded-xl bg-white/[0.03] border border-white/[0.08] text-xs space-y-2 text-slate-300 leading-relaxed">
            <p class="font-semibold text-white flex items-center gap-2">
              <Icon name="carbon:information" size="16" class="text-rose-400" />
              Konfigurasi Kredensial Apple Developer Program
            </p>
            <p>
              Untuk sinkronisasi live Apple Music di portfolio, isi variabel berikut di file <code class="text-rose-300 font-mono">.env</code>:
            </p>
            <div class="bg-black/40 rounded-lg p-3 font-mono text-[11px] text-slate-300 space-y-1">
              <div><span class="text-rose-400">NUXT_APPLE_MUSIC_KEY_ID</span>=ABC123XYZ0</div>
              <div><span class="text-rose-400">NUXT_APPLE_MUSIC_TEAM_ID</span>=DEF456UVW1</div>
              <div><span class="text-rose-400">NUXT_APPLE_MUSIC_PRIVATE_KEY</span>=LS0tLS1CRUdJTiBQUkl...</div>
              <div><span class="text-rose-400">NUXT_APPLE_MUSIC_USER_TOKEN</span>=&lt;Music-User-Token&gt;</div>
            </div>
            <p class="text-[11px] text-slate-400">
              *Jika kredensial belum diisi, website otomatis berjalan dalam mode <strong>Curated Demo</strong> tanpa melempar error.
            </p>
          </div>

          <!-- Connection Test Button -->
          <button
            type="button"
            @click="testAppleMusicConnection"
            :disabled="isTestingAppleMusic"
            class="w-full px-6 py-3 rounded-lg bg-gradient-to-r from-[#fa243c] to-[#fa586a] hover:brightness-110 text-white font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Icon
              v-if="isTestingAppleMusic"
              name="icon-park-outline:loading-four"
              size="16"
              class="animate-spin"
            />
            <Icon v-else name="carbon:renew" size="18" />
            <span>{{ isTestingAppleMusic ? 'Testing Connection...' : 'Test Apple Music Status' }}</span>
          </button>

          <!-- Live Result Display -->
          <div
            v-if="appleMusicStatusResult"
            class="p-4 rounded-xl bg-white/[0.04] border border-white/10 space-y-3"
          >
            <div class="flex items-center justify-between">
              <span class="text-xs font-mono uppercase tracking-wider text-slate-400">Status Widget</span>
              <span
                class="text-[10px] font-mono px-2 py-0.5 rounded"
                :class="appleMusicStatusResult.is_configured ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'"
              >
                {{ appleMusicStatusResult.is_configured ? (appleMusicStatusResult.is_live ? 'Live Apple Music' : 'Configured (Active)') : 'Hidden (Not Configured)' }}
              </span>
            </div>

            <!-- If Not Configured -->
            <div v-if="!appleMusicStatusResult.is_configured" class="p-3 rounded-lg bg-rose-500/5 border border-rose-500/20 text-xs text-rose-300">
              <p class="font-semibold mb-1">Widget Apple Music Saat Ini Disembunyikan</p>
              <p class="text-white/60 text-[11px]">Komponen Apple Music di halaman portfolio (About Section) tidak akan ditampilkan ke publik sebelum kredensial di file <code class="font-mono text-rose-300">.env</code> diisi lengkap.</p>
            </div>

            <!-- If Configured & Has Track -->
            <template v-else-if="appleMusicStatusResult.track">
              <div class="flex items-center gap-3">
                <img
                  :src="appleMusicStatusResult.track?.album_art"
                  alt="Track art"
                  class="w-12 h-12 rounded-lg object-cover border border-white/10"
                />
                <div class="min-w-0 flex-1">
                  <p class="text-sm font-bold text-white truncate">{{ appleMusicStatusResult.track?.title }}</p>
                  <p class="text-xs text-slate-400 truncate">{{ appleMusicStatusResult.track?.artist }} • {{ appleMusicStatusResult.track?.album }}</p>
                </div>
              </div>

              <!-- Detected Genres -->
              <div v-if="appleMusicStatusResult.favorite_genres?.length" class="pt-2 border-t border-white/10">
                <p class="text-xs font-mono text-slate-400 mb-2">Detected Favorite Genres:</p>
                <div class="flex flex-wrap gap-1.5">
                  <span
                    v-for="g in appleMusicStatusResult.favorite_genres"
                    :key="g.name"
                    class="text-[11px] px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-slate-200"
                  >
                    {{ g.name }}
                  </span>
                </div>
              </div>
            </template>
          </div>
        </div>
      </div>
    </div>

    <!-- CV Preview Modal -->
    <div
      v-if="showCVModal && cvUrl"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
    >
      <!-- Modal Container -->
      <div
        class="bg-[#0a1628] border border-white/10 rounded-2xl w-full max-w-4xl h-full max-h-[90vh] flex flex-col shadow-2xl"
      >
        <!-- Header -->
        <div
          class="flex items-center justify-between p-6 border-b border-white/10 bg-white/5"
        >
          <div class="flex items-center gap-3">
            <Icon name="carbon:document-pdf" size="24" class="text-red-400" />
            <div>
              <h3 class="text-xl font-bold text-white">CV Preview</h3>
              <p class="text-xs text-white/50">PDF Document</p>
            </div>
          </div>
          <button
            @click="closeCVModal"
            class="p-2 hover:bg-white/10 rounded-lg transition-all"
          >
            <Icon
              name="carbon:close"
              size="24"
              class="text-white/70 hover:text-white"
            />
          </button>
        </div>

        <!-- PDF Viewer (Object) -->
        <div class="flex-1 overflow-hidden bg-white/5">
          <object :data="cvUrl" type="application/pdf" class="w-full h-full">
            <!-- Fallback jika object tidak support -->
            <div
              class="flex flex-col items-center justify-center h-full gap-4 p-6"
            >
              <Icon
                name="carbon:document-pdf"
                size="48"
                class="text-red-400/50"
              />
              <div class="text-center">
                <p class="text-white mb-2">Cannot display PDF in browser</p>
                <p class="text-white/50 text-sm mb-4">
                  Please download the file to view it
                </p>
                <a
                  :href="cvUrl"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="inline-flex items-center gap-2 px-4 py-2 bg-primary hover:brightness-110 text-white font-medium rounded-lg transition-all"
                >
                  <Icon name="carbon:download" size="16" />
                  Download PDF
                </a>
              </div>
            </div>
          </object>
        </div>

        <!-- Footer -->
        <div
          class="flex items-center justify-between p-4 border-t border-white/10 bg-white/5"
        >
          <p class="text-xs text-white/50">PDF Preview</p>
          <div class="flex gap-2">
            <a
              :href="cvUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center gap-2 px-4 py-2 bg-primary hover:brightness-110 text-white text-sm font-medium rounded-lg transition-all"
            >
              <Icon name="carbon:download" size="16" />
              Download
            </a>
            <button
              @click="closeCVModal"
              class="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-sm font-medium rounded-lg transition-all"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
input[type="checkbox"] {
  accent-color: #135bec;
}
</style>
