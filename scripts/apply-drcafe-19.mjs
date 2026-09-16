/**
 * Fold Scout dr.CAFE-19 hex pack into the catalog.
 * Official Maps place hex + district only. Never invent pins, logos, or districts.
 * Permanently closed / notFound / out-of-Riyadh stay out.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const handoff = JSON.parse(
  readFileSync(
    "/tmp/drcafe-19/drcafe-19-pack/DEV-HANDOFF-DRCAFE-19-2026-09-16.json",
    "utf8",
  ),
);
const catalogPath = join(root, "data/catalog.json");
const popularityPath = join(root, "data/popularity-index.json");
const catalog = JSON.parse(readFileSync(catalogPath, "utf8"));
const popularity = JSON.parse(readFileSync(popularityPath, "utf8"));

const DISTRICT = {
  namar: { id: "namar", ar: "نمار" },
  "as-sulimaniyah": { id: "sulimaniyah", ar: "السليمانية" },
  "an-nahdah": { id: "al-nahdah", ar: "النهضة" },
  badr: { id: "badr", ar: "بدر" },
  kkia: { id: "kkia", ar: "مطار الملك خالد" },
  "al-jazirah": { id: "al-jazirah", ar: "الجزيرة" },
  "al-aziziyah": { id: "al-aziziyah", ar: "العزيزية" },
  "an-nasim": { id: "an-nasim", ar: "النسيم" },
  "al-wadi": { id: "al-wadi", ar: "الوادي" },
  "an-nasim-al-gharbi": { id: "an-nasim-al-gharbi", ar: "النسيم الغربي" },
  "al-munsiyah": { id: "al-munsiyah", ar: "المونسية" },
  shubra: { id: "shubra", ar: "شبرا" },
  manfuha: { id: "manfuha", ar: "منفوحة" },
  tuwaiq: { id: "tuwaiq", ar: "طويق" },
  "al-maghrazat": { id: "al-mughrizat", ar: "المغرزات" },
  "al-mathar": { id: "al-mathar", ar: "المعذر" },
  "as-suwaidi": { id: "as-suwaidi", ar: "السويدي" },
};

const ADD_IDS = {
  "0x3e2f0fe76bdfb701:0x928c99cfc2d87be2": "drcafe-namar",
  "0x3e2f03791bc4b859:0x1b964057f60fabad": "drcafe-sulimaniyah",
  "0x3e2f0052067454f3:0xa856dfa409d9ff29": "drcafe-al-nahdah",
  "0x3e2f0e41a7dd61af:0xd8692919b993047a": "drcafe-badr",
  "0x3e2efb04fb343b3f:0x52a38463347ab11c": "drcafe-kkia",
  "0x3e2fa19d0adb9a3b:0x9f4ad21c462110a3": "drcafe-al-jazirah",
  "0x3e2f06e25cee8377:0x9df991d46f20952": "drcafe-al-jazirah-2",
  "0x3e2f08ded355923b:0xc4bc656b1e447b13": "drcafe-al-aziziyah",
  "0x3e2efd05adeb83e5:0x969915ad21e01c84": "drcafe-an-nasim",
  "0x3e2efd05b15a0823:0x451777b9e0fff348": "drcafe-al-wadi",
  "0x3e2f0092559b0727:0x9df0d7386f767cd2": "drcafe-an-nasim-al-gharbi",
  "0x3e2efda2ac7732ab:0xf6e431cfe1736bf2": "drcafe-al-munsiyah",
  "0x3e2f0f8aa2b64d2f:0xfcfad1512bf4804a": "drcafe-shubra",
  "0x3e2f0fe284e5df7d:0x7d5dbfd4cb376ee8": "drcafe-manfuha",
  "0x3e2f03c7ad55c98f:0xab1d4d63141eb7db": "drcafe-sulimaniyah-2",
  "0x3e2f23d8f7793ff7:0xcd9dc3308cf0a8b5": "drcafe-tuwaiq",
  "0x3e2f03188dc9c7c3:0x6f4363ded7db4c2a": "drcafe-al-mughrizat",
  "0x3e2f1d603358c3c5:0xe25266bdde4d5e0c": "drcafe-al-mathar",
  "0x3e2f11001901a3f5:0xaf74b1bb8db394a2": "drcafe-as-suwaidi",
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

const report = {
  added: [],
  skippedExisting: [],
  held: [],
  dropped: [],
};
const existingIds = new Set(catalog.shops.map((shop) => shop.id));

for (const row of handoff.add) {
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

  if (!row.placeHex) {
    report.held.push({
      nameEn: row.nameEn,
      district: row.district,
      reason: "missing official place hex",
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

  const shop = {
    id,
    nameAr: "د.كيف كافيه",
    nameEn: "dr.CAFE",
    city: "riyadh",
    neighborhood: district.id,
    neighborhoodAr: district.ar,
    vibeTags: ["درايف ثرو"],
    momentTags: ["drive-through"],
    mapsShareUrl,
    ...(pin ? { pin } : {}),
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
    pin: pin ?? null,
    storeId: row.storeId,
  });
}

for (const row of handoff.holdNotFound ?? []) {
  report.held.push({
    storeId: row.storeId,
    nameEn: row.nameEn,
    reason: "notFound",
  });
}
for (const row of handoff.outOfScopeRiyadh ?? []) {
  report.held.push({
    storeId: row.storeId,
    nameEn: row.nameEn,
    reason: "outOfScopeRiyadh",
  });
}
for (const row of handoff.droppedClosed ?? []) {
  report.dropped.push({
    storeId: row.storeId,
    nameEn: row.nameEn,
    placeHex: row.hex,
    reason: "permanently closed",
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
      lines.push(
        `      "pin": { "lat": ${val.lat}, "lng": ${val.lng} }${comma}`,
      );
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
  "/tmp/drcafe-19-apply-report.json",
  `${JSON.stringify(report, null, 2)}\n`,
);

const starbucks = catalog.shops.filter((shop) =>
  /starbucks/i.test(`${shop.id} ${shop.nameEn} ${shop.nameAr}`),
);

console.log(
  JSON.stringify(
    {
      added: report.added.length,
      skippedExisting: report.skippedExisting.length,
      held: report.held.length,
      dropped: report.dropped.length,
      catalog: catalog.shops.length,
      starbucks: starbucks.length,
    },
    null,
    2,
  ),
);
