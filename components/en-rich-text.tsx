import type { ReactNode } from "react";
import Link from "next/link";

type EnRichTextProps = {
  markdown: string;
  skipHeadingLevel1?: boolean;
  className?: string;
};

function EnLink({ href, children }: { href: string; children: ReactNode }) {
  const className = "text-bean underline-offset-2 hover:underline";
  if (href.startsWith("/")) {
    return (
      <Link href={href} className={className}>
        {children}
      </Link>
    );
  }
  return (
    <a href={href} className={className}>
      {children}
    </a>
  );
}

/** Clause kinds the renderer consumes. `{chain}` marks a list row. */
const CLAUSE_KINDS = ["chain-counts", "local-counts", "chain-only"] as const;

/** Every raw marker this renderer understands. The chain check fails if one survives. */
export const CONTENT_MARKERS = [
  ...CLAUSE_KINDS.flatMap((kind) => [`{${kind}}`, `{/${kind}}`]),
  "{chain}",
] as const;

const COUNT_CLAUSE = new RegExp(
  `\\{(${CLAUSE_KINDS.join("|")})\\}([\\s\\S]*?)\\{\\/\\1\\}`,
  "g",
);

const CHAIN_ONLY_REGION = /\{chain-only\}([\s\S]*?)\{\/chain-only\}/g;

/**
 * A `{chain-only}` pair that spans a blank line is split before the clause
 * regex runs. Wrap each paragraph on its own so neither tag is left as text.
 */
function expandChainOnlyRegions(markdown: string): string {
  return markdown.replace(CHAIN_ONLY_REGION, (_full, inner: string) => {
    const parts = inner
      .replace(/\r\n/g, "\n")
      .split(/\n{2,}/)
      .map((part) => part.trim())
      .filter(Boolean);
    if (parts.length === 0) return "";
    return parts
      .map((part) => {
        if (/^#{1,6} /.test(part)) {
          return part.replace(/^(#{1,6} )/, "$1{chain-only}");
        }
        return `{chain-only}${part}{/chain-only}`;
      })
      .join("\n\n");
  });
}

function stripChainOnlyTags(text: string): string {
  return text.replace(/\{chain-only\}|\{\/chain-only\}/g, "");
}

function renderWithClauses(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let last = 0;
  let match: RegExpExecArray | null;
  let key = 0;
  COUNT_CLAUSE.lastIndex = 0;
  while ((match = COUNT_CLAUSE.exec(text))) {
    if (match.index > last) {
      nodes.push(...renderInline(stripChainOnlyTags(text.slice(last, match.index))));
    }
    const kind = match[1];
    const attr =
      kind === "chain-counts"
        ? "data-chain-counts"
        : kind === "local-counts"
          ? "data-local-counts"
          : "data-chain-only";
    nodes.push(
      <span key={`q${key}`} {...{ [attr]: "" }}>
        {renderInline(match[2] ?? "")}
      </span>,
    );
    key += 1;
    last = match.index + match[0].length;
  }
  if (last < text.length) nodes.push(...renderInline(stripChainOnlyTags(text.slice(last))));
  return nodes;
}

function renderInline(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const token =
    /(\[`[^\]]+`\]\([^)]+\)|\[.*?\]\([^)]+\)|\*\*[^*]+\*\*|`[^`]+`)/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = token.exec(text))) {
    if (match.index > last) {
      nodes.push(text.slice(last, match.index));
    }
    const chunk = match[0];
    if (chunk.startsWith("[") && chunk.includes("](")) {
      const link = chunk.match(/^\[(`?)(.+?)\1\]\((.+)\)$/);
      if (link) {
        const [, tick, label, href] = link;
        const inner = tick ? <code>{label}</code> : label;
        nodes.push(
          <EnLink key={`l${key}`} href={href}>
            {inner}
          </EnLink>,
        );
        key += 1;
      } else {
        nodes.push(chunk);
      }
    } else if (chunk.startsWith("**")) {
      nodes.push(<strong key={`b${key}`}>{chunk.slice(2, -2)}</strong>);
      key += 1;
    } else if (chunk.startsWith("`")) {
      nodes.push(<code key={`c${key}`}>{chunk.slice(1, -1)}</code>);
      key += 1;
    } else {
      nodes.push(chunk);
    }
    last = match.index + chunk.length;
  }

  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

