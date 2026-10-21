<script setup lang="ts">
import {ref} from 'vue'
import type {Message} from "~/types/message";
import {useToastCustom} from "~/composables/useToastCustom";

definePageMeta({
  layout: 'dashboard',
  breadCrumb: [
    {title: 'Messages'}
  ]
})

const {
  fetchMessages,
  updateMessageStatus,
  deleteMessage,
  messages,
  isLoading,
  cursor,
  hasMore,
} = useMessage()

const toast = useToastCustom()
const selectedMessage = ref<Message | null>(null)
const isDetailOpen = ref(false)
const selectedStatus = ref<'unread' | 'read'>('unread')
const canLoadMore = ref(false)

// Fetch initial messages on SSR/CSR
const {data} = await useAsyncData(`messages-${selectedStatus.value}`, async () => {
  return await fetchMessages(false, selectedStatus.value)
})


// Watch for status changes
watch([selectedStatus], async () => {
  cursor.value = null
  canLoadMore.value = false
  try {
    await fetchMessages(false, selectedStatus.value)
  } finally {
    canLoadMore.value = true
  }
}, {immediate: false})

const scrollTriggerRef = ref<HTMLElement>()

// Intersection Observer setup (client-side only)
const setupIntersectionObserver = () => {
  if (import.meta.server || !scrollTriggerRef.value) return

  const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && hasMore.value && !isLoading.value && canLoadMore.value) {
            fetchMessages(true, selectedStatus.value)
          }
        })
      },
      {
        root: null,
        rootMargin: '100px',
        threshold: 0.1,
      }
  )

  observer.observe(scrollTriggerRef.value)

  onUnmounted(() => {
    observer.disconnect()
  })
}

// Setup observer on client-side only
if (import.meta.client) {
  onMounted(() => {
    if (data.value) {
      messages.value = data.value.data
      hasMore.value = data.value.has_next

      if (data.value.data.length > 0) {
        cursor.value = data.value.data.at(-1)!.id as any
      }
    }
    canLoadMore.value = true
    setupIntersectionObserver()
  })
}

const openMessage = (message: Message) => {
  selectedMessage.value = message
  // Mark as read if unread
  if (message.status === 'unread') {
    updateMessageStatus(message.id!, 'read')
  }
  isDetailOpen.value = true
}

const closeDetail = () => {
  isDetailOpen.value = false
  selectedMessage.value = null
}

// Generate initials from name
const getInitials = (name: string): string => {
  return name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .join('')
      .slice(0, 2)
}

// Generate consistent color based on name
const getAvatarColor = (name: string) => {
  const colors = [
    {from: '#3b82f6', to: '#2563eb'},  // blue
    {from: '#a855f7', to: '#9333ea'},  // purple
    {from: '#ec4899', to: '#db2777'},  // pink
    {from: '#10b981', to: '#059669'},  // green
    {from: '#f97316', to: '#ea580c'},  // orange
    {from: '#ef4444', to: '#dc2626'},  // red
    {from: '#06b6d4', to: '#0891b2'},  // cyan
    {from: '#6366f1', to: '#4f46e5'}   // indigo
  ]

  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }

  const index = Math.abs(hash) % colors.length
  return colors[index]
}

// Get avatar background style
const getAvatarStyle = (name: string) => {
  const color = getAvatarColor(name)
  return {
    background: `linear-gradient(135deg, ${color!.from} 0%, ${color!.to} 100%)`
  }
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'unread':
      return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
    case 'read':
      return 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'
    default:
      return 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'
  }
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'unread':
      return 'material-symbols:mark-email-unread'
    case 'read':
      return 'mdi:email-open'
    default:
      return 'material-symbols:mail-rounded'
  }
}

const deleteMessageHandler = async (messageId: string) => {
  toast.showConfirmationToast(
      'Delete Message',
      'Are you sure you want to delete this message? This action cannot be undone.',
      async () => {
        const success = await deleteMessage(messageId)
        if (success) {
          closeDetail()
          cursor.value = null
          canLoadMore.value = false
          try {
            await fetchMessages(false, selectedStatus.value)
          } finally {
            canLoadMore.value = true
          }
        }
      }
  )
}

