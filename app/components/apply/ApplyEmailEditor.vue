<script setup lang="ts">
const props = defineProps<{
    subject: string
    body: string
    reasoning: string[]
    readonly?: boolean
}>()

const emit = defineEmits<{
    'update:subject': [value: string]
    'update:body': [value: string]
}>()

const localSubject = ref(props.subject)
const localBody = ref(props.body)

watch(() => props.subject, (v) => { localSubject.value = v })
watch(() => props.body, (v) => { localBody.value = v })

watch(localSubject, (v) => emit('update:subject', v))
watch(localBody, (v) => emit('update:body', v))
</script>

<template>
    <div class="space-y-5">
        <div>
            <label class="block text-xs font-medium text-zinc-300 uppercase tracking-wider mb-2">Subject</label>
            <input
                v-model="localSubject"
                type="text"
                :readonly="readonly"
                class="w-full px-4 py-2.5 rounded-xl bg-zinc-900/60 border border-white/10 text-white placeholder:text-zinc-600 focus:outline-none focus:border-white/30 transition-all text-sm"
            />
        </div>

        <div>
            <label class="block text-xs font-medium text-zinc-300 uppercase tracking-wider mb-2">Email Body</label>
            <textarea
                v-model="localBody"
                :readonly="readonly"
                rows="16"
                class="w-full px-4 py-2.5 rounded-xl bg-zinc-900/60 border border-white/10 text-white placeholder:text-zinc-600 focus:outline-none focus:border-white/30 transition-all resize-y font-mono text-sm leading-relaxed"
            ></textarea>
            <p class="text-xs text-zinc-500 mt-1.5">{{ localBody.length }} characters</p>
        </div>

        <div v-if="reasoning.length > 0" class="pt-3 border-t border-white/5">
            <label class="block text-xs font-medium text-zinc-400 uppercase tracking-wider mb-2">Why this email?</label>
            <ul class="space-y-2">
                <li
                    v-for="(point, idx) in reasoning"
                    :key="idx"
                    class="flex items-start gap-2.5 text-xs text-zinc-400 leading-relaxed"
                >
                    <Icon name="carbon:idea" size="15" class="text-amber-400 shrink-0 mt-0.5"/>
                    <span>{{ point }}</span>
                </li>
            </ul>
        </div>
    </div>
</template>
