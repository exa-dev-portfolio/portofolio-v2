<script setup lang="ts">
import {computed, ref} from 'vue'
import type {GitHubOrgData, Project, ProjectPreviewInput, SubApp} from "~/types/project";
import {useToastCustom} from "~/composables/useToastCustom";
import {useProject} from "~/composables/useProject";
import {useSkill} from "~/composables/useSkill";
import {formatDate, parseDateForInput} from "~/utils";
import ImageCropperModal from "~/components/ImageCropperModal.vue";

interface FormErrors {
  name?: string
  description?: string
  image?: string
  features?: string
  technologies?: string
  repo_url?: string
  live_url?: string
  github_org?: string

  [key: string]: string | undefined
}

const route = useRoute()
const router = useRouter()
const breadCrumbStore = useBreadCrumbStore()
const toast = useToastCustom()
const {fetchSkills} = useSkill()
const {isSaving, fetchProjectById, updateProject, deleteProject, fetchOrgRepos} = useProject()

const projectId = computed(() => parseInt(route.params.id as string))
const isEditMode = ref(false)

// Form state
const formData = ref<Project | null>(null)
const currentProject = ref<Project | null>(null)
const errors = ref<FormErrors>({})
const imagePreview = ref<string>('')
const fileInputRef = ref<HTMLInputElement | null>(null)

// Image Cropper State
const isCropperOpen = ref(false)
const cropImageFile = ref<File | null>(null)

// GitHub Org State
const isFetchingOrg = ref(false)
const orgData = ref<GitHubOrgData | null>(null)

// Preview images state (Feature gallery)
const previewItems = ref<ProjectPreviewInput[]>([])
const previewFileInputRef = ref<HTMLInputElement | null>(null)

const triggerPreviewFileInput = () => {
  previewFileInputRef.value?.click()
}

// Client-side WebP compressor for preview screenshots
const compressScreenshotToWebP = (
    file: File,
    maxWidth = 1600,
    quality = 0.85
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
              quality
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
  const target = event.target as HTMLInputElement
  const files = target.files
  if (!files || files.length === 0) return

  const maxSize = 15 * 1024 * 1024

  for (const file of Array.from(files)) {
    if (!file.type.startsWith('image/')) {
      toast.showErrorToast('Invalid File', `${file.name} is not an image file`)
      continue
    }
    if (file.size > maxSize) {
      toast.showErrorToast('File Too Large', `${file.name} exceeds 15MB limit`)
      continue
    }

    try {
      const optimized = await compressScreenshotToWebP(file);
      previewItems.value.push({
        id: crypto.randomUUID(),
        file: optimized.file,
        previewUrl: optimized.previewUrl,
        title: '',
        caption: ''
      })
    } catch (err) {
      console.error("Failed to compress screenshot:", err);
    }
  }

  target.value = ''
}

const removePreviewItem = (index: number) => {
  previewItems.value.splice(index, 1)
}

const initPreviewItems = (project: Project) => {
  if (project.preview_images && Array.isArray(project.preview_images)) {
    previewItems.value = project.preview_images.map((img) => ({
      id: crypto.randomUUID(),
      url: img.url,
      previewUrl: img.url,
      title: img.title || '',
      caption: img.caption || ''
    }))
  } else {
    previewItems.value = []
  }
}

// Fetch initial skills on SSR/CSR
const {data: skillsData} = await useAsyncData('edit-skills', async () => {
  const res = await fetchSkills(false, '', false)
  return res.data
})

// Fetch project data on SSR/CSR
definePageMeta({
  layout: 'dashboard',
  breadCrumb: [
    {title: 'Projects', link: '/dashboard/projects'},
    {title: 'Detail'}
  ]
})
const {data: projectData} = await useAsyncData(`project-${route.params.id}`, async () => {
  return await fetchProjectById(projectId.value)
})

const allSkills = computed(
    () => skillsData.value?.filter(
        (skill) => !formData.value?.id_skills?.includes(skill.id)
    ) || []
)

