<script setup lang="ts">
import {computed, ref} from 'vue'
import type {Journey} from "~/types/journey";
import {useToastCustom} from "~/composables/useToastCustom";
import {useJourney} from "~/composables/useJourney";
import {useSkill} from "~/composables/useSkill";
import {parseDateForInput} from "~/utils";

interface FormErrors {
  title?: string
  company?: string
  location?: string
  start_date?: string
  end_date?: string
  key_responsibilities?: string
  description?: string
  attachments?: string
  skills?: string

  [key: string]: string | undefined
}

const route = useRoute()
const router = useRouter()
const toast = useToastCustom()
const {fetchSkills} = useSkill()
const {isSaving, fetchJourneyById, updateJourney, deleteJourney} = useJourney()

const journeyId = computed(() => parseInt(route.params.id as string))
const isEditMode = ref(false)

// Form state
const formData = ref<Journey | null>(null)
const currentJourney = ref<Journey | null>(null)
const errors = ref<FormErrors>({})

// Fetch initial skills on SSR/CSR
const {data: skillsData} = await useAsyncData('edit-skills', async () => {
  const res = await fetchSkills(false, '', false)
  return res.data
})

// Fetch journey data on SSR/CSR
definePageMeta({
  layout: 'dashboard',
  breadCrumb: [
    {title: 'Work', link: '/dashboard/journeys'},
    {title: 'Detail'}
  ]
})

const {data: journeyData} = await useAsyncData(`journey-${route.params.id}`, async () => {
  return await fetchJourneyById(journeyId.value)
})

const allSkills = computed(
    () => skillsData.value?.filter(
        (skill) => !formData.value?.id_skills?.includes(skill.id)
    ) || []
)

