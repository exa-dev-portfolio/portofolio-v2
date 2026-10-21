<script setup lang="ts">
const props = defineProps<{
    company_name: string
    position: string
    hr_email: string
    status: 'draft' | 'sent'
    job_link?: string | null
    sent_at?: string | null
}>()
</script>

<template>
    <div class="bg-[#141417] border border-white/10 rounded-2xl p-6 space-y-4 shadow-sm">
        <div class="flex items-start justify-between">
            <div class="flex items-center gap-3.5">
                <div class="w-11 h-11 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-zinc-300">
                    <Icon name="carbon:building" size="22"/>
                </div>
                <div>
                    <p class="text-white font-bold text-lg leading-tight">{{ company_name }}</p>
                    <p class="text-zinc-400 text-sm mt-0.5">{{ position }}</p>
                </div>
            </div>
            <span
                :class="[
                    'px-2.5 py-0.5 rounded-full text-[11px] font-medium border',
                    status === 'sent'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                ]"
            >
                {{ status === 'sent' ? 'Sent' : 'Draft' }}
            </span>
        </div>

        <div class="flex items-center gap-2 text-sm text-zinc-400">
            <Icon name="carbon:email" size="15" class="text-zinc-500"/>
            <span>{{ hr_email }}</span>
        </div>

        <div v-if="job_link" class="flex items-center gap-2 text-sm">
            <Icon name="carbon:link" size="15" class="text-zinc-500"/>
            <a
                :href="job_link"
                target="_blank"
                rel="noopener noreferrer"
                class="text-zinc-300 hover:text-white hover:underline truncate transition-colors"
            >{{ job_link }}</a>
        </div>

        <div v-if="sent_at" class="flex items-center gap-2 text-xs text-zinc-500 pt-2 border-t border-white/5">
            <Icon name="carbon:time" size="13"/>
            <span>Sent {{ new Date(sent_at).toLocaleDateString() }}</span>
        </div>
    </div>
</template>
