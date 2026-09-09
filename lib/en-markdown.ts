/** Tiny markdown subset used by locked EN district/cafe copy. */

const LINK_RE = /\[(`?)([^\]]+?)\1\]\(([^)]+)\)/g;
const BOLD_RE = /\*\*([^*]+)\*\*/g;

export function stripInlineMarkdown(value: string): string {
  return value
    .replace(LINK_RE, "$2")
    .replace(BOLD_RE, "$1")
    .replace(/`([^`]+)`/g, "$1");
}

export function stripMarkdown(markdown: string): string {
  return markdown
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => {
      const trimmed = line.trim();
      if (trimmed.startsWith("# ")) return stripInlineMarkdown(trimmed.slice(2));
      if (trimmed.startsWith("## ")) return stripInlineMarkdown(trimmed.slice(3));
      if (trimmed.startsWith("- ")) return stripInlineMarkdown(trimmed.slice(2));
      return stripInlineMarkdown(trimmed);
    })
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function wordCount(markdown: string): number {
  const text = stripMarkdown(markdown).replace(/[—–]/g, " ");
  return text.split(/\s+/).filter(Boolean).length;
}

export function markdownHasPhrase(markdown: string, phrase: string): boolean {
  return stripMarkdown(markdown).toLowerCase().includes(phrase.toLowerCase());
}