const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`

  return date.toLocaleDateString('en-US', {month: 'short', day: 'numeric', year: 'numeric'})
}

const formatStatus = (status?: string): string => {
  if (!status) return ''
  return status.charAt(0).toUpperCase() + status.slice(1)
}
</script>

<template>
  <div class="p-8">
    <!-- Page Header -->
    <div class="mb-8">
      <h1 class="text-4xl font-black text-white mb-2">Messages</h1>
      <p class="text-white/60">Manage and respond to messages from visitors and potential clients.</p>
    </div>

    <!-- Status Tabs -->
    <div class="flex gap-2 mb-8 border-b border-white/10">
      <button
          @click="selectedStatus = 'unread'"
          class="cursor-pointer px-6 py-3 font-semibold transition-all border-b-2 text-sm flex items-center gap-2"
          :class="[
            selectedStatus === 'unread'
              ? 'text-white border-white'
              : 'text-zinc-400 border-transparent hover:text-white'
          ]"
      >
        <Icon name="material-symbols:mark-email-unread" size="18"/>
        <span>Unread</span>
      </button>
      <button
          @click="selectedStatus = 'read'"
          class="cursor-pointer px-6 py-3 font-semibold transition-all border-b-2 text-sm flex items-center gap-2"
          :class="[
            selectedStatus === 'read'
              ? 'text-white border-white'
              : 'text-zinc-400 border-transparent hover:text-white'
          ]"
      >
        <Icon name="mdi:email-open" size="18"/>
        <span>Read</span>
      </button>
    </div>

    <!-- Messages List -->
    <div class="space-y-3 mb-8">
      <!-- Skeleton Loading -->
      <div v-if="isLoading && messages.length === 0" v-for="i in 5" :key="`skeleton-${i}`"
           class="bg-[#141417] border border-white/10 rounded-2xl p-4 animate-pulse">
        <div class="flex items-start gap-4">
          <div class="w-10 h-10 rounded-xl bg-white/5 shrink-0"></div>
          <div class="flex-1 space-y-2">
            <div class="h-4 bg-white/10 rounded w-1/3"></div>
            <div class="h-3 bg-white/10 rounded w-1/2"></div>
            <div class="h-3 bg-white/10 rounded w-full"></div>
          </div>
        </div>
      </div>

      <!-- Messages -->
      <div
          v-for="message in messages"
          :key="message.id"
          @click="openMessage(message)"
          class="group bg-[#141417] border border-white/10 rounded-2xl p-4 sm:p-5 hover:border-white/25 hover:bg-[#18181c] transition-all duration-300 cursor-pointer"
          :class="message.status === 'unread' ? 'border-emerald-500/30' : ''"
      >
        <div class="flex items-start gap-4">
          <!-- Avatar with Initials -->
          <div
              class="w-10 h-10 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center shrink-0 text-white font-mono font-bold text-xs shadow-inner">
            {{ getInitials(message.name) }}
          </div>

          <!-- Content -->
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-3 mb-1.5">
              <h3 class="text-sm font-bold text-white group-hover:text-zinc-200 transition-colors tracking-tight">
                {{ message.name }}
              </h3>
              <span
                  :class="['px-2.5 py-0.5 rounded-full text-xs font-mono font-medium border shrink-0 flex items-center gap-1', getStatusColor(message.status || 'read')]">
                <Icon :name="getStatusIcon(message.status || 'read')" size="13"/>
                <span>{{ formatStatus(message.status) }}</span>
              </span>
            </div>
            <p class="text-xs text-zinc-400 mb-1 font-mono">{{ message.email }}</p>
            <p class="text-sm font-semibold text-white mb-1.5 tracking-tight">{{ message.subject }}</p>
            <p class="text-xs text-zinc-400 line-clamp-2 mb-2 leading-relaxed">{{ message.message }}</p>
            <p class="text-[11px] font-mono text-zinc-500">{{ formatDate(message.created_at || '') }}</p>
          </div>

          <!-- Action -->
          <button
              class="p-2 rounded-xl bg-white/5 hover:bg-white/15 text-zinc-400 hover:text-white transition-all shrink-0">
            <Icon name="carbon:arrow-right" size="16"/>
          </button>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-if="messages.length === 0 && !isLoading" class="flex flex-col items-center justify-center py-16 rounded-2xl bg-[#141417] border border-white/10">
      <div class="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-zinc-500 mb-4">
        <Icon name="carbon:email" size="24"/>
      </div>
      <h3 class="text-base font-bold text-white mb-1 tracking-tight">No messages</h3>
      <p class="text-xs text-zinc-400 text-center">You don't have any {{ selectedStatus }} messages in this folder.</p>
    </div>

    <!-- Scroll Trigger for Infinite Scroll (Load More) -->
    <div ref="scrollTriggerRef" class="h-10 flex items-center justify-center">
      <div v-if="isLoading && messages.length > 0 && canLoadMore"
           class="flex items-center gap-2 text-zinc-400 text-xs font-mono">
        <Icon name="carbon:circle-dash" size="14" class="animate-spin"/>
        <p>Loading more messages...</p>
      </div>
    </div>

    <!-- Message Detail Modal -->
    <UModal
      v-model:open="isDetailOpen"
      :ui="{
        content: 'w-full max-w-2xl bg-[#141417] border border-white/15 shadow-2xl rounded-2xl sm:rounded-3xl overflow-hidden',
        header: 'p-5 sm:p-6 bg-[#18181c] border-b border-white/10',
        body: 'p-5 sm:p-6 max-h-[75vh] overflow-y-auto',
        footer: 'p-4 sm:p-5 bg-[#18181c] border-t border-white/10'
      }"
    >
      <template #title>
        <div class="flex items-center gap-3">
          <div
              class="w-10 h-10 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center text-white font-mono font-bold text-xs shrink-0 shadow-inner">
            {{ getInitials(selectedMessage?.name || '') }}
          </div>
          <div>
            <h2 class="text-lg font-bold text-white tracking-tight">{{ selectedMessage?.name }}</h2>
            <p class="text-xs text-zinc-400 font-mono">{{ selectedMessage?.email }}</p>
          </div>
        </div>
      </template>

      <template #description>
        <p class="text-xs text-zinc-400 font-medium">{{ selectedMessage?.subject }}</p>
      </template>

      <!-- Body -->
      <template #body>
        <div class="space-y-6">
          <!-- Message Content -->
          <div>
            <h3 class="text-xs font-mono font-semibold text-zinc-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Icon name="carbon:email" size="16" class="text-zinc-300"/>
              <span>Message Content</span>
            </h3>
            <div class="bg-white/5 border border-white/10 rounded-xl p-5">
              <p class="text-zinc-200 text-sm leading-relaxed whitespace-pre-wrap">{{ selectedMessage?.message }}</p>
            </div>
          </div>

          <!-- Sender Details -->
          <div>
            <h3 class="text-xs font-mono font-semibold text-zinc-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Icon name="carbon:user" size="16" class="text-zinc-300"/>
              <span>Sender Information</span>
            </h3>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div class="bg-white/5 border border-white/10 rounded-xl p-3.5">
                <p class="text-[11px] font-mono text-zinc-500 mb-1">Name</p>
                <p class="text-white font-medium text-xs">{{ selectedMessage?.name }}</p>
              </div>
              <div class="bg-white/5 border border-white/10 rounded-xl p-3.5">
                <p class="text-[11px] font-mono text-zinc-500 mb-1">Email</p>
                <p class="text-white font-medium text-xs break-all font-mono">{{ selectedMessage?.email }}</p>
              </div>
              <div class="bg-white/5 border border-white/10 rounded-xl p-3.5">
                <p class="text-[11px] font-mono text-zinc-500 mb-1">Status</p>
                <span
                    :class="['px-2.5 py-0.5 rounded-full text-xs font-mono font-medium border inline-flex items-center gap-1', getStatusColor(selectedMessage?.status || '')]">
                  <Icon :name="getStatusIcon(selectedMessage?.status || '')" size="12"/>
                  <span>{{ formatStatus(selectedMessage?.status || '') }}</span>
                </span>
              </div>
              <div class="bg-white/5 border border-white/10 rounded-xl p-3.5">
                <p class="text-[11px] font-mono text-zinc-500 mb-1">Received</p>
                <p class="text-white font-medium text-xs font-mono">{{ formatDate(selectedMessage?.created_at || '') }}</p>
              </div>
            </div>
          </div>
        </div>
      </template>

      <!-- Footer -->
      <template #footer>
        <div class="flex w-full justify-end gap-2.5">
          <button
              @click="deleteMessageHandler(selectedMessage?.id || '')"
              class="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 text-xs font-semibold transition-all border border-rose-500/20 cursor-pointer">
            <Icon name="carbon:trash-can" size="14"/>
            <span>Delete</span>
          </button>
          <button
              @click="closeDetail"
              class="px-5 py-2 rounded-xl bg-white text-zinc-950 hover:bg-zinc-200 text-xs font-semibold transition-all shadow-sm cursor-pointer">
            Close
          </button>
        </div>
      </template>
    </UModal>
  </div>
</template>

<style scoped>
</style>