// Validation function
const validateForm = (): boolean => {
  const newErrors: FormErrors = {}

  if (!formData.value?.title?.trim()) {
    newErrors.title = 'Job title is required'
  }

  if (!formData.value?.company?.trim()) {
    newErrors.company = 'Company name is required'
  }

  if (!formData.value?.start_date) {
    newErrors.start_date = 'Start date is required'
  }

  if (!formData.value?.is_current && !formData.value?.end_date) {
    newErrors.end_date = 'End date is required if not currently working'
  }

  const emptyResponsibilities = formData.value?.key_responsibilities.filter(r => !r.trim()) || []
  if (emptyResponsibilities.length === formData.value?.key_responsibilities.length) {
    newErrors.key_responsibilities = 'Please add at least one key responsibility'
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
    clearError('skills')
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

const addResponsibility = () => {
  if (formData.value) {
    formData.value.key_responsibilities.push('')
    clearError('key_responsibilities')
  }
}

const removeResponsibility = (index: number) => {
  if (formData.value) {
    formData.value.key_responsibilities.splice(index, 1)
  }
}

const toggleEditMode = () => {
  if (isEditMode.value) {
    // Cancel edit
    formData.value = {...currentJourney.value!}
    errors.value = {}
    isEditMode.value = false
  } else {
    // Enter edit mode
    isEditMode.value = true
  }
}

const formatDateRange = (startDate: string, endDate?: string) => {
  const start = new Date(startDate).toLocaleDateString('en-US', {month: 'short', year: 'numeric'})
  if (!endDate) return `${start} - Present`
  const end = new Date(endDate).toLocaleDateString('en-US', {month: 'short', year: 'numeric'})
  return `${start} - ${end}`
}

const saveJourney = async () => {
  if (!validateForm() || !formData.value) {
    toast.showErrorToast('Error', 'Please fix the errors in the form before saving.')
    return
  }

  formData.value.id = journeyId.value
  const success = await updateJourney(formData.value)
  if (success) {
    currentJourney.value = {
      ...formData.value,
      end_date: formData.value.is_current ? undefined : formData.value.end_date
    }
    isEditMode.value = false
  }
}

const deleteJourneyHandler = async () => {
  toast.showConfirmationToast(
      'Delete Journey',
      'Are you sure you want to delete this work experience? This action cannot be undone.',
      async () => {
        const success = await deleteJourney(journeyId.value)
        if (success) {
          router.push('/dashboard/journeys')
        }
      },
  )
}

const getStatusColor = (isCurrent: boolean) => {
  return isCurrent
      ? 'bg-green-500/20 text-green-400 border-green-500/40'
      : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40'
}

const getStatusText = (isCurrent: boolean) => {
  return isCurrent ? 'Current' : 'Past'
}

// Initialize on mount (client-side only)
if (import.meta.client) {
  onMounted(() => {
    if (journeyData.value) {
      currentJourney.value = {
        ...journeyData.value,
        start_date: parseDateForInput(journeyData.value.start_date),
        end_date: journeyData.value.end_date ? parseDateForInput(journeyData.value.end_date) : undefined
      }
      formData.value = {
        ...journeyData.value,
        start_date: parseDateForInput(journeyData.value.start_date),
        end_date: journeyData.value.end_date ? parseDateForInput(journeyData.value.end_date) : undefined
      }
    } else {
      navigateTo('/dashboard/journeys')
    }
  })
}
</script>

<template>
  <div class="p-8">
    <!-- Loading State -->
    <div v-if="!currentJourney" class="flex flex-col items-center justify-center py-20">
      <div class="w-12 h-12 border-4 border-white/20 border-t-primary rounded-full animate-spin mb-4"></div>
      <p class="text-white/60 text-sm">Loading journey...</p>
    </div>

    <!-- Content -->
    <div v-else class="w-full">
      <!-- Header -->
      <div class="flex items-center justify-between mb-8">
        <div>
          <h1 v-if="!isEditMode" class="text-4xl font-black text-white mb-2">{{ currentJourney?.title }}</h1>
          <p v-if="!isEditMode" class="text-white/60 text-lg">{{ currentJourney?.company }}</p>
        </div>

        <!-- Action Buttons -->
        <div class="flex gap-3">
          <button
              v-if="!isEditMode"
              @click="toggleEditMode"
              class="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-white font-semibold hover:brightness-110 transition-all"
          >
            <Icon name="carbon:pen" size="20"/>
            Edit
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
              @click="saveJourney"
              :disabled="isSaving"
              class="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-green-600 text-white font-semibold hover:bg-green-700 transition-all disabled:opacity-50"
          >
            <Icon v-if="isSaving" name="icon-park-outline:loading-four" size="16" class="animate-spin"/>
            <Icon v-else name="carbon:save" size="20"/>
            {{ isSaving ? 'Saving...' : 'Save' }}
          </button>

          <button
              v-if="!isEditMode"
              @click="deleteJourneyHandler"
              class="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-red-500/20 text-red-400 font-semibold hover:bg-red-500/30 transition-all border border-red-500/40"
          >
            <Icon name="carbon:trash-can" size="20"/>
            Delete
          </button>
        </div>
      </div>

      <!-- View Mode -->
      <div v-if="!isEditMode" class="space-y-6">
        <!-- Overview Card -->
        <div class="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-8">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <p class="text-sm font-medium text-white/60 mb-1">Status</p>
              <span
                  :class="['px-3 py-1 rounded-full text-sm font-semibold border', getStatusColor(currentJourney.is_current)]">
                {{ getStatusText(currentJourney.is_current) }}
              </span>
            </div>
            <div>
              <p class="text-sm font-medium text-white/60 mb-1">Employment Period</p>
              <p class="text-white text-sm">{{
                  formatDateRange(currentJourney.start_date, currentJourney.end_date)
                }}</p>
            </div>
            <div>
              <p class="text-sm font-medium text-white/60 mb-1">Location</p>
              <p class="text-white text-sm">{{ currentJourney.location || 'Not specified' }}</p>
            </div>
          </div>
        </div>

        <!-- Description -->
        <div v-if="currentJourney.description"
             class="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-8">
          <h2 class="text-xl font-bold text-white mb-4">About This Role</h2>
          <p class="text-white/70">{{ currentJourney.description }}</p>
        </div>

        <!-- Key Responsibilities -->
        <div v-if="currentJourney.key_responsibilities && currentJourney.key_responsibilities.length > 0"
             class="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-8">
          <h2 class="text-xl font-bold text-white mb-4">Key Responsibilities</h2>
          <ul class="space-y-3">
            <li v-for="(resp, idx) in currentJourney.key_responsibilities" :key="idx" class="flex gap-3">
              <Icon name="carbon:checkmark-filled" size="20" class="text-green-400 shrink-0 mt-0.5"/>
              <span class="text-white/70">{{ resp }}</span>
            </li>
          </ul>
        </div>

        <!-- Skills -->
        <div v-if="currentJourney.id_skills && currentJourney.id_skills.length > 0"
             class="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-8">
          <h2 class="text-xl font-bold text-white mb-4">Associated Skills</h2>
          <div class="flex flex-wrap gap-2">
            <div
                v-for="skillId in currentJourney.id_skills"
                :key="skillId"
                class="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/20 text-primary border border-primary/40"
            >
              <Icon :name="getSkillIcon(skillId)" size="16"/>
              <span class="font-medium">{{ getSkillName(skillId) }}</span>
            </div>
          </div>
        </div>

        <!-- Attachments -->
        <div v-if="currentJourney.attachments"
             class="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-8">
          <h2 class="text-xl font-bold text-white mb-4">Attachments/Links</h2>
          <a
              :href="currentJourney.attachments"
              target="_blank"
              class="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/20 text-primary hover:bg-primary/30 transition-all border border-primary/40"
          >
            <Icon name="carbon:link" size="16"/>
            View Attachment
          </a>
        </div>
      </div>

      <!-- Edit Mode -->
      <div v-else class="space-y-6">
        <!-- Basic Information -->
        <div class="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-8">
          <h2 class="text-xl font-bold text-white mb-6">Basic Information</h2>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <!-- Job Title -->
            <div>
              <label class="block text-sm font-semibold text-white mb-2">
                Job Title
                <span class="text-red-400">*</span>
              </label>
              <input
                  v-model="formData!.title"
                  @input="() => clearError('title')"
                  type="text"
                  :class="[
                    'w-full px-4 py-2 rounded-lg bg-white/10 border text-white placeholder:text-white/40 focus:outline-none transition-all',
                    errors.title ? 'border-red-500 focus:border-red-500' : 'border-white/20 focus:border-primary/50'
                  ]"
              />
              <div v-if="errors.title" class="mt-2 flex items-center gap-2 text-red-400 text-sm">
                <Icon name="carbon:warning-alt" size="16"/>
                {{ errors.title }}
              </div>
            </div>

            <!-- Company -->
            <div>
              <label class="block text-sm font-semibold text-white mb-2">
                Company Name
                <span class="text-red-400">*</span>
              </label>
              <input
                  v-model="formData!.company"
                  @input="() => clearError('company')"
                  type="text"
                  :class="[
                    'w-full px-4 py-2 rounded-lg bg-white/10 border text-white placeholder:text-white/40 focus:outline-none transition-all',
                    errors.company ? 'border-red-500 focus:border-red-500' : 'border-white/20 focus:border-primary/50'
                  ]"
              />
              <div v-if="errors.company" class="mt-2 flex items-center gap-2 text-red-400 text-sm">
                <Icon name="carbon:warning-alt" size="16"/>
                {{ errors.company }}
              </div>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Location -->
            <div>
              <label class="block text-sm font-medium text-white mb-2">Location</label>
              <input
                  v-model="formData!.location"
                  type="text"
                  class="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-white/40 focus:outline-none focus:border-primary/50 focus:bg-white/15 transition-all"
              />
            </div>

            <!-- Current Position Toggle -->
            <div class="flex items-center gap-4">
              <label class="block text-sm font-medium text-white">Currently Working Here</label>
              <input
                  v-model="formData!.is_current"
                  type="checkbox"
                  class="w-5 h-5 rounded accent-primary cursor-pointer"
              />
            </div>
          </div>
        </div>

        <!-- Date Information -->
        <div class="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-8">
          <h2 class="text-xl font-bold text-white mb-6">Employment Period</h2>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Start Date -->
            <div>
              <label class="block text-sm font-semibold text-white mb-2">
                Start Date
                <span class="text-red-400">*</span>
              </label>
              <input
                  v-model="formData!.start_date"
                  @input="() => clearError('start_date')"
                  type="date"
                  :class="[
                    'w-full px-4 py-2 rounded-lg bg-white/10 border text-white focus:outline-none transition-all',
                    errors.start_date ? 'border-red-500 focus:border-red-500' : 'border-white/20 focus:border-primary/50'
                  ]"
              />
              <div v-if="errors.start_date" class="mt-2 flex items-center gap-2 text-red-400 text-sm">
                <Icon name="carbon:warning-alt" size="16"/>
                {{ errors.start_date }}
              </div>
            </div>

            <!-- End Date -->
            <div v-if="!formData!.is_current">
              <label class="block text-sm font-semibold text-white mb-2">
                End Date
                <span class="text-red-400">*</span>
              </label>
              <input
                  v-model="formData!.end_date"
                  @input="() => clearError('end_date')"
                  type="date"
                  :class="[
                    'w-full px-4 py-2 rounded-lg bg-white/10 border text-white focus:outline-none transition-all',
                    errors.end_date ? 'border-red-500 focus:border-red-500' : 'border-white/20 focus:border-primary/50'
                  ]"
              />
              <div v-if="errors.end_date" class="mt-2 flex items-center gap-2 text-red-400 text-sm">
                <Icon name="carbon:warning-alt" size="16"/>
                {{ errors.end_date }}
              </div>
            </div>
          </div>
        </div>

        <!-- Description -->
        <div class="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-8">
          <h2 class="text-xl font-bold text-white mb-6">Details</h2>

          <!-- Description -->
          <div class="mb-6">
            <label class="block text-sm font-medium text-white mb-2">Description</label>
            <textarea
                v-model="formData!.description"
                rows="4"
                class="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-white/40 focus:outline-none focus:border-primary/50 focus:bg-white/15 transition-all resize-none"
            ></textarea>
          </div>

          <!-- Key Responsibilities -->
          <div class="mb-6">
            <label class="block text-sm font-semibold text-white mb-2">
              Key Responsibilities
              <span class="text-red-400">*</span>
            </label>
            <div class="space-y-3">
              <div v-for="(responsibility, index) in formData!.key_responsibilities" :key="index" class="flex gap-3">
                <input
                    v-model="formData!.key_responsibilities[index]"
                    @input="() => clearError('key_responsibilities')"
                    type="text"
                    :class="[
                      'flex-1 px-4 py-2 rounded-lg bg-white/10 border text-white placeholder:text-white/40 focus:outline-none transition-all',
                      errors.key_responsibilities ? 'border-red-500 focus:border-red-500' : 'border-white/20 focus:border-primary/50'
                    ]"
                />
                <button
                    @click="removeResponsibility(index)"
                    class="px-4 py-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all">
                  <Icon name="carbon:trash-can" size="16"/>
                </button>
              </div>
            </div>
            <button
                @click="addResponsibility"
                class="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 text-white/70 hover:bg-white/15 transition-all">
              <Icon name="carbon:add" size="16"/>
              Add Responsibility
            </button>
            <div v-if="errors.key_responsibilities" class="mt-2 flex items-center gap-2 text-red-400 text-sm">
              <Icon name="carbon:warning-alt" size="16"/>
              {{ errors.key_responsibilities }}
            </div>
          </div>

          <!-- Attachments (URL) -->
          <div>
            <label class="block text-sm font-medium text-white mb-2">Attachments/Portfolio Link</label>
            <input
                v-model="formData!.attachments"
                type="text"
                placeholder="e.g., https://yourportfolio.com/project-url"
                class="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-white/40 focus:outline-none focus:border-primary/50 focus:bg-white/15 transition-all"
            />
          </div>
        </div>

        <!-- Skills -->
        <div class="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-8">
          <h2 class="text-xl font-bold text-white mb-6">Associated Skills</h2>

          <!-- Selected Skills -->
          <div v-if="formData!.id_skills && formData!.id_skills.length > 0" class="mb-6">
            <label class="block text-sm font-medium text-white mb-3">Selected Skills</label>
            <div class="flex flex-wrap gap-2">
              <div
                  v-for="skillId in formData!.id_skills"
                  :key="skillId"
                  class="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/20 text-primary border border-primary/40"
              >
                <Icon :name="getSkillIcon(skillId)" size="16"/>
                <span class="font-medium">{{ getSkillName(skillId) }}</span>
                <button
                    @click="removeSkill(skillId)"
                    class="ml-2 hover:text-red-400 transition-colors">
                  <Icon name="carbon:close" size="16"/>
                </button>
              </div>
            </div>
          </div>

          <!-- Add Skill Dropdown -->
          <div class="mb-4">
            <label class="block text-sm font-medium text-white mb-2">Add Skills</label>
            <div class="relative">
              <USelectMenu
                  :key="selectKey"
                  v-model="selectedSkill"
                  :items="allSkills"
                  label-key="name"
                  value-key="id"
                  :searchable="true"
                  placeholder="Search and select skills..."
                  @update:model-value="addSkill">
                <template #default>
                  <span class="text-white/50 text-sm">Search and select skills...</span>
                </template>
              </USelectMenu>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
</style>

