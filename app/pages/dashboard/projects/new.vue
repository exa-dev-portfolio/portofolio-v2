<script setup lang="ts">
import { ref, computed } from "vue";
import { useToastCustom } from "~/composables/useToastCustom";
import type {
  Project,
  ProjectPreviewInput,
  GitHubOrgData,
  SubApp,
} from "~/types/project";
import { useProject } from "~/composables/useProject";
import ImageCropperModal from "~/components/ImageCropperModal.vue";

definePageMeta({
  layout: "dashboard",
  breadCrumb: [
    { title: "Projects", link: "/dashboard/projects" },
    { title: "Create New Project" },
  ],
});

interface FormErrors {
  name?: string;
  description?: string;
  image?: string;
  features?: string;
  technologies?: string;
  repo_url?: string;
  live_url?: string;
  github_org?: string;

  [key: string]: string | undefined;
}

const toast = useToastCustom();
const { fetchSkills } = useSkill();
const { isSaving, createProject, fetchOrgRepos } = useProject();

// Form state
const formData = ref<Project>({
  name: "",
  description: "",
  status: true,
  image: null,
  features: [""],
  technologies: [],
  repo_url: "",
  live_url: "",
  start_date: "",
  end_date: "",
  is_organization: false,
  github_org: "",
  sub_apps: [],
});

const errors = ref<FormErrors>({});
const imagePreview = ref<string>("");
const fileInputRef = ref<HTMLInputElement | null>(null);

// Image Cropper State
const isCropperOpen = ref(false);
const cropImageFile = ref<File | null>(null);

// GitHub Org Fetch State
const isFetchingOrg = ref(false);
const orgData = ref<GitHubOrgData | null>(null);

// Preview images state (Feature gallery)
const previewItems = ref<ProjectPreviewInput[]>([]);
const previewFileInputRef = ref<HTMLInputElement | null>(null);

// Fetch initial skills on SSR/CSR
const { data } = await useAsyncData("skills", async () => {
  const res = await fetchSkills(false, "", false);
  return res.data;
});

const allSkills = computed(
  () =>
    data.value?.filter(
      (skill) => !formData.value.technologies?.includes(skill.id.toString()),
    ) || [],
);

// Validation function for URLs
const isValidUrl = (url: string): boolean => {
  if (!url) return true; // Empty URL is allowed (optional field)
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// Validation function
const validateForm = (): boolean => {
  const newErrors: FormErrors = {};

  if (!formData.value.name?.trim()) {
    newErrors.name = "Project name is required";
  }

  if (!formData.value.description?.trim()) {
    newErrors.description = "Description is required";
  }

  if (!formData.value.image && !imagePreview.value) {
    newErrors.image = "Please upload a project image";
  }

  const emptyFeatures = formData.value.features.filter((f) => !f.trim());
  if (emptyFeatures.length > 0) {
    newErrors.features = `Please fill in all features or remove empty ones`;
  }

  if (
    !formData.value.technologies ||
    formData.value.technologies.length === 0
  ) {
    newErrors.technologies = "Please select at least one technology";
  }

  // Validate URLs if provided
  if (formData.value.repo_url && !isValidUrl(formData.value.repo_url)) {
    newErrors.repo_url = "Please enter a valid GitHub URL";
  }

  if (formData.value.live_url && !isValidUrl(formData.value.live_url)) {
    newErrors.live_url = "Please enter a valid live URL";
  }

  errors.value = newErrors;
  return Object.keys(newErrors).length === 0;
};

const clearError = (field: string) => {
  delete errors.value[field];
};

const selectKey = ref(0);
const selectedSkill = ref<any>(null);

const addSkill = (val: any) => {
  if (!val) return;
  const rawId = typeof val === "object" && val !== null ? val.id : val;
  if (rawId && !formData.value.technologies?.includes(rawId.toString())) {
    if (!formData.value.technologies) {
      formData.value.technologies = [];
    }
    formData.value.technologies.push(rawId.toString());
    clearError("technologies");
  }
  selectedSkill.value = null;
  nextTick(() => {
    selectKey.value++;
  });
};

const removeSkill = (skillId: number | string) => {
  if (formData.value.technologies) {
    const index = formData.value.technologies.indexOf(skillId.toString());
    if (index > -1) {
      formData.value.technologies.splice(index, 1);
    }
  }
};

const getSkillName = (skillId: number | string): string => {
  const skill = data.value?.find((s) => s.id === Number(skillId));
  return skill?.name || "Unknown";
};

const getSkillIcon = (skillId: number | string): string => {
  const skill = data.value?.find((s) => s.id === Number(skillId));
  return skill?.icon || "carbon:code";
};

const addFeature = () => {
  formData.value.features.push("");
  clearError("features");
};

const removeFeature = (index: number) => {
  formData.value.features.splice(index, 1);
};

// Image Cropper & WebP Handlers
const handleImageUpload = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];

  if (!file) return;

  if (!file.type.startsWith("image/")) {
    toast.showErrorToast("Error", "Please upload a valid image file");
    return;
  }

  const maxSize = 20 * 1024 * 1024; // Up to 20MB source image, will be cropped and compressed
  if (file.size > maxSize) {
    toast.showErrorToast("Error", "Source image exceeds 20MB limit");
    return;
  }

  cropImageFile.value = file;
  isCropperOpen.value = true;
  target.value = "";
};

