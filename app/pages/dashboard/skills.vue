<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted, watch } from 'vue'
import type { Skill, SkillCategory } from "~/types/skill";
import { useToastCustom } from "~/composables/useToastCustom";
import { useSkillCategory } from "~/composables/useSkillCategory";

definePageMeta({
  layout: 'dashboard',
  breadCrumb: [
    {
      title: 'Skills'
    }
  ]
})

const {
  hasMore,
  cursor,
  skills,
  fetchSkills,
  isLoading,
  isSaving,
  createMultipleSkills,
  updateSkill,
  deleteSkill
} = useSkill()

const {
  categories,
  fetchCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  isSaving: isSavingCategory
} = useSkillCategory()

const searchQuery = ref('')
const selectedCategoryId = ref<number | null>(null)
const canLoadMore = ref(false)
const toast = useToastCustom()
const showModal = ref(false)
const showCategoryModal = ref(false)
const { debounce } = useDebounce()
const isEditMode = ref(false)
const isSearching = ref(false)

// Category form state inside Manage Categories Modal
const isEditingCategory = ref(false)
const editingCategoryId = ref<number | null>(null)
const categoryForm = ref({
  name: '',
  description: '',
  color: '#38bdf8'
})

const errorsMessages = ref<{
  name: string
  icon: string
  color: string
  category: string
}[]>([])

const formData = ref<Skill>({
  id: 0,
  name: '',
  icon: 'mdi:code',
  color: '#001eff',
  category_id: null,
})

// Multiple skills form data
const formDataList = ref<Skill[]>([
  {
    id: 0,
    name: '',
    icon: 'mdi:code',
    color: '#001eff',
    category_id: null,
  }
])

// Fetch initial skills & categories on SSR/CSR
const { data } = await useAsyncData('skills', async () => {
  return await fetchSkills(false, '', true, selectedCategoryId.value)
})

await useAsyncData('skill-categories', async () => {
  return await fetchCategories()
})

const doSearchAndFilter = async () => {
  isSearching.value = true
  cursor.value = null
  canLoadMore.value = false
  try {
    await fetchSkills(false, searchQuery.value, true, selectedCategoryId.value)
    canLoadMore.value = true
  } finally {
    isSearching.value = false
  }
}

// Watch search query with debounce
watch(searchQuery, () => {
  debounce(
    "search-skills",
    async () => {
      await doSearchAndFilter()
    },
    450,
    searchQuery.value
  )
})

// Watch category filter change immediately
watch(selectedCategoryId, async () => {
  await doSearchAndFilter()
})

// Load more on client side only (infinite scroll)
const scrollTriggerRef = ref<HTMLElement>()

const filteredSkills = computed(() => {
  return skills.value
})

const totalSkillsCount = computed(() => {
  return categories.value.reduce((acc, cat) => acc + (cat.skills_count || 0), 0) || skills.value.length
})

// Intersection Observer setup (client-side only)
const setupIntersectionObserver = () => {
  if (import.meta.server || !scrollTriggerRef.value) return

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && hasMore.value && !isLoading.value && canLoadMore.value && !isSearching.value) {
          fetchSkills(true, searchQuery.value, true, selectedCategoryId.value)
        }
      })
    },
    {
      root: null,
      rootMargin: '100px',
      threshold: 0.1,
    }
  )

  observer.observe(scrollTriggerRef.value)

  onUnmounted(() => {
    observer.disconnect()
  })
}

// Setup observer & initial category fetch on client-side
if (import.meta.client) {
  onMounted(async () => {
    await fetchCategories()
    if (data.value) {
      skills.value = data.value.data
      hasMore.value = data.value.has_next

      if (data.value.data.length > 0) {
        cursor.value = data.value.data.at(-1)!.id.toString()
      }
    }
    canLoadMore.value = true
    setupIntersectionObserver()
  })
}

const saveSkill = () => {
  if (isEditMode.value) {
    handleUpdateSkill()
  } else {
    saveMultipleSkills()
  }
}

