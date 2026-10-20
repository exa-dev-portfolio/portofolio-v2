<script setup lang="ts">
import { ref } from 'vue'

interface Experience {
  id?: number
  company: string
  position: string
  period: string
  description: string
  logo: string
  responsibilities: string[]
  technologies: string[]
  attachment: string | null
}

defineProps<{
  experiences: Experience[]
}>()

const isOpen = ref(false)
const selectedExperience = ref<Experience | null>(null)

const openModal = (experience: Experience) => {
  selectedExperience.value = experience
  isOpen.value = true
}
</script>

<template>
  <section id="work" class="py-20 sm:py-24 relative overflow-hidden" aria-labelledby="journey-heading">
    <div class="container mx-auto px-4 sm:px-6">
      
      <!-- Section Header -->
      <Motion
        :initial="{ opacity: 0, y: 20 }"
        :while-in-view="{ opacity: 1, y: 0 }"
        :viewport="{ once: true, amount: 0.15 }"
        :transition="{ duration: 0.45, ease: 'easeOut' }"
        class="text-center max-w-3xl mx-auto mb-14 sm:mb-16"
      >
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono mb-4">
          <Icon name="carbon:milestone" size="14" />
          <span>CAREER TIMELINE</span>
        </div>
        <h2 id="journey-heading" class="text-3xl sm:text-4xl lg:text-5xl font-heading font-black text-white tracking-tight mb-4">
          Professional <span class="text-gradient-primary">Journey</span>
        </h2>
        <p class="text-slate-300 text-base sm:text-lg font-normal leading-relaxed">
          A track record of architecting scalable products, driving technical milestones, and solving high-impact challenges.
        </p>
      </Motion>

      <!-- Timeline Structure -->
      <div class="max-w-4xl mx-auto">
        <div class="relative">
          <!-- Continuous Vertical Gradient Line -->
          <div class="absolute left-6 sm:left-8 top-4 bottom-4 w-0.5 bg-gradient-to-b from-emerald-500 via-teal-500/40 to-transparent"></div>

          <!-- Timeline Items List -->
          <div class="space-y-6 sm:space-y-8">
            <Motion
              v-for="(experience, index) in experiences"
              :key="experience.id ?? index"
              :initial="{ opacity: 0, x: -20 }"
              :while-in-view="{ opacity: 1, x: 0 }"
              :viewport="{ once: true, amount: 0.1 }"
              :transition="{ duration: 0.45, delay: index * 0.08, ease: 'easeOut' }"
              class="relative pl-14 sm:pl-20"
            >
              <!-- Checkpoint Node -->
              <div class="absolute left-0 top-1 w-12 sm:w-16 h-12 sm:h-16 flex items-center justify-center">
                <div class="w-9 h-9 sm:w-11 sm:h-11 rounded-2xl bg-[#060d08] border border-emerald-500/40 shadow-md shadow-emerald-500/15 flex items-center justify-center">
                  <Icon name="carbon:badge" size="18" class="text-emerald-400" />
                </div>
              </div>

              <!-- Experience Interactive Card -->
              <div
                class="card-interactive rounded-2xl p-5 sm:p-6 cursor-pointer group border border-white/[0.08] hover:border-emerald-500/40"
                @click="openModal(experience)"
              >
                <!-- Card Header -->
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5">
                  <div>
                    <h3 class="text-lg sm:text-xl font-heading font-bold text-white group-hover:text-emerald-300 transition-colors">
                      {{ experience.position }}
                    </h3>
                    <p class="text-sm font-medium text-teal-400 mt-0.5 flex items-center gap-1.5">
                      <Icon name="carbon:building" size="14" />
                      {{ experience.company }}
                    </p>
                  </div>
                  
                  <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-xs font-mono text-slate-300 shrink-0 self-start sm:self-center">
                    <Icon name="carbon:calendar" size="13" class="text-emerald-400" />
                    <span>{{ experience.period }}</span>
                  </div>
                </div>

                <!-- Short Description -->
                <p class="text-slate-300 text-sm leading-relaxed mb-4 line-clamp-2 font-normal">
                  {{ experience.description }}
                </p>

                <!-- Technologies & Modal Prompt Footer -->
                <div class="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/[0.06]">
                  <div class="flex flex-wrap gap-1.5">
                    <span
                      v-for="tech in experience.technologies.slice(0, 4)"
                      :key="tech"
                      class="px-2.5 py-0.5 rounded-md text-[11px] font-mono font-medium bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
                    >
                      {{ tech }}
                    </span>
                    <span
                      v-if="experience.technologies.length > 4"
                      class="px-2 py-0.5 rounded-md text-[11px] font-mono text-slate-400 bg-white/[0.03]"
                    >
                      +{{ experience.technologies.length - 4 }}
                    </span>
                  </div>

                  <div class="flex items-center gap-1 text-xs font-semibold text-emerald-400 group-hover:translate-x-1 transition-transform">
                    <span>View Role Breakdown</span>
                    <Icon name="carbon:arrow-right" size="14" />
                  </div>
                </div>

              </div>
            </Motion>
          </div>
        </div>
      </div>
    </div>

    <!-- Experience Details Modal -->
    <UModal 
      v-model:open="isOpen"
      :ui="{
        content: 'w-full max-w-4xl bg-[#060c08] border border-emerald-500/30 shadow-2xl rounded-3xl overflow-hidden',
        header: 'p-6 sm:p-8 bg-[#09130c] border-b border-white/10',
        body: 'p-6 sm:p-8 max-h-[70vh] overflow-y-auto',
        footer: 'p-4 sm:p-6 bg-[#09130c] border-t border-white/10'
      }"
    >
      <template #title>
        <div class="flex flex-col gap-1">
          <span class="text-xs font-mono text-emerald-400 uppercase tracking-wider">{{ selectedExperience?.company }}</span>
          <h2 class="text-2xl sm:text-3xl font-heading font-black text-white">
            {{ selectedExperience?.position }}
          </h2>
        </div>
      </template>

      <template #body>
        <div class="space-y-8">
          <!-- Metric Badges Row -->
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div class="p-4 rounded-xl bg-white/[0.03] border border-white/10 flex items-center gap-3">
              <div class="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                <Icon name="carbon:calendar" size="20" />
              </div>
              <div>
                <p class="text-[10px] font-mono uppercase text-slate-400">Tenure</p>
                <p class="text-xs sm:text-sm font-semibold text-white">{{ selectedExperience?.period }}</p>
              </div>
            </div>

            <div class="p-4 rounded-xl bg-white/[0.03] border border-white/10 flex items-center gap-3">
              <div class="w-10 h-10 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 shrink-0">
                <Icon name="carbon:task-complete" size="20" />
              </div>
              <div>
                <p class="text-[10px] font-mono uppercase text-slate-400">Key Tasks</p>
                <p class="text-xs sm:text-sm font-semibold text-white">{{ selectedExperience?.responsibilities.length || 0 }} Deliverables</p>
              </div>
            </div>

            <div class="p-4 rounded-xl bg-white/[0.03] border border-white/10 flex items-center gap-3">
              <div class="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                <Icon name="carbon:tools" size="20" />
              </div>
              <div>
                <p class="text-[10px] font-mono uppercase text-slate-400">Tech Stack</p>
                <p class="text-xs sm:text-sm font-semibold text-white">{{ selectedExperience?.technologies.length || 0 }} Technologies</p>
              </div>
            </div>
          </div>

          <!-- Role Summary -->
          <div>
            <h3 class="text-sm font-mono uppercase text-slate-400 tracking-wider mb-2 flex items-center gap-2">
              <Icon name="carbon:information" size="16" class="text-emerald-400" />
              <span>Role Overview</span>
            </h3>
            <div class="p-5 rounded-2xl bg-white/[0.02] border border-white/10">
              <p class="text-slate-200 text-sm sm:text-base leading-relaxed font-normal">
                {{ selectedExperience?.description }}
              </p>
            </div>
          </div>

          <!-- Key Responsibilities Checklist -->
          <div v-if="selectedExperience?.responsibilities?.length">
            <h3 class="text-sm font-mono uppercase text-slate-400 tracking-wider mb-3 flex items-center gap-2">
              <Icon name="carbon:checkmark-outline" size="16" class="text-emerald-400" />
              <span>Key Responsibilities & Achievements</span>
            </h3>
            <div class="space-y-2.5">
              <div
                v-for="(resp, idx) in selectedExperience?.responsibilities"
                :key="idx"
                class="flex items-start gap-3 p-3.5 rounded-xl bg-white/[0.02] border border-white/10"
              >
                <Icon name="carbon:checkmark-filled" size="18" class="text-emerald-400 shrink-0 mt-0.5" />
                <span class="text-xs sm:text-sm text-slate-200 leading-relaxed">{{ resp }}</span>
              </div>
            </div>
          </div>

          <!-- Technology Badges -->
          <div v-if="selectedExperience?.technologies?.length">
            <h3 class="text-sm font-mono uppercase text-slate-400 tracking-wider mb-3 flex items-center gap-2">
              <Icon name="carbon:code" size="16" class="text-teal-400" />
              <span>Technologies Utilized</span>
            </h3>
            <div class="flex flex-wrap gap-2 p-4 rounded-2xl bg-white/[0.02] border border-white/10">
              <span
                v-for="tech in selectedExperience?.technologies"
                :key="tech"
                class="px-3 py-1.5 rounded-lg text-xs font-mono font-medium bg-emerald-500/10 text-emerald-300 border border-emerald-500/30"
              >
                {{ tech }}
              </span>
            </div>
          </div>
        </div>
      </template>

      <template #footer>
        <div class="flex items-center justify-between w-full">
          <a
            v-if="selectedExperience?.attachment"
            :href="selectedExperience.attachment"
            target="_blank"
            rel="noopener noreferrer"
            class="btn-primary-gradient px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-white flex items-center gap-2 cursor-pointer"
          >
            <Icon name="carbon:document-download" size="16" />
            <span>Download Certificate</span>
          </a>
          <span v-else></span>

          <UButton
            color="neutral"
            variant="outline"
            size="md"
            @click="isOpen = false"
            class="rounded-xl px-5 cursor-pointer text-slate-300 hover:text-white"
          >
            Close
          </UButton>
        </div>
      </template>
    </UModal>
  </section>
</template>
