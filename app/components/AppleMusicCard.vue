<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import type { AppleMusicNowPlayingResponse } from '~/types/music';

// Fetch Apple Music status from backend endpoint
const { data: musicResponse, pending: isLoading, refresh } = await useFetch<BaseResponse<AppleMusicNowPlayingResponse>>('/api/music', {
  lazy: true,
  server: true,
});

const musicData = computed(() => musicResponse.value?.data);
const isConfigured = computed(() => Boolean(musicData.value?.is_configured && musicData.value?.track));
const track = computed(() => musicData.value?.track);
const genres = computed(() => musicData.value?.favorite_genres || []);
const isLive = computed(() => musicData.value?.is_live ?? false);

// Audio Preview Player State
const audioPlayer = ref<HTMLAudioElement | null>(null);
const isAudioPlaying = ref(false);
const audioProgress = ref(0);
const isMuted = ref(false);
const isAudioLoading = ref(false);
const pollTimer = ref<NodeJS.Timeout | null>(null);

const toggleAudioPlay = async () => {
  if (!audioPlayer.value || !track.value?.preview_url) return;

  if (isAudioPlaying.value) {
    audioPlayer.value.pause();
    isAudioPlaying.value = false;
  } else {
    try {
      isAudioLoading.value = true;
      await audioPlayer.value.play();
      isAudioPlaying.value = true;
    } catch (err) {
      console.warn('[AppleMusicCard] Could not play audio preview:', err);
      isAudioPlaying.value = false;
    } finally {
      isAudioLoading.value = false;
    }
  }
};

const toggleMute = () => {
  if (!audioPlayer.value) return;
  audioPlayer.value.muted = !audioPlayer.value.muted;
  isMuted.value = audioPlayer.value.muted;
};

const onTimeUpdate = () => {
  if (!audioPlayer.value || !audioPlayer.value.duration) return;
  audioProgress.value = (audioPlayer.value.currentTime / audioPlayer.value.duration) * 100;
};

const onAudioEnded = () => {
  isAudioPlaying.value = false;
  audioProgress.value = 0;
};

const handleSeek = (event: MouseEvent) => {
  if (!audioPlayer.value || !audioPlayer.value.duration) return;
  const target = event.currentTarget as HTMLElement;
  const rect = target.getBoundingClientRect();
  const clickX = event.clientX - rect.left;
  const fraction = Math.max(0, Math.min(1, clickX / rect.width));
  audioPlayer.value.currentTime = fraction * audioPlayer.value.duration;
};

// Periodic polling every 30 seconds for live Apple Music status
onMounted(() => {
  pollTimer.value = setInterval(() => {
    // Only refresh if not actively playing audio preview to avoid audio cut
    if (!isAudioPlaying.value) {
      refresh();
    }
  }, 30000);
});

onBeforeUnmount(() => {
  if (pollTimer.value) clearInterval(pollTimer.value);
  if (audioPlayer.value) {
    audioPlayer.value.pause();
    audioPlayer.value.src = '';
  }
});
</script>

