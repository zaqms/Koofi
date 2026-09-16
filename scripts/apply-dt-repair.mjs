/**
 * Fold Scout DT district repair into the catalog.
 * Adds remaining hex-verified ADD rows. Never invents districts, pins, or logos.
 * Permanently closed = DROP. A PLUS never gets the Drive Coffee mark.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const handoff = JSON.parse(
  readFileSync(
    "/tmp/dt-repair/dt-repair-pack/DEV-HANDOFF-DRIVE-THROUGH-CHIP-2026-09-16.json",
    "utf8",
  ),
);
const catalogPath = join(root, "data/catalog.json");
const popularityPath = join(root, "data/popularity-index.json");
const catalog = JSON.parse(readFileSync(catalogPath, "utf8"));
const popularity = JSON.parse(readFileSync(popularityPath, "utf8"));

const DISTRICT = {
  "as-salam": { id: "as-salam", ar: "السلام" },
  ghubairah: { id: "ghubairah", ar: "غبيرة" },
  "al-wisham": { id: "al-wisham", ar: "الوشام" },
  badr: { id: "badr", ar: "بدر" },
  "al-aziziyah": { id: "al-aziziyah", ar: "العزيزية" },
  "al-hazm": { id: "al-hazm", ar: "الحزم" },
  "al-andalus": { id: "al-andalus", ar: "الأندلس" },
  "al-khaleej": { id: "al-khaleej", ar: "الخليج" },
  "an-nasim-al-gharbi": { id: "an-nasim-al-gharbi", ar: "النسيم الغربي" },
  "ar-rimal": { id: "ar-rimal", ar: "الرمال" },
  "al-qirawan": { id: "al-qirawan", ar: "القيروان" },
  "al-yasmin": { id: "al-yasmin", ar: "الياسمين" },
  "as-sahafah": { id: "as-sahafah", ar: "الصحافة" },
  "an-nakheel": { id: "al-nakheel", ar: "النخيل" },
  "al-nakheel": { id: "al-nakheel", ar: "النخيل" },
  "al-janadriyyah": { id: "al-janadriyyah", ar: "الجنادرية" },
};

const ADD_IDS = {
  "0x3e2f0710c6cd3d7b:0x79deb14d56573531": "a-plus-as-salam",
  "0x3e2f05e5c3807617:0xa66e2166b48b2d3f": "arabica-cafe-ghubairah",
  "0x3e2f04e1c48ccfa9:0xdd89e06d218798ae": "arabica-coffee-al-wisham",
  "0x3e2f0f7d093e89ad:0x25634e4237928efe": "drive-badr",
  "0x3e2f090039040fbf:0x3442fdc0f56cedb4": "drive-al-aziziyah",
  "0x3e2f11006ee73071:0x6ac1ed1f9c42da4a": "drive-al-hazm",
  "0x3e2f010060d8ffc3:0x5fb35dec54089a48": "drive-al-andalus",
  "0x3e2f01004769df7d:0xfb56f6756c523dac": "drive-al-khaleej",
  "0x3e2f010068e50f15:0xdaae116aad4b79ad": "drive-an-nasim-al-gharbi",
  "0x3e2ef9002b269119:0x68698a697541607d": "drive-ar-rimal",
  "0x3e2ee7000f67c713:0x87b0608ff8dcbc50": "drive-al-qirawan-2",
  "0x3e2ee3005d8dc955:0xd52930e780f1a55c": "drive-al-yasmin",
  "0x3e2ee50058d3a89f:0x57c1ed8a3852218d": "drive-as-sahafah",
  "0x3e2f0f001887555b:0xeea0e18c273e881f": "drive-badr-2",
  "0x3e2ee3000519787f:0xd54d0d43ff709a3d": "drive-al-nakheel",
  "0x3e2e5500720fb481:0xfeb986d1f94e48d3": "drive-al-janadriyyah",
};

function hexInUrl(url, hex) {
  if (!url || !hex) return false;
  const compact = hex.replace(/^0x/, "");
  return url.includes(hex) || url.includes(`1s${hex}`) || url.includes(compact);
}

function findByHex(hex) {
  return catalog.shops.find((shop) => hexInUrl(shop.mapsShareUrl, hex));
}

function officialPlaceUrl(mapsShare, hex) {
  if (typeof mapsShare === "string" && mapsShare.includes("/maps/place/")) {
    return mapsShare.split("&g_ep=")[0];
  }
  return `https://www.google.com/maps/place/data=!4m2!3m1!1s${hex}`;
}

function pinFromPlaceUrl(url) {
  const match = url.match(/!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/);
  if (!match) return undefined;
  return { lat: Number(match[1]), lng: Number(match[2]) };
}

function englishName(row) {
  if (row.brand === "Drive Coffee") return "Drive Coffee";
  if (row.brand === "A PLUS") return "A PLUS";
  if (typeof row.nameEn === "string" && /[A-Za-z]/.test(row.nameEn)) {
    return row.nameEn.replace(/\s+\|\s+.*$/, "").trim();
  }
  return row.brand || row.nameEn;
}

function arabicName(row, nameEn) {
  if (row.brand === "Drive Coffee") return "درايف كوفي";
  if (typeof row.nameAr === "string" && row.nameAr.trim()) return row.nameAr.trim();
  return nameEn;
}

function logoForAdd(row) {
  if (row.brand === "A PLUS") return undefined;
  if (row.brand === "Drive Coffee") return "/logos/drive-coffee-site.png";
  return undefined;
}

const report = { added: [], skippedExisting: [], held: [], dropped: [] };
const existingIds = new Set(catalog.shops.map((shop) => shop.id));

for (const row of handoff.shops) {
  if (row.action !== "ADD") continue;

  const closed =
    typeof row.openStatus === "string" &&
    /permanently closed/i.test(row.openStatus);
  if (closed) {
    report.dropped.push({
      nameEn: row.nameEn,
      placeHex: row.placeHex,
      district: row.district,
      reason: "permanently closed",
    });
    continue;
  }

  if (findByHex(row.placeHex)) {
    report.skippedExisting.push({
      nameEn: row.nameEn,
      placeHex: row.placeHex,
    });
    continue;
  }

  if (!row.district) {
    report.held.push({
      nameEn: row.nameEn,
      placeHex: row.placeHex,
      reason: "missing district",
    });
    continue;
  }

  if (row.district === "king-khalid-international-airport") {
    report.held.push({
      nameEn: row.nameEn,
      placeHex: row.placeHex,
      district: row.district,
      reason: "airport locality not in live neighborhood map",
    });
    continue;
  }

  const district = DISTRICT[row.district];
  if (!district) {
    report.held.push({
      nameEn: row.nameEn,
      placeHex: row.placeHex,
      district: row.district,
      reason: "district not in live map",
    });
    continue;
  }

  const id = ADD_IDS[row.placeHex];
  if (!id) {
    throw new Error(`no id mapping for ${row.placeHex}`);
  }
  if (existingIds.has(id)) {
    throw new Error(`ADD would duplicate id ${id}`);
  }

  const mapsShareUrl = officialPlaceUrl(row.mapsShare, row.placeHex);
  const pin = pinFromPlaceUrl(mapsShareUrl);
  const nameEn = englishName(row);
  const nameAr = arabicName(row, nameEn);
  const logoUrl = logoForAdd(row);

  const shop = {
    id,
    nameAr,
    nameEn,
    city: "riyadh",
    neighborhood: district.id,
    neighborhoodAr: district.ar,
    vibeTags: ["درايف ثرو"],
    momentTags: ["drive-through"],
    mapsShareUrl,
    ...(pin ? { pin } : {}),
    ...(logoUrl ? { logoUrl } : {}),
    popularityIndex: 40,
    catalogLane: "drive-through",
    example: false,
  };

  catalog.shops.push(shop);
  existingIds.add(id);
  popularity[id] = 40;
  report.added.push({
    id,
    placeHex: row.placeHex,
    neighborhood: district.id,
    logoUrl: logoUrl ?? null,
    pin: pin ?? null,
  });
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

const catalogOut = `{\n  "note": ${JSON.stringify(catalog.note)},\n  "shops": [\n${catalog.shops.map((shop) => formatShop(shop)).join(",\n")}\n  ]\n}\n`;
writeFileSync(catalogPath, catalogOut);

const popKeys = Object.keys(popularity);
const popLines = popKeys.map((key, index) => {
  const comma = index < popKeys.length - 1 ? "," : "";
  return `  ${JSON.stringify(key)}: ${JSON.stringify(popularity[key])}${comma}`;
});
writeFileSync(popularityPath, `{\n${popLines.join("\n")}\n}\n`);
writeFileSync(
  "/tmp/dt-repair-apply-report.json",
  `${JSON.stringify(report, null, 2)}\n`,
);

console.log(
  JSON.stringify(
    {
      added: report.added.length,
      skippedExisting: report.skippedExisting.length,
      held: report.held.length,
      dropped: report.dropped.length,
      catalog: catalog.shops.length,
    },
    null,
    2,
  ),
);
