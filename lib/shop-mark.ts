const SKIP = new Set([
  "cafe",
  "coffee",
  "downtown",
  "and",
  "مقهى",
  "محمصة",
  "ومحمصة",
  "كافيه",
]);

function lettersFrom(name: string): string {
  const tokens = name
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .map((token) => token.trim())
    .filter(Boolean)
    .filter((token) => !SKIP.has(token.toLowerCase()));

  if (tokens.length === 0) {
    const compact = name.replace(/[^\p{L}\p{N}]/gu, "");
    return compact.slice(0, 2).toUpperCase();
  }

  const first = tokens[0];
  if (tokens.length === 1) {
    return first.slice(0, 2).toUpperCase();
  }
  if (first.length <= 2 && first === first.toUpperCase()) {
    return first.toUpperCase();
  }
  if (first.length >= 4 && first === first.toUpperCase()) {
    return first.slice(0, 2).toUpperCase();
  }

  return `${first[0] ?? ""}${tokens[1][0] ?? ""}`.toUpperCase();
}

export function shopMarkLetters(nameEn: string, nameAr: string): string {
  const latin = nameEn.trim();
  const source = /[A-Za-z]/.test(latin) ? latin : nameAr.trim();
  return lettersFrom(source) || "?";
}
