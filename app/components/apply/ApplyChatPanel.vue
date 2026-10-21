<script setup lang="ts">
interface ChatMessage {
    role: 'user' | 'assistant'
    content: string
}

const props = defineProps<{
    messages: ChatMessage[]
    loading?: boolean
}>()

const emit = defineEmits<{
    send: [message: string]
    clear: []
}>()

const userInput = ref('')
const messagesContainer = ref<HTMLElement>()

const handleSend = () => {
    const msg = userInput.value.trim()
    if (!msg || props.loading) return
    userInput.value = ''
    emit('send', msg)
}

watch(() => props.messages.length, () => {
    nextTick(() => {
        if (messagesContainer.value) {
            messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
        }
    })
})

const suggestions = [
    'Buat lebih formal',
    'Tonjolkan pengalaman Laravel',
    'Buat lebih singkat',
    'Kurangi paragraf pertama',
    'Sesuaikan dengan budaya startup',
]
</script>

<template>
    <div class="flex flex-col h-full bg-[#141417] rounded-2xl border border-white/10 overflow-hidden shadow-sm">
        <div class="px-4 py-3.5 border-b border-white/10 bg-[#18181c] flex items-center justify-between">
            <div>
                <p class="text-sm font-semibold text-white flex items-center gap-2">
                    <Icon name="carbon:chat" size="16" class="text-zinc-400"/>
                    AI Revision Chat
                </p>
                <p class="text-xs text-zinc-500">Ask AI to revise and refine the email</p>
            </div>
            <button
                v-if="messages.length > 0"
                @click="emit('clear')"
                title="Hapus riwayat chat"
                class="px-2.5 py-1 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all text-xs flex items-center gap-1 cursor-pointer border border-transparent hover:border-rose-500/20"
            >
                <Icon name="carbon:trash-can" size="14"/>
                <span class="text-[11px]">Clear</span>
            </button>
        </div>

        <div ref="messagesContainer" class="flex-1 overflow-y-auto p-4 space-y-3">
            <div v-if="messages.length === 0" class="text-center py-8">
                <Icon name="carbon:chat-bot" size="32" class="text-zinc-600 mx-auto mb-2"/>
                <p class="text-sm text-zinc-400 font-medium">Ask AI to revise the email</p>
                <p class="text-xs text-zinc-600 mt-1">Try one of the suggestions below</p>
            </div>

            <div
                v-for="(msg, idx) in messages"
                :key="idx"
                :class="[
                    'flex gap-2',
                    msg.role === 'user' ? 'justify-end' : 'justify-start'
                ]"
            >
                <div
                    v-if="msg.role === 'assistant'"
                    class="max-w-[90%] bg-white/10 border border-white/15 rounded-xl px-3.5 py-2.5 text-sm text-zinc-200 leading-relaxed"
                >
                    {{ msg.content }}
                </div>
                <div
                    v-else
                    class="max-w-[90%] bg-white text-zinc-950 font-medium rounded-xl px-3.5 py-2.5 text-sm leading-relaxed shadow-sm"
                >
                    {{ msg.content }}
                </div>
            </div>

            <div v-if="loading" class="flex gap-2">
                <div class="bg-white/10 border border-white/15 rounded-xl px-3.5 py-2.5 flex items-center gap-1.5">
                    <div class="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-bounce" style="animation-delay: 0s"></div>
                    <div class="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-bounce" style="animation-delay: 0.2s"></div>
                    <div class="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-bounce" style="animation-delay: 0.4s"></div>
                </div>
            </div>
        </div>

        <div class="px-4 py-3 border-t border-white/10 bg-[#18181c]">
            <div v-if="messages.length <= 1 && !loading" class="mb-3">
                <div class="flex flex-wrap gap-1.5">
                    <button
                        v-for="(sug, idx) in suggestions"
                        :key="idx"
                        @click="emit('send', sug)"
                        class="px-2.5 py-1 text-xs rounded-lg bg-white/5 border border-white/10 text-zinc-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
                    >
                        {{ sug }}
                    </button>
                </div>
            </div>

            <form @submit.prevent="handleSend" class="flex gap-2">
                <input
                    v-model="userInput"
                    type="text"
                    placeholder="Type revision request..."
                    class="flex-1 px-3.5 py-2 rounded-xl bg-zinc-900/60 border border-white/10 text-white placeholder:text-zinc-600 focus:outline-none focus:border-white/30 text-sm"
                />
                <button
                    type="submit"
                    :disabled="loading || !userInput.trim()"
                    class="px-3.5 py-2 rounded-xl bg-white text-zinc-950 font-semibold hover:bg-zinc-200 disabled:opacity-40 transition-all cursor-pointer shadow-sm flex items-center justify-center"
                >
                    <Icon name="carbon:send" size="16"/>
                </button>
            </form>
        </div>
    </div>
</template>

<style scoped>
::-webkit-scrollbar {
    width: 4px;
}
::-webkit-scrollbar-track {
    background: transparent;
}
::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 2px;
}
</style>