const onCropSuccess = (result: {
  file: File;
  previewUrl: string;
  originalSize: number;
  compressedSize: number;
}) => {
  formData.value.image = result.file;
  imagePreview.value = result.previewUrl;
  clearError("image");
  const savings = Math.max(
    0,
    Math.round((1 - result.compressedSize / result.originalSize) * 100),
  );
  toast.showSuccessToast(
    "Image Optimized",
    `Cropped & converted to WebP (${savings}% file size reduction)`,
  );
};

const reopenCropper = () => {
  if (cropImageFile.value) {
    isCropperOpen.value = true;
  } else {
    triggerFileInput();
  }
};

const triggerFileInput = () => {
  fileInputRef.value?.click();
};

const triggerPreviewFileInput = () => {
  previewFileInputRef.value?.click();
};

// Client-side WebP compressor for preview screenshots
const compressScreenshotToWebP = (
  file: File,
  maxWidth = 1600,
  quality = 0.85,
): Promise<{ file: File; previewUrl: string }> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.naturalWidth;
        let height = img.naturalHeight;
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = "high";
          ctx.drawImage(img, 0, 0, width, height);
          canvas.toBlob(
            (blob) => {
              if (blob) {
                const cleanName = file.name
                  .replace(/\.[^/.]+$/, "")
                  .replace(/\s+/g, "-");
                const webpFile = new File([blob], `${cleanName}.webp`, {
                  type: "image/webp",
                });
                resolve({
                  file: webpFile,
                  previewUrl: URL.createObjectURL(blob),
                });
              } else {
                resolve({ file, previewUrl: e.target?.result as string });
              }
            },
            "image/webp",
            quality,
          );
        } else {
          resolve({ file, previewUrl: e.target?.result as string });
        }
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
};

const handlePreviewUpload = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  const files = target.files;
  if (!files || files.length === 0) return;

  const maxSize = 15 * 1024 * 1024;

  for (const file of Array.from(files)) {
    if (!file.type.startsWith("image/")) {
      toast.showErrorToast("Invalid File", `${file.name} is not an image file`);
      continue;
    }
    if (file.size > maxSize) {
      toast.showErrorToast("File Too Large", `${file.name} exceeds 15MB limit`);
      continue;
    }

    try {
      const optimized = await compressScreenshotToWebP(file);
      previewItems.value.push({
        id: crypto.randomUUID(),
        file: optimized.file,
        previewUrl: optimized.previewUrl,
        title: "",
        caption: "",
      });
    } catch (err) {
      console.error("Failed to compress screenshot:", err);
    }
  }

  target.value = "";
};

const removePreviewItem = (index: number) => {
  previewItems.value.splice(index, 1);
};

// GitHub Org & Sub-Apps Handlers
const handleFetchOrg = async () => {
  if (!formData.value.github_org?.trim()) {
    toast.showErrorToast(
      "Validation",
      "Please enter a GitHub Organization URL or name",
    );
    return;
  }
  isFetchingOrg.value = true;
  try {
    const data = await fetchOrgRepos(formData.value.github_org.trim());
    if (data) {
      orgData.value = data;
      toast.showSuccessToast(
        "Organization Found",
        `Discovered ${data.total_repos} repositories from ${data.org}`,
      );
    }
  } finally {
    isFetchingOrg.value = false;
  }
};

