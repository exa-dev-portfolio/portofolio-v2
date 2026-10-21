<script setup lang="ts">
import type {GenerateInput} from "~/types/application";

definePageMeta({
    layout: 'dashboard',
    breadCrumb: [
        {title: 'Apply', link: '/dashboard/apply'},
        {title: 'New Application'}
    ]
})

const router = useRouter()
const {generateEmail, isGenerating} = useApply()

const handleGenerate = async (input: GenerateInput) => {
    const result = await generateEmail(input)
    if (result?.application?.id) {
        await router.push(`/dashboard/apply/${result.application.id}`)
    }
}
</script>

<template>
    <div class="space-y-8">
        <div>
            <h1 class="text-3xl font-bold tracking-tight text-white mb-1">New Application</h1>
            <p class="text-sm text-zinc-400">Fill in the job details and generate a personalized application email</p>
        </div>

        <div class="max-w-2xl">
            <div class="bg-[#141417] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-sm">
                <ApplyInputForm
                    :loading="isGenerating"
                    @submit="handleGenerate"
                />
            </div>
        </div>
    </div>
</template>
