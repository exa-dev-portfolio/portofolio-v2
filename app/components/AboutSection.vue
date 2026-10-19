<script setup lang="ts">
import type { UserSettingsModel } from "~/types/settings";
import AppleMusicCard from "~/components/AppleMusicCard.vue";

defineProps<{
  user?: UserSettingsModel | null;
  count_projects?: number;
  count_experience?: number;
}>();

const competencies = [
  { label: 'Frontend Architecture', icon: 'carbon:application-web', color: 'text-cyan-400', bg: 'bg-cyan-500/10 border-cyan-500/20' },
  { label: 'Backend & Microservices', icon: 'carbon:data-base', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
  { label: 'Mobile Engineering', icon: 'carbon:devices', color: 'text-pink-400', bg: 'bg-pink-500/10 border-pink-500/20' },
  { label: 'DevOps & Kubernetes', icon: 'carbon:cloud-app', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
  { label: 'CI/CD Automation', icon: 'carbon:delivery-parcel', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
  { label: 'High Performance & Security', icon: 'carbon:security', color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20' },
];
</script>

<template>
  <section id="about" class="py-20 sm:py-24 relative overflow-hidden" aria-labelledby="about-heading">
    <div class="container mx-auto px-4 sm:px-6">
      
      <!-- Section Header -->
      <Motion
        :initial="{ opacity: 0, y: 20 }"
        :while-in-view="{ opacity: 1, y: 0 }"
        :viewport="{ once: true, amount: 0.15 }"
        :transition="{ duration: 0.45, ease: 'easeOut' }"
        class="text-center max-w-3xl mx-auto mb-14 sm:mb-16"
      >
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-mono mb-4">
          <Icon name="carbon:identification" size="14" />
          <span>ABOUT ME</span>
        </div>
        <h2 id="about-heading" class="text-3xl sm:text-4xl lg:text-5xl font-heading font-black text-white tracking-tight mb-4">
          Bridging <span class="text-gradient-cyan">Backend Logic</span> with <span class="text-gradient-primary">Frontend Magic</span>.
        </h2>
        <p class="text-slate-300 text-base sm:text-lg font-normal leading-relaxed">
          Architecting resilient digital ecosystems that blend clean code, high scalability, and seamless user experiences.
        </p>
      </Motion>

      <!-- Bento-style Grid Layout -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        <!-- Left: Profile & Status Card (5 cols) -->
        <Motion
          :initial="{ opacity: 0, x: -20 }"
          :while-in-view="{ opacity: 1, x: 0 }"
          :viewport="{ once: true, amount: 0.15 }"
          :transition="{ duration: 0.5, ease: 'easeOut' }"
          class="lg:col-span-5"
        >
          <div class="card-elevated rounded-3xl p-4 sm:p-6 shadow-xl overflow-hidden group">
            
            <!-- Profile Image Container -->
            <div class="relative rounded-2xl overflow-hidden border border-white/10 mb-6 bg-slate-900">
              <NuxtImg
                src="/images/about.webp"
                alt="Eka Developer Profile"
                class="w-full h-80 sm:h-96 object-cover object-center group-hover:scale-103 transition-transform duration-500"
                loading="lazy"
                width="500"
                height="600"
              />
              <div class="absolute inset-0 bg-gradient-to-t from-[#090e1a] via-transparent to-transparent opacity-80"></div>

              <!-- Status Badge on Image -->
              <div class="absolute bottom-4 left-4 right-4">
                <div class="flex items-center justify-between p-3 rounded-xl bg-[#0b1329]/95 border border-white/15 shadow-md">
                  <div class="flex items-center gap-3">
                    <div class="relative flex h-2.5 w-2.5">
                      <span 
                        v-if="user?.open_to_opportunities" 
                        class="radar-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"
                      ></span>
                      <span 
                        class="relative inline-flex rounded-full h-2.5 w-2.5"
                        :class="user?.open_to_opportunities ? 'bg-emerald-500' : 'bg-amber-500'"
                      ></span>
                    </div>
                    <div>
                      <p class="text-[10px] font-mono uppercase text-slate-400 tracking-wider">Current Status</p>
                      <p class="text-xs font-semibold text-white">
                        {{ user?.open_to_opportunities ? 'Open to New Opportunities' : 'Currently Engaged' }}
                      </p>
                    </div>
                  </div>
                  <span class="text-xs font-mono text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-md border border-blue-500/20">
                    {{ user?.location || 'Indonesia' }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Download CV / Direct Link Action -->
            <div class="flex flex-col sm:flex-row gap-3">
              <a
                v-if="user?.cv_url"
                :href="user.cv_url"
                target="_blank"
                rel="noopener noreferrer"
                class="btn-primary-gradient w-full py-3 px-4 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 group cursor-pointer"
              >
                <span>Download Resume</span>
                <Icon name="carbon:document-download" size="18" class="group-hover:translate-y-0.5 transition-transform" />
              </a>

              <a
                href="#contact"
                class="btn-secondary-subtle w-full py-3 px-4 rounded-xl text-sm font-semibold text-slate-200 hover:text-white flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Let's Discuss</span>
                <Icon name="carbon:arrow-up-right" size="16" class="text-blue-400" />
              </a>
            </div>

          </div>
        </Motion>

        <!-- Right: Story, Stats & Competencies (7 cols) -->
        <div class="lg:col-span-7 flex flex-col gap-6">
          
          <!-- Story Elevated Card -->
          <Motion
            :initial="{ opacity: 0, y: 15 }"
            :while-in-view="{ opacity: 1, y: 0 }"
            :viewport="{ once: true, amount: 0.15 }"
            :transition="{ duration: 0.5, ease: 'easeOut', delay: 0.1 }"
            class="card-elevated rounded-3xl p-6 sm:p-8 relative"
          >
            <div class="flex items-center gap-2 text-xs font-mono text-blue-400 uppercase tracking-wider mb-4">
              <Icon name="carbon:terminal" size="16" />
              <span>Engineering Philosophy</span>
            </div>

            <h3 class="text-xl sm:text-2xl font-heading font-bold text-white mb-4 leading-snug">
              Crafting robust solutions with relentless attention to speed, scalability, and code cleanliness.
            </h3>

            <p class="text-slate-300 text-sm sm:text-base leading-relaxed mb-4 font-normal">
              I specialize in building full-stack applications that solve real-world problems. From designing resilient microservices with Go and Node.js to constructing modern, fluid user interfaces with Vue.js, React, and Flutter, I engineer software that stands the test of high traffic and complex workflows.
            </p>

            <p class="text-slate-400 text-sm sm:text-base leading-relaxed font-normal">
              Beyond standard web development, my toolkit includes DevOps automation, container orchestration with Kubernetes, and continuous delivery pipelines to ensure maximum reliability and 99.9% uptime.
            </p>
          </Motion>

          <!-- Metric Stats Grid -->
          <Motion
            :initial="{ opacity: 0, y: 15 }"
            :while-in-view="{ opacity: 1, y: 0 }"
            :viewport="{ once: true, amount: 0.15 }"
            :transition="{ duration: 0.5, ease: 'easeOut', delay: 0.2 }"
            class="grid grid-cols-1 sm:grid-cols-2 gap-4"
          >
            <!-- Stat 1: Years Experience -->
            <div class="card-interactive rounded-2xl p-5 flex items-center justify-between">
              <div>
                <p class="text-3xl sm:text-4xl font-heading font-black text-white mb-1">
                  {{ count_experience || 0 }}<span class="text-blue-500">+</span>
                </p>
                <p class="text-xs font-mono uppercase tracking-wider text-slate-400">Years Experience</p>
              </div>
              <div class="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                <Icon name="carbon:time" size="24" />
              </div>
            </div>

            <!-- Stat 2: Projects Delivered -->
            <div class="card-interactive rounded-2xl p-5 flex items-center justify-between">
              <div>
                <p class="text-3xl sm:text-4xl font-heading font-black text-white mb-1">
                  {{ count_projects || 0 }}<span class="text-cyan-400">+</span>
                </p>
                <p class="text-xs font-mono uppercase tracking-wider text-slate-400">Projects Shipped</p>
              </div>
              <div class="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                <Icon name="carbon:rocket" size="24" />
              </div>
            </div>
          </Motion>

          <!-- Core Competencies Badges -->
          <Motion
            :initial="{ opacity: 0, y: 15 }"
            :while-in-view="{ opacity: 1, y: 0 }"
            :viewport="{ once: true, amount: 0.15 }"
            :transition="{ duration: 0.5, ease: 'easeOut', delay: 0.25 }"
            class="card-elevated rounded-3xl p-6"
          >
            <div class="flex items-center justify-between mb-4">
              <span class="text-xs font-mono uppercase tracking-wider text-slate-400">Core Disciplines</span>
              <span class="text-[11px] font-mono text-blue-400">Production-Tested</span>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div
                v-for="comp in competencies"
                :key="comp.label"
                class="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.05] transition-colors"
              >
                <div class="w-8 h-8 rounded-lg flex items-center justify-center border" :class="comp.bg">
                  <Icon :name="comp.icon" size="16" :class="comp.color" />
                </div>
                <span class="text-xs font-medium text-slate-200">{{ comp.label }}</span>
              </div>
            </div>
          </Motion>

        </div>

      </div>

      <!-- Bento Item: Apple Music Now Playing & Favorite Genres Card (Hidden if not configured) -->
      <AppleMusicCard />

    </div>
  </section>
</template>