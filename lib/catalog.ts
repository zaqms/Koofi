import catalogFile from "../data/catalog.json";
import { isExampleShop } from "./product";
import type { CatalogFile, Shop } from "./types";

const catalog = catalogFile as CatalogFile;

export function listShops(): Shop[] {
  return catalog.shops.filter((shop) => shop.city === "riyadh");
}

export function getShop(id: string): Shop | undefined {
  return listShops().find((shop) => shop.id === id);
}

export function realShopCount(): number {
  return listShops().filter((shop) => !isExampleShop(shop)).length;
}
