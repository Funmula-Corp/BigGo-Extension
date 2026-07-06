import { syncRegion } from "@background/sync"
import { getConfig } from "./config"
import { isLogin } from "./user"
import * as storage from "./storage"
import { envCall } from "./env"
import { send } from "@/content/messenger"

export const list = ["tw", "th", "sg", "hk", "my", "id", "jp", "ph", "vn", "in", "br", "mx", "au", "us"]

export function getRegionDomain(region) {
  switch (region) {
    case "th": return "biggo.co.th"
    case "tw": return "biggo.com.tw"
    case "hk": return "biggo.hk"
    case "my": return "biggo.my"
    case "id": return "biggo.id"
    case "sg": return "biggo.sg"
    case "jp": return "biggo.jp"
    case "ph": return "biggo.ph"
    case "vn": return "vn.biggo.com"
    case "in": return "biggo.co.in"
    case "au": return "biggo.com.au"
    case "mx": return "biggo.mx"
    case "br": return "biggo.com.br"
    case "us": return "biggo.com"
    default: return "biggo.com.tw"
  }
}

export async function getRegion() {
  const config = await getConfig()
  if(config.pageFeature.region && config.pageFeature.region !== "auto" && await isLogin()) {
    return config.pageFeature.region
  }

  return await storage.getItem(storage.STORAGE_KEY_REGION)
    || await envCall({content: () => send("sync", "region"), background: syncRegion})
}

export async function getCurrentRegionDomain() {
  const region = await getRegion()
  return getRegionDomain(region)
}

export function isSupportSearchRegion(region) {
  return list.includes(region+"")
}

export function isSupportImageSearch(region) {
  return region == "tw"
}
