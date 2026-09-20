<script setup lang="ts">
import {onMounted, ref, watch} from 'vue'

definePageMeta({
  layout: false,
})
useHead({
  title: 'Login - MyApp',
  meta: [
    {
      name: 'description',
      content: 'Login to access your personalized dashboard and portfolio.',
    },
  ],
  script: [
    {
      src: 'https://accounts.google.com/gsi/client',
      async: true,
      defer: true,
    },
    {
      src: 'https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js',
      async: true,
      defer: true,
    },
  ],
})

const isLoading = ref(false)
const localError = ref<string | null>(null)
const config = useRuntimeConfig()
const debugInfo = ref<{ clientId?: string; clientUrl?: string }>({clientId: '', clientUrl: ''})

const {initGoogleSignIn, signInError} = useGoogleSignIn()
const {signInWithApple, isAppleLoading, appleSignInError} = useAppleSignIn()

// Watch untuk reactive error dari Google
watch(signInError, (newError) => {
  if (newError) {
    localError.value = newError
  }
})

// Watch untuk reactive error dari Apple
watch(appleSignInError, (newError) => {
  if (newError) {
    localError.value = newError
  }
})

onMounted(() => {
  // Debug: Tampilkan konfigurasi Google
  debugInfo.value = {
    clientId: String(config.public.googleClientId || 'NOT SET'),
    clientUrl: String(config.public.clientUrl || 'NOT SET'),
  }
  console.log('[Debug] Google Config:', debugInfo.value)
  console.log('[Debug] Apple Client ID:', config.public.appleClientId)
})

const handleGoogleLogin = async () => {
  isLoading.value = true
  localError.value = null

  // Trigger Google Sign-In pop-up
  initGoogleSignIn()

  // Pop-up adalah async, set loading false after a moment
  setTimeout(() => {
    isLoading.value = false
  }, 1000)
}

const handleAppleLogin = async () => {
  localError.value = null
  await signInWithApple()
}
</script>

<template>
  <div
      class="min-h-screen bg-linear-to-br from-[#0a0e27] via-[#0f1535] to-[#1a2332] relative overflow-hidden flex items-center justify-center">
    <!-- Animated Background Elements -->
    <div class="absolute inset-0 overflow-hidden pointer-events-none">
      <!-- Gradient Orbs -->
      <div class="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
      <div class="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse"
           style="animation-delay: 1s"></div>
      <div class="absolute top-1/2 left-1/2 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse"
           style="animation-delay: 2s"></div>

      <!-- Additional decorative elements -->
      <div class="absolute inset-0 bg-linear-to-t from-[#0a0e27]/40 via-transparent to-transparent"></div>
    </div>

    <!-- Content -->
    <div class="relative z-10 w-full max-w-lg px-6 sm:px-8">
      <!-- Logo/Branding Section -->
      <div class="text-center mb-12">
        <div class="mb-6 inline-block">
          <div
              class="w-16 h-16 sm:w-20 sm:h-20 bg-linear-to-br from-primary to-primary/60 rounded-2xl flex items-center justify-center shadow-lg shadow-primary/30">
            <Icon name="carbon:user-avatar" size="40" class="text-white"/>
          </div>
        </div>
        <h1 class="text-4xl sm:text-5xl font-black bg-linear-to-r from-white via-white to-white/60 bg-clip-text text-transparent mb-3">
          Welcome
        </h1>
        <p class="text-white/60 text-sm sm:text-base max-w-sm mx-auto leading-relaxed">
          Access your personalized dashboard and explore your portfolio
        </p>
      </div>

      <!-- Main Card -->
      <div class="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 sm:p-10 shadow-2xl">
        <!-- Error Message -->
        <div v-if="localError" class="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-lg">
          <p class="text-red-400 text-sm">{{ localError }}</p>
        </div>

        <!-- Header -->
        <div class="text-center mb-8">
          <h2 class="text-2xl font-bold text-white mb-2">Sign in to your account</h2>
          <p class="text-white/50 text-sm">Quick and secure authentication</p>
        </div>

        <!-- Login Buttons Container -->
        <div class="space-y-4">
          <!-- Google Login Button -->
          <button
              @click="handleGoogleLogin"
              :disabled="isLoading || isAppleLoading"
              class="w-full py-4 cursor-pointer px-6 rounded-xl bg-white text-[#0a0e27] font-bold text-base hover:bg-white/90 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-3 group shadow-lg hover:shadow-xl"
          >
            <Icon v-if="isLoading" name="icon-park-outline:loading-four" size="22" class="animate-spin text-[#0a0e27]"/>
            <Icon v-else name="mdi:google" size="22" class="text-[#0a0e27]"/>
            <span>{{ isLoading ? 'Signing in with Google...' : 'Continue with Google' }}</span>
          </button>

          <!-- Apple Login Button -->
          <button
              @click="handleAppleLogin"
              :disabled="isLoading || isAppleLoading"
              class="w-full py-4 cursor-pointer px-6 rounded-xl bg-[#000000] text-white border border-white/20 font-bold text-base hover:bg-[#111111] hover:border-white/40 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-3 group shadow-lg hover:shadow-xl"
          >
            <Icon v-if="isAppleLoading" name="icon-park-outline:loading-four" size="22" class="animate-spin text-white"/>
            <Icon v-else name="mdi:apple" size="24" class="text-white"/>
            <span>{{ isAppleLoading ? 'Signing in with Apple...' : 'Sign in with Apple' }}</span>
          </button>
        </div>
      </div>

      <!-- Security Info -->
      <div class="mt-8 text-center">
        <p class="text-xs text-white/40 mb-4">
          We never store your password. Your data is secure with industry-standard encryption.
        </p>
        <div class="flex items-center justify-center gap-4 text-xs text-white/50">
          <span class="flex items-center gap-1">
            <Icon name="carbon:checkmark-filled" size="16" class="text-green-400"/>
            Secure
          </span>
          <span class="flex items-center gap-1">
            <Icon name="carbon:checkmark-filled" size="16" class="text-green-400"/>
            Fast
          </span>
          <span class="flex items-center gap-1">
            <Icon name="carbon:checkmark-filled" size="16" class="text-green-400"/>
            Reliable
          </span>
        </div>
      </div>

      <!-- Terms & Privacy -->
      <div class="text-center mt-8 text-xs text-white/40">
        <p>
          By continuing, you agree to our
          <a href="/terms" class="text-primary hover:text-primary/80 transition-colors underline">Terms of Service</a>
          and
          <a href="/privacy" class="text-primary hover:text-primary/80 transition-colors underline">Privacy Policy</a>
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
@keyframes slide-in {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

div[class*="max-w-lg"] {
  animation: slide-in 0.4s ease-out;
}
</style>