const importReposAsSubApps = () => {
  if (!orgData.value?.repos) return;
  if (!formData.value.sub_apps) formData.value.sub_apps = [];

  let count = 0;
  for (const repo of orgData.value.repos) {
    const exists = formData.value.sub_apps.some(
      (a) =>
        a.repo_url?.toLowerCase() === repo.html_url.toLowerCase() ||
        a.name.toLowerCase() === repo.name.toLowerCase(),
    );
    if (!exists) {
      formData.value.sub_apps.push({
        id: crypto.randomUUID(),
        name: repo.name,
        app_type: repo.app_type,
        description: repo.description || "",
        repo_url: repo.html_url,
        live_url: repo.homepage || "",
        technologies: repo.language ? [repo.language] : [],
      });
      count++;
    }
  }
  toast.showSuccessToast(
    "Import Complete",
    `Added ${count} repositories as sub-apps`,
  );
};

const addSubApp = () => {
  if (!formData.value.sub_apps) formData.value.sub_apps = [];
  formData.value.sub_apps.push({
    id: crypto.randomUUID(),
    name: "",
    app_type: "web",
    description: "",
    repo_url: "",
    live_url: "",
    technologies: [],
  });
};

const removeSubApp = (index: number) => {
  formData.value.sub_apps?.splice(index, 1);
};

const saveProject = async () => {
  if (!validateForm()) {
    toast.showErrorToast("Error", "Please fix the errors above");
    return;
  }

  const success = await createProject(formData.value, previewItems.value);
  if (success) navigateTo("/dashboard/projects");
};

const goBack = () => {
  navigateTo("/dashboard/projects");
};
</script>

