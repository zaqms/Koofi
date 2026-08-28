import type { MetadataRoute } from "next";
import { PRODUCT_NAME } from "@/lib/product";

/** Name only. This is a link, not an installable app. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: PRODUCT_NAME,
    short_name: PRODUCT_NAME,
    description: "وين القهوة الحين — ثلاث قهاوي، وسبب لكل وحدة. الرياض.",
    start_url: "/",
    display: "browser",
    lang: "ar",
    dir: "rtl",
    background_color: "#f3eee4",
    theme_color: "#6f2f22",
  };
}
