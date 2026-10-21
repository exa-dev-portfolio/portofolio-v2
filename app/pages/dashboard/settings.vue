<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
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

// Apple Music Integration & MusicKit
const {
  connectAppleMusic,
  disconnectAppleMusic,
  saveManualUserToken,
  isAuthorizing: isAppleMusicAuthorizing,
} = useMusicKit();
const isTestingAppleMusic = ref(false);
const appleMusicStatusResult = ref<any>(null);
const manualMusicUserToken = ref("");
const isSavingManualToken = ref(false);
const showReauthForm = ref(false);

const handleConnectAppleMusic = async () => {
  try {
    const token = await connectAppleMusic();
    if (token) {
      toast.showSuccessToast('Berhasil', 'Apple Music berhasil terhubung! Widget aktif di portfolio.');
      showReauthForm.value = false;
      await testAppleMusicConnection(false);
    }
  } catch (err: any) {
    toast.showErrorToast('Koneksi Gagal', err?.message || 'Gagal menghubungkan Apple Music');
  }
};

const handleSaveManualToken = async () => {
  if (!manualMusicUserToken.value.trim()) {
    toast.showErrorToast('Error', 'Silakan masukkan Music User Token terlebih dahulu');
    return;
  }
  isSavingManualToken.value = true;
  try {
    await saveManualUserToken(manualMusicUserToken.value);
    toast.showSuccessToast('Berhasil', 'Music User Token berhasil disimpan!');
    manualMusicUserToken.value = '';
    showReauthForm.value = false;
    await testAppleMusicConnection(false);
  } catch (err: any) {
    toast.showErrorToast('Gagal', err?.message || 'Gagal menyimpan Music User Token');
  } finally {
    isSavingManualToken.value = false;
  }
};

const handleDisconnectAppleMusic = async () => {
  const confirmed = confirm("Apakah Anda yakin ingin memutuskan koneksi akun Apple Music?");
  if (!confirmed) return;

  try {
    await disconnectAppleMusic();
    toast.showSuccessToast('Terputus', 'Akun Apple Music berhasil diputus.');
    await testAppleMusicConnection(false);
  } catch (err: any) {
    toast.showErrorToast('Error', err?.message || 'Gagal memutus koneksi Apple Music');
  }
};

const testAppleMusicConnection = async (showToast = true) => {
  isTestingAppleMusic.value = true;
  try {
    const res = await $fetch<any>('/api/music');
    if (res?.data) {
      appleMusicStatusResult.value = res.data;
      if (showToast) {
        if (res.data.is_configured) {
          toast.showSuccessToast('Success', 'Apple Music status synced successfully!');
        } else {
          toast.showInfoToast('Info', 'Apple Music belum dikonfigurasi.');
        }
      }
    }
  } catch (err: any) {
    if (showToast) {
      toast.showErrorToast('Error', err?.message || 'Failed to fetch Apple Music status');
    }
  } finally {
    isTestingAppleMusic.value = false;
  }
};

