import { ref } from "vue";

export function useMusicKit() {
  const isAuthorizing = ref(false);
  const error = ref<string | null>(null);

  /**
   * Connect to Apple Music via isolated native popup window (apple-music-auth.html).
   * This isolates Apple's MusicKit JS SDK in a vanilla HTML DOM without Vite/Nuxt shims.
   */
  const connectAppleMusic = (): Promise<string | null> => {
    return new Promise((resolve, reject) => {
      if (typeof window === "undefined") {
        return resolve(null);
      }

      isAuthorizing.value = true;
      error.value = null;

      const popupWidth = 520;
      const popupHeight = 680;
      const left = window.screenX + (window.outerWidth - popupWidth) / 2;
      const top = window.screenY + (window.outerHeight - popupHeight) / 2;

      const popup = window.open(
        "/apple-music-auth.html",
        "AppleMusicAuth",
        `width=${popupWidth},height=${popupHeight},left=${left},top=${top},status=no,menubar=no,toolbar=no`
      );

      if (!popup || popup.closed || typeof popup.closed === "undefined") {
        isAuthorizing.value = false;
        const msg = "Popup otorisasi diblokir oleh browser. Silakan izinkan popup atau gunakan opsi input manual.";
        error.value = msg;
        return reject(new Error(msg));
      }

      // Check if popup is closed by user before completing
      const checkClosedInterval = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosedInterval);
          cleanup();
          if (isAuthorizing.value) {
            isAuthorizing.value = false;
            // If user closed without receiving token
            resolve(null);
          }
        }
      }, 500);

      const messageListener = (event: MessageEvent) => {
        // Only accept messages from same origin
        if (event.origin !== window.location.origin) return;

        const data = event.data;
        if (!data || typeof data !== "object") return;

        if (data.type === "APPLE_MUSIC_AUTH_SUCCESS") {
          cleanup();
          isAuthorizing.value = false;
          resolve(data.userToken || null);
        } else if (data.type === "APPLE_MUSIC_AUTH_ERROR") {
          cleanup();
          isAuthorizing.value = false;
          const msg = data.error || "Gagal mengotorisasi akun Apple Music";
          error.value = msg;
          reject(new Error(msg));
        }
      };

      const cleanup = () => {
        clearInterval(checkClosedInterval);
        window.removeEventListener("message", messageListener);
      };

      window.addEventListener("message", messageListener);
    });
  };

  /**
   * Save user token directly (manual input fallback)
   */
  const saveManualUserToken = async (userToken: string): Promise<void> => {
    if (!userToken || !userToken.trim()) {
      throw new Error("Music User Token tidak boleh kosong");
    }
    await $fetch("/api/music/user-token", {
      method: "POST",
      body: { userToken: userToken.trim() },
    });
  };

  /**
   * Disconnect Apple Music account
   */
  const disconnectAppleMusic = async (): Promise<void> => {
    await $fetch("/api/music/user-token", {
      method: "DELETE",
    });
  };

  return {
    isAuthorizing,
    error,
    connectAppleMusic,
    saveManualUserToken,
    disconnectAppleMusic,
  };
}