// Validation functions
const isValidUrl = (url: string): boolean => {
  if (!url) return true
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

const validateForm = (): boolean => {
  const newErrors: FormErrors = {}

  if (!formData.value?.name?.trim()) {
    newErrors.name = 'Project name is required'
  }

  if (!formData.value?.description?.trim()) {
    newErrors.description = 'Description is required'
  }

  if (!formData.value?.image && !imagePreview.value) {
    newErrors.image = 'Please upload a project image'
  }

  const emptyFeatures = formData.value?.features.filter(f => !f.trim()) || []
  if (emptyFeatures.length > 0) {
    newErrors.features = 'Please fill in all features or remove empty ones'
  }

  if (!formData.value?.id_skills || formData.value.id_skills.length === 0) {
    newErrors.technologies = 'Please select at least one technology'
  }

  if (formData.value?.repo_url && !isValidUrl(formData.value.repo_url)) {
    newErrors.repo_url = 'Please enter a valid GitHub URL'
  }

  if (formData.value?.live_url && !isValidUrl(formData.value.live_url)) {
    newErrors.live_url = 'Please enter a valid live URL'
  }

  errors.value = newErrors
  return Object.keys(newErrors).length === 0
}

const clearError = (field: string) => {
  delete errors.value[field]
}

const selectKey = ref(0)
const selectedSkill = ref<any>(null)

const addSkill = (val: any) => {
  if (!val) return
  const skillId = typeof val === 'object' && val !== null ? Number(val.id) : Number(val)
  if (skillId && !formData.value?.id_skills?.includes(skillId)) {
    if (!formData.value) return
    if (!formData.value.id_skills) {
      formData.value.id_skills = []
    }
    formData.value.id_skills.push(skillId)
    clearError('technologies')
  }
  selectedSkill.value = null
  nextTick(() => {
    selectKey.value++
  })
}

const removeSkill = (skillId: number) => {
  if (formData.value?.id_skills) {
    const index = formData.value.id_skills.indexOf(skillId)
    if (index > -1) {
      formData.value.id_skills.splice(index, 1)
    }
  }
}

const getSkillName = (skillId: number): string => {
  const skill = skillsData.value?.find(s => s.id === skillId)
  return skill?.name || 'Unknown'
}

const getSkillIcon = (skillId: number): string => {
  const skill = skillsData.value?.find(s => s.id === skillId)
  return skill?.icon || 'carbon:code'
}

const addFeature = () => {
  if (formData.value) {
    formData.value.features.push('')
    clearError('features')
  }
}

const removeFeature = (index: number) => {
  if (formData.value) {
    formData.value.features.splice(index, 1)
  }
}

// Image Cropper & WebP Handlers
const handleImageUpload = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]

  if (!file) return

  if (!file.type.startsWith('image/')) {
    toast.showErrorToast('Error', 'Please select an image file')
    return
  }

  const maxSize = 20 * 1024 * 1024
  if (file.size > maxSize) {
    toast.showErrorToast('Error', 'Source image exceeds 20MB limit')
    return
  }

  cropImageFile.value = file
  isCropperOpen.value = true
  target.value = ''
}

const onCropSuccess = (result: {
  file: File
  previewUrl: string
  originalSize: number
  compressedSize: number
}) => {
  if (formData.value) {
    formData.value.image = result.file as any
  }
  imagePreview.value = result.previewUrl
  clearError('image')
  const savings = Math.max(
      0,
      Math.round((1 - result.compressedSize / result.originalSize) * 100)
  )
  toast.showSuccessToast(
      'Image Optimized',
      `Cropped & converted to WebP (${savings}% file size reduction)`
  )
}

const reopenCropper = () => {
  if (cropImageFile.value) {
    isCropperOpen.value = true
  } else {
    triggerFileInput()
  }
}

// GitHub Org & Sub-Apps Handlers
const handleFetchOrg = async () => {
  if (!formData.value?.github_org?.trim()) {
    toast.showErrorToast(
        'Validation',
        'Please enter a GitHub Organization URL or name'
    )
    return
  }
  isFetchingOrg.value = true
  try {
    const data = await fetchOrgRepos(formData.value.github_org.trim())
    if (data) {
      orgData.value = data
      toast.showSuccessToast(
          'Organization Found',
          `Discovered ${data.total_repos} repositories from ${data.org}`
      )
    }
  } finally {
    isFetchingOrg.value = false
  }
}

const importReposAsSubApps = () => {
  if (!orgData.value?.repos || !formData.value) return
  if (!formData.value.sub_apps) formData.value.sub_apps = []

  let count = 0
  for (const repo of orgData.value.repos) {
    const exists = formData.value.sub_apps.some(
        (a) =>
            a.repo_url?.toLowerCase() === repo.html_url.toLowerCase() ||
            a.name.toLowerCase() === repo.name.toLowerCase()
    )
    if (!exists) {
      formData.value.sub_apps.push({
        id: crypto.randomUUID(),
        name: repo.name,
        app_type: repo.app_type,
        description: repo.description || '',
        repo_url: repo.html_url,
        live_url: repo.homepage || '',
        technologies: repo.language ? [repo.language] : []
      })
      count++
    }
  }
  toast.showSuccessToast(
      'Import Complete',
      `Added ${count} repositories as sub-apps`
  )
}

const addSubApp = () => {
  if (!formData.value) return
  if (!formData.value.sub_apps) formData.value.sub_apps = []
  formData.value.sub_apps.push({
    id: crypto.randomUUID(),
    name: '',
    app_type: 'web',
    description: '',
    repo_url: '',
    live_url: '',
    technologies: []
  })
}

const removeSubApp = (index: number) => {
  formData.value?.sub_apps?.splice(index, 1)
}

const triggerFileInput = () => {
  fileInputRef.value?.click()
}

const toggleEditMode = () => {
  if (isEditMode.value) {
    // Cancel edit
    formData.value = {
      ...currentProject.value!,
      sub_apps: JSON.parse(JSON.stringify(currentProject.value?.sub_apps || []))
    }
    imagePreview.value = currentProject.value?.preview_image as string || ''
    initPreviewItems(currentProject.value!)
    errors.value = {}
    isEditMode.value = false
  } else {
    // Enter edit mode
    isEditMode.value = true
  }
}

