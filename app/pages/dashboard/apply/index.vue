<script setup lang="ts">
import type {Application} from "~/types/application";

definePageMeta({
    layout: 'dashboard',
    breadCrumb: [
        {title: 'Apply'}
    ]
})

const {$axios} = useNuxtApp()
const toast = useToastCustom()
const router = useRouter()

const applications = ref<Application[]>([])
const isLoading = ref(true)
const stats = ref({total: 0, draft: 0, sent: 0})
const filterStatus = ref<'all' | 'draft' | 'sent'>('all')

const fetchData = async () => {
    isLoading.value = true
    try {
        const [appsRes, statsRes] = await Promise.all([
            $axios.get<BaseResponse<Application[]>>('/api/applications'),
            $axios.get<BaseResponse<{ total: number; draft: number; sent: number }>>('/api/applications/stats'),
        ])
        applications.value = appsRes.data?.data ?? []
        stats.value = statsRes.data?.data ?? {total: 0, draft: 0, sent: 0}
    } catch (err) {
        console.error(err)
    } finally {
        isLoading.value = false
    }
}

onMounted(fetchData)

const filteredApps = computed(() => {
    if (filterStatus.value === 'all') return applications.value
    return applications.value.filter(a => a.status === filterStatus.value)
})

const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric'
    })
}

const handleDelete = async (id: string) => {
    toast.showConfirmationToast('Delete', 'Are you sure?', async () => {
        try {
            await $axios.delete(`/api/applications/${id}`)
            toast.showSuccessToast('Deleted', 'Application deleted')
            await fetchData()
        } catch {
            toast.showErrorToast('Error', 'Failed to delete')
        }
    })
}
</script>

<template>
    <div class="space-y-8">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
                <h1 class="text-3xl font-bold tracking-tight text-white mb-1">Job Applications</h1>
                <p class="text-sm text-zinc-400">Track and manage your targeted job applications</p>
            </div>
            <NuxtLink
                to="/dashboard/apply/new"
                class="px-5 py-2.5 rounded-xl bg-white text-zinc-950 font-semibold hover:bg-zinc-200 transition-all flex items-center justify-center gap-2 shadow-sm text-sm"
            >
                <Icon name="carbon:add" size="18"/>
                New Application
            </NuxtLink>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div class="bg-[#141417] border border-white/10 rounded-2xl p-5 shadow-sm">
                <p class="text-3xl font-bold text-white tracking-tight">{{ stats.total }}</p>
                <p class="text-xs font-medium text-zinc-500 mt-1 uppercase tracking-wider">Total Applications</p>
            </div>
            <div class="bg-[#141417] border border-white/10 rounded-2xl p-5 shadow-sm">
                <p class="text-3xl font-bold text-amber-400 tracking-tight">{{ stats.draft }}</p>
                <p class="text-xs font-medium text-zinc-500 mt-1 uppercase tracking-wider">Drafts</p>
            </div>
            <div class="bg-[#141417] border border-white/10 rounded-2xl p-5 shadow-sm">
                <p class="text-3xl font-bold text-emerald-400 tracking-tight">{{ stats.sent }}</p>
                <p class="text-xs font-medium text-zinc-500 mt-1 uppercase tracking-wider">Sent Out</p>
            </div>
        </div>

        <div class="flex items-center gap-2 border-b border-white/10 pb-4">
            <button
                v-for="f in (['all', 'draft', 'sent'] as const)"
                :key="f"
                @click="filterStatus = f"
                :class="[
                    'px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all capitalize',
                    filterStatus === f
                        ? 'bg-white text-zinc-950 font-semibold shadow-sm'
                        : 'bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10 border border-white/10'
                ]"
            >
                {{ f }}
            </button>
        </div>

        <div v-if="isLoading" class="flex justify-center py-20">
            <Icon name="line-md:loading-loop" size="32" class="text-zinc-400"/>
        </div>

        <div v-else-if="filteredApps.length === 0" class="text-center py-20 bg-[#141417] border border-white/10 rounded-2xl p-8">
            <div class="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-3 text-zinc-500">
                <Icon name="carbon:document" size="24"/>
            </div>
            <p class="text-zinc-300 font-medium text-sm">No applications found</p>
            <p class="text-xs text-zinc-500 mt-1">Ready to apply? Create your first application package.</p>
            <NuxtLink to="/dashboard/apply/new" class="mt-4 inline-flex items-center gap-1.5 text-xs text-white hover:underline font-medium">
                Create your first application &rarr;
            </NuxtLink>
        </div>

        <div v-else class="space-y-3">
            <NuxtLink
                v-for="app in filteredApps"
                :key="app.id"
                :to="`/dashboard/apply/${app.id}`"
                class="block bg-[#141417] border border-white/10 rounded-2xl p-5 hover:border-white/20 hover:bg-[#18181c] transition-all group shadow-sm"
            >
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-4">
                        <div class="w-11 h-11 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-zinc-300 group-hover:text-white transition-all">
                            <Icon name="carbon:building" size="22"/>
                        </div>
                        <div>
                            <p class="text-white font-semibold group-hover:text-zinc-100 transition-colors">{{ app.company_name }}</p>
                            <p class="text-zinc-400 text-sm">{{ app.position }}</p>
                        </div>
                    </div>
                    <div class="flex items-center gap-4">
                        <span class="text-xs text-zinc-500 hidden sm:inline">{{ formatDate(app.created_at) }}</span>
                        <span
                            :class="[
                                'px-2.5 py-0.5 rounded-full text-[11px] font-medium border',
                                app.status === 'sent'
                                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                    : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                            ]"
                        >
                            {{ app.status === 'sent' ? 'Sent' : 'Draft' }}
                        </span>
                        <button
                            @click.prevent="handleDelete(app.id)"
                            class="p-2 rounded-lg hover:bg-rose-500/10 text-zinc-500 hover:text-rose-400 transition-all cursor-pointer"
                        >
                            <Icon name="carbon:trash-can" size="16"/>
                        </button>
                    </div>
                </div>
            </NuxtLink>
        </div>
    </div>
</template>
