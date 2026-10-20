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

const sendMessage = async () => {
  if (!form.value.name || !form.value.email || !form.value.message) {
    feedback.value = { type: 'error', message: 'Please fill in all required fields.' }
    return
  }

  isSending.value = true
  feedback.value = null

  try {
    await $fetch('/api/contact', {
      method: 'POST',
      body: form.value,
    })

    feedback.value = {
      type: 'success',
      message: 'Message sent successfully! I will get back to you shortly.',
    }
    form.value = { name: '', email: '', subject: '', message: '' }
  } catch (err: any) {
    feedback.value = {
      type: 'error',
      message: err?.data?.message || 'Failed to send message. Please reach out directly via email.',
    }
  } finally {
    isSending.value = false
  }
}
</script>

<template>
  <section class="space-y-8">
    
    <!-- Section Header -->
    <div class="pb-2 border-b border-white/10">
      <span class="text-xs font-mono uppercase tracking-wider text-zinc-500 block">Connect</span>
      <h2 class="text-2xl sm:text-3xl font-bold text-white tracking-tight mt-1">Get in Touch</h2>
      <p class="text-xs sm:text-sm text-zinc-400 mt-1 max-w-xl">
        Have a project idea, consulting inquiry, or an engineering role? Let's talk.
      </p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-12 gap-6 sm:gap-8 items-start">
      
      <!-- Direct Contact Channels (5 cols) -->
      <div class="md:col-span-5 space-y-4">
        <div class="p-5 rounded-2xl bg-[#141417]/70 border border-white/10 space-y-3">
          <span class="text-xs font-mono uppercase text-zinc-500 font-semibold block">Email Address</span>
          <div class="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/5">
            <span class="text-xs text-white truncate mr-2">{{ user?.email || 'contact@eka-dev.cloud' }}</span>
            <button
              @click="copyEmail"
              class="px-2.5 py-1 rounded-lg bg-white text-black text-[11px] font-semibold hover:bg-zinc-200 transition-colors cursor-pointer shrink-0"
            >
              {{ emailCopied ? 'Copied' : 'Copy' }}
            </button>
          </div>
        </div>

        <!-- Social Profiles -->
        <div class="p-5 rounded-2xl bg-[#141417]/70 border border-white/10 space-y-3">
          <span class="text-xs font-mono uppercase text-zinc-500 font-semibold block">Social Profiles</span>
          <div class="flex items-center gap-2">
            <a
              v-if="user?.github_profile"
              :href="user.github_profile"
              target="_blank"
              class="flex-1 p-2.5 rounded-xl bg-white/[0.03] border border-white/5 hover:border-white/20 text-zinc-300 hover:text-white flex items-center justify-center gap-2 text-xs transition-colors"
            >
              <Icon name="line-md:github" size="16" />
              <span>GitHub</span>
            </a>
            <a
              v-if="user?.linkedin_profile"
              :href="user.linkedin_profile"
              target="_blank"
              class="flex-1 p-2.5 rounded-xl bg-white/[0.03] border border-white/5 hover:border-white/20 text-zinc-300 hover:text-white flex items-center justify-center gap-2 text-xs transition-colors"
            >
              <Icon name="jam:linkedin" size="16" />
              <span>LinkedIn</span>
            </a>
          </div>
        </div>
      </div>

      <!-- Message Form (7 cols) -->
      <div class="md:col-span-7 p-6 rounded-2xl bg-[#141417]/70 border border-white/10">
        <form @submit.prevent="sendMessage" class="space-y-4 text-xs">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-zinc-400 font-medium mb-1">Your Name</label>
              <input
                v-model="form.name"
                type="text"
                required
                placeholder="Alex Mercer"
                class="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder:text-zinc-600 focus:outline-none focus:border-white/30 transition-colors"
              />
            </div>
            <div>
              <label class="block text-zinc-400 font-medium mb-1">Your Email</label>
              <input
                v-model="form.email"
                type="email"
                required
                placeholder="alex@company.com"
                class="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder:text-zinc-600 focus:outline-none focus:border-white/30 transition-colors"
              />
            </div>
          </div>

          <div>
            <label class="block text-zinc-400 font-medium mb-1">Subject</label>
            <input
              v-model="form.subject"
              type="text"
              placeholder="Project inquiry or full-time opportunity"
              class="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder:text-zinc-600 focus:outline-none focus:border-white/30 transition-colors"
            />
          </div>

          <div>
            <label class="block text-zinc-400 font-medium mb-1">Message</label>
            <textarea
              v-model="form.message"
              required
              rows="4"
              placeholder="Tell me about your project, timeline, or scope..."
              class="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder:text-zinc-600 focus:outline-none focus:border-white/30 transition-colors font-sans"
            ></textarea>
          </div>

          <!-- Feedback Status -->
          <div
            v-if="feedback"
            class="p-3 rounded-xl text-xs"
            :class="feedback.type === 'success' ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-300' : 'bg-red-500/10 border border-red-500/20 text-red-300'"
          >
            {{ feedback.message }}
          </div>

          <button
            type="submit"
            :disabled="isSending"
            class="w-full py-3 rounded-xl bg-white text-black font-semibold text-xs tracking-wide shadow-md hover:bg-zinc-200 transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Icon v-if="isSending" name="carbon:circle-dash" size="16" class="animate-spin" />
            <Icon v-else name="carbon:send-alt" size="16" />
            <span>{{ isSending ? 'Sending...' : 'Send Message' }}</span>
          </button>
        </form>
      </div>

    </div>

  </section>
</template>
