import type { ReactNode } from "react";
import Link from "next/link";

type EnRichTextProps = {
  markdown: string;
  skipHeadingLevel1?: boolean;
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

export function EnRichText({
  markdown,
  skipHeadingLevel1 = false,
}: EnRichTextProps) {
  const items = blocks(markdown)
    .map((block) => {
      if (block.startsWith("# ")) {
        if (skipHeadingLevel1) return null;
        return (
          <h1 key={block} className="text-base font-semibold">
            {renderInline(block.slice(2))}
          </h1>
        );
      }
      if (block.startsWith("## ")) {
        return (
          <h2 key={block} className="text-sm font-semibold">
            {renderInline(block.slice(3))}
          </h2>
        );
      }
      if (isList(block)) {
        const rows = block
          .split("\n")
          .map((line) => line.trim())
          .filter((line) => line.startsWith("- "));
        return (
          <ul key={block} className="list-disc space-y-1 ps-5">
            {rows.map((row) => (
              <li key={row}>{renderInline(row.slice(2))}</li>
            ))}
          </ul>
        );
      }
      return (
        <p key={block} className="text-sm leading-6">
          {renderInline(block.replace(/\n/g, " "))}
        </p>
      );
    })
    .filter(Boolean);

  return <div className="space-y-3 text-sm leading-6 text-ink">{items}</div>;
}
