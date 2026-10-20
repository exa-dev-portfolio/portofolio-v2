<script setup lang="ts">
import { ref } from 'vue'
import type { UserSettingsModel } from '~/types/settings'

const props = defineProps<{
  user?: UserSettingsModel
}>()

const form = ref({
  name: '',
  email: '',
  subject: '',
  message: '',
})

const isSending = ref(false)
const feedback = ref<{ type: 'success' | 'error'; message: string } | null>(null)
const emailCopied = ref(false)

const copyEmail = () => {
  const email = props.user?.email || 'contact@eka-dev.cloud'
  navigator.clipboard.writeText(email)
  emailCopied.value = true
  setTimeout(() => {
    emailCopied.value = false
  }, 2000)
}

const sendTransmission = async () => {
  if (!form.value.name || !form.value.email || !form.value.message) {
    feedback.value = { type: 'error', message: 'All transmission parameters must be specified.' }
    return
  }

  isSending.value = true
  feedback.value = null

  try {
    const res = await $fetch('/api/contact', {
      method: 'POST',
      body: form.value,
    })

    feedback.value = {
      type: 'success',
      message: 'Transmission dispatched successfully! Encrypted payload received at station gateway.',
    }
    form.value = { name: '', email: '', subject: '', message: '' }
  } catch (err: any) {
    feedback.value = {
      type: 'error',
      message: err?.data?.message || 'Transmission failed. Direct channel error, please use direct email.',
    }
  } finally {
    isSending.value = false
  }
}
</script>

<template>
  <section class="py-12 sm:py-16 px-4 sm:px-6 max-w-7xl mx-auto">
    
    <!-- Header -->
    <div class="mb-8">
      <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-mono mb-2">
        <span>MODULE_05</span>
        <span class="text-white/30">•</span>
        <span>SECURE_TRANSMISSION_TERMINAL</span>
      </div>
      <h2 class="text-2xl sm:text-4xl font-extrabold text-white font-heading tracking-tight">
        Direct Communications Terminal
      </h2>
      <p class="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl">
        Transmit project inquiries, architecture consulting requests, or dispatch recruitment signals.
      </p>
    </div>

    <!-- Comms Console Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
      
      <!-- Left (7 cols): Transmission Input Console -->
      <div class="lg:col-span-7 rounded-3xl bg-[#08120c]/90 border border-emerald-500/25 p-5 sm:p-7 shadow-2xl backdrop-blur-2xl">
        <div class="flex items-center justify-between pb-4 mb-5 border-b border-white/10 font-mono text-xs">
          <span class="text-emerald-400 font-bold flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399] animate-pulse"></span>
            CHANNEL: TLS_1.3_ENCRYPTED
          </span>
          <span class="text-slate-500">BUFFER: READY</span>
        </div>

        <form @submit.prevent="sendTransmission" class="space-y-4 font-mono text-xs">
          
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-slate-300 font-semibold mb-1 text-[11px] uppercase">
                Callsign / Name <span class="text-emerald-400">*</span>
              </label>
              <input
                v-model="form.name"
                type="text"
                required
                placeholder="e.g. Alex Mercer"
                class="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/50 transition-colors"
              />
            </div>

            <div>
              <label class="block text-slate-300 font-semibold mb-1 text-[11px] uppercase">
                Return Comms / Email <span class="text-emerald-400">*</span>
              </label>
              <input
                v-model="form.email"
                type="email"
                required
                placeholder="alex@company.cloud"
                class="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/50 transition-colors"
              />
            </div>
          </div>

          <div>
            <label class="block text-slate-300 font-semibold mb-1 text-[11px] uppercase">
              Transmission Subject
            </label>
            <input
              v-model="form.subject"
              type="text"
              placeholder="e.g. New Distributed Platform Project / Hiring"
              class="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/50 transition-colors"
            />
          </div>

          <div>
            <div class="flex items-center justify-between mb-1">
              <label class="block text-slate-300 font-semibold text-[11px] uppercase">
                Payload Message <span class="text-emerald-400">*</span>
              </label>
              <span class="text-[10px] text-slate-500">{{ form.message.length }} bytes</span>
            </div>
            <textarea
              v-model="form.message"
              required
              rows="4"
              placeholder="Describe scope, technical stack, or project goals..."
              class="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/50 transition-colors font-sans"
            ></textarea>
          </div>

          <!-- Feedback Status Banner -->
          <div
            v-if="feedback"
            class="p-3 rounded-xl text-xs"
            :class="feedback.type === 'success' ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300' : 'bg-red-500/15 border border-red-500/30 text-red-300'"
          >
            {{ feedback.message }}
          </div>

          <button
            type="submit"
            :disabled="isSending"
            class="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold tracking-wide shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Icon v-if="isSending" name="carbon:circle-dash" size="18" class="animate-spin" />
            <Icon v-else name="carbon:send-alt" size="18" />
            <span>{{ isSending ? 'DISPATCHING PAYLOAD...' : 'TRANSMIT MESSAGE' }}</span>
          </button>
        </form>
      </div>

      <!-- Right (5 cols): Comms Frequencies & Direct Identity -->
      <div class="lg:col-span-5 flex flex-col gap-5 font-mono text-xs">
        
        <!-- Direct Email Card -->
        <div class="p-5 rounded-3xl bg-[#08120c]/90 border border-emerald-500/20 shadow-xl space-y-3">
          <span class="text-[11px] uppercase font-bold text-emerald-400">Direct Gateway Coordinate</span>
          <div class="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
            <div class="flex items-center gap-2 text-white truncate mr-2">
              <Icon name="carbon:email" size="16" class="text-emerald-400 shrink-0" />
              <span class="truncate">{{ user?.email || 'contact@eka-dev.cloud' }}</span>
            </div>
            <button
              @click="copyEmail"
              class="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-[10px] font-bold border border-emerald-500/30 transition-colors cursor-pointer shrink-0"
            >
              {{ emailCopied ? 'COPIED!' : 'COPY' }}
            </button>
          </div>
        </div>

        <!-- Social Channels -->
        <div class="p-5 rounded-3xl bg-[#08120c]/90 border border-emerald-500/20 shadow-xl space-y-3">
          <span class="text-[11px] uppercase font-bold text-emerald-400">Network Profiles</span>
          <div class="grid grid-cols-2 gap-2">
            <a
              v-if="user?.github_profile"
              :href="user.github_profile"
              target="_blank"
              class="p-3 rounded-xl bg-white/5 hover:bg-emerald-500/10 border border-white/10 hover:border-emerald-400/40 text-slate-300 hover:text-white flex items-center gap-2 transition-colors"
            >
              <Icon name="line-md:github" size="18" class="text-emerald-400" />
              <span>GitHub</span>
            </a>

            <a
              v-if="user?.linkedin_profile"
              :href="user.linkedin_profile"
              target="_blank"
              class="p-3 rounded-xl bg-white/5 hover:bg-emerald-500/10 border border-white/10 hover:border-emerald-400/40 text-slate-300 hover:text-white flex items-center gap-2 transition-colors"
            >
              <Icon name="jam:linkedin" size="18" class="text-emerald-400" />
              <span>LinkedIn</span>
            </a>
          </div>
        </div>

        <!-- Response SLA Guarantee -->
        <div class="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-center gap-3">
          <Icon name="carbon:security" size="24" class="text-emerald-400 shrink-0" />
          <div>
            <p class="font-bold text-white text-xs">Response Guarantee</p>
            <p class="text-[11px] text-slate-400">All transmissions dispatched receive direct engineer triage within &lt;24 hours.</p>
          </div>
        </div>

      </div>

    </div>

  </section>
</template>
