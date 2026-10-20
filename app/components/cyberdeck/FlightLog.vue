<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Experience } from '~/types/journey'

const props = defineProps<{
  experiences: Experience[]
}>()

const expandedIndex = ref<number | null>(0)

const toggleExpand = (idx: number) => {
  expandedIndex.value = expandedIndex.value === idx ? null : idx
}
</script>

<template>
  <section class="py-12 sm:py-16 px-4 sm:px-6 max-w-7xl mx-auto">
    
    <!-- Header -->
    <div class="mb-8">
      <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-mono mb-2">
        <span>MODULE_04</span>
        <span class="text-white/30">•</span>
        <span>FLIGHT_TELEMETRY_LOG</span>
      </div>
      <h2 class="text-2xl sm:text-4xl font-extrabold text-white font-heading tracking-tight">
        Engineering Flight Log & Mission Debrief
      </h2>
      <p class="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl">
        Chronological record of technical roles, high-impact deployments, and distributed systems architected.
      </p>
    </div>

    <!-- Mission Log Stack -->
    <div class="space-y-4">
      <div
        v-for="(exp, idx) in experiences"
        :key="exp.id || idx"
        class="rounded-3xl bg-[#08120c]/90 border border-emerald-500/20 shadow-xl overflow-hidden transition-all duration-300 hover:border-emerald-400/40"
      >
        <!-- Flight Log Header Row -->
        <button
          @click="toggleExpand(idx)"
          class="w-full p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-left cursor-pointer"
        >
          <div class="flex items-start sm:items-center gap-3 sm:gap-4">
            <!-- Mission Badge Number -->
            <div class="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-mono font-bold text-sm sm:text-base flex items-center justify-center shrink-0">
              #0{{ idx + 1 }}
            </div>

            <div class="min-w-0">
              <div class="flex items-center gap-2">
                <h3 class="text-base sm:text-lg font-heading font-bold text-white truncate">{{ exp.role }}</h3>
                <span v-if="exp.is_current" class="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-semibold">
                  ACTIVE
                </span>
              </div>
              <p class="text-xs font-mono text-emerald-400 mt-0.5">{{ exp.company }}</p>
            </div>
          </div>

          <!-- Time & Arrow -->
          <div class="flex items-center justify-between sm:justify-end gap-3 font-mono text-xs text-slate-400 shrink-0">
            <span class="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-[11px]">
              {{ exp.period }}
            </span>
            <Icon
              name="carbon:chevron-down"
              size="18"
              class="text-emerald-400 transition-transform duration-200"
              :class="expandedIndex === idx ? 'rotate-180' : ''"
            />
          </div>
        </button>

        <!-- Expandable Mission Debrief Body -->
        <div
          v-show="expandedIndex === idx"
          class="px-5 sm:px-6 pb-6 pt-2 border-t border-white/5 space-y-4 font-mono text-xs"
        >
          <div v-if="exp.description" class="p-4 rounded-2xl bg-black/40 border border-white/5 text-slate-300 leading-relaxed font-sans text-xs sm:text-sm">
            {{ exp.description }}
          </div>

          <!-- Skills / Tools Deployed in Mission -->
          <div v-if="exp.skills?.length" class="space-y-2">
            <span class="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">Technologies Deployed:</span>
            <div class="flex flex-wrap gap-1.5">
              <span
                v-for="s in exp.skills"
                :key="s"
                class="px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-[10px]"
              >
                {{ s }}
              </span>
            </div>
          </div>
        </div>

      </div>
    </div>

  </section>
</template>