const saveProject = async () => {
  if (!validateForm() || !formData.value) return toast.showErrorToast('Error', 'Please fix the errors in the form before saving.')

  formData.value.id = projectId.value
  const success = await updateProject(formData.value, previewItems.value)
  if (success) {
    const updated = await fetchProjectById(projectId.value)
    if (updated) {
      currentProject.value = {
        ...updated,
        is_organization: Boolean(updated.is_organization),
        github_org: updated.github_org || '',
        sub_apps: Array.isArray(updated.sub_apps) ? updated.sub_apps : [],
        start_date: parseDateForInput(updated.start_date),
        end_date: parseDateForInput(updated.end_date)
      }
      formData.value = {
        ...currentProject.value,
        sub_apps: JSON.parse(JSON.stringify(currentProject.value.sub_apps || []))
      }
      imagePreview.value = updated.preview_image as string || ''
      initPreviewItems(updated)
    }
    isEditMode.value = false
  }
}

const deleteProjectHandler = async () => {
  toast.showConfirmationToast(
      'Delete Project',
      'Are you sure you want to delete this project? This action cannot be undone.',
      async () => {
        const success = await deleteProject(projectId.value)
        if (success) {
          router.push('/dashboard/projects')
        }
      },
  )
}

const getStatusColor = (status: boolean) => {
  return status
      ? 'bg-green-500/20 text-green-400 border-green-500/40'
      : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40'
}

const getStatusText = (status: boolean) => {
  return status ? 'Published' : 'Draft'
}

// Initialize on mount (client-side only)
if (import.meta.client) {
  onMounted(() => {
    if (projectData.value) {
      currentProject.value = {
        ...projectData.value,
        is_organization: Boolean(projectData.value.is_organization),
        github_org: projectData.value.github_org || '',
        sub_apps: Array.isArray(projectData.value.sub_apps) ? projectData.value.sub_apps : [],
        start_date: parseDateForInput(projectData.value.start_date),
        end_date: parseDateForInput(projectData.value.end_date)
      }
      formData.value = {
        ...currentProject.value,
        sub_apps: JSON.parse(JSON.stringify(currentProject.value.sub_apps || []))
      }
      imagePreview.value = projectData.value.preview_image as string || ''
      initPreviewItems(projectData.value)
    } else {
      navigateTo('/dashboard/projects')
    }
  })
}
</script>

