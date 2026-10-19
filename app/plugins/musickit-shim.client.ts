export default defineNuxtPlugin(() => {
  if (typeof window !== "undefined") {
    const win = window as any;
    if (!win.process) {
      win.process = {};
    }
    // Apple's MusicKit JS SDK (musickit.js) evaluates:
    // `"undefined"!=typeof process&&null!==process.versions&&null!==process.versions.node?Buffer:window.Buffer`
    // In Vite/Nuxt client environment, process is defined with versions: undefined.
    // Because null !== undefined is true, it attempts to read process.versions.node, throwing:
    // Uncaught TypeError: Cannot read properties of undefined (reading 'node')
    // Setting versions: { node: null } prevents the crash and falls back to window.Buffer / standard browser globals.
    if (!win.process.versions) {
      win.process.versions = { node: null };
    }
  }
});
