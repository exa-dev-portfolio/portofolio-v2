<script setup lang="ts">
import { onMounted, ref } from 'vue'

interface Message {
  id: string
  type: 'user' | 'assistant'
  content: string
  isHtml?: boolean
  timestamp: Date
}

const isOpen = ref(false)
const messages = ref<Message[]>([
  {
    id: '1',
    type: 'assistant',
    content: "Hello! 👋 I'm Eka's AI Assistant. Ask me anything about engineering experience, tech stack, or projects!",
    timestamp: new Date()
  }
])

const userInput = ref('')
const isLoading = ref(false)
const messagesContainer = ref<HTMLElement>()
const { sendMessage: callAI, loadChatHistory } = useAIChat()

const predefinedQuestions = [
  'What is your core tech stack?',
  'Are you open for new roles?',
  'Show me your featured projects'
]

onMounted(() => {
  if (import.meta.client) {
    const history = loadChatHistory()
    if (history.length > 0) {
      const loadedMessages = history.map(msg => ({
        id: String(msg.timestamp),
        type: msg.role as 'user' | 'assistant',
        content: msg.content,
        isHtml: msg.role === 'assistant',
        timestamp: new Date(msg.timestamp)
      }))
      messages.value = [messages.value[0]!, ...loadedMessages]

      setTimeout(() => {
        if (messagesContainer.value) {
          messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
        }
      }, 0)
    }
  }
})

const sendMessage = async () => {
  if (!userInput.value.trim()) return

  const userMessage: Message = {
    id: Date.now().toString(),
    type: 'user',
    content: userInput.value,
    timestamp: new Date()
  }

  const prompt = userMessage.content
  messages.value.push(userMessage)
  userInput.value = ''
  isLoading.value = true

  setTimeout(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  }, 0)

  try {
    const response = await callAI(prompt)

    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      type: 'assistant',
      content: response || "Sorry, I couldn't generate a response. Please try again.",
      isHtml: true,
      timestamp: new Date()
    }
    messages.value.push(assistantMessage)
  } catch (error) {
    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      type: 'assistant',
      content: 'Sorry, I encountered an issue connecting to the AI service. Please try again later.',
      timestamp: new Date()
    }
    messages.value.push(assistantMessage)
  } finally {
    isLoading.value = false

    setTimeout(() => {
      if (messagesContainer.value) {
        messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
      }
    }, 0)
  }
}

const askQuestion = (question: string) => {
  userInput.value = question
  sendMessage()
}

const toggleChat = () => {
  isOpen.value = !isOpen.value
}
</script>