<template>
  <div class="p-8">
    <!-- Header -->
    <div class="flex items-center justify-between mb-8">
      <div>
        <h1 class="text-4xl font-black text-white mb-2">Create New Project</h1>
        <p class="text-white/60">Add a new project to your portfolio</p>
      </div>

      <!-- Action Buttons -->
      <div class="flex gap-3">
        <button
          @click="goBack"
          class="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-white/10 text-white font-semibold hover:bg-white/20 transition-all border border-white/20"
        >
          <Icon name="carbon:arrow-left" size="20" />
          Back
        </button>

        <button
          @click="saveProject"
          :disabled="isSaving"
          class="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-white font-semibold hover:brightness-110 transition-all disabled:opacity-50"
        >
          <Icon
            v-if="isSaving"
            name="icon-park-outline:loading-four"
            size="20"
            class="animate-spin"
          />
          <Icon v-else name="carbon:save" size="20" />
          {{ isSaving ? "Creating..." : "Create Project" }}
        </button>
      </div>
    </div>

    <!-- Content -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <!-- Main Content -->
      <div class="lg:col-span-2 space-y-6">
        <!-- Image Section -->
        <div
          class="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 space-y-4"
          :class="errors.image ? 'border-red-500/50' : ''"
        >
          <div>
            <label class="block text-sm font-semibold text-white mb-2">
              Project Image
              <span class="text-red-400">*</span>
            </label>
            <div class="flex gap-3">
              <button
                @click="triggerFileInput"
                type="button"
                class="inline-flex cursor-pointer items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white font-semibold hover:brightness-110 transition-all"
              >
                <Icon name="carbon:cloud-upload" size="20" />
                Choose Image
              </button>
              <input
                ref="fileInputRef"
                type="file"
                accept="image/*"
                @change="handleImageUpload"
                class="hidden"
              />
              <span
                v-if="imagePreview"
                class="inline-flex items-center text-sm text-green-400"
              >
                <Icon name="carbon:checkmark-filled" size="16" class="mr-1" />
                Image selected
              </span>
              <span
                v-else
                class="inline-flex items-center text-sm text-white/60"
              >
                <Icon name="carbon:close" size="16" class="mr-1" />
                No image selected
              </span>
            </div>
            <!-- Error Message -->
            <div
              v-if="errors.image"
              class="mt-2 flex items-center gap-2 text-red-400 text-sm"
            >
              <Icon name="carbon:warning-alt" size="16" />
              {{ errors.image }}
            </div>
          </div>

          <!-- Image Preview with Crop Re-adjust Option -->
          <div
            v-if="imagePreview"
            class="relative w-full aspect-[16/9] max-h-[440px] bg-slate-950 rounded-xl overflow-hidden border border-white/20 group flex items-center justify-center"
          >
            <img
              :src="imagePreview"
              alt="Project preview"
              class="w-full h-full object-contain"
            />
            <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
              <button
                type="button"
                @click="reopenCropper"
                class="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg flex items-center gap-2 cursor-pointer transition-transform hover:scale-105"
              >
                <Icon name="carbon:crop" size="16" />
                <span>Adjust Crop & WebP</span>
              </button>
            </div>
            <span class="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/70 text-[10px] font-mono text-emerald-400">
              16:9 WebP Optimized
            </span>
          </div>
        </div>

        <!-- Feature Gallery & Screenshots Section -->
        <div
          class="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 space-y-4"
        >
          <div
            class="flex flex-col sm:flex-row sm:items-center justify-between gap-3"
          >
            <div>
              <div class="flex items-center gap-2">
                <label class="text-sm font-semibold text-white"
                  >Feature Gallery & Screenshots</label
                >
                <span
                  class="px-2 py-0.5 rounded-full text-[11px] font-mono font-medium bg-blue-500/15 text-blue-300 border border-blue-500/30"
                >
                  {{ previewItems.length }}
                  {{ previewItems.length === 1 ? "Preview" : "Previews" }}
                </span>
              </div>
              <p class="text-xs text-white/50 mt-0.5">
                Upload screenshots to showcase detailed features, mobile
                layouts, or architecture in the modal viewer.
              </p>
            </div>

            <div>
              <button
                @click="triggerPreviewFileInput"
                type="button"
                class="inline-flex cursor-pointer items-center gap-2 px-3.5 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-white text-xs font-semibold border border-white/20 transition-all"
              >
                <Icon name="carbon:add-alt" size="16" class="text-blue-400" />
                Add Screenshots
              </button>
              <input
                ref="previewFileInputRef"
                type="file"
                accept="image/*"
                multiple
                @change="handlePreviewUpload"
                class="hidden"
              />
            </div>
          </div>

          <!-- Empty State -->
          <div
            v-if="previewItems.length === 0"
            @click="triggerPreviewFileInput"
            class="border-2 border-dashed border-white/10 hover:border-blue-500/40 rounded-xl p-8 text-center cursor-pointer transition-all bg-white/[0.01] hover:bg-white/[0.03]"
          >
            <div
              class="w-10 h-10 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mx-auto mb-2"
            >
              <Icon name="carbon:images" size="20" />
            </div>
            <p class="text-sm font-medium text-white/80">
              No feature screenshots added yet
            </p>
            <p class="text-xs text-white/40 mt-1">
              Click here or the button above to select one or multiple images
              (PNG, WebP, JPG up to 5MB)
            </p>
          </div>

          <!-- Preview Items List -->
          <div v-else class="space-y-3">
            <div
              v-for="(item, idx) in previewItems"
              :key="item.id || idx"
              class="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-3.5 rounded-xl bg-white/[0.03] border border-white/10 hover:border-white/20 transition-all"
            >
              <!-- Thumbnail Preview -->
              <div
                class="relative w-full sm:w-36 aspect-[16/9] rounded-lg overflow-hidden border border-white/10 bg-slate-950 shrink-0 flex items-center justify-center"
              >
                <img
                  :src="item.previewUrl"
                  :alt="item.title || `Screenshot ${idx + 1}`"
                  class="w-full h-full object-contain"
                />
                <span
                  class="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-xs text-[10px] font-mono text-white/80"
                >
                  #{{ idx + 1 }}
                </span>
              </div>

              <!-- Inputs: Title & Caption -->
              <div class="flex-1 w-full space-y-2">
                <div>
                  <input
                    v-model="item.title"
                    type="text"
                    placeholder="Screenshot Title (e.g. Analytics Dashboard, Mobile UI)"
                    class="w-full px-3 py-1.5 text-xs rounded-lg bg-white/10 border border-white/15 focus:border-blue-500/50 text-white placeholder:text-white/40 focus:outline-none transition-all"
                  />
                </div>
                <div>
                  <input
                    v-model="item.caption"
                    type="text"
                    placeholder="Brief caption/description of this feature..."
                    class="w-full px-3 py-1.5 text-xs rounded-lg bg-white/10 border border-white/15 focus:border-blue-500/50 text-white placeholder:text-white/40 focus:outline-none transition-all"
                  />
                </div>
              </div>

              <!-- Delete Action -->
              <button
                @click="removePreviewItem(idx)"
                type="button"
                class="p-2 rounded-lg hover:bg-red-500/20 text-white/50 hover:text-red-400 transition-all cursor-pointer shrink-0 self-end sm:self-center"
                title="Remove screenshot"
              >
                <Icon name="carbon:trash-can" size="18" />
              </button>
            </div>
          </div>
        </div>

        <!-- Multi-App & Organization Ecosystem Section -->
        <div
          class="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 space-y-5"
        >
          <!-- Header with Toggle -->
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div
                class="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400"
              >
                <Icon name="carbon:flow" size="20" />
              </div>
              <div>
                <h3 class="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                  <span>Multi-App & Organization Ecosystem</span>
                  <span
                    v-if="formData.is_organization"
                    class="px-2 py-0.5 rounded-full text-[10px] font-mono bg-purple-500/20 text-purple-300 border border-purple-500/40"
                  >
                    Active
                  </span>
                </h3>
                <p class="text-xs text-white/60 mt-0.5">
                  Group multiple applications (e.g. Mobile App, Kiosk Web POS, Backend API) under a GitHub Organization.
                </p>
              </div>
            </div>

            <!-- Toggle Switch -->
            <label class="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                v-model="formData.is_organization"
                class="sr-only peer"
              />
              <div
                class="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"
              ></div>
            </label>
          </div>

          <!-- Collapsible Body when Enabled -->
          <div
            v-if="formData.is_organization"
            class="space-y-5 pt-3 border-t border-white/10"
          >
            <!-- Organization URL / Handle Input + Sync Button -->
            <div>
              <label class="block text-xs font-semibold text-white/80 mb-1.5">
                GitHub Organization Name or URL
              </label>
              <div class="flex gap-2.5">
                <div class="relative flex-1">
                  <div
                    class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-white/40"
                  >
                    <Icon name="line-md:github" size="16" />
                  </div>
                  <input
                    v-model="formData.github_org"
                    type="text"
                    placeholder="e.g. https://github.com/my-coffee-org or my-coffee-org"
                    class="w-full pl-9 pr-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-white/40 focus:outline-none focus:border-purple-500/50 text-sm"
                  />
                </div>

                <button
                  type="button"
                  @click="handleFetchOrg"
                  :disabled="isFetchingOrg || !formData.github_org"
                  class="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-purple-500/20 shrink-0"
                >
                  <Icon
                    v-if="isFetchingOrg"
                    name="icon-park-outline:loading-four"
                    size="14"
                    class="animate-spin"
                  />
                  <Icon v-else name="carbon:synchronize" size="14" />
                  <span>{{ isFetchingOrg ? "Fetching..." : "Fetch Repos" }}</span>
                </button>
              </div>
            </div>

            <!-- Discovered Repos Banner & Import Button -->
            <div
              v-if="orgData"
              class="p-4 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-between gap-3"
            >
              <div class="flex items-center gap-3 min-w-0">
                <img
                  :src="orgData.avatar_url"
                  :alt="orgData.org"
                  class="w-9 h-9 rounded-lg border border-white/20 object-cover shrink-0"
                />
                <div class="min-w-0">
                  <p class="text-xs font-semibold text-white truncate">
                    GitHub: {{ orgData.org }}
                  </p>
                  <p class="text-[11px] font-mono text-purple-300">
                    {{ orgData.total_repos }} repositories discovered
                  </p>
                </div>
              </div>

              <button
                type="button"
                @click="importReposAsSubApps"
                class="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/20 transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <Icon name="carbon:download" size="14" class="text-purple-400" />
                <span>Import All Repos</span>
              </button>
            </div>

            <!-- Sub-Apps List -->
            <div class="space-y-3">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <span class="text-xs font-mono font-semibold text-white"
                    >Application Suite / Sub-Apps</span
                  >
                  <span
                    class="px-2 py-0.5 rounded-full text-[10px] font-mono bg-white/10 text-white/80"
                  >
                    {{ formData.sub_apps?.length || 0 }} apps
                  </span>
                </div>

                <button
                  type="button"
                  @click="addSubApp"
                  class="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/15 text-white text-xs font-semibold border border-white/20 transition-all flex items-center gap-1 cursor-pointer"
                >
                  <Icon name="carbon:add" size="14" class="text-purple-400" />
                  <span>Add Sub-App</span>
                </button>
              </div>

              <!-- Empty state -->
              <div
                v-if="!formData.sub_apps || formData.sub_apps.length === 0"
                class="p-6 rounded-xl border border-dashed border-white/15 text-center bg-white/[0.01]"
              >
                <Icon
                  name="carbon:cube"
                  size="24"
                  class="mx-auto text-white/30 mb-2"
                />
                <p class="text-xs text-white/60">No sub-applications added yet.</p>
                <p class="text-[11px] text-white/40 mt-1">
                  Click "Add Sub-App" or "Fetch Repos" from your GitHub Organization above.
                </p>
              </div>

              <!-- Sub-app Card -->
              <div
                v-for="(app, idx) in formData.sub_apps"
                :key="app.id || idx"
                class="p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-3 relative group"
              >
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <span
                      class="w-5 h-5 rounded-md bg-purple-500/20 text-purple-400 text-[11px] font-mono flex items-center justify-center font-bold"
                    >
                      {{ idx + 1 }}
                    </span>
                    <span class="text-xs font-bold text-white">{{
                      app.name || "Untitled App"
                    }}</span>
                  </div>

                  <button
                    type="button"
                    @click="removeSubApp(idx)"
                    class="p-1 rounded-lg hover:bg-red-500/20 text-white/40 hover:text-red-400 transition-colors cursor-pointer"
                    title="Remove app"
                  >
                    <Icon name="carbon:trash-can" size="14" />
                  </button>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <!-- App Type -->
                  <div>
                    <label class="block text-[11px] font-mono text-white/70 mb-1"
                      >App Type</label
                    >
                    <select
                      v-model="app.app_type"
                      class="w-full px-2.5 py-1.5 rounded-lg bg-white/10 border border-white/20 text-white text-xs focus:outline-none focus:border-purple-500/50"
                    >
                      <option value="mobile" class="bg-slate-900 text-white">
                        📱 Mobile App
                      </option>
                      <option value="web" class="bg-slate-900 text-white">
                        💻 Web App
                      </option>
                      <option value="backend" class="bg-slate-900 text-white">
                        ⚙️ Backend / API
                      </option>
                      <option value="pos" class="bg-slate-900 text-white">
                        🖥️ POS / Kiosk
                      </option>
                      <option value="other" class="bg-slate-900 text-white">
                        📦 Service / Library
                      </option>
                    </select>
                  </div>

                  <!-- App Name -->
                  <div class="sm:col-span-2">
                    <label class="block text-[11px] font-mono text-white/70 mb-1"
                      >App Name</label
                    >
                    <input
                      v-model="app.name"
                      type="text"
                      placeholder="e.g., Customer Mobile Ordering"
                      class="w-full px-2.5 py-1.5 rounded-lg bg-white/10 border border-white/20 text-white text-xs placeholder:text-white/40 focus:outline-none focus:border-purple-500/50"
                    />
                  </div>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <!-- Repo URL -->
                  <div>
                    <label class="block text-[11px] font-mono text-white/70 mb-1"
                      >Repository URL</label
                    >
                    <input
                      v-model="app.repo_url"
                      type="url"
                      placeholder="https://github.com/org/repo"
                      class="w-full px-2.5 py-1.5 rounded-lg bg-white/10 border border-white/20 text-white text-xs placeholder:text-white/40 focus:outline-none focus:border-purple-500/50"
                    />
                  </div>

                  <!-- Live / Demo URL -->
                  <div>
                    <label class="block text-[11px] font-mono text-white/70 mb-1"
                      >Live / Demo URL (Optional)</label
                    >
                    <input
                      v-model="app.live_url"
                      type="url"
                      placeholder="https://demo.app.com or APK link"
                      class="w-full px-2.5 py-1.5 rounded-lg bg-white/10 border border-white/20 text-white text-xs placeholder:text-white/40 focus:outline-none focus:border-purple-500/50"
                    />
                  </div>
                </div>

                <!-- Description -->
                <div>
                  <label class="block text-[11px] font-mono text-white/70 mb-1"
                    >Short Description</label
                  >
                  <input
                    v-model="app.description"
                    type="text"
                    placeholder="Brief summary of this app..."
                    class="w-full px-2.5 py-1.5 rounded-lg bg-white/10 border border-white/20 text-white text-xs placeholder:text-white/40 focus:outline-none focus:border-purple-500/50"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Description Section -->
        <div
          class="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 space-y-4"
          :class="errors.name || errors.description ? 'border-red-500/50' : ''"
        >
          <div>
            <label class="block text-sm font-semibold text-white mb-2">
              Project Name
              <span class="text-red-400">*</span>
            </label>
            <input
              v-model="formData.name"
              @input="clearError('name')"
              type="text"
              class="w-full px-4 py-2 rounded-lg bg-white/10 border transition-all text-white placeholder:text-white/40 focus:outline-none"
              :class="
                errors.name
                  ? 'border-red-500 focus:border-red-500'
                  : 'border-white/20 focus:border-primary/50'
              "
              placeholder="e.g., SaaS Analytics Dashboard"
            />
            <!-- Error Message -->
            <div
              v-if="errors.name"
              class="mt-2 flex items-center gap-2 text-red-400 text-sm"
            >
              <Icon name="carbon:warning-alt" size="16" />
              {{ errors.name }}
            </div>
          </div>
          <div>
            <label class="block text-sm font-semibold text-white mb-2">
              Short Description
              <span class="text-red-400">*</span>
            </label>
            <input
              v-model="formData.description"
              @input="clearError('description')"
              type="text"
              placeholder="A brief description of your project..."
              class="w-full px-4 py-2 rounded-lg bg-white/10 border transition-all text-white placeholder:text-white/40 focus:outline-none"
              :class="
                errors.description
                  ? 'border-red-500 focus:border-red-500'
                  : 'border-white/20 focus:border-primary/50'
              "
            />
            <!-- Error Message -->
            <div
              v-if="errors.description"
              class="mt-2 flex items-center gap-2 text-red-400 text-sm"
            >
              <Icon name="carbon:warning-alt" size="16" />
              {{ errors.description }}
            </div>
          </div>
        </div>

        <!-- Status Section -->
        <div
          class="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6"
        >
          <label class="block text-sm font-semibold text-white mb-3"
            >Status</label
          >
          <USelectMenu
            v-model="formData.status"
            :items="[
              { value: false, label: 'Draft' },
              { value: true, label: 'Published' },
            ]"
            option-attribute="label"
            value-key="value"
            placeholder="Select status..."
            class="w-full"
          />
        </div>
      </div>

      <!-- Sidebar -->
      <div class="lg:col-span-1 space-y-6">
        <!-- Technologies/Skills Section -->
        <div
          class="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6"
        >
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-bold text-white">Technologies Used</h3>
          </div>

          <!-- Skills Dropdown using Nuxt UI -->
          <div class="mb-4">
            <label class="block text-xs font-semibold text-white/80 mb-2"
              >Select Skills</label
            >
            <USelectMenu
              :key="selectKey"
              v-model="selectedSkill"
              :items="allSkills"
              label-key="name"
              value-key="id"
              placeholder="Choose a skill..."
              @update:model-value="addSkill"
              class="w-full"
            >
              <template #default>
                <span class="text-white/50 text-sm">Choose a skill...</span>
              </template>
            </USelectMenu>
          </div>

          <!-- Selected Skills -->
          <div
            v-if="formData.technologies && formData.technologies.length > 0"
            class="space-y-2"
          >
            <p class="text-xs text-white/60 mb-3">Selected Technologies:</p>
            <div
              v-for="skillId in formData.technologies"
              :key="skillId"
              class="flex items-center justify-between p-3 rounded-lg bg-primary/20 border border-primary/30"
            >
              <div class="flex items-center gap-2 flex-1">
                <Icon
                  :name="getSkillIcon(skillId)"
                  size="18"
                  class="text-primary"
                />
                <span class="text-sm font-medium text-white">{{
                  getSkillName(skillId)
                }}</span>
              </div>
              <button
                @click="removeSkill(skillId)"
                class="p-1.5 rounded-lg hover:bg-red-500/20 text-white/50 hover:text-red-400 transition-all"
                type="button"
              >
                <Icon name="carbon:trash-can" size="16" />
              </button>
            </div>
          </div>

          <div v-else class="text-center py-6">
            <p class="text-sm text-white/50">No skills selected yet</p>
          </div>
          <div
            v-if="errors.technologies"
            class="mt-3 flex items-center gap-2 text-red-400 text-sm"
          >
            <Icon name="carbon:warning-alt" size="16" />
            {{ errors.technologies }}
          </div>
        </div>

        <!-- Features Section -->
        <div
          class="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6"
          :class="errors.features ? 'border-red-500/50' : ''"
        >
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-bold text-white">Key Features</h3>
            <button
              @click="addFeature"
              class="p-1.5 rounded-lg hover:bg-primary/20 text-primary transition-all"
              type="button"
            >
              <Icon name="carbon:add" size="16" />
            </button>
          </div>

          <div class="space-y-2">
            <div
              v-for="index in formData.features.length"
              :key="index - 1"
              class="flex gap-2"
            >
              <input
                v-model="formData.features[index - 1]"
                @input="clearError('features')"
                type="text"
                placeholder="e.g., Real-time updates"
                class="flex-1 px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-white/40 focus:outline-none focus:border-primary/50 transition-all text-sm"
              />
              <button
                v-if="formData.features.length > 1"
                @click="removeFeature(index - 1)"
                class="p-2 rounded-lg hover:bg-red-500/20 text-white/50 hover:text-red-400 transition-all"
                type="button"
              >
                <Icon name="carbon:trash-can" size="16" />
              </button>
            </div>
          </div>

          <!-- Error Message -->
          <div
            v-if="errors.features"
            class="mt-3 flex items-center gap-2 text-red-400 text-sm"
          >
            <Icon name="carbon:warning-alt" size="16" />
            {{ errors.features }}
          </div>
        </div>

        <!-- Links Section -->
        <div
          class="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 space-y-3"
        >
          <h3 class="text-lg font-bold text-white mb-4">Links</h3>
          <div>
            <label class="block text-xs font-semibold text-white/80 mb-1.5"
              >GitHub Link</label
            >
            <input
              v-model="formData.repo_url"
              @input="clearError('repo_url')"
              type="url"
              placeholder="https://github.com/..."
              class="w-full px-3 py-2 rounded-lg bg-white/10 border transition-all text-white placeholder:text-white/40 focus:outline-none text-sm"
              :class="
                errors.repo_url
                  ? 'border-red-500 focus:border-red-500'
                  : 'border-white/20 focus:border-primary/50'
              "
            />
            <div
              v-if="errors.repo_url"
              class="mt-2 flex items-center gap-2 text-red-400 text-sm"
            >
              <Icon name="carbon:warning-alt" size="16" />
              {{ errors.repo_url }}
            </div>
          </div>
          <div>
            <label class="block text-xs font-semibold text-white/80 mb-1.5"
              >Live Link</label
            >
            <input
              v-model="formData.live_url"
              @input="clearError('live_url')"
              type="url"
              placeholder="https://example.com"
              class="w-full px-3 py-2 rounded-lg bg-white/10 border transition-all text-white placeholder:text-white/40 focus:outline-none text-sm"
              :class="
                errors.live_url
                  ? 'border-red-500 focus:border-red-500'
                  : 'border-white/20 focus:border-primary/50'
              "
            />
            <div
              v-if="errors.live_url"
              class="mt-2 flex items-center gap-2 text-red-400 text-sm"
            >
              <Icon name="carbon:warning-alt" size="16" />
              {{ errors.live_url }}
            </div>
          </div>
        </div>

        <!-- Timeline Section -->
        <div
          class="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 space-y-3"
        >
          <h3 class="text-lg font-bold text-white mb-4">Timeline</h3>
          <div>
            <label class="block text-xs font-semibold text-white/80 mb-1.5"
              >Start Date</label
            >
            <input
              v-model="formData.start_date"
              type="date"
              class="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:border-primary/50 transition-all text-sm"
            />
          </div>
          <div>
            <label class="block text-xs font-semibold text-white/80 mb-1.5"
              >End Date</label
            >
            <input
              v-model="formData.end_date"
              type="date"
              class="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:border-primary/50 transition-all text-sm"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Image Cropper & WebP Optimizer Modal -->
    <ImageCropperModal
      v-model:open="isCropperOpen"
      :image-file="cropImageFile"
      @crop-success="onCropSuccess"
    />
  </div>
</template>

<style scoped></style>