<template>
  <Motion
    v-if="isConfigured && track"
    :initial="{ opacity: 0, y: 20 }"
    :while-in-view="{ opacity: 1, y: 0 }"
    :viewport="{ once: true, amount: 0.15 }"
    :transition="{ duration: 0.5, ease: 'easeOut', delay: 0.2 }"
    class="mt-8"
  >
    <div class="card-elevated rounded-3xl p-6 sm:p-7 relative overflow-hidden border border-white/10 shadow-2xl group transition-all duration-300 hover:border-pink-500/30">
    <!-- Subtle ambient glow matching Apple Music gradient -->
    <div class="absolute -top-24 -right-24 w-60 h-60 rounded-full bg-gradient-to-br from-[#fa243c]/15 via-[#fa586a]/10 to-transparent blur-3xl pointer-events-none group-hover:scale-110 transition-transform duration-700"></div>
    <div class="absolute -bottom-24 -left-24 w-52 h-52 rounded-full bg-gradient-to-tr from-cyan-500/10 via-purple-500/10 to-transparent blur-3xl pointer-events-none"></div>

    <!-- Hidden native audio element for preview with preload none -->
    <audio
      v-if="track?.preview_url"
      ref="audioPlayer"
      :src="track.preview_url"
      preload="none"
      @timeupdate="onTimeUpdate"
      @ended="onAudioEnded"
      @pause="isAudioPlaying = false"
      @play="isAudioPlaying = true"
    ></audio>

    <!-- Header: Apple Music Badge & Live Status -->
    <div class="flex items-center justify-between mb-5 relative z-10">
      <div class="flex items-center gap-2.5">
        <!-- Apple Music Badge -->
        <a
          href="https://music.apple.com"
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-[#fa243c]/20 via-[#fa586a]/20 to-[#fb5c74]/15 border border-[#fa243c]/30 text-rose-300 text-xs font-semibold hover:border-[#fa243c]/50 transition-colors cursor-pointer shadow-sm shadow-[#fa243c]/10"
          title="Visit Apple Music"
        >
          <Icon name="carbon:music" size="14" class="text-[#fa243c] animate-pulse" />
          <span class="tracking-wide">Apple Music</span>
        </a>

        <!-- Live / Recent Indicator -->
        <div class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-[11px] font-mono text-slate-300">
          <span class="relative flex h-2 w-2">
            <span
              v-if="isAudioPlaying || isLive"
              class="radar-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"
            ></span>
            <span
              class="relative inline-flex rounded-full h-2 w-2"
              :class="isAudioPlaying || isLive ? 'bg-[#fa243c]' : 'bg-slate-400'"
            ></span>
          </span>
          <span>{{ isAudioPlaying ? 'PREVIEW PLAYING' : (isLive ? 'NOW PLAYING' : 'RECENTLY PLAYED') }}</span>
        </div>
      </div>

      <!-- Action: Manual Refresh -->
      <div class="flex items-center gap-2">
        <button
          type="button"
          @click="refresh()"
          :disabled="isLoading"
          class="w-7 h-7 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer disabled:opacity-50"
          title="Refresh Apple Music status"
          aria-label="Refresh Apple Music"
        >
          <Icon name="carbon:renew" size="13" :class="{ 'animate-spin': isLoading }" />
        </button>
      </div>
    </div>

    <!-- Main Track Display -->
    <div class="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-5 p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] backdrop-blur-md mb-6 hover:bg-white/[0.04] transition-colors">
      
      <!-- Artwork & Vinyl Effect -->
      <div class="relative shrink-0 w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden border border-white/15 shadow-xl bg-slate-900 group/art">
        <img
          :src="track?.album_art || '/images/apple-music-fallback.webp'"
          :alt="`${track?.title || 'Track'} album artwork`"
          class="w-full h-full object-cover transition-transform duration-500 group-hover/art:scale-105"
          loading="lazy"
          width="112"
          height="112"
        />

        <!-- Vinyl Groove Overlay / Spinning Center if Playing -->
        <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>

        <!-- Animated Audio Waveform Overlay -->
        <div class="absolute bottom-2 right-2 flex items-end gap-1 px-1.5 py-1 rounded bg-black/60 backdrop-blur-sm border border-white/10">
          <span
            v-for="bar in 4"
            :key="bar"
            class="w-0.5 bg-[#fa243c] rounded-full transition-all duration-300"
            :style="{
              height: isAudioPlaying ? `${Math.floor(6 + ((bar * 5) % 12))}px` : '4px',
              animation: isAudioPlaying ? `bounce 0.8s ease-in-out infinite ${bar * 0.15}s` : 'none'
            }"
          ></span>
        </div>

        <!-- Quick Play / Pause Button Overlay on Art -->
        <button
          v-if="track?.preview_url"
          type="button"
          @click="toggleAudioPlay"
          class="absolute inset-0 m-auto w-10 h-10 rounded-full bg-black/70 hover:bg-[#fa243c] border border-white/20 text-white flex items-center justify-center transition-all opacity-0 group-hover/art:opacity-100 cursor-pointer shadow-lg hover:scale-110"
          :class="{ '!opacity-100 !bg-[#fa243c]': isAudioPlaying }"
          :aria-label="isAudioPlaying ? 'Pause audio preview' : 'Play audio preview'"
        >
          <Icon :name="isAudioPlaying ? 'carbon:pause-filled' : 'carbon:play-filled-alt'" size="18" />
        </button>
      </div>

      <!-- Track Information & Player Controls -->
      <div class="flex-1 min-w-0 w-full text-center sm:text-left">
        <!-- Song Title & Open Link -->
        <div class="flex items-center justify-center sm:justify-between gap-2 mb-1">
          <a
            :href="track?.url || 'https://music.apple.com'"
            target="_blank"
            rel="noopener noreferrer"
            class="text-base sm:text-lg font-heading font-bold text-white hover:text-rose-400 transition-colors truncate max-w-[280px] sm:max-w-[340px] block cursor-pointer"
            :title="track?.title"
          >
            {{ track?.title || 'Loading Soundtrack...' }}
          </a>

          <a
            :href="track?.url || 'https://music.apple.com'"
            target="_blank"
            rel="noopener noreferrer"
            class="text-slate-400 hover:text-white shrink-0 hidden sm:inline-flex"
            title="Open track on Apple Music"
            aria-label="Open on Apple Music"
          >
            <Icon name="carbon:launch" size="14" />
          </a>
        </div>

        <!-- Artist & Album -->
        <p class="text-xs sm:text-sm text-slate-300 font-medium truncate mb-1">
          <span class="text-slate-100 font-semibold">{{ track?.artist || 'Unknown Artist' }}</span>
          <span v-if="track?.album" class="text-slate-500 mx-1.5">•</span>
          <span class="text-slate-400 font-normal">{{ track?.album }}</span>
        </p>

        <!-- Dynamic Genre Badges from this song -->
        <div class="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 my-2.5">
          <span
            v-for="genre in (track?.genre_names || []).slice(0, 3)"
            :key="genre"
            class="text-[10px] font-mono px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-slate-300"
          >
            #{{ genre }}
          </span>
        </div>

        <!-- Interactive Audio Preview Bar -->
        <div v-if="track?.preview_url" class="mt-2 pt-2 border-t border-white/[0.06] flex items-center gap-3">
          <!-- Play / Pause Button -->
          <button
            type="button"
            @click="toggleAudioPlay"
            class="shrink-0 w-8 h-8 rounded-full bg-[#fa243c]/15 hover:bg-[#fa243c] border border-[#fa243c]/30 text-rose-300 hover:text-white flex items-center justify-center transition-all cursor-pointer hover:scale-105"
            :aria-label="isAudioPlaying ? 'Pause preview' : 'Play preview'"
          >
            <Icon :name="isAudioPlaying ? 'carbon:pause-filled' : 'carbon:play-filled-alt'" size="14" />
          </button>

          <!-- Audio Waveform Progress Bar -->
          <div
            @click="handleSeek"
            class="flex-1 h-2 rounded-full bg-white/10 relative overflow-hidden cursor-pointer group/bar"
            title="Click to seek preview"
          >
            <div
              class="h-full bg-gradient-to-r from-[#fa243c] to-[#fa586a] rounded-full transition-all duration-100"
              :style="{ width: `${audioProgress}%` }"
            ></div>
            <div class="absolute inset-0 bg-white/10 opacity-0 group-hover/bar:opacity-100 transition-opacity"></div>
          </div>

          <!-- Volume / Mute Button -->
          <button
            type="button"
            @click="toggleMute"
            class="shrink-0 text-slate-400 hover:text-white transition-colors cursor-pointer"
            :title="isMuted ? 'Unmute' : 'Mute'"
            :aria-label="isMuted ? 'Unmute preview' : 'Mute preview'"
          >
            <Icon :name="isMuted ? 'carbon:volume-mute' : 'carbon:volume-up'" size="15" />
          </button>

          <!-- Preview Label -->
          <span class="text-[10px] font-mono text-slate-400 shrink-0">
            Preview
          </span>
        </div>

        <!-- Fallback if no preview URL available -->
        <div v-else class="mt-2 pt-2 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-slate-400">
          <span>Listen full track on Apple Music</span>
          <a
            :href="track?.url || 'https://music.apple.com'"
            target="_blank"
            rel="noopener noreferrer"
            class="text-rose-400 hover:underline flex items-center gap-1 font-mono text-[11px]"
          >
            <span>Stream</span>
            <Icon name="carbon:arrow-up-right" size="12" />
          </a>
        </div>
      </div>
    </div>

    <!-- Favorite Genres & Music Taste Section -->
    <div v-if="genres.length > 0" class="relative z-10 pt-1">
      <div class="flex items-center justify-between mb-3">
        <div class="flex items-center gap-2">
          <Icon name="carbon:headphones" size="14" class="text-rose-400" />
          <span class="text-xs font-mono uppercase tracking-wider text-slate-300 font-semibold">Coding Soundtracks & Favorite Genres</span>
        </div>
        <span class="text-[11px] font-mono text-slate-400">Daily Rotation</span>
      </div>

      <!-- Genres Interactive Pills Grid -->
      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
        <div
          v-for="genre in genres"
          :key="genre.name"
          class="flex items-center gap-2 p-2.5 rounded-xl border backdrop-blur-sm hover:scale-[1.02] transition-transform duration-200"
          :class="[genre.bg || 'bg-white/[0.03]', genre.border || 'border-white/[0.08]']"
        >
          <div class="w-6 h-6 rounded-lg flex items-center justify-center shrink-0" :class="genre.color || 'text-rose-400'">
            <Icon :name="genre.icon || 'carbon:music'" size="14" />
          </div>
          <div class="min-w-0 flex-1">
            <p class="text-[11px] font-medium text-slate-200 truncate leading-tight">
              {{ genre.name }}
            </p>
            <p v-if="genre.count" class="text-[9px] font-mono text-slate-400 leading-none mt-0.5">
              {{ genre.count }} tracks
            </p>
          </div>
        </div>
      </div>
    </div>

    </div>
  </Motion>
</template>

<style scoped>
@keyframes bounce {
  0%, 100% {
    height: 4px;
  }
  50% {
    height: 16px;
  }
}
</style>
