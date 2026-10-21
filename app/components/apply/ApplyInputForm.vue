<script setup lang="ts">
import {reactive} from 'vue'

const emit = defineEmits<{
    submit: [value: {
        company_name: string
        position: string
        hr_email: string
        job_description: string
        job_link: string
    }]
}>()

const form = reactive({
    company_name: '',
    position: '',
    hr_email: '',
    job_description: '',
    job_link: '',
})

const isSubmitting = defineModel<boolean>('loading', {default: false})

const isValid = computed(() => {
    return form.company_name.trim()
        && form.position.trim()
        && form.hr_email.trim()
        && form.job_description.trim()
})

const handleSubmit = () => {
    if (!isValid.value) return
    emit('submit', {...form})
}
</script>

<template>
    <form @submit.prevent="handleSubmit" class="space-y-5">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
                <label class="block text-xs font-medium text-zinc-300 uppercase tracking-wider mb-2">Company Name</label>
                <input
                    v-model="form.company_name"
                    type="text"
                    placeholder="e.g. Google, Startup XYZ"
                    class="w-full px-4 py-2.5 rounded-xl bg-zinc-900/60 border border-white/10 text-white placeholder:text-zinc-600 focus:outline-none focus:border-white/30 transition-all text-sm"
                />
            </div>
            <div>
                <label class="block text-xs font-medium text-zinc-300 uppercase tracking-wider mb-2">Position</label>
                <input
                    v-model="form.position"
                    type="text"
                    placeholder="e.g. Senior Frontend Developer"
                    class="w-full px-4 py-2.5 rounded-xl bg-zinc-900/60 border border-white/10 text-white placeholder:text-zinc-600 focus:outline-none focus:border-white/30 transition-all text-sm"
                />
            </div>
        </div>

        <div>
            <label class="block text-xs font-medium text-zinc-300 uppercase tracking-wider mb-2">HR Email</label>
            <input
                v-model="form.hr_email"
                type="email"
                placeholder="hr@company.com"
                class="w-full px-4 py-2.5 rounded-xl bg-zinc-900/60 border border-white/10 text-white placeholder:text-zinc-600 focus:outline-none focus:border-white/30 transition-all text-sm"
            />
        </div>

        <div>
            <label class="block text-xs font-medium text-zinc-300 uppercase tracking-wider mb-2">Job Description</label>
            <textarea
                v-model="form.job_description"
                rows="10"
                placeholder="Paste the job description here..."
                class="w-full px-4 py-2.5 rounded-xl bg-zinc-900/60 border border-white/10 text-white placeholder:text-zinc-600 focus:outline-none focus:border-white/30 transition-all resize-y font-mono text-sm"
            ></textarea>
        </div>

        <div>
            <label class="block text-xs font-medium text-zinc-300 uppercase tracking-wider mb-2">
                Job Link
                <span class="text-zinc-500 font-normal normal-case">(optional)</span>
            </label>
            <input
                v-model="form.job_link"
                type="url"
                placeholder="https://company.com/careers/job-id"
                class="w-full px-4 py-2.5 rounded-xl bg-zinc-900/60 border border-white/10 text-white placeholder:text-zinc-600 focus:outline-none focus:border-white/30 transition-all text-sm"
            />
        </div>

        <button
            type="submit"
            :disabled="!isValid || isSubmitting"
            class="w-full px-6 py-3 rounded-xl bg-white text-zinc-950 font-semibold hover:bg-zinc-200 disabled:opacity-40 transition-all flex items-center justify-center gap-2 shadow-sm text-sm cursor-pointer"
        >
            <Icon v-if="isSubmitting" name="line-md:loading-loop" size="18"/>
            <Icon v-else name="carbon:machine-learning" size="18"/>
            {{ isSubmitting ? 'Generating Email...' : 'Generate Email' }}
        </button>
    </form>
</template>
