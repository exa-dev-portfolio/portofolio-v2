<script setup lang="ts">
import {ref} from 'vue'
import {useToastCustom} from "~/composables/useToastCustom";
import type {Journey} from "~/types/journey";
import {useJourney} from "~/composables/useJourney";

definePageMeta({
  layout: 'dashboard',
  breadCrumb: [
    {title: 'Work', link: '/dashboard/journeys'},
    {title: 'Add Experience'}
  ],
})

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

const toast = useToastCustom()
const {
  fetchSkills,
} = useSkill()
const {isSaving, createJourney} = useJourney()

// Form state
const formData = ref<Journey>({
  title: '',
  company: '',
  location: '',
  start_date: '',
  end_date: '',
  key_responsibilities: [''],
  description: '',
  attachments: '',
  is_current: false,
  id_skills: []
})

const errors = ref<FormErrors>({})

// Fetch initial skills on SSR/CSR
const {data} = await useAsyncData('skills', async () => {
  const res = await fetchSkills(false, '', false)
  return res.data
})

const allSkills = computed(
    () => data.value?.filter(
        (skill) => !formData.value.id_skills?.includes(skill.id)
    ) || []
)

// Validation function
const validateForm = (): boolean => {
  const newErrors: FormErrors = {}

  if (!formData.value.title?.trim()) {
    newErrors.title = 'Job title is required'
  }

  if (!formData.value.company?.trim()) {
    newErrors.company = 'Company name is required'
  }

  if (!formData.value.start_date) {
    newErrors.start_date = 'Start date is required'
  }

  if (!formData.value.is_current && !formData.value.end_date) {
    newErrors.end_date = 'End date is required if not currently working'
  }

  const emptyResponsibilities = formData.value.key_responsibilities.filter(r => !r.trim())
  if (emptyResponsibilities.length === formData.value.key_responsibilities.length) {
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
  if (formData.value.id_skills) {
    const index = formData.value.id_skills.indexOf(skillId)
    if (index > -1) {
      formData.value.id_skills.splice(index, 1)
    }
  }
}

const getSkillName = (skillId: number): string => {
  const skill = data.value?.find(s => s.id === skillId)
  return skill?.name || 'Unknown'
}

const getSkillIcon = (skillId: number): string => {
  const skill = data.value?.find(s => s.id === skillId)
  return skill?.icon || 'carbon:code'
}

const addResponsibility = () => {
  formData.value.key_responsibilities.push('')
  clearError('key_responsibilities')
}

const removeResponsibility = (index: number) => {
  formData.value.key_responsibilities.splice(index, 1)
}

const saveJourney = async () => {
  if (!validateForm()) {
    toast.showErrorToast('Error', 'Please fix the errors above')
    return
  }

  const success = await createJourney(formData.value)
  if (success) navigateTo('/dashboard/journeys')
}

const goBack = () => {
  navigateTo('/dashboard/journeys')
}
</script>

<template>
  <div class="p-8">
    <!-- Page Header -->
    <div class="mb-8">
      <button
          @click="goBack"
          class="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors mb-4">
        <Icon name="carbon:arrow-left" size="20"/>
        Back to Work
      </button>
      <h1 class="text-4xl font-black text-white mb-2">Add Work Experience</h1>
      <p class="text-white/60">Add details about your work experience and career journey.</p>
    </div>

    <!-- Form Container -->
    <div class="">
      <!-- Basic Information -->
      <div class="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-8 mb-6">
        <h2 class="text-xl font-bold text-white mb-6">Basic Information</h2>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <!-- Job Title -->
          <div>
            <label class="block text-sm font-semibold text-white mb-2">
              Job Title
              <span class="text-red-400">*</span>
            </label>
            <input
                v-model="formData.title"
                @input="clearError('title')"
                type="text"
                placeholder="e.g., Senior Frontend Developer"
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
                v-model="formData.company"
                @input="clearError('company')"
                type="text"
                placeholder="e.g., Acme Corporation"
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
                v-model="formData.location"
                type="text"
                placeholder="e.g., San Francisco, CA"
                class="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-white/40 focus:outline-none focus:border-primary/50 focus:bg-white/15 transition-all"
            />
          </div>

          <!-- Current Position Toggle -->
          <div class="flex items-center gap-4">
            <label class="block text-sm font-medium text-white">Currently Working Here</label>
            <input
                v-model="formData.is_current"
                type="checkbox"
                class="w-5 h-5 rounded accent-primary cursor-pointer"
            />
          </div>
        </div>
      </div>

      <!-- Date Information -->
      <div class="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-8 mb-6">
        <h2 class="text-xl font-bold text-white mb-6">Employment Period</h2>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Start Date -->
          <div>
            <label class="block text-sm font-semibold text-white mb-2">
              Start Date
              <span class="text-red-400">*</span>
            </label>
            <input
                v-model="formData.start_date"
                @input="clearError('start_date')"
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
          <div v-if="!formData.is_current">
            <label class="block text-sm font-semibold text-white mb-2">
              End Date
              <span class="text-red-400">*</span>
            </label>
            <input
                v-model="formData.end_date"
                @input="clearError('end_date')"
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
      <div class="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-8 mb-6">
        <h2 class="text-xl font-bold text-white mb-6">Details</h2>

        <!-- Description -->
        <div class="mb-6">
          <label class="block text-sm font-medium text-white mb-2">Description</label>
          <textarea
              v-model="formData.description"
              placeholder="Describe your role and contributions..."
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
            <div v-for="(responsibility, index) in formData.key_responsibilities" :key="index" class="flex gap-3">
              <input
                  v-model="formData.key_responsibilities[index]"
                  @input="clearError('key_responsibilities')"
                  type="text"
                  placeholder="e.g., Led development of new features"
                  class="flex-1 px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-white/40 focus:outline-none focus:border-primary/50 transition-all"
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
              v-model="formData.attachments"
              type="text"
              placeholder="e.g., https://yourportfolio.com/project-url"
              class="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-white/40 focus:outline-none focus:border-primary/50 focus:bg-white/15 transition-all"
          />
        </div>
      </div>

      <!-- Skills -->
      <div class="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-8 mb-6">
        <h2 class="text-xl font-bold text-white mb-6">Associated Skills</h2>

        <!-- Selected Skills -->
        <div v-if="formData.id_skills && formData.id_skills.length > 0" class="mb-6">
          <label class="block text-sm font-medium text-white mb-3">Selected Skills</label>
          <div class="flex flex-wrap gap-2">
            <div
                v-for="skillId in formData.id_skills"
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

      <!-- Action Buttons -->
      <div class="flex gap-4">
        <button
            @click="goBack"
            class="px-6 py-3 rounded-lg bg-white/10 text-white hover:bg-white/15 transition-all font-semibold inline-flex items-center gap-2 cursor-pointer">
          <Icon name="carbon:close" size="20"/>
          Cancel
        </button>
        <button
            @click="saveJourney"
            :disabled="isSaving"
            class="px-6 py-3 rounded-lg bg-primary text-white hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer font-semibold inline-flex items-center gap-2">
          <Icon v-if="isSaving" name="icon-park-outline:loading-four" size="16" class="animate-spin"/>
          <Icon v-else name="carbon:save" size="20"/>
          {{ isSaving ? 'Saving...' : 'Save Experience' }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
</style>

