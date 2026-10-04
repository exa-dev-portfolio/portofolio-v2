import { Marked } from "marked";

const markedInstance = new Marked({
  gfm: true,
  breaks: true,
  renderer: {
    link({ href, title, text }) {
      const titleAttr = title ? ` title="${title}"` : "";
      return `<a href="${href}" target="_blank" rel="noopener noreferrer"${titleAttr}>${text}</a>`;
    },
  },
});

export function useMarkdown() {
  const renderMarkdown = (content?: string | null): string => {
    if (!content) return "";
    try {
      const parsed = markedInstance.parse(content) as string;
      // Strip potentially malicious script tags
      return parsed.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");
    } catch (e) {
      console.error("Failed to parse markdown:", e);
      return content;
    }
  };

  return {
    renderMarkdown,
  };
}
