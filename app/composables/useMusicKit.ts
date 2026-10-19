import { ref } from 'vue';

declare global {
  interface Window {
    MusicKit?: any;
  }
}

export function useMusicKit() {
  const isAuthorizing = ref(false);
  const error = ref<string | null>(null);

  /**
   * Dynamically loads the official Apple MusicKit JS SDK (v3)
   */
  const loadMusicKitScript = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined') return resolve();

      if (window.MusicKit) {
        return resolve();
      }

      const existingScript = document.getElementById('apple-musickit-sdk');
      if (existingScript) {
        existingScript.addEventListener('load', () => resolve());
        existingScript.addEventListener('error', (e) => reject(e));
        return;
      }

      const script = document.createElement('script');
      script.id = 'apple-musickit-sdk';
      script.src = 'https://js-cdn.music.apple.com/musickit/v3/musickit.js';
      script.async = true;
      script.crossOrigin = 'anonymous';

      script.onload = () => resolve();
      script.onerror = (err) => reject(new Error('Gagal memuat MusicKit JS SDK dari Apple CDN'));

      document.head.appendChild(script);
    });
  };

  /**
   * Connect to Apple Music using MusicKit JS authorization popup
   */
  const connectAppleMusic = async (): Promise<string | null> => {
    isAuthorizing.value = true;
    error.value = null;

    try {
      // 1. Fetch Developer Token generated server-side
      const tokenRes = await $fetch<any>('/api/music/developer-token');
      const developerToken = tokenRes?.data?.developerToken;

      if (!developerToken) {
        throw new Error('Developer token tidak ditemukan. Pastikan kredensial developer di .env sudah lengkap.');
      }

      // 2. Load MusicKit script
      await loadMusicKitScript();

      if (!window.MusicKit) {
        throw new Error('MusicKit SDK gagal diinisialisasi');
      }

      // 3. Configure MusicKit instance
      await window.MusicKit.configure({
        developerToken,
        app: {
          name: 'Portfolio',
          build: '1.0.0',
        },
      });

      const musicKit = window.MusicKit.getInstance();

      // 4. Open official Apple ID authorization popup
      const userToken = await musicKit.authorize();

      if (!userToken) {
        throw new Error('Otorisasi dibatalkan oleh pengguna');
      }

      // 5. Save user token to server session / Redis
      await $fetch('/api/music/user-token', {
        method: 'POST',
        body: { userToken },
      });

      return userToken;
    } catch (err: any) {
      const msg = err?.data?.message || err?.message || 'Gagal menghubungkan Apple Music';
      error.value = msg;
      throw new Error(msg);
    } finally {
      isAuthorizing.value = false;
    }
  };

  /**
   * Disconnect Apple Music account
   */
  const disconnectAppleMusic = async (): Promise<void> => {
    try {
      if (typeof window !== 'undefined' && window.MusicKit) {
        const musicKit = window.MusicKit.getInstance();
        if (musicKit && typeof musicKit.unauthorize === 'function') {
          await musicKit.unauthorize();
        }
      }
    } catch {}

    await $fetch('/api/music/user-token', {
      method: 'DELETE',
    });
  };

  return {
    isAuthorizing,
    error,
    connectAppleMusic,
    disconnectAppleMusic,
  };
}