<template>
  <div class="p-8">
    <!-- Loading State -->
    <div v-if="!currentProject" class="flex flex-col items-center justify-center py-20">
      <div class="w-12 h-12 border-4 border-white/20 border-t-primary rounded-full animate-spin mb-4"></div>
      <p class="text-white/60 text-sm">Loading project...</p>
    </div>

    <!-- Content -->
    <div v-else class="w-full">
      <!-- Header -->
      <div class="flex items-center justify-between mb-8">
        <div>
          <h1 v-if="!isEditMode" class="text-4xl font-black text-white mb-2">{{ currentProject?.name }}</h1>
          <p v-if="!isEditMode" class="text-white/60">View and manage project details</p>
        </div>

        <!-- Action Buttons -->
        <div class="flex gap-3">
          <button
              v-if="!isEditMode"
              @click="toggleEditMode"
              class="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-white font-semibold hover:brightness-110 transition-all"
          >
            <Icon name="carbon:pen" size="20"/>
            Edit Project
          </button>

          <button
              v-if="isEditMode"
              @click="toggleEditMode"
              class="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-white/10 text-white font-semibold hover:bg-white/20 transition-all border border-white/20"
          >
            <Icon name="carbon:close" size="20"/>
            Cancel
          </button>

          <button
              v-if="isEditMode"
              @click="saveProject"
              :disabled="isSaving"
              class="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-green-600 text-white font-semibold hover:bg-green-700 transition-all disabled:opacity-50"
          >
            <Icon name="carbon:save" size="20"/>
            {{ isSaving ? 'Saving...' : 'Save' }}
          </button>

          <button
              v-if="!isEditMode"
              @click="deleteProjectHandler"
              class="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-red-600/20 text-red-400 font-semibold hover:bg-red-600/30 transition-all border border-red-600/40"
          >
            <Icon name="carbon:trash-can" size="20"/>
            Delete
          </button>
        </div>
      </div>

      <!-- Content Grid -->
      <div v-if="currentProject && formData" class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Main Content -->
        <div class="lg:col-span-2 space-y-6">
          <!-- Image Section -->
          <div class="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden">
            <div v-if="!isEditMode" class="relative w-full aspect-[16/9] max-h-[440px] bg-slate-950 overflow-hidden flex items-center justify-center">
              <NuxtImg
                  :src="imagePreview"
                  :alt="currentProject?.name"
                  class="w-full h-full object-contain"
              />
              <!-- Status Badge -->
              <div class="absolute top-6 right-6">
                <span
                    :class="['px-4 py-2 rounded-full text-sm font-semibold border', getStatusColor(currentProject?.status)]">
                  {{ getStatusText(currentProject?.status) }}
                </span>
              </div>
            </div>

            <div v-else class="p-6 space-y-4">
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
                    <Icon name="carbon:cloud-upload" size="20"/>
                    Choose Image
                  </button>
                  <input
                      ref="fileInputRef"
                      type="file"
                      accept="image/*"
                      @change="handleImageUpload"
                      class="hidden"
                  />
                  <span v-if="imagePreview" class="inline-flex items-center text-sm text-green-400">
                    <Icon name="carbon:checkmark-filled" size="16" class="mr-1"/>
                    Image selected
                  </span>
                  <span v-else class="inline-flex items-center text-sm text-white/60">
                    <Icon name="carbon:close" size="16" class="mr-1"/>
                    No new image selected
                  </span>
                </div>
                <!-- Error Message -->
                <div v-if="errors.image" class="mt-2 flex items-center gap-2 text-red-400 text-sm">
                  <Icon name="carbon:warning-alt" size="16"/>
                  {{ errors.image }}
                </div>
              </div>

              <!-- Image Preview -->
              <div v-if="imagePreview"
                   class="relative w-full aspect-[16/9] max-h-[440px] bg-slate-950 rounded-xl overflow-hidden border border-white/20 group flex items-center justify-center">
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
          </div>

          <!-- Feature Gallery & Screenshots Section -->
          <div class="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 space-y-4">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div class="flex items-center gap-2">
                  <h3 class="text-lg font-bold text-white">Feature Gallery & Screenshots</h3>
                  <span class="px-2 py-0.5 rounded-full text-[11px] font-mono font-medium bg-blue-500/15 text-blue-300 border border-blue-500/30">
                    {{ isEditMode ? previewItems.length : (currentProject?.preview_images?.length || 0) }} {{ (isEditMode ? previewItems.length : (currentProject?.preview_images?.length || 0)) === 1 ? 'Preview' : 'Previews' }}
                  </span>
                </div>
                <p class="text-xs text-white/50 mt-0.5">Deep-dive feature screenshots displayed in the portfolio showcase modal.</p>
              </div>

              <!-- Add button in Edit Mode -->
              <div v-if="isEditMode">
                <button
                    @click="triggerPreviewFileInput"
                    type="button"
                    class="inline-flex cursor-pointer items-center gap-2 px-3.5 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-white text-xs font-semibold border border-white/20 transition-all"
                >
                  <Icon name="carbon:add-alt" size="16" class="text-blue-400"/>
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

            <!-- View Mode -->
            <div v-if="!isEditMode">
              <div v-if="currentProject?.preview_images?.length" class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div
                    v-for="(img, idx) in currentProject.preview_images"
                    :key="idx"
                    class="p-3 rounded-xl bg-white/[0.03] border border-white/10 space-y-2.5"
                >
                  <div class="relative w-full aspect-[16/9] rounded-lg overflow-hidden border border-white/10 bg-slate-950 flex items-center justify-center">
                    <img
                        :src="img.url"
                        :alt="img.title || `Preview ${idx + 1}`"
                        class="w-full h-full object-contain"
                    />
                    <span class="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/70 backdrop-blur-xs text-[10px] font-mono text-white/80">
                      #{{ idx + 1 }}
                    </span>
                  </div>
                  <div>
                    <h4 class="text-sm font-semibold text-white">{{ img.title || 'Untitled Screenshot' }}</h4>
                    <p v-if="img.caption" class="text-xs text-white/60 mt-0.5 leading-relaxed">{{ img.caption }}</p>
                  </div>
                </div>
              </div>

              <div v-else class="text-center py-8 border border-dashed border-white/10 rounded-xl bg-white/[0.01]">
                <Icon name="carbon:images" size="32" class="text-white/20 mx-auto mb-2"/>
                <p class="text-sm text-white/50">No feature screenshots uploaded for this project yet.</p>
                <p class="text-xs text-white/30 mt-1">Click "Edit Project" above to upload feature screenshots.</p>
              </div>
            </div>

            <!-- Edit Mode -->
            <div v-else>
              <div
                  v-if="previewItems.length === 0"
                  @click="triggerPreviewFileInput"
                  class="border-2 border-dashed border-white/10 hover:border-blue-500/40 rounded-xl p-8 text-center cursor-pointer transition-all bg-white/[0.01] hover:bg-white/[0.03]"
              >
                <div class="w-10 h-10 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mx-auto mb-2">
                  <Icon name="carbon:images" size="20"/>
                </div>
                <p class="text-sm font-medium text-white/80">No feature screenshots added yet</p>
                <p class="text-xs text-white/40 mt-1">Click here to select images to showcase in the modal deep-dive viewer.</p>
              </div>

              <div v-else class="space-y-3">
                <div
                    v-for="(item, idx) in previewItems"
                    :key="item.id || idx"
                    class="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-3.5 rounded-xl bg-white/[0.03] border border-white/10 hover:border-white/20 transition-all"
                >
                  <!-- Thumbnail Preview -->
                  <div class="relative w-full sm:w-36 aspect-[16/9] rounded-lg overflow-hidden border border-white/10 bg-slate-950 shrink-0 flex items-center justify-center">
                    <img
                        :src="item.previewUrl"
                        :alt="item.title || `Screenshot ${idx + 1}`"
                        class="w-full h-full object-contain"
                    />
                    <span class="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-xs text-[10px] font-mono text-white/80">
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
                    <Icon name="carbon:trash-can" size="18"/>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Multi-App & Organization Ecosystem Section -->
          <div class="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 space-y-5">
            <!-- Header with Toggle / Status -->
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
                  <Icon name="carbon:flow" size="20" />
                </div>
                <div>
                  <h3 class="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                    <span>Multi-App & Organization Ecosystem</span>
                    <span
                        v-if="(isEditMode ? formData?.is_organization : currentProject?.is_organization)"
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

              <!-- Toggle Switch (Edit Mode Only) -->
              <label v-if="isEditMode && formData" class="relative inline-flex items-center cursor-pointer">
                <input
                    type="checkbox"
                    v-model="formData.is_organization"
                    class="sr-only peer"
                />
                <div class="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
              </label>
            </div>

            <!-- View Mode Content -->
            <div v-if="!isEditMode">
              <div v-if="currentProject?.is_organization" class="space-y-4 pt-3 border-t border-white/10">
                <!-- Org link banner -->
                <div v-if="currentProject?.github_org" class="p-3.5 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-between">
                  <div class="flex items-center gap-2.5">
                    <Icon name="line-md:github" size="20" class="text-purple-400" />
                    <div>
                      <p class="text-xs font-semibold text-white">GitHub Organization</p>
                      <a
                          :href="currentProject.github_org.startsWith('http') ? currentProject.github_org : `https://github.com/${currentProject.github_org}`"
                          target="_blank"
                          rel="noopener noreferrer"
                          class="text-xs font-mono text-purple-300 hover:underline flex items-center gap-1"
                      >
                        <span>{{ currentProject.github_org }}</span>
                        <Icon name="carbon:launch" size="12" />
                      </a>
                    </div>
                  </div>
                </div>

                <!-- Apps list view -->
                <div class="space-y-2.5">
                  <p class="text-xs font-mono uppercase text-white/60 tracking-wider">
                    Applications Suite ({{ currentProject?.sub_apps?.length || 0 }} Apps)
                  </p>

                  <div v-if="!currentProject?.sub_apps || currentProject.sub_apps.length === 0" class="text-center py-4 text-xs text-white/40">
                    No sub-apps configured yet. Click "Edit Project" to add apps.
                  </div>

                  <div
                      v-for="(app, aIdx) in currentProject?.sub_apps"
                      :key="aIdx"
                      class="p-3.5 rounded-xl bg-white/[0.02] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div class="flex items-center gap-3">
                      <div class="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/80">
                        <Icon :name="app.app_type === 'mobile' ? 'carbon:phone' : app.app_type === 'backend' ? 'carbon:server-dns' : app.app_type === 'pos' ? 'carbon:receipt' : 'carbon:laptop'" size="16" />
                      </div>
                      <div>
                        <div class="flex items-center gap-2">
                          <span class="text-xs font-semibold text-white">{{ app.name }}</span>
                          <span class="px-1.5 py-0.5 rounded text-[10px] font-mono bg-purple-500/15 text-purple-300">
                            {{ app.app_type.toUpperCase() }}
                          </span>
                        </div>
                        <p v-if="app.description" class="text-xs text-white/50 mt-0.5">{{ app.description }}</p>
                      </div>
                    </div>

                    <div class="flex items-center gap-2 shrink-0">
                      <a
                          v-if="app.repo_url"
                          :href="app.repo_url"
                          target="_blank"
                          rel="noopener noreferrer"
                          class="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 text-xs font-mono flex items-center gap-1 border border-white/10"
                      >
                        <Icon name="line-md:github" size="14" />
                        <span>Repo</span>
                      </a>
                      <a
                          v-if="app.live_url"
                          :href="app.live_url"
                          target="_blank"
                          rel="noopener noreferrer"
                          class="px-2.5 py-1 rounded-lg bg-purple-600/30 hover:bg-purple-600/50 text-purple-300 text-xs font-mono flex items-center gap-1 border border-purple-500/30"
                      >
                        <Icon name="carbon:launch" size="14" />
                        <span>Demo</span>
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              <div v-else class="text-xs text-white/40 pt-2 border-t border-white/10">
                This is a standalone single project. Click "Edit Project" and toggle "Multi-App & Organization Ecosystem" if you want to add multiple sub-apps.
              </div>
            </div>

            <!-- Edit Mode Content -->
            <div v-else-if="formData?.is_organization" class="space-y-5 pt-3 border-t border-white/10">
              <!-- Org input -->
              <div>
                <label class="block text-xs font-semibold text-white/80 mb-1.5">
                  GitHub Organization Name or URL
                </label>
                <div class="flex gap-2.5">
                  <div class="relative flex-1">
                    <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-white/40">
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
                    <Icon v-if="isFetchingOrg" name="icon-park-outline:loading-four" size="14" class="animate-spin" />
                    <Icon v-else name="carbon:synchronize" size="14" />
                    <span>{{ isFetchingOrg ? "Fetching..." : "Fetch Repos" }}</span>
                  </button>
                </div>
              </div>

              <!-- Discovered Repos Banner & Import Button -->
              <div v-if="orgData" class="p-4 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-between gap-3">
                <div class="flex items-center gap-3 min-w-0">
                  <img :src="orgData.avatar_url" :alt="orgData.org" class="w-9 h-9 rounded-lg border border-white/20 object-cover shrink-0" />
                  <div class="min-w-0">
                    <p class="text-xs font-semibold text-white truncate">GitHub: {{ orgData.org }}</p>
                    <p class="text-[11px] font-mono text-purple-300">{{ orgData.total_repos }} repositories discovered</p>
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

              <!-- Sub-Apps List in Edit Mode -->
              <div class="space-y-3">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <span class="text-xs font-mono font-semibold text-white">Application Suite / Sub-Apps</span>
                    <span class="px-2 py-0.5 rounded-full text-[10px] font-mono bg-white/10 text-white/80">
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
                <div v-if="!formData.sub_apps || formData.sub_apps.length === 0" class="p-6 rounded-xl border border-dashed border-white/15 text-center bg-white/[0.01]">
                  <Icon name="carbon:cube" size="24" class="mx-auto text-white/30 mb-2" />
                  <p class="text-xs text-white/60">No sub-applications added yet.</p>
                  <p class="text-[11px] text-white/40 mt-1">Click "Add Sub-App" or "Fetch Repos" from your GitHub Organization above.</p>
                </div>

                <!-- Sub-app Card -->
                <div
                    v-for="(app, idx) in formData.sub_apps"
                    :key="app.id || idx"
                    class="p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-3 relative group"
                >
                  <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2">
                      <span class="w-5 h-5 rounded-md bg-purple-500/20 text-purple-400 text-[11px] font-mono flex items-center justify-center font-bold">
                        {{ idx + 1 }}
                      </span>
                      <span class="text-xs font-bold text-white">{{ app.name || "Untitled App" }}</span>
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
                    <div>
                      <label class="block text-[11px] font-mono text-white/70 mb-1">App Type</label>
                      <select
                          v-model="app.app_type"
                          class="w-full px-2.5 py-1.5 rounded-lg bg-white/10 border border-white/20 text-white text-xs focus:outline-none focus:border-purple-500/50"
                      >
                        <option value="mobile" class="bg-slate-900 text-white">📱 Mobile App</option>
                        <option value="web" class="bg-slate-900 text-white">💻 Web App</option>
                        <option value="backend" class="bg-slate-900 text-white">⚙️ Backend / API</option>
                        <option value="pos" class="bg-slate-900 text-white">🖥️ POS / Kiosk</option>
                        <option value="other" class="bg-slate-900 text-white">📦 Service / Library</option>
                      </select>
                    </div>

                    <div class="sm:col-span-2">
                      <label class="block text-[11px] font-mono text-white/70 mb-1">App Name</label>
                      <input
                          v-model="app.name"
                          type="text"
                          placeholder="e.g., Customer Mobile Ordering"
                          class="w-full px-2.5 py-1.5 rounded-lg bg-white/10 border border-white/20 text-white text-xs placeholder:text-white/40 focus:outline-none focus:border-purple-500/50"
                      />
                    </div>
                  </div>

                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label class="block text-[11px] font-mono text-white/70 mb-1">Repository URL</label>
                      <input
                          v-model="app.repo_url"
                          type="url"
                          placeholder="https://github.com/org/repo"
                          class="w-full px-2.5 py-1.5 rounded-lg bg-white/10 border border-white/20 text-white text-xs placeholder:text-white/40 focus:outline-none focus:border-purple-500/50"
                      />
                    </div>

                    <div>
                      <label class="block text-[11px] font-mono text-white/70 mb-1">Live / Demo URL (Optional)</label>
                      <input
                          v-model="app.live_url"
                          type="url"
                          placeholder="https://demo.app.com or APK link"
                          class="w-full px-2.5 py-1.5 rounded-lg bg-white/10 border border-white/20 text-white text-xs placeholder:text-white/40 focus:outline-none focus:border-purple-500/50"
                      />
                    </div>
                  </div>

                  <div>
                    <label class="block text-[11px] font-mono text-white/70 mb-1">Short Description</label>
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
          <div class="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
            <div v-if="!isEditMode">
              <h3 class="text-lg font-bold text-white mb-4">About This Project</h3>
              <p class="text-white/70 leading-relaxed">{{ currentProject?.description }}</p>
            </div>
            <div v-else class="space-y-4">
              <div>
                <label class="block text-sm font-semibold text-white mb-2">Project Name *</label>
                <input
                    v-model="formData.name"
                    @input="clearError('name')"
                    type="text"
                    class="w-full px-4 py-2 rounded-lg bg-white/10 border transition-all text-white placeholder:text-white/40 focus:outline-none text-sm"
                    :class="errors.name ? 'border-red-500 focus:border-red-500' : 'border-white/20 focus:border-primary/50'"
                />
                <div v-if="errors.name" class="mt-2 flex items-center gap-2 text-red-400 text-sm">
                  <Icon name="carbon:warning-alt" size="16"/>
                  {{ errors.name }}
                </div>
              </div>
              <div>
                <label class="block text-sm font-semibold text-white mb-2">Description *</label>
                <textarea
                    v-model="formData.description"
                    @input="clearError('description')"
                    rows="6"
                    class="w-full px-4 py-2 rounded-lg bg-white/10 border transition-all text-white placeholder:text-white/40 focus:outline-none resize-none text-sm"
                    :class="errors.description ? 'border-red-500 focus:border-red-500' : 'border-white/20 focus:border-primary/50'"
                    placeholder="Write a detailed description of your project..."
                ></textarea>
                <div v-if="errors.description" class="mt-2 flex items-center gap-2 text-red-400 text-sm">
                  <Icon name="carbon:warning-alt" size="16"/>
                  {{ errors.description }}
                </div>
              </div>
            </div>
          </div>

          <!-- Status Section -->
          <div class="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
            <div v-if="!isEditMode">
              <h3 class="text-lg font-bold text-white mb-4">Status</h3>
              <span
                  :class="['px-4 py-2 rounded-full text-sm font-semibold border inline-block', getStatusColor(currentProject.status)]">
              {{ getStatusText(currentProject.status) }}
            </span>
            </div>
            <div v-else>
              <label class="block text-sm font-semibold text-white mb-2">Status</label>
              <select
                  v-model="formData.status"
                  class="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:border-primary/50 transition-all"
              >
                <option :value="false">Draft</option>
                <option :value="true">Published</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Sidebar -->
        <div class="lg:col-span-1 space-y-6">
          <!-- Technologies/Skills Section -->
          <div class="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-lg font-bold text-white">Technologies Used</h3>
            </div>

            <!-- Skills Dropdown for Edit Mode -->
            <div v-if="isEditMode" class="mb-4">
              <label class="block text-xs font-semibold text-white/80 mb-2">Select Skills</label>
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

            <!-- Display Mode -->
            <div v-if="!isEditMode" class="space-y-2">
              <div
                  v-for="skillId in currentProject?.id_skills"
                  :key="skillId"
                  class="flex items-center gap-2 p-2 rounded-lg bg-primary/10 border border-primary/20"
              >
                <Icon
                    :name="getSkillIcon(skillId)"
                    size="16"
                    class="text-primary"
                />
                <span class="text-sm font-medium text-white">{{ getSkillName(skillId) }}</span>
              </div>
              <div v-if="!currentProject?.technologies || currentProject.technologies.length === 0"
                   class="text-center py-4">
                <p class="text-sm text-white/50">No technologies selected</p>
              </div>
            </div>

            <!-- Selected Skills for Edit Mode -->
            <div v-if="isEditMode && formData?.id_skills && formData.id_skills.length > 0" class="space-y-2">
              <p class="text-xs text-white/60 mb-3">Selected Technologies:</p>
              <div
                  v-for="skillId in formData.id_skills"
                  :key="skillId"
                  class="flex items-center justify-between p-3 rounded-lg bg-primary/20 border border-primary/30"
              >
                <div class="flex items-center gap-2 flex-1">
                  <Icon
                      :name="getSkillIcon(skillId)"
                      size="18"
                      class="text-primary"
                  />
                  <span class="text-sm font-medium text-white">{{ getSkillName(skillId) }}</span>
                </div>
                <button
                    @click="removeSkill(skillId)"
                    class="p-1.5 rounded-lg hover:bg-red-500/20 text-white/50 hover:text-red-400 transition-all"
                    type="button"
                >
                  <Icon name="carbon:trash-can" size="16"/>
                </button>
              </div>
            </div>

            <div v-if="isEditMode && (!formData?.id_skills || formData.id_skills.length === 0)"
                 class="text-center py-6">
              <p class="text-sm text-white/50">No skills selected yet</p>
            </div>
            <div v-if="errors.technologies" class="mt-3 flex items-center gap-2 text-red-400 text-sm">
              <Icon name="carbon:warning-alt" size="16"/>
              {{ errors.technologies }}
            </div>
          </div>

          <!-- Features Section -->
          <div class="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-lg font-bold text-white">Key Features</h3>
              <button
                  v-if="isEditMode"
                  @click="addFeature"
                  class="p-1.5 rounded-lg hover:bg-primary/20 text-primary transition-all"
                  type="button"
              >
                <Icon name="carbon:add" size="16"/>
              </button>
            </div>

            <!-- Display Mode -->
            <div v-if="!isEditMode" class="space-y-2">
              <div
                  v-for="(feature, idx) in currentProject?.features"
                  :key="idx"
                  class="flex items-start gap-3 p-2.5 rounded-lg bg-white/5 border border-white/10"
              >
                <Icon name="carbon:checkmark" size="16" class="text-green-400 mt-1 shrink-0"/>
                <p class="text-sm text-white/80">{{ feature }}</p>
              </div>
            </div>

            <!-- Edit Mode -->
            <div v-else class="space-y-2">
              <div
                  v-for="index in formData?.features.length"
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
                    v-if="formData && formData.features.length > 1"
                    @click="removeFeature(index - 1)"
                    class="p-2 rounded-lg hover:bg-red-500/20 text-white/50 hover:text-red-400 transition-all"
                    type="button"
                >
                  <Icon name="carbon:trash-can" size="16"/>
                </button>
              </div>
            </div>

            <!-- Error Message -->
            <div v-if="errors.features" class="mt-3 flex items-center gap-2 text-red-400 text-sm">
              <Icon name="carbon:warning-alt" size="16"/>
              {{ errors.features }}
            </div>
          </div>
          <div class="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 space-y-3">
            <h3 class="text-lg font-bold text-white mb-4">Links</h3>

            <!-- Display Mode -->
            <div v-if="!isEditMode" class="space-y-3">
              <a
                  v-if="currentProject?.repo_url"
                  :href="currentProject.repo_url"
                  target="_blank"
                  class="flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-primary/15 border border-white/10 hover:border-primary/30 transition-all"
              >
                <Icon name="mdi:github" size="20" class="text-white/70"/>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-semibold text-white">GitHub Repository</p>
                  <p class="text-xs text-white/50 truncate">{{ currentProject.repo_url }}</p>
                </div>
                <Icon name="carbon:arrow-up-right" size="16" class="text-white/50"/>
              </a>

              <a
                  v-if="currentProject?.live_url"
                  :href="currentProject.live_url"
                  target="_blank"
                  class="flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-primary/15 border border-white/10 hover:border-primary/30 transition-all"
              >
                <Icon name="carbon:launch" size="20" class="text-white/70"/>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-semibold text-white">Live Demo</p>
                  <p class="text-xs text-white/50 truncate">{{ currentProject.live_url }}</p>
                </div>
                <Icon name="carbon:arrow-up-right" size="16" class="text-white/50"/>
              </a>
            </div>

            <!-- Edit Mode -->
            <div v-else class="space-y-3">
              <div>
                <label class="block text-xs font-semibold text-white/80 mb-1.5">GitHub Link</label>
                <input
                    v-model="formData.repo_url"
                    @input="clearError('repo_url')"
                    type="url"
                    placeholder="https://github.com/..."
                    class="w-full px-3 py-2 rounded-lg bg-white/10 border transition-all text-white placeholder:text-white/40 focus:outline-none text-sm"
                    :class="errors.repo_url ? 'border-red-500 focus:border-red-500' : 'border-white/20 focus:border-primary/50'"
                />
                <div v-if="errors.repo_url" class="mt-2 flex items-center gap-2 text-red-400 text-sm">
                  <Icon name="carbon:warning-alt" size="16"/>
                  {{ errors.repo_url }}
                </div>
              </div>
              <div>
                <label class="block text-xs font-semibold text-white/80 mb-1.5">Live Link</label>
                <input
                    v-model="formData.live_url"
                    @input="clearError('live_url')"
                    type="url"
                    placeholder="https://example.com"
                    class="w-full px-3 py-2 rounded-lg bg-white/10 border transition-all text-white placeholder:text-white/40 focus:outline-none text-sm"
                    :class="errors.live_url ? 'border-red-500 focus:border-red-500' : 'border-white/20 focus:border-primary/50'"
                />
                <div v-if="errors.live_url" class="mt-2 flex items-center gap-2 text-red-400 text-sm">
                  <Icon name="carbon:warning-alt" size="16"/>
                  {{ errors.live_url }}
                </div>
              </div>
            </div>
          </div>

          <!-- Timeline Section -->
          <div class="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
            <h3 class="text-lg font-bold text-white mb-4">Timeline</h3>

            <div v-if="!isEditMode" class="space-y-4">
              <div class="flex items-center gap-4">
                <div class="shrink-0">
                  <Icon name="carbon:calendar" size="24" class="text-primary"/>
                </div>
                <div class="flex-1">
                  <p class="text-xs text-white/50 mb-1">Start Date</p>
                  <p class="text-base font-semibold text-white">
                    {{ currentProject?.start_date ? formatDate(currentProject.start_date) : 'Not set' }}
                  </p>
                </div>
              </div>
              <div class="flex items-center gap-4">
                <div class="shrink-0">
                  <Icon name="carbon:calendar" size="24" class="text-primary"/>
                </div>
                <div class="flex-1">
                  <p class="text-xs text-white/50 mb-1">End Date</p>
                  <p class="text-base font-semibold text-white">
                    {{ currentProject?.end_date ? formatDate(currentProject.end_date) : 'Ongoing' }}
                  </p>
                </div>
              </div>
            </div>

            <div v-else class="space-y-3">
              <div>
                <label class="block text-xs font-semibold text-white/80 mb-1.5">Start Date</label>
                <UInput
                    v-model="formData.start_date"
                    type="date"
                    class="w-full"
                    placeholder="Select start date"
                />
              </div>
              <div>
                <label class="block text-xs font-semibold text-white/80 mb-1.5">End Date</label>
                <UInput
                    v-model="formData.end_date"
                    type="date"
                    class="w-full"
                    placeholder="Select end date"
                />
              </div>
            </div>
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

<style scoped>
</style>

