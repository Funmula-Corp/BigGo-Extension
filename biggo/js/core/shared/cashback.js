import { getCurrentTab } from "@background/util"
import { envCall } from "./env"
import { getSiteList } from "./sites"
import { send } from "@/content/messenger"
import storage from "./storage"

export const REGION = ["tw"]

export async function isCashbackNindex(nindex) {
  const sites = await getSiteList()
  if(!sites[nindex]) {
    return false
  }

  return sites[nindex].detail && sites[nindex].detail.rate_desc
}

export function isCashbackRegion(region) {
  return REGION.includes(region)
}

export function getItemKey(nindex, tabid) {
  return `cashback:${tabid}:${nindex}`
}

export async function isActivity(nindex, tabid) {
  try {
    if(nindex === "tw_bid_shopee") {
      nindex = "tw_mall_shopeemall"
    }
    const time = await storage.getItem(getItemKey(nindex, tabid || await envCall({
      content: () => send("get", "tabId"),
      background: async () => (await getCurrentTab()).id || ""
    })))

    if(!time) {
      return false
    }

    return (Date.now() - time) / 1000 <= 1800
  }catch(e){
    return false
  }
}
