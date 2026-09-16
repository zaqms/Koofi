/**
 * One-shot catalog apply for the Drive-through chip.
 * Verified pin-level rows only. Never invents districts, coords, hours, or logos.
 */
import { copyFileSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { basename, join } from "node:path";

const root = process.cwd();
const handoff = JSON.parse(
  readFileSync(
    "/tmp/dt-handoff/drive-through-chip-handoff/DEV-HANDOFF-DRIVE-THROUGH-CHIP-2026-09-16.json",
    "utf8",
  ),
);
const catalogPath = join(root, "data/catalog.json");
const popularityPath = join(root, "data/popularity-index.json");
const catalog = JSON.parse(readFileSync(catalogPath, "utf8"));
const popularity = JSON.parse(readFileSync(popularityPath, "utf8"));

const DISTRICT = {
  "al-wadi": { id: "al-wadi", ar: "الوادي" },
  "al-yasmin": { id: "al-yasmin", ar: "الياسمين" },
  "ar-rabi": { id: "al-rabi", ar: "الربيع" },
  "al-rabi": { id: "al-rabi", ar: "الربيع" },
  "al-mursalat": { id: "al-mursalat", ar: "المرسلات" },
  diriyah: { id: "diriyah", ar: "الدرعية" },
  "al-arid": { id: "al-arid", ar: "العارض" },
  "al-hamra": { id: "al-hamra", ar: "الحمراء" },
  "al-malaz": { id: "al-malaz", ar: "الملز" },
  "al-munsiyah": { id: "al-munsiyah", ar: "المونسية" },
  "al-murabba": { id: "al-murabba", ar: "المربع" },
  "al-muruj": { id: "al-muruj", ar: "المروج" },
  "al-nahdah": { id: "al-nahdah", ar: "النهضة" },
  "al-yarmouk": { id: "al-yarmouk", ar: "اليرموك" },
  "ar-rabwah": { id: "al-rabwah", ar: "الربوة" },
  "al-manar": { id: "al-manar", ar: "المنار" },
  "ar-rawabi": { id: "al-rawabi", ar: "الروابي" },
  "al-ghadeer": { id: "al-ghadeer", ar: "الغدير" },
  "as-sulaymaniyah": { id: "sulimaniyah", ar: "السليمانية" },
};

const LOGO_DIR = "/tmp/dt-handoff/drive-through-chip-handoff/logos";
const PUBLIC_LOGOS = join(root, "public/logos");

function copyLogo(srcName, destName) {
  const src = join(LOGO_DIR, srcName);
  const dest = join(PUBLIC_LOGOS, destName);
  if (!existsSync(src)) throw new Error(`missing logo ${srcName}`);
  copyFileSync(src, dest);
  return `/logos/${destName}`;
}

const javaLogo = copyLogo("java-cafe-wadi-site.png", "java-cafe.png");
const coffeeAddressLogo = copyLogo(
  "coffee-address-wadi-mark.png",
  "coffee-address-wadi-mark.png",
);
const driveLogo = copyLogo("drive-coffee-site.png", "drive-coffee-site.png");
const mezajMalazLogo = copyLogo("mezaj-malaz-mark.png", "mezaj-malaz-mark.png");
const mezajWadiLogo = copyLogo("mezaj-wadi-site.png", "mezaj-wadi-site.png");

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

function cleanAr(value, fallbackEn) {
  if (typeof value === "string") {
    const trimmed = value.replace(/\s+-\s*$/, "").trim();
    if (trimmed) return trimmed;
  }
  return fallbackEn;
}

function englishName(row) {
  const brand = row.brand;
  if (brand === "Drive Coffee") return "Drive Coffee";
  if (brand === "Java Cafe" || /^java cafe$/i.test(row.nameEn)) return "Java Cafe";
  if (brand === "Coffee Address") return "Coffee Address";
  if (brand === "24Cafe") return "24Cafe";
  if (brand === "MEZAJ") {
    return row.nameEn.includes("Maghrebi") ? "Mezaj Maghrebi" : "MEZAJ";
  }
  if (typeof row.nameEn === "string" && /[A-Za-z]/.test(row.nameEn)) {
    return row.nameEn.replace(/\s+\|\s+.*$/, "").trim();
  }
  return brand || row.nameEn;
}

const ADD_IDS = {
  "0x3e2efd0012b7901b:0xcb15d3c12a7ec8f3": "24cafe-al-wadi",
  "0x3e2ee50b9302e8eb:0xfe85ed42001b7870": "24cafe-al-yasmin",
  "0x3e2f0540dff98b35:0x9e465db31bcc0796": "24cafe-al-rabi",
  "0x3e2ee3000fff285d:0xb8eba5e82d1e0610": "agrio-al-rabi",
  "0x3e2efd006d04e08d:0xe64ff13c73835ec1": "camel-step-al-mursalat",
  "0x3e2ee1816bda2b39:0xf4e714f72c515dfe": "camel-step-diriyah",
  "0x3e2f050053f417cd:0x655ebe64fe121fa": "coffee-address-al-malaz",
  "0x3e2f0531e32f0181:0x511490758e3f040e": "coffee-address-al-murabba",
  "0x3e2ee3201a86f6c1:0x5fb4ef3770847e83": "coffee-address-al-muruj",
  "0x3e2efd23ff0bd2c3:0x8eb49edd0339eb97": "coffee-address-al-wadi",
  "0x3e2efdb12553cbcd:0xaebb5b364509f0c0": "coffee-address-al-rabi",
  "0x3e2f07003cc046cb:0xe8deaf2f79452d26": "coffee-address-al-rabwah",
  "0x3e2f04442e5d5387:0xe6adf7d5a9f6c9db": "java-cafe-al-malaz",
  "0x3e2f019b842c723f:0x49453cb4c4545d2": "java-cafe-al-manar",
  "0x3e2ee2a34b228cb9:0x79b072c15d325546": "java-cafe-al-muruj",
  "0x3e2efd1afa40335f:0x553954bb689cd13c": "java-cafe-al-wadi",
  "0x3e2f0f6d010e8553:0x7c5051346d9cb657": "java-cafe-al-rabi",
  "0x3e2f07e1cc4e7d73:0x4d5387958cac6b11": "java-cafe-al-rawabi",
  "0x3e2f037a130ef8f7:0x697082682fe8a89b": "meeting-caffeine-al-rabi",
  "0x3e2f0592929759a7:0xfe04c42b64c03742": "mezaj-al-malaz",
  "0x3e2efd02eafc2e93:0x1277b14b7e9c55ed": "mezaj-maghrebi-al-wadi",
  "0x3e2ee3042acd9c41:0x47065b2906ae5f5c": "moroccan-taste-al-muruj",
  "0x3e2e5590bd7a29bf:0xf3d43257286f5446": "n5-caffe-al-rabi",
  "0x3e2f19bb781f0d1d:0xd80e9e25085e3bf": "n5-caffe-al-rabi-2",
  "0x3e2ee3d552ada9d3:0x596c164eb7ef9675": "sol-olas-al-ghadeer",
  "0x3e2f03535b0a45d1:0xe8d9d98bac19e3b2": "three-sulimaniyah",
  "0x3e2ee5006b37ddf7:0xdd33d76f69752d40": "threes-al-yasmin",
  "0x3e2eff1ab3ca4111:0x46ed1734dc0969a": "wave-cafe-al-rabi",
  "0x3e2efd00295eb7b9:0x36afe2294fa030d9": "drive-al-rabi",
  "0x3e2f1300167fbf8d:0x6ed04938a9e8579b": "drive-al-rabi-2",
  "0x3e2f050021927b9b:0x7064ee41e76f63aa": "drive-al-rabi-3",
  "0x3e2efd0068ece6e9:0xbea4e4d5d6e09cfe": "drive-al-rabi-4",
  "0x3e2ee300687e921b:0xfbb84f91addbaec4": "drive-al-rabi-5",
};

function logoForAdd(row) {
  if (row.brand === "Java Cafe") return javaLogo;
  if (row.brand === "Coffee Address") return coffeeAddressLogo;
  if (row.brand === "Drive Coffee") return driveLogo;
  if (row.placeHex === "0x3e2f0592929759a7:0xfe04c42b64c03742") return mezajMalazLogo;
  if (row.placeHex === "0x3e2efd02eafc2e93:0x1277b14b7e9c55ed") return mezajWadiLogo;
  return undefined;
}

function arabicName(row, nameEn) {
  if (row.brand === "Java Cafe") return "جافا كافيه";
  if (row.brand === "Coffee Address") return "عنوان القهوة";
  if (row.brand === "MEZAJ") return "مزاج مغربي";
  if (row.brand === "Drive Coffee") return "درايف كوفي";
  if (row.brand === "24Cafe") return "24Cafe";
  if (row.brand === "Camel Step") return "خطوة جمل";
  return cleanAr(row.nameAr, nameEn);
}

const report = {
  tagged: [],
  added: [],
  held: [],
  dropped: [],
};

const existingIds = new Set(catalog.shops.map((shop) => shop.id));

for (const row of handoff.shops) {
  const closed =
    typeof row.openStatus === "string" &&
    /permanently closed/i.test(row.openStatus);
  if (closed) {
    report.dropped.push({
      nameEn: row.nameEn,
      placeHex: row.placeHex,
      reason: "permanently closed",
    });
    continue;
  }

  if (row.action === "TAG") {
    const shop =
      (row.catalogId &&
        catalog.shops.find((item) => item.id === row.catalogId)) ||
      findByHex(row.placeHex);
    if (!shop) {
      throw new Error(`TAG miss ${row.catalogId || row.placeHex}`);
    }
    if (!hexInUrl(shop.mapsShareUrl, row.placeHex)) {
      throw new Error(`TAG hex mismatch ${shop.id} vs ${row.placeHex}`);
    }
    if (!shop.momentTags.includes("drive-through")) {
      shop.momentTags = [...shop.momentTags, "drive-through"];
    }
    report.tagged.push({ id: shop.id, placeHex: row.placeHex });
    continue;
  }

  if (row.action !== "ADD") continue;

  if (!row.district) {
    report.held.push({
      nameEn: row.nameEn,
      placeHex: row.placeHex,
      reason: "missing district",
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
  if (existingIds.has(id) || findByHex(row.placeHex)) {
    throw new Error(`ADD would duplicate ${id} / ${row.placeHex}`);
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
  "/tmp/drive-through-apply-report.json",
  `${JSON.stringify(report, null, 2)}\n`,
);

console.log(
  JSON.stringify(
    {
      added: report.added.length,
      tagged: report.tagged.length,
      held: report.held.length,
      dropped: report.dropped.length,
      catalog: catalog.shops.length,
    },
    null,
    2,
  ),
);
