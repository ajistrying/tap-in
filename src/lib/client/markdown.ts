import DOMPurify from "isomorphic-dompurify";
import { marked } from "marked";

marked.setOptions({
  gfm: true,
  breaks: true
});

export const renderMarkdown = (content: string) => {
  const raw = marked.parse(content ?? "");

  if (typeof raw === "string") {
    return DOMPurify.sanitize(raw, { USE_PROFILES: { html: true } });
  } else {
    return DOMPurify.sanitize(raw.toString(), { USE_PROFILES: { html: true } });
  }
};
