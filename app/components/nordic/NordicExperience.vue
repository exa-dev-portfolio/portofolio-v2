<script setup lang="ts">
import type { Experience } from '~/types/journey'

defineProps<{
  experiences: Experience[]
}>()
</script>

<template>
  <section class="space-y-8">
    
    <!-- Section Header -->
    <div class="pb-2 border-b border-white/10">
      <span class="text-xs font-mono uppercase tracking-wider text-zinc-500 block">Career History</span>
      <h2 class="text-2xl sm:text-3xl font-bold text-white tracking-tight mt-1">Work Experience</h2>
      <p class="text-xs sm:text-sm text-zinc-400 mt-1 max-w-xl">
        Positions held, technical challenges solved, and production systems maintained.
      </p>
    </div>

    <!-- Minimalist Experience Timeline List -->
    <div class="space-y-4">
      <div
        v-for="(exp, idx) in experiences"
        :key="exp.id || idx"
        class="p-5 sm:p-6 rounded-2xl bg-[#141417]/70 border border-white/10 hover:border-white/20 transition-colors space-y-3"
      >
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div class="flex items-center gap-2">
              <h3 class="text-base sm:text-lg font-bold text-white">{{ exp.role }}</h3>
              <span
                v-if="exp.is_current"
                class="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-mono font-medium"
              >
                Current
              </span>
            </div>
            <p class="text-xs sm:text-sm text-zinc-400 mt-0.5">{{ exp.company }}</p>
          </div>

          <span class="px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-mono text-zinc-400 self-start sm:self-auto">
            {{ exp.period }}
          </span>
        </div>

        <p v-if="exp.description" class="text-xs sm:text-sm text-zinc-300 leading-relaxed font-sans">
          {{ exp.description }}
        </p>

        <!-- Technologies Used -->
        <div v-if="exp.skills?.length" class="flex flex-wrap gap-1.5 pt-1">
          <span
            v-for="s in exp.skills"
            :key="s"
            class="px-2 py-0.5 rounded-md bg-white/5 border border-white/5 text-[10px] font-mono text-zinc-400"
          >
            {{ s }}
          </span>
        </div>

      </div>
    </div>

  </section>
</template>