<template>
  <!-- AI Assistant Dock Container -->
  <div class="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 flex flex-col items-end gap-3">
    
    <!-- Chat Window -->
    <Transition
      enter-active-class="transition duration-250 cubic-bezier(0.16, 1, 0.3, 1)"
      enter-from-class="opacity-0 scale-95 translate-y-3"
      enter-to-class="opacity-100 scale-100 translate-y-0"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100 scale-100 translate-y-0"
      leave-to-class="opacity-0 scale-95 translate-y-3"
    >
      <div
        v-show="isOpen"
        class="w-[calc(100vw-2rem)] sm:w-[380px] bg-[#0c1222] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        style="max-height: calc(100vh - 7rem); height: min(560px, calc(100vh - 7rem))"
      >
        <!-- Header -->
        <div class="px-5 py-3.5 bg-[#0e1628] border-b border-white/10 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="relative w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 p-[1px] shadow-sm">
              <div class="w-full h-full bg-[#080d19] rounded-[11px] flex items-center justify-center">
                <Icon name="carbon:bot" size="18" class="text-blue-400" />
              </div>
            </div>
            <div>
              <p class="text-sm font-heading font-bold text-white flex items-center gap-1.5">
                Portfolio Copilot
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              </p>
              <p class="text-[10px] font-mono text-slate-400">Powered by Gemini AI</p>
            </div>
          </div>

          <div class="flex items-center gap-1">
            <button
              @click="toggleChat"
              class="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              aria-label="Close AI Assistant"
            >
              <Icon name="carbon:close" size="16" />
            </button>
          </div>
        </div>

        <!-- Messages Area -->
        <div
          ref="messagesContainer"
          class="flex-1 overflow-y-auto p-4 space-y-3.5 bg-[#080d19]"
        >
          <div
            v-for="message in messages"
            :key="message.id"
            :class="[
              'flex gap-2.5',
              message.type === 'user' ? 'justify-end' : 'justify-start'
            ]"
          >
            <!-- Assistant Bubble -->
            <div v-if="message.type === 'assistant'" class="flex gap-2.5 max-w-[88%]">
              <div class="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0 mt-0.5">
                <Icon name="carbon:bot" size="14" class="text-blue-400" />
              </div>
              <div
                v-if="message.isHtml"
                class="p-3 rounded-2xl rounded-tl-none bg-white/[0.04] border border-white/10 text-slate-200 text-xs sm:text-sm leading-relaxed prose prose-invert max-w-none"
                v-html="message.content"
              ></div>
              <div
                v-else
                class="p-3 rounded-2xl rounded-tl-none bg-white/[0.04] border border-white/10 text-slate-200 text-xs sm:text-sm leading-relaxed"
              >
                {{ message.content }}
              </div>
            </div>

            <!-- User Bubble -->
            <div v-else class="flex gap-2.5 max-w-[85%] justify-end">
              <div class="p-3 rounded-2xl rounded-tr-none bg-blue-600 text-white text-xs sm:text-sm leading-relaxed font-medium shadow-sm">
                {{ message.content }}
              </div>
            </div>
          </div>

          <!-- Loading Dots Indicator -->
          <div v-if="isLoading" class="flex gap-2.5 items-center">
            <div class="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
              <Icon name="carbon:bot" size="14" class="text-blue-400" />
            </div>
            <div class="p-3 rounded-2xl rounded-tl-none bg-white/[0.04] border border-white/10 flex items-center gap-1.5">
              <div class="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce" style="animation-delay: 0s"></div>
              <div class="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce" style="animation-delay: 0.2s"></div>
              <div class="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce" style="animation-delay: 0.4s"></div>
            </div>
          </div>
        </div>

        <!-- Predefined Quick Question Chips -->
        <div v-if="messages.length <= 1 && !isLoading" class="p-3 border-t border-white/10 bg-[#0a1020] space-y-1.5">
          <p class="text-[10px] font-mono uppercase text-slate-400 px-1">Suggested prompts:</p>
          <div class="flex flex-col gap-1.5">
            <button
              v-for="(q, idx) in predefinedQuestions"
              :key="idx"
              @click="askQuestion(q)"
              class="text-left px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/10 hover:border-blue-500/40 hover:bg-blue-500/10 text-xs text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              {{ q }}
            </button>
          </div>
        </div>

        <!-- Input Bar -->
        <div class="p-3 border-t border-white/10 bg-[#0a1020]">
          <form @submit.prevent="sendMessage" class="flex gap-2">
            <input
              v-model="userInput"
              type="text"
              placeholder="Ask me anything..."
              class="flex-1 px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-xs sm:text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50 transition-colors"
            />
            <button
              type="submit"
              :disabled="isLoading || !userInput.trim()"
              class="btn-primary-gradient px-4 py-2.5 rounded-xl text-white disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center cursor-pointer"
              aria-label="Send message"
            >
              <Icon name="carbon:send-alt" size="16" />
            </button>
          </form>
        </div>
      </div>
    </Transition>

    <!-- Main Floating Trigger Button -->
    <button
      @click="toggleChat"
      :aria-label="isOpen ? 'Close AI Assistant' : 'Open AI Assistant'"
      class="group relative w-12 h-12 sm:w-13 sm:h-13 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 p-[1px] shadow-lg shadow-blue-500/25 hover:scale-105 transition-transform duration-200 cursor-pointer"
    >
      <div class="relative w-full h-full bg-[#080d1a] rounded-[15px] flex items-center justify-center text-white">
        <Icon v-if="!isOpen" name="carbon:bot" size="24" class="text-blue-400 group-hover:scale-105 transition-transform" />
        <Icon v-else name="carbon:close" size="22" class="text-slate-200" />
      </div>
    </button>

  </div>
</template>