const openCreateModal = () => {
  isEditMode.value = false
  const defaultCatId = categories.value.length > 0 ? categories.value[0]?.id : null
  formDataList.value = [
    {
      id: 0,
      name: '',
      icon: '',
      color: '#001eff',
      category_id: defaultCatId || null,
    }
  ]
  errorsMessages.value = []
  showModal.value = true
}

const addMoreSkillForm = () => {
  const defaultCatId = categories.value.length > 0 ? categories.value[0]?.id : null
  formDataList.value.push({
    id: 0,
    name: '',
    icon: '',
    color: '#001eff',
    category_id: defaultCatId || null,
  })
}

const removeSkillForm = (index: number) => {
  if (formDataList.value.length > 1) {
    formDataList.value.splice(index, 1)
  }
}

const openEditModal = (skill: Skill) => {
  isEditMode.value = true
  formData.value = { ...skill }
  errorsMessages.value = []
  showModal.value = true
}

const validateSkillItem = (skill: Skill): boolean => {
  let isValid = true

  const errorMessagesTemp = {
    name: '',
    icon: '',
    color: '',
    category: '',
  }

  // Validate Name
  if (!skill.name || skill.name.trim() === '') {
    errorMessagesTemp.name = 'Name is required'
    isValid = false
  }

  // Validate Icon
  if (!skill.icon || skill.icon.trim() === '') {
    errorMessagesTemp.icon = 'Icon is required'
    isValid = false
  }

  // Validate Color
  if (!skill.color || skill.color.trim() === '') {
    errorMessagesTemp.color = 'Color is required'
    isValid = false
  }

  errorsMessages.value.push(errorMessagesTemp)
  return isValid
}

const handleUpdateSkill = async () => {
  if (isSaving.value) return
  errorsMessages.value = []

  const isValid = validateSkillItem(formData.value)
  if (!isValid) return

  const success = await updateSkill(formData.value)
  if (success) {
    closeModal()
    await fetchCategories() // refresh counts
  }
}

const saveMultipleSkills = async () => {
  if (isSaving.value) return
  errorsMessages.value = []

  const validSkills: Skill[] = []
  let hasErrors = false

  for (let i = 0; i < formDataList.value.length; i++) {
    const skill = formDataList.value[i]
    if (!validateSkillItem(skill!)) {
      hasErrors = true
    } else {
      validSkills.push(skill!)
    }
  }

  if (validSkills.length === 0 || hasErrors) return

  const success = await createMultipleSkills(validSkills)
  if (success) {
    closeModal()
    await fetchCategories() // refresh counts
  }
}

const deleteSkillHandler = async (skillId: number) => {
  toast.showConfirmationToast(
    'Delete Skill',
    'Are you sure you want to delete this skill? This action cannot be undone.',
    async () => {
      const ok = await deleteSkill(skillId)
      if (ok) {
        await fetchCategories()
      }
    },
  )
}

const closeModal = () => {
  showModal.value = false
  errorsMessages.value = []
}

// ========== CATEGORY MANAGEMENT HANDLERS ==========
const openManageCategoriesModal = () => {
  resetCategoryForm()
  showCategoryModal.value = true
}

const resetCategoryForm = () => {
  isEditingCategory.value = false
  editingCategoryId.value = null
  categoryForm.value = {
    name: '',
    description: '',
    color: '#38bdf8'
  }
}

const editCategoryHandler = (cat: SkillCategory) => {
  isEditingCategory.value = true
  editingCategoryId.value = cat.id
  categoryForm.value = {
    name: cat.name,
    description: cat.description || '',
    color: cat.color || '#38bdf8'
  }
}

const saveCategoryHandler = async () => {
  if (!categoryForm.value.name.trim()) {
    toast.showToast('Validation Error', 'Category name cannot be empty', 'error', 3000)
    return
  }

  if (isEditingCategory.value && editingCategoryId.value) {
    const ok = await updateCategory({
      id: editingCategoryId.value,
      name: categoryForm.value.name.trim(),
      description: categoryForm.value.description.trim() || undefined,
      color: categoryForm.value.color
    })
    if (ok) {
      resetCategoryForm()
      await doSearchAndFilter()
    }
  } else {
    const ok = await createCategory({
      name: categoryForm.value.name.trim(),
      description: categoryForm.value.description.trim() || undefined,
      color: categoryForm.value.color
    })
    if (ok) {
      resetCategoryForm()
      await doSearchAndFilter()
    }
  }
}

