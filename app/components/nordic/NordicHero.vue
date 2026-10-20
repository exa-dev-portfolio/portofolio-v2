<script setup lang="ts">
import { computed } from 'vue'
import type { UserSettingsModel } from '~/types/settings'

const props = defineProps<{
  user?: UserSettingsModel
  projectCount?: number
  experienceYears?: number
}>()

const scrollTo = (id: string) => {
  const el = document.getElementById(id)
  if (el) {
    el.scrollIntoView({ behavior: 'smooth' })
  }
}
</script>

<template>
  <section class="space-y-10 sm:space-y-12">
    
    <!-- Top Availability Pill -->
    <div class="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/10 text-xs text-zinc-300">
      <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
      <span class="font-medium text-white">Available for new opportunities</span>
      <span class="text-zinc-600">•</span>
      <span class="text-zinc-400">Full-Stack & Cloud</span>
    </div>

    <!-- Main Headline & Narrative -->
    <div class="space-y-4 max-w-3xl">
      <h1 class="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-[1.12]">
        Building scalable backends, robust cloud systems, and thoughtful web interfaces.
      </h1>
      <p class="text-base sm:text-lg text-zinc-400 leading-relaxed font-normal pt-1">
        I'm <strong class="text-white font-medium">{{ user?.name || 'Eka' }}</strong>, a software engineer with {{ experienceYears || 5 }}+ years of experience architecting resilient services in Golang and building reactive frontends with Vue, Nuxt, and TypeScript.
      </p>
    </div>

    <!-- Primary Action Buttons -->
    <div class="flex items-center gap-3 flex-wrap pt-1">
      <button
        @click="scrollTo('projects')"
        class="px-5 py-2.5 rounded-full bg-white text-black font-semibold text-xs sm:text-sm shadow-md hover:bg-zinc-200 transition-colors cursor-pointer flex items-center gap-2"
      >
        <span>View Projects</span>
        <Icon name="carbon:arrow-down" size="14" />
      </button>

      <button
        @click="scrollTo('contact')"
        class="px-5 py-2.5 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-white font-medium text-xs sm:text-sm transition-colors cursor-pointer"
      >
        Get in touch
      </button>

      <a
        v-if="user?.cv_url"
        :href="user.cv_url"
        target="_blank"
        rel="noopener noreferrer"
        class="px-4 py-2.5 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-zinc-400 hover:text-white font-mono text-xs transition-colors flex items-center gap-1.5"
      >
        <span>Resume</span>
        <Icon name="carbon:download" size="12" />
      </a>
    </div>

    <!-- Minimalist Bento Stats Grid -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 pt-4">
      <div class="p-4 sm:p-5 rounded-2xl bg-[#141417]/70 border border-white/10">
        <span class="text-2xl sm:text-3xl font-bold text-white block tracking-tight">{{ experienceYears || 5 }}+</span>
        <span class="text-xs text-zinc-400 mt-1 block font-medium">Years Experience</span>
      </div>

      <div class="p-4 sm:p-5 rounded-2xl bg-[#141417]/70 border border-white/10">
        <span class="text-2xl sm:text-3xl font-bold text-white block tracking-tight">{{ projectCount || 30 }}+</span>
        <span class="text-xs text-zinc-400 mt-1 block font-medium">Shipped Projects</span>
      </div>

      <div class="p-4 sm:p-5 rounded-2xl bg-[#141417]/70 border border-white/10">
        <span class="text-2xl sm:text-3xl font-bold text-white block tracking-tight">99.9%</span>
        <span class="text-xs text-zinc-400 mt-1 block font-medium">Production Uptime</span>
      </div>

      <div class="p-4 sm:p-5 rounded-2xl bg-[#141417]/70 border border-white/10">
        <span class="text-xl sm:text-2xl font-bold text-white block tracking-tight mt-0.5">Jakarta</span>
        <span class="text-xs text-zinc-400 mt-1 block font-medium">Indonesia (UTC+7)</span>
      </div>
    </div>

  </section>
</template>
