import { ref } from "vue";

declare global {
  interface Window {
    MusicKit?: any;
    process?: any;
  }
}

/**
 * Ensures browser globals are safe for Apple's MusicKit JS SDK.
 * musickit.js contains `"undefined"!=typeof process&&null!==process.versions&&null!==process.versions.node?Buffer:window.Buffer`
 * In Vite/Nuxt, `window.process` exists with `versions: undefined`, causing a crash:
 * `TypeError: Cannot read properties of undefined (reading 'node')`.
 */
function applyMusicKitPolyfills() {
  if (typeof window === "undefined") return;
  const win = window as any;
  if (!win.process) {
    win.process = {};
  }
  // Setting win.process.versions = null prevents both:
  // 1. `Cannot read properties of undefined (reading 'node')` at line 13
  // 2. `detectNodeEnvironment()` returning true, which caused `reading 'from'`
  win.process.versions = null;

  if (!win.Buffer) {
    win.Buffer = {
      from: (str: any, enc?: string) => ({
        toString: (outEnc?: string) => {
          try {
            if (outEnc === "base64" || enc === "binary") {
              return win.btoa ? win.btoa(str) : String(str);
            }
            return win.atob ? win.atob(str) : String(str);
          } catch {
            return String(str);
          }
        },
      }),
    };
  }
}

// Apply immediately on client module evaluation
if (typeof window !== "undefined") {
  applyMusicKitPolyfills();
}

export function useMusicKit() {
  const isAuthorizing = ref(false);
  const error = ref<string | null>(null);

  /**
   * Dynamically loads the official Apple MusicKit JS SDK (v3) safely
   */
  const loadMusicKitScript = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (typeof window === "undefined") return resolve();

      applyMusicKitPolyfills();

      const win = window as any;
      if (win.MusicKit && typeof win.MusicKit.configure === "function") {
        return resolve();
      }

      let isDone = false;
      const onDone = () => {
        if (isDone) return;
        isDone = true;
        resolve();
      };

      // Listen for MusicKit loaded event dispatched by Apple SDK
      document.addEventListener("musickitloaded", onDone, { once: true });

      const existingScript = document.getElementById("apple-musickit-sdk") as HTMLScriptElement | null;
      if (existingScript) {
        if (win.MusicKit && typeof win.MusicKit.configure === "function") {
          return onDone();
        }
        existingScript.addEventListener("load", () => {
          setTimeout(onDone, 50);
        });
        existingScript.addEventListener("error", (e) => reject(e));
        return;
      }

      const script = document.createElement("script");
      script.id = "apple-musickit-sdk";
      script.src = "https://js-cdn.music.apple.com/musickit/v3/musickit.js";
      script.async = true;
      script.crossOrigin = "anonymous";

      script.onload = () => {
        setTimeout(onDone, 50);
      };
      script.onerror = () => reject(new Error("Gagal memuat MusicKit JS SDK dari Apple CDN"));

      document.head.appendChild(script);
    });
  };

  /**
   * Helper to wait for window.MusicKit to be configured and ready
   */
  const waitForMusicKit = async (timeoutMs = 6000): Promise<any> => {
    const start = Date.now();
    const win = window as any;
    while (Date.now() - start < timeoutMs) {
      if (win.MusicKit && typeof win.MusicKit.configure === "function") {
        return win.MusicKit;
      }
      await new Promise((r) => setTimeout(r, 60));
    }
    if (win.MusicKit && typeof win.MusicKit.configure === "function") {
      return win.MusicKit;
    }
    throw new Error("MusicKit SDK belum siap atau gagal dimuat dari Apple CDN");
  };

  /**
   * Connect to Apple Music using MusicKit JS authorization popup
   */
  const connectAppleMusic = async (): Promise<string | null> => {
    isAuthorizing.value = true;
    error.value = null;

    try {
      // 1. Fetch Developer Token generated server-side
      const tokenRes = await $fetch<any>("/api/music/developer-token");
      const developerToken = tokenRes?.data?.developerToken;

      if (!developerToken) {
        throw new Error("Developer token tidak ditemukan. Pastikan kredensial developer di .env sudah lengkap.");
      }

      // 2. Load MusicKit script
      await loadMusicKitScript();

      // 3. Wait for MusicKit object
      const MusicKit = await waitForMusicKit();

      // 4. Configure MusicKit instance
      await MusicKit.configure({
        developerToken,
        app: {
          name: "Portfolio",
          build: "1.0.0",
        },
      });

      const musicKit = MusicKit.getInstance();
      if (!musicKit) {
        throw new Error("Gagal mendapatkan instance MusicKit");
      }

      // 5. Open official Apple ID authorization popup
      const userToken = await musicKit.authorize();

      if (!userToken) {
        throw new Error("Otorisasi dibatalkan oleh pengguna");
      }

      // 6. Save user token to server session / Redis
      await $fetch("/api/music/user-token", {
        method: "POST",
        body: { userToken },
      });

      return userToken;
    } catch (err: any) {
      const msg = err?.data?.message || err?.message || "Gagal menghubungkan Apple Music";
      error.value = msg;
      throw new Error(msg);
    } finally {
      isAuthorizing.value = false;
    }
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
    try {
      if (typeof window !== "undefined" && (window as any).MusicKit) {
        const musicKit = (window as any).MusicKit.getInstance();
        if (musicKit && typeof musicKit.unauthorize === "function") {
          await musicKit.unauthorize();
        }
      }
    } catch {}

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