function blocks(markdown: string): string[] {
  return markdown.replace(/\r\n/g, "\n").trim().split(/\n{2,}/);
}

function isList(block: string): boolean {
  return block
    .split("\n")
    .filter((line) => line.trim())
    .every((line) => line.startsWith("- "));
}

/** True when Local only would hide the whole block. */
function blockIsEntirelyChainOnly(block: string): boolean {
  if (isList(block)) {
    const rows = block
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.startsWith("- "));
    return rows.length > 0 && rows.every((row) => row.startsWith("- {chain} "));
  }
  const visible = block
    .replace(/\{chain-only\}[\s\S]*?\{\/chain-only\}/g, "")
    .replace(/\{chain-counts\}[\s\S]*?\{\/chain-counts\}/g, "")
    .replace(/\{chain-only\}|\{\/chain-only\}/g, "")
    .trim();
  return visible.length === 0;
}

/**
 * A section heading hides with Local only when nothing after it, up to the
 * next heading, would stay on screen. An empty section counts: nothing follows.
 */
function sectionHidesWithLocalOnly(source: string[], index: number): boolean {
  for (let cursor = index + 1; cursor < source.length; cursor += 1) {
    const next = source[cursor] ?? "";
    if (/^#{1,6} /.test(next)) break;
    if (!next.trim()) continue;
    if (!blockIsEntirelyChainOnly(next)) return false;
  }
  return true;
}

export function EnRichText({
  markdown,
  skipHeadingLevel1 = false,
  className = "space-y-3 text-sm leading-6 text-ink",
}: EnRichTextProps) {
  const source = blocks(expandChainOnlyRegions(markdown));
  const items = source
    .map((block, index) => {
      if (block.startsWith("# ")) {
        if (skipHeadingLevel1) return null;
        return (
          <h1 key={`h1-${index}`} className="text-base font-semibold">
            {renderInline(stripChainOnlyTags(block.slice(2)))}
          </h1>
        );
      }
      if (block.startsWith("## ")) {
        const chainOnly =
          /\{chain-only\}|\{\/chain-only\}/.test(block) ||
          sectionHidesWithLocalOnly(source, index);
        const label = stripChainOnlyTags(block.slice(3));
        return (
          <h2
            key={`h2-${index}`}
            className="text-sm font-semibold"
            {...(chainOnly ? { "data-chain-only": "" } : {})}
          >
            {renderInline(label)}
          </h2>
        );
      }
      if (isList(block)) {
        const rows = block
          .split("\n")
          .map((line) => line.trim())
          .filter((line) => line.startsWith("- "));
        return (
          <ul key={`ul-${index}`} className="list-disc space-y-1 ps-5">
            {rows.map((row, rowIndex) => {
              const chain = row.startsWith("- {chain} ");
              const body = chain ? row.slice("- {chain} ".length) : row.slice(2);
              return (
                <li key={`li-${index}-${rowIndex}`} {...(chain ? { "data-chain-card": "" } : {})}>
                  {renderWithClauses(body)}
                </li>
              );
            })}
          </ul>
        );
      }
      const paragraph = stripChainOnlyTags(block.replace(/\n/g, " "));
      const chainOnly =
        /\{chain-only\}|\{\/chain-only\}/.test(block) && !paragraph.includes("{chain-counts}");
      return (
        <p
          key={`p-${index}`}
          className="text-sm leading-6"
          {...(chainOnly ? { "data-chain-only": "" } : {})}
        >
          {renderWithClauses(paragraph)}
        </p>
      );
    })
    .filter(Boolean);

  return <div className={className}>{items}</div>;
}