onMounted(() => {
  testAppleMusicConnection(false);
});

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
            class="px-5 py-2.5 rounded-xl bg-white text-zinc-950 font-semibold hover:bg-zinc-200 disabled:opacity-50 transition-all flex items-center gap-2 text-sm shadow-sm cursor-pointer"
          >
            <Icon
              v-if="isSaving"
              name="icon-park-outline:loading-four"
              size="16"
              class="animate-spin text-zinc-950"
            />
            <Icon v-else name="carbon:save" size="18" class="text-zinc-950" />
            <span>{{ isSaving ? "Saving..." : "Save Profile" }}</span>
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
            class="w-full px-5 py-2.5 rounded-xl bg-white text-zinc-950 font-semibold hover:bg-zinc-200 disabled:opacity-50 transition-all flex items-center justify-center gap-2 text-sm shadow-sm cursor-pointer"
          >
            <Icon
              v-if="isSaving"
              name="icon-park-outline:loading-four"
              size="16"
              class="animate-spin text-zinc-950"
            />
            <Icon v-else name="carbon:save" size="18" class="text-zinc-950" />
            <span>{{ isSaving ? "Saving..." : "Save Social Links" }}</span>
          </button>
        </div>
      </div>

      <!-- CV Upload -->
      <div
        class="bg-[#141417] border border-white/10 rounded-2xl overflow-hidden"
      >
        <!-- Header -->
        <div class="px-6 py-4 border-b border-white/10 bg-white/[0.02]">
          <h2 class="text-xl font-bold text-white flex items-center gap-2.5 tracking-tight">
            <Icon name="carbon:document" size="20" class="text-zinc-300" />
            <span>CV/Resume</span>
          </h2>
        </div>

        <!-- Content -->
        <div class="p-6 space-y-4">
          <!-- Current CV Preview -->
          <div
            v-if="cvUrl"
            class="bg-white/5 border border-white/10 rounded-xl p-4"
          >
            <div class="flex items-center justify-between mb-3">
              <div class="flex items-center gap-2">
                <Icon
                  name="carbon:document-pdf"
                  size="24"
                  class="text-rose-400"
                />
                <div>
                  <p class="text-sm font-semibold text-white">Current CV</p>
                  <p class="text-xs text-zinc-400 font-mono">PDF Document</p>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <a
                  :href="cvUrl"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-mono transition-all flex items-center gap-1.5 border border-white/10"
                >
                  <Icon name="carbon:download" size="14" />
                  <span>Download</span>
                </a>
                <button
                  @click="openCVModal"
                  class="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white text-xs font-mono transition-all flex items-center gap-1.5 border border-white/10 cursor-pointer"
                >
                  <Icon name="carbon:view" size="14" />
                  <span>Preview</span>
                </button>
              </div>
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
                class="flex-1 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white cursor-pointer hover:bg-white/10 transition-all flex items-center gap-2 text-sm"
              >
                <Icon name="carbon:cloud-upload" size="18" class="text-zinc-400" />
                <span class="text-zinc-300">{{ cvFileName || "Choose PDF file..." }}</span>
              </label>
              <span class="text-xs font-mono text-zinc-500">Max 5MB</span>
            </div>
            <p class="text-xs text-zinc-500 mt-2 font-mono">
              PDF files only. Maximum size: 5MB
            </p>
          </div>

          <!-- Upload Button -->
          <button
            @click="uploadCVFile"
            :disabled="isSaving || !cvFile"
            class="w-full px-5 py-2.5 rounded-xl bg-white text-zinc-950 font-semibold hover:bg-zinc-200 disabled:opacity-50 transition-all flex items-center justify-center gap-2 text-sm shadow-sm cursor-pointer"
          >
            <Icon
              v-if="isSaving"
              name="icon-park-outline:loading-four"
              size="16"
              class="animate-spin text-zinc-950"
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
              <div class="flex items-center gap-2">
                <h2 class="text-xl font-bold text-white">Apple Music Integration</h2>
                <span
                  v-if="appleMusicStatusResult?.is_configured"
                  class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                >
                  <Icon name="carbon:checkmark-filled" size="12" /> Connected
                </span>
                <span
                  v-else
                  class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20"
                >
                  Not Connected
                </span>
              </div>
              <p class="text-xs text-white/50">Showcase Now Playing & Favorite Genres on portfolio</p>
            </div>
          </div>
          <span class="text-xs font-mono px-2.5 py-1 rounded-md bg-rose-500/10 border border-rose-500/20 text-rose-300">
            MusicKit API
          </span>
        </div>

        <!-- Content -->
        <div class="p-6 space-y-5">
          <!-- Connected Banner (Persistent active status) -->
          <div
            v-if="appleMusicStatusResult?.is_configured"
            class="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                <Icon name="carbon:checkmark-filled" size="22" />
              </div>
              <div>
                <p class="text-sm font-bold text-white flex items-center gap-2">
                  Akun Apple Music Terhubung
                  <span class="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">Live Active</span>
                </p>
                <p class="text-xs text-white/60 mt-0.5">
                  Widget di halaman portfolio sudah aktif dan tersinkronisasi otomatis. Anda tidak perlu menghubungkan ulang.
                </p>
              </div>
            </div>
            <div class="flex items-center gap-2 shrink-0">
              <button
                type="button"
                @click="testAppleMusicConnection(true)"
                :disabled="isTestingAppleMusic"
                class="px-3.5 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-white text-xs font-semibold border border-white/15 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Icon
                  v-if="isTestingAppleMusic"
                  name="icon-park-outline:loading-four"
                  size="14"
                  class="animate-spin"
                />
                <Icon v-else name="carbon:renew" size="14" />
                <span>Sync Status</span>
              </button>

              <button
                type="button"
                @click="handleDisconnectAppleMusic"
                class="px-3.5 py-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Icon name="carbon:unlink" size="14" />
                <span>Disconnect</span>
              </button>
            </div>
          </div>

          <!-- Collapsible Re-auth Toggle -->
          <div v-if="appleMusicStatusResult?.is_configured" class="flex justify-end">
            <button
              type="button"
              @click="showReauthForm = !showReauthForm"
              class="text-xs text-white/40 hover:text-white/70 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Icon :name="showReauthForm ? 'carbon:chevron-up' : 'carbon:chevron-down'" size="14" />
              <span>{{ showReauthForm ? 'Tutup Opsi Sambung Ulang' : 'Hubungkan Ulang / Ganti Akun' }}</span>
            </button>
          </div>

          <!-- Guide Note (Show only when not configured) -->
          <div
            v-if="!appleMusicStatusResult?.is_configured"
            class="p-4 rounded-xl bg-white/[0.03] border border-white/[0.08] text-xs space-y-2 text-slate-300 leading-relaxed"
          >
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
              *Jika kredensial belum diisi, widget Apple Music di halaman portfolio akan disembunyikan secara otomatis.
            </p>
          </div>

          <!-- Connect Actions (Show if NOT configured OR if user opened reauth form) -->
          <div v-if="!appleMusicStatusResult?.is_configured || showReauthForm" class="space-y-4">
            <div class="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                @click="handleConnectAppleMusic"
                :disabled="isAppleMusicAuthorizing || isTestingAppleMusic"
                class="flex-1 px-5 py-3 rounded-lg bg-gradient-to-r from-[#fa243c] to-[#fa586a] hover:brightness-110 text-white font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-md shadow-[#fa243c]/15"
              >
                <Icon
                  v-if="isAppleMusicAuthorizing"
                  name="icon-park-outline:loading-four"
                  size="18"
                  class="animate-spin"
                />
                <Icon v-else name="carbon:music" size="18" />
                <span>{{ isAppleMusicAuthorizing ? 'Menghubungkan...' : 'Connect Apple Music' }}</span>
              </button>

              <button
                v-if="!appleMusicStatusResult?.is_configured"
                type="button"
                @click="testAppleMusicConnection(true)"
                :disabled="isTestingAppleMusic || isAppleMusicAuthorizing"
                class="px-5 py-3 rounded-lg bg-white/10 hover:bg-white/15 text-white font-medium border border-white/15 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Icon
                  v-if="isTestingAppleMusic"
                  name="icon-park-outline:loading-four"
                  size="16"
                  class="animate-spin"
                />
                <Icon v-else name="carbon:renew" size="16" />
                <span>Test Sync</span>
              </button>
            </div>

            <!-- Manual Token Input (Alternative / Fallback) -->
            <div class="pt-4 border-t border-white/10 space-y-3">
              <div class="flex items-center justify-between">
                <label class="text-xs font-semibold text-white flex items-center gap-2">
                  <Icon name="carbon:password" size="14" class="text-rose-400" />
                  Atau Paste Music User Token Manual
                </label>
                <span class="text-[11px] text-white/40">Alternatif jika popup Apple ID diblokir browser</span>
              </div>
              <div class="flex flex-col sm:flex-row gap-2">
                <input
                  v-model="manualMusicUserToken"
                  type="text"
                  placeholder="Paste Apple Music-User-Token di sini..."
                  class="flex-1 px-4 py-2.5 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-white/40 text-xs focus:outline-none focus:border-rose-500/50 focus:bg-white/15 transition-all font-mono"
                />
                <button
                  type="button"
                  @click="handleSaveManualToken"
                  :disabled="isSavingManualToken || !manualMusicUserToken.trim()"
                  class="px-4 py-2.5 rounded-lg bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"
                >
                  <Icon
                    v-if="isSavingManualToken"
                    name="icon-park-outline:loading-four"
                    size="14"
                    class="animate-spin"
                  />
                  <Icon v-else name="carbon:save" size="14" />
                  <span>Simpan Token</span>
                </button>
              </div>
            </div>
          </div>

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
                {{ appleMusicStatusResult.is_configured ? 'Connected & Active' : 'Hidden (Not Configured)' }}
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

            <!-- If Configured & No Current Track -->
            <div v-else-if="appleMusicStatusResult.is_configured" class="p-3.5 rounded-lg bg-white/5 border border-white/10 text-xs">
              <p class="font-semibold text-white mb-1 flex items-center gap-1.5">
                <Icon name="carbon:headphones" size="14" class="text-rose-400" />
                Belum Ada Lagu yang Diputar
              </p>
              <p class="text-white/60 text-[11px] leading-relaxed">
                Akun Apple Music Anda sudah aktif terhubung! Saat Anda memutar lagu di aplikasi Apple Music (iPhone, Mac, atau Web), lagu dan genre favorit Anda akan otomatis muncul di sini dan di halaman portfolio.
              </p>
            </div>
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
        class="bg-[#141417] border border-white/10 rounded-2xl w-full max-w-4xl h-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
      >
        <!-- Header -->
        <div
          class="flex items-center justify-between p-5 border-b border-white/10 bg-[#18181c]"
        >
          <div class="flex items-center gap-3">
            <Icon name="carbon:document-pdf" size="24" class="text-rose-400" />
            <div>
              <h3 class="text-lg font-bold text-white tracking-tight">CV Preview</h3>
              <p class="text-xs text-zinc-400 font-mono">PDF Document</p>
            </div>
          </div>
          <button
            @click="closeCVModal"
            class="p-2 hover:bg-white/10 rounded-xl transition-all cursor-pointer text-zinc-400 hover:text-white"
          >
            <Icon
              name="carbon:close"
              size="20"
            />
          </button>
        </div>

        <!-- PDF Viewer (Object) -->
        <div class="flex-1 overflow-hidden bg-black/40">
          <object :data="cvUrl" type="application/pdf" class="w-full h-full">
            <!-- Fallback jika object tidak support -->
            <div
              class="flex flex-col items-center justify-center h-full gap-4 p-6"
            >
              <Icon
                name="carbon:document-pdf"
                size="48"
                class="text-rose-400/50"
              />
              <div class="text-center">
                <p class="text-white mb-2">Cannot display PDF in browser</p>
                <p class="text-zinc-400 text-xs mb-4">
                  Please download the file to view it
                </p>
                <a
                  :href="cvUrl"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="inline-flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-zinc-200 text-zinc-950 font-semibold rounded-xl text-xs transition-all shadow-sm"
                >
                  <Icon name="carbon:download" size="14" />
                  <span>Download PDF</span>
                </a>
              </div>
            </div>
          </object>
        </div>

        <!-- Footer -->
        <div
          class="flex items-center justify-between p-4 border-t border-white/10 bg-[#18181c]"
        >
          <p class="text-xs text-zinc-500 font-mono">PDF Preview</p>
          <div class="flex gap-2">
            <a
              :href="cvUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-zinc-200 text-zinc-950 text-xs font-semibold rounded-xl transition-all shadow-sm"
            >
              <Icon name="carbon:download" size="14" />
              <span>Download</span>
            </a>
            <button
              @click="closeCVModal"
              class="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 hover:text-white text-xs font-semibold rounded-xl transition-all cursor-pointer"
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