const deleteCategoryHandler = async (cat: SkillCategory) => {
  toast.showConfirmationToast(
    'Delete Category',
    `Are you sure you want to delete "${cat.name}"? Skills in this category will become uncategorized.`,
    async () => {
      const ok = await deleteCategory(cat.id)
      if (ok) {
        if (selectedCategoryId.value === cat.id) {
          selectedCategoryId.value = null
        }
        await doSearchAndFilter()
      }
    }
  )
}
</script>

<template>
  <div class="p-6 sm:p-8 max-w-7xl mx-auto">
    <!-- Page Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 mb-8">
      <div>
        <h1 class="text-3xl sm:text-4xl font-black text-white tracking-tight mb-2 flex items-center gap-3">
          <span>Skills Management</span>
          <span class="text-xs font-mono px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
            {{ totalSkillsCount }} Total
          </span>
        </h1>
        <p class="text-white/60 text-sm sm:text-base">
          Categorize, manage, and showcase your technical skills backed by PostgreSQL & Redis.
        </p>
      </div>

      <!-- Action Buttons Cluster -->
      <div class="flex items-center gap-3">
        <!-- Manage Categories Button -->
        <button
          @click="openManageCategoriesModal"
          class="inline-flex items-center cursor-pointer gap-2 px-4 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/10 border border-white/15 text-white font-medium text-sm transition-all whitespace-nowrap shadow-sm hover:border-cyan-500/40"
        >
          <Icon name="carbon:folders" size="18" class="text-cyan-400" />
          <span>Manage Categories</span>
        </button>

        <!-- Add Skill Button -->
        <button
          @click="openCreateModal"
          class="inline-flex items-center cursor-pointer gap-2 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold text-sm transition-all whitespace-nowrap shadow-lg shadow-blue-500/20"
        >
          <Icon name="carbon:add" size="18" />
          <span>Add Skill</span>
        </button>
      </div>
    </div>

    <!-- Filters Section: Search Bar & Dynamic Category Pills -->
    <div class="bg-[#0b1222]/80 backdrop-blur-md border border-white/10 rounded-2xl p-5 mb-8 shadow-xl">
      <!-- Search Input -->
      <div class="relative mb-4">
        <Icon
          name="carbon:search"
          size="20"
          class="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-400"
        />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search skills by name (e.g. Vue, Docker, Golang)..."
          class="w-full pl-11 pr-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/15 text-white placeholder:text-slate-400 focus:outline-none focus:border-cyan-500/50 focus:bg-white/[0.08] transition-all text-sm"
        />
        <button
          v-if="searchQuery"
          @click="searchQuery = ''"
          class="absolute right-3.5 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white"
        >
          <Icon name="carbon:close" size="16" />
        </button>
      </div>

      <!-- Category Filter Pills (Backend-Driven) -->
      <div>
        <div class="flex items-center justify-between mb-2">
          <span class="text-xs font-mono text-slate-400 uppercase tracking-wider">Filter by Category:</span>
          <span v-if="selectedCategoryId !== null" class="text-xs text-cyan-400 cursor-pointer hover:underline" @click="selectedCategoryId = null">
            Reset to All
          </span>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <!-- All Categories Pill -->
          <button
            @click="selectedCategoryId = null"
            class="px-3.5 py-1.5 rounded-xl text-xs font-medium tracking-wide transition-all cursor-pointer flex items-center gap-2"
            :class="selectedCategoryId === null
              ? 'bg-blue-600/30 text-white border border-blue-500/50 shadow-md shadow-blue-500/20 font-semibold'
              : 'bg-white/[0.03] text-slate-300 border border-white/10 hover:bg-white/[0.07] hover:text-white'"
          >
            <span>All Categories</span>
            <span class="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-white/10">
              {{ totalSkillsCount }}
            </span>
          </button>

          <!-- Dynamic Categories from Database -->
          <button
            v-for="cat in categories"
            :key="cat.id"
            @click="selectedCategoryId = cat.id"
            class="px-3.5 py-1.5 rounded-xl text-xs font-medium tracking-wide transition-all cursor-pointer flex items-center gap-2 border"
            :style="selectedCategoryId === cat.id ? {
              backgroundColor: `${cat.color}25`,
              borderColor: `${cat.color}70`,
              color: '#ffffff',
              boxShadow: `0 0 12px ${cat.color}30`
            } : {
              backgroundColor: 'rgba(255,255,255,0.03)',
              borderColor: 'rgba(255,255,255,0.1)',
              color: '#cbd5e1'
            }"
          >
            <span class="w-2 h-2 rounded-full" :style="{ backgroundColor: cat.color || '#38bdf8' }"></span>
            <span>{{ cat.name }}</span>
            <span class="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-white/10 text-slate-300">
              {{ cat.skills_count ?? 0 }}
            </span>
          </button>
        </div>
      </div>
    </div>

    <!-- Skills Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
      <!-- Skeleton Loading -->
      <template v-if="isSearching">
        <div
          v-for="i in 6"
          :key="`skeleton-${i}`"
          class="bg-white/5 border border-white/10 rounded-2xl p-5 animate-pulse"
        >
          <div class="flex items-start gap-4 mb-4">
            <div class="w-12 h-12 rounded-xl bg-white/10 shrink-0"></div>
            <div class="flex-1 space-y-2">
              <div class="h-5 bg-white/10 rounded w-2/3"></div>
              <div class="h-4 bg-white/10 rounded w-1/2"></div>
            </div>
          </div>
          <div class="h-8 bg-white/10 rounded-lg"></div>
        </div>
      </template>

      <!-- Skills Cards with Category Badge -->
      <template v-else>
        <div
          v-for="skill in filteredSkills"
          :key="skill.id"
          class="group bg-[#0b1222]/90 border border-white/10 hover:border-white/20 rounded-2xl p-5 transition-all duration-300 flex flex-col hover:shadow-xl hover:shadow-black/40 hover:-translate-y-0.5 relative overflow-hidden"
          :style="{ '--skill-color': skill.color || '#38bdf8' }"
        >
          <!-- Subtle Top Accent Line -->
          <div
            class="absolute top-0 left-0 right-0 h-0.5 opacity-40 group-hover:opacity-100 transition-opacity"
            :style="{ backgroundColor: skill.color || '#38bdf8' }"
          ></div>

          <!-- Icon & Header Info -->
          <div class="flex items-start gap-3.5 mb-4">
            <!-- Icon Wrapper -->
            <div
              class="w-12 h-12 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-center shrink-0 transition-colors group-hover:bg-[color-mix(in_srgb,var(--skill-color)_15%,transparent)]"
            >
              <Icon
                :name="skill.icon || 'mdi:code'"
                size="24"
                class="transition-colors group-hover:scale-110 duration-200"
                :style="{ color: skill.color || '#38bdf8' }"
              />
            </div>

            <!-- Name & Category Badge -->
            <div class="flex-1 min-w-0">
              <h3 class="text-base font-bold text-white tracking-tight truncate group-hover:text-cyan-300 transition-colors">
                {{ skill.name }}
              </h3>

              <!-- Category Badge -->
              <div class="mt-1 flex items-center gap-1.5">
                <span
                  class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-mono font-medium border"
                  :style="{
                    color: skill.category_color || '#38bdf8',
                    borderColor: `${skill.category_color || '#38bdf8'}35`,
                    backgroundColor: `${skill.category_color || '#38bdf8'}12`
                  }"
                >
                  <span class="w-1.5 h-1.5 rounded-full" :style="{ backgroundColor: skill.category_color || '#38bdf8' }"></span>
                  <span class="truncate max-w-[140px]">{{ skill.category_name || 'Unassigned' }}</span>
                </span>
              </div>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="flex gap-2 pt-3 border-t border-white/[0.06] mt-auto">
            <button
              @click="openEditModal(skill)"
              class="flex-1 py-1.5 cursor-pointer rounded-lg bg-white/[0.04] hover:bg-blue-600/20 text-slate-300 hover:text-blue-400 border border-white/[0.06] hover:border-blue-500/30 transition-all font-medium text-xs flex items-center justify-center gap-1.5"
            >
              <Icon name="carbon:pen" size="14" />
              <span>Edit</span>
            </button>
            <button
              @click="deleteSkillHandler(skill.id)"
              class="flex-1 py-1.5 cursor-pointer rounded-lg bg-white/[0.04] hover:bg-red-500/20 text-slate-300 hover:text-red-400 border border-white/[0.06] hover:border-red-500/30 transition-all font-medium text-xs flex items-center justify-center gap-1.5"
            >
              <Icon name="carbon:trash-can" size="14" />
              <span>Delete</span>
            </button>
          </div>
        </div>
      </template>
    </div>

    <!-- Infinite Scroll Trigger & Status -->
    <div ref="scrollTriggerRef" class="flex flex-col items-center justify-center py-6">
      <div v-if="isLoading && filteredSkills.length > 0 && !isSearching" class="flex flex-col items-center gap-3">
        <div class="w-7 h-7 border-3 border-white/20 border-t-cyan-400 rounded-full animate-spin"></div>
        <p class="text-white/60 text-xs">Loading more skills from database...</p>
      </div>

      <div v-else-if="filteredSkills.length > 0 && !hasMore" class="text-center py-4">
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.03] border border-white/10 text-slate-400 text-xs font-mono">
          <Icon name="carbon:checkmark" size="14" class="text-green-400" />
          <span>All {{ filteredSkills.length }} skills loaded</span>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else-if="filteredSkills.length === 0 && !isSearching" class="text-center py-16">
        <div class="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4 text-slate-500">
          <Icon name="carbon:skill-level" size="32" />
        </div>
        <h3 class="text-lg font-bold text-white mb-1">No skills found</h3>
        <p class="text-slate-400 text-sm mb-6 max-w-sm mx-auto">
          No skills match your current search query or category filter.
        </p>
        <button
          @click="openCreateModal"
          class="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-primary text-white font-semibold text-xs transition-all shadow-md"
        >
          <Icon name="carbon:add" size="16" />
          <span>Add Skill in this Category</span>
        </button>
      </div>
    </div>

    <!-- Add/Edit Skill Modal -->
    <UModal
      v-model:open="showModal"
      :ui="{
        content: 'w-full max-w-xl bg-[#090e1a] border border-white/15 shadow-2xl rounded-2xl sm:rounded-3xl overflow-hidden',
        header: 'p-5 sm:p-6 bg-[#0c1424] border-b border-white/10',
        body: 'p-5 sm:p-6 max-h-[75vh] overflow-y-auto',
        footer: 'p-4 sm:p-5 bg-[#0c1424] border-t border-white/10'
      }"
    >
      <template #title>
        <h2 class="text-xl font-bold text-white">
          {{ isEditMode ? 'Edit Skill' : 'Add New Skills' }}
        </h2>
      </template>

      <template #description>
        <p class="text-xs text-slate-400">
          {{ isEditMode ? 'Update skill details and assign category' : 'Register technical skills with database-backed categorization' }}
        </p>
      </template>

      <template #body>
        <!-- Single Edit Mode -->
        <div v-if="isEditMode" class="space-y-4">
          <!-- Skill Name -->
          <div>
            <label class="block text-xs font-semibold text-white/80 mb-1.5">Skill Name *</label>
            <input
              v-model="formData.name"
              type="text"
              placeholder="e.g., Vue, Golang, Docker"
              class="w-full px-3.5 py-2 rounded-xl bg-white/[0.06] border border-white/15 text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/50 text-sm"
            />
            <p v-if="errorsMessages[0]?.name" class="text-red-400 text-xs mt-1">{{ errorsMessages[0]?.name }}</p>
          </div>

          <!-- Category Selection Dropdown -->
          <div>
            <div class="flex items-center justify-between mb-1.5">
              <label class="block text-xs font-semibold text-white/80">Category *</label>
              <button
                @click="openManageCategoriesModal"
                type="button"
                class="text-xs text-cyan-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Icon name="carbon:add" size="12" />
                <span>New Category</span>
              </button>
            </div>
            <select
              v-model="formData.category_id"
              class="w-full px-3.5 py-2 rounded-xl bg-[#0b1222] border border-white/20 text-white focus:outline-none focus:border-cyan-500/50 text-sm cursor-pointer"
            >
              <option :value="null">-- No Category (Unassigned) --</option>
              <option v-for="cat in categories" :key="cat.id" :value="cat.id">
                {{ cat.name }}
              </option>
            </select>
          </div>

          <!-- Icon -->
          <div>
            <label class="block text-xs font-semibold text-white/80 mb-1.5">Icon Name * (Carbon / MDI / SimpleIcons)</label>
            <div class="flex items-center gap-2">
              <input
                v-model="formData.icon"
                type="text"
                placeholder="e.g., mdi:vuejs, simple-icons:docker"
                class="flex-1 px-3.5 py-2 rounded-xl bg-white/[0.06] border border-white/15 text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/50 text-sm font-mono"
              />
              <div class="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                <Icon :name="formData.icon || 'carbon:unknown'" size="20" class="text-cyan-400" />
              </div>
            </div>
            <p v-if="errorsMessages[0]?.icon" class="text-red-400 text-xs mt-1">{{ errorsMessages[0]?.icon }}</p>
          </div>

          <!-- Color -->
          <div>
            <label class="block text-xs font-semibold text-white/80 mb-1.5">Color Accent *</label>
            <div class="flex items-center gap-2.5">
              <input
                v-model="formData.color"
                type="color"
                class="w-11 h-9 rounded-xl cursor-pointer bg-transparent border border-white/20"
              />
              <input
                v-model="formData.color"
                type="text"
                placeholder="#38bdf8"
                class="flex-1 px-3.5 py-2 rounded-xl bg-white/[0.06] border border-white/15 text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/50 text-sm font-mono"
              />
            </div>
            <p v-if="errorsMessages[0]?.color" class="text-red-400 text-xs mt-1">{{ errorsMessages[0]?.color }}</p>
          </div>
        </div>

        <!-- Multiple Create Mode -->
        <div v-else class="space-y-5 max-h-[460px] overflow-y-auto pr-1">
          <div
            v-for="(skillItem, index) in formDataList"
            :key="index"
            class="p-4 bg-white/[0.03] border border-white/10 rounded-xl relative"
          >
            <!-- Header of Skill Item -->
            <div class="flex items-center justify-between mb-3">
              <span class="text-xs font-mono font-semibold text-cyan-400">#{{ index + 1 }} Skill</span>
              <button
                v-if="formDataList.length > 1"
                @click="removeSkillForm(index)"
                type="button"
                class="p-1 rounded-lg hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors"
                title="Remove this skill"
              >
                <Icon name="carbon:trash-can" size="15" />
              </button>
            </div>

            <!-- Skill Name & Category in Grid -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
              <div>
                <label class="block text-xs font-semibold text-slate-300 mb-1">Name *</label>
                <input
                  v-model="skillItem.name"
                  type="text"
                  placeholder="e.g. React"
                  class="w-full px-3 py-1.5 rounded-lg bg-white/[0.06] border border-white/15 text-white text-xs focus:outline-none focus:border-cyan-500/50"
                  :class="errorsMessages[index]?.name ? 'border-red-500/50' : ''"
                />
                <p v-if="errorsMessages[index]?.name" class="text-red-400 text-[11px] mt-0.5">{{ errorsMessages[index]?.name }}</p>
              </div>

              <div>
                <label class="block text-xs font-semibold text-slate-300 mb-1">Category *</label>
                <select
                  v-model="skillItem.category_id"
                  class="w-full px-3 py-1.5 rounded-lg bg-[#0b1222] border border-white/20 text-white text-xs focus:outline-none focus:border-cyan-500/50 cursor-pointer"
                >
                  <option :value="null">-- Unassigned --</option>
                  <option v-for="cat in categories" :key="cat.id" :value="cat.id">
                    {{ cat.name }}
                  </option>
                </select>
              </div>
            </div>

            <!-- Icon & Color in Grid -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-semibold text-slate-300 mb-1">Icon *</label>
                <input
                  v-model="skillItem.icon"
                  type="text"
                  placeholder="mdi:react"
                  class="w-full px-3 py-1.5 rounded-lg bg-white/[0.06] border border-white/15 text-white text-xs font-mono focus:outline-none focus:border-cyan-500/50"
                  :class="errorsMessages[index]?.icon ? 'border-red-500/50' : ''"
                />
                <p v-if="errorsMessages[index]?.icon" class="text-red-400 text-[11px] mt-0.5">{{ errorsMessages[index]?.icon }}</p>
              </div>

              <div>
                <label class="block text-xs font-semibold text-slate-300 mb-1">Color *</label>
                <div class="flex items-center gap-2">
                  <input
                    v-model="skillItem.color"
                    type="color"
                    class="w-8 h-7 rounded cursor-pointer bg-transparent border border-white/20"
                  />
                  <input
                    v-model="skillItem.color"
                    type="text"
                    placeholder="#38bdf8"
                    class="flex-1 px-2.5 py-1.5 rounded-lg bg-white/[0.06] border border-white/15 text-white text-xs font-mono focus:outline-none focus:border-cyan-500/50"
                  />
                </div>
              </div>
            </div>
          </div>

          <!-- Add More Button -->
          <button
            @click="addMoreSkillForm"
            type="button"
            class="w-full py-2.5 cursor-pointer rounded-xl border-2 border-dashed border-white/20 hover:border-cyan-400/50 text-slate-300 hover:text-cyan-300 transition-all text-xs font-medium flex items-center justify-center gap-2"
          >
            <Icon name="carbon:add" size="16" />
            <span>Add Another Skill Row</span>
          </button>
        </div>
      </template>

      <template #footer>
        <div class="flex w-full gap-3">
          <button
            @click="closeModal"
            class="flex-1 py-2 rounded-xl bg-white/[0.05] hover:bg-white/10 text-slate-300 font-semibold text-xs border border-white/10 transition-all"
          >
            Cancel
          </button>
          <button
            @click="saveSkill"
            :disabled="isSaving"
            class="flex-1 py-2 rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold text-xs transition-all shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Icon v-if="isSaving" name="carbon:circle-dash" size="14" class="animate-spin" />
            <span>{{ isEditMode ? 'Update Skill' : `Save ${formDataList.length} Skill(s)` }}</span>
          </button>
        </div>
      </template>
    </UModal>

    <!-- Manage Categories Modal (Dedicated CRUD) -->
    <UModal
      v-model:open="showCategoryModal"
      :ui="{
        content: 'w-full max-w-lg bg-[#090e1a] border border-white/15 shadow-2xl rounded-2xl sm:rounded-3xl overflow-hidden',
        header: 'p-5 sm:p-6 bg-[#0c1424] border-b border-white/10',
        body: 'p-5 sm:p-6 max-h-[75vh] overflow-y-auto',
        footer: 'p-4 sm:p-5 bg-[#0c1424] border-t border-white/10'
      }"
    >
      <template #title>
        <div class="flex items-center gap-2">
          <Icon name="carbon:folders" size="22" class="text-cyan-400" />
          <h2 class="text-xl font-bold text-white">Manage Skill Categories</h2>
        </div>
      </template>

      <template #description>
        <p class="text-xs text-slate-400">
          Create, edit, or delete categories. Skills in deleted categories will remain intact as unassigned.
        </p>
      </template>

      <template #body>
        <div class="space-y-6">
          <!-- Category Create / Edit Form Card -->
          <div class="p-4 rounded-xl bg-white/[0.04] border border-white/15">
            <h3 class="text-xs font-mono font-semibold text-cyan-300 uppercase tracking-wider mb-3">
              {{ isEditingCategory ? 'Edit Category' : 'Create New Category' }}
            </h3>

            <div class="space-y-3">
              <!-- Name & Color -->
              <div class="grid grid-cols-1 sm:grid-cols-12 gap-3">
                <div class="sm:col-span-7">
                  <label class="block text-xs text-slate-300 mb-1 font-medium">Category Name *</label>
                  <input
                    v-model="categoryForm.name"
                    type="text"
                    placeholder="e.g. AI & Machine Learning"
                    class="w-full px-3 py-2 rounded-lg bg-white/[0.06] border border-white/15 text-white text-xs focus:outline-none focus:border-cyan-500/50"
                  />
                </div>
                <div class="sm:col-span-5">
                  <label class="block text-xs text-slate-300 mb-1 font-medium">Theme Color</label>
                  <div class="flex items-center gap-2">
                    <input
                      v-model="categoryForm.color"
                      type="color"
                      class="w-8 h-8 rounded-lg cursor-pointer bg-transparent border border-white/20 shrink-0 p-0.5"
                    />
                    <input
                      v-model="categoryForm.color"
                      type="text"
                      placeholder="#38bdf8"
                      class="w-full min-w-0 flex-1 px-2.5 py-1.5 rounded-lg bg-white/[0.06] border border-white/15 text-white text-xs font-mono focus:outline-none focus:border-cyan-500/50"
                    />
                  </div>
                </div>
              </div>

              <!-- Description -->
              <div>
                <label class="block text-xs text-slate-300 mb-1 font-medium">Description (Optional)</label>
                <input
                  v-model="categoryForm.description"
                  type="text"
                  placeholder="Short description of this skill category..."
                  class="w-full px-3 py-2 rounded-lg bg-white/[0.06] border border-white/15 text-white text-xs focus:outline-none focus:border-cyan-500/50"
                />
              </div>

              <!-- Form Action Buttons -->
              <div class="flex items-center justify-end gap-2 pt-1">
                <button
                  v-if="isEditingCategory"
                  @click="resetCategoryForm"
                  type="button"
                  class="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white cursor-pointer"
                >
                  Cancel Edit
                </button>
                <button
                  @click="saveCategoryHandler"
                  :disabled="isSavingCategory"
                  class="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  <Icon v-if="isSavingCategory" name="carbon:circle-dash" size="14" class="animate-spin" />
                  <span>{{ isEditingCategory ? 'Update Category' : 'Add Category' }}</span>
                </button>
              </div>
            </div>
          </div>

          <!-- Existing Categories List -->
          <div>
            <h3 class="text-xs font-mono font-semibold text-slate-400 uppercase tracking-wider mb-2.5">
              Existing Categories ({{ categories.length }})
            </h3>

            <div class="space-y-2 max-h-52 overflow-y-auto pr-1">
              <div
                v-if="categories.length === 0"
                class="text-center py-6 text-xs text-slate-500 bg-white/[0.02] border border-dashed border-white/10 rounded-xl"
              >
                No categories created yet. Add one above!
              </div>
              <div
                v-for="cat in categories"
                :key="cat.id"
                class="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/10 hover:border-white/20 transition-all gap-2"
              >
                <!-- Left: Name & Dot -->
                <div class="flex items-center gap-2.5 min-w-0 flex-1">
                  <span class="w-3 h-3 rounded-full shrink-0" :style="{ backgroundColor: cat.color || '#38bdf8' }"></span>
                  <div class="min-w-0 flex-1">
                    <p class="text-sm font-semibold text-white truncate">{{ cat.name }}</p>
                    <p class="text-[11px] text-slate-400 truncate">{{ cat.description || `${cat.skills_count || 0} skills linked` }}</p>
                  </div>
                </div>

                <!-- Right: Count & Actions -->
                <div class="flex items-center gap-1.5 shrink-0">
                  <span class="px-2 py-0.5 rounded-full text-[11px] font-mono bg-white/10 text-cyan-300 whitespace-nowrap">
                    {{ cat.skills_count || 0 }} skills
                  </span>
                  <button
                    @click="editCategoryHandler(cat)"
                    type="button"
                    class="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-cyan-300 transition-colors cursor-pointer"
                    title="Edit category"
                  >
                    <Icon name="carbon:pen" size="15" />
                  </button>
                  <button
                    @click="deleteCategoryHandler(cat)"
                    type="button"
                    class="p-1.5 rounded-lg hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors cursor-pointer"
                    title="Delete category"
                  >
                    <Icon name="carbon:trash-can" size="15" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>

      <template #footer>
        <button
          @click="showCategoryModal = false"
          class="w-full py-2 rounded-xl bg-white/[0.08] hover:bg-white/15 text-white font-semibold text-xs border border-white/10 transition-all cursor-pointer"
        >
          Close
        </button>
      </template>
    </UModal>
  </div>
</template>
