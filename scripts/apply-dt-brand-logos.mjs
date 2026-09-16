/**
 * Attach official DT brand marks. Never invent logos.
 * Threes (al-yasmin) and Three (sulimaniyah) stay distinct.
 */
import { copyFileSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const catalogPath = join(root, "data/catalog.json");
const catalog = JSON.parse(readFileSync(catalogPath, "utf8"));
const srcDir = "/tmp/dt-logo-chase/dt-logo-chase/logos";
const destDir = join(root, "public/logos");

const MARKS = {
  "drcafe-mark.png": "/logos/drcafe-mark.png",
  "threes-mark.png": "/logos/threes-mark.png",
  "24cafe-mark.png": "/logos/24cafe-mark.png",
  "three-mark.png": "/logos/three-mark.png",
};

for (const file of Object.keys(MARKS)) {
  const src = join(srcDir, file);
  if (!existsSync(src)) throw new Error(`missing mark ${src}`);
  copyFileSync(src, join(destDir, file));
}

const LOGO_BY_ID = new Map();
for (const shop of catalog.shops) {
  if (shop.id.startsWith("drcafe-")) {
    LOGO_BY_ID.set(shop.id, MARKS["drcafe-mark.png"]);
  }
}
LOGO_BY_ID.set("threes-al-yasmin", MARKS["threes-mark.png"]);
LOGO_BY_ID.set("three-sulimaniyah", MARKS["three-mark.png"]);
LOGO_BY_ID.set("24cafe-al-wadi", MARKS["24cafe-mark.png"]);
LOGO_BY_ID.set("24cafe-al-yasmin", MARKS["24cafe-mark.png"]);
LOGO_BY_ID.set("24cafe-al-rabi", MARKS["24cafe-mark.png"]);

if (LOGO_BY_ID.get("threes-al-yasmin") === LOGO_BY_ID.get("three-sulimaniyah")) {
  throw new Error("Threes and Three must not share a mark");
}

const report = { updated: [], missing: [] };
for (const [id, logoUrl] of LOGO_BY_ID) {
  const shop = catalog.shops.find((row) => row.id === id);
  if (!shop) {
    report.missing.push(id);
    continue;
  }
  shop.logoUrl = logoUrl;
  report.updated.push({ id, logoUrl });
}

if (report.missing.length) {
  throw new Error(`missing catalog ids: ${report.missing.join(", ")}`);
}

function formatShop(shop) {
  const order = [
    "id",
    "nameAr",
    "nameEn",
    "city",
    "neighborhood",
    "neighborhoodAr",
    "vibeTags",
    "momentTags",
    "mapsShareUrl",
    "pin",
    "logoUrl",
    "popularityIndex",
    "catalogLane",
    "example",
  ];
  const keys = [
    ...order.filter((key) => key in shop),
    ...Object.keys(shop).filter((key) => !order.includes(key)),
  ];
  const lines = ["    {"];
  keys.forEach((key, index) => {
    const comma = index < keys.length - 1 ? "," : "";
    const val = shop[key];
    if (key === "pin" && val && typeof val === "object") {
      lines.push(`      "pin": { "lat": ${val.lat}, "lng": ${val.lng} }${comma}`);
      return;
    }
    if (Array.isArray(val)) {
      lines.push(
        `      ${JSON.stringify(key)}: [${val.map((item) => JSON.stringify(item)).join(", ")}]${comma}`,
      );
      return;
    }
    lines.push(`      ${JSON.stringify(key)}: ${JSON.stringify(val)}${comma}`);
  });
  lines.push("    }");
  return lines.join("\n");
}

writeFileSync(
  catalogPath,
  `{\n  "note": ${JSON.stringify(catalog.note)},\n  "shops": [\n${catalog.shops.map((shop) => formatShop(shop)).join(",\n")}\n  ]\n}\n`,
);

console.log(
  JSON.stringify(
    {
      updated: report.updated.length,
      drcafe: report.updated.filter((row) => row.id.startsWith("drcafe-")).length,
      threes: report.updated.filter((row) => row.id === "threes-al-yasmin").length,
      three: report.updated.filter((row) => row.id === "three-sulimaniyah").length,
      cafe24: report.updated.filter((row) => row.id.startsWith("24cafe-")).length,
    },
    null,
    2,
  ),
);
