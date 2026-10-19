export default defineNuxtPlugin(() => {
  if (typeof window !== "undefined") {
    const win = window as any;

    if (!win.process) {
      win.process = {};
    }

    // Apple MusicKit JS SDK (musickit.js) has two critical checks:
    // 1. Line 13: `"undefined"!=typeof process&&null!==process.versions&&null!==process.versions.node?Buffer:window.Buffer`
    //    If process.versions is undefined, `null !== undefined` is true, and `undefined.node` throws `reading 'node'`.
    // 2. detectNodeEnvironment: `return void 0 !== globalThis?.process?.versions?.node`
    //    If versions.node is anything other than undefined (e.g. null), detectNodeEnvironment() returns true!
    //    Then it attempts `b.from(...)` instead of `window.atob/btoa`, throwing `reading 'from'`.
    // Setting `win.process.versions = null` solves BOTH:
    // - Line 13 short-circuits (`null !== null` is false)
    // - detectNodeEnvironment() evaluates to undefined (`void 0 !== undefined` is false), correctly detecting browser!
    win.process.versions = null;

    // Safety fallback for Buffer in browser
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
});
