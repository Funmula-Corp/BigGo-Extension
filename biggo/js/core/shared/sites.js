import { envCall } from "./env"
import { syncSites, syncECList } from "@background/sync"
import { send } from "@/content/messenger"
import storage, { STORAGE_KEY_EC_LIST, STORAGE_KEY_SITES } from "./storage"
import { getNindexRegion } from "@/util.shared"
import { getRegion } from "./region"
import { getId } from "@background/domain"

/**
 * 取得sitetype列表
 */
export async function getSiteList() {
  const list = await storage.getItem(STORAGE_KEY_SITES)
  return list || await envCall({
    content: () => send("sync", "sites"),
    background: syncSites
  }) || {}
}

/**
 * 取得eclist列表
 */
export async function getECList() {
  const list = await storage.getItem(STORAGE_KEY_EC_LIST)
  return list || await envCall({
    content: () => send("sync", "eclist"),
    background: syncECList
  }) || {}
}

export async function getCashbackList() {
  const sites = await getSiteList()
  if(Object.keys(sites).length === 0) {
    sites = await getSites()
  }

  let obj = {}
  for (const nindex in sites) {
    const site = sites[nindex]
    if(site.detail && site.detail.rate_desc) {
      obj[nindex] = site
    }
  }
  return obj
}

/**
 * 取得同個網站但有多國版本的nindex對照表
 */
export function getGlobalSiteMap() {
  const globalSiteGroup = [
    ["tw_pec_dokodemo", "thai_ec_dokodemo", "my_ec_dokodemo", "sg_ec_dokodemo", "hk_ec_dokodemo"],
    ["tw_pec_nike", "ph_ec_nike", "thai_pec_nike", "id_ec_nike", "vn_ec_nike", "sg_pec_nike"],
    ["tw_pec_kkday", "ph_ec_kkday", "thai_pec_kkday", "sg_pec_kkday"],
    ["tw_pec_klook", "ph_ec_klook", "thai_pec_klook", "hk_ec_klook"],
    ["tw_hotels_booking", "thai_hotels_booking"],
    ["ph_ec_strawberry", "thai_pec_strawberrynet", "hk_ec_strawberrynet"]
  ]

  return globalSiteGroup.reduce((map, group) => {
    const regionMap = group.reduce((obj, nindex) => {
      obj[getNindexRegion(nindex)] = nindex
      return obj
    }, {})

    group.forEach(nindex => {
      map[nindex] = regionMap
    })
    return map
  }, {})
}

/**
 * 取得對於地區正確的nindex
 */
export async function resolveGlobalSiteNindex(nindex) {
  const globalSiteMap = getGlobalSiteMap()

  if(!globalSiteMap[nindex]) {
    return nindex
  }

  let region = await getRegion()
  if(region === "th") {
    region = "thai"
  }

  return globalSiteMap[nindex][region] || nindex
}

/**
 * 判斷網址是否為ec 從sitetype內找
 */
export async function isECFromURL(url) {
  if(!url) {
    return null
  }

  const pairNindexStoreMap = new Map()
  pairNindexStoreMap.set("https://shopee.tw/cart", "tw_mall_shopeemall")

  if(pairNindexStoreMap.has(url)) {
    return pairNindexStoreMap.get(url)
  }

  const list = await getSiteList()

  try{
    const {hostname} = (new URL(url))
    for(const nindex in list) {
      const site = list[nindex]
      let urlList = []
      if(site.detail && site.detail.alternative_domain && Array.isArray(site.detail.alternative_domain)) {
        urlList = [...urlList, ...site.detail.alternative_domain]
      }
      if(site.domain && Array.isArray(site.domain)) {
        urlList = [...urlList, ...site.domain]
      }

      for (const current of urlList) {
        if(current === hostname) {
          return site.bg_mark
        }
      }
    }
  }catch(error) {
    console.error("check ec url error: ", error)
  }

  return null
}

/**
 * 從eclist或sitetype拿url的nindex
 */
export async function getNindexFromSitelist(url) {
  if(!url) {
    return null
  }

  try {
    const list = await getECList()
    const sites = await getSiteList()
    for(const nindex in sites) {
      // 針對蝦皮特別處理
      if(nindex === "tw_bid_shopee" && (url.includes("mall.shopee.tw") || url.includes("shopee.tw/mall"))) {
        return await resolveGlobalSiteNindex("tw_mall_shopeemall")
      }

      const site = sites[nindex]
      if(site && site.domain) {
        const domains = site.domain
        for (const domain of domains) {
          if(url.indexOf(domain) > -1) {
            return await resolveGlobalSiteNindex(nindex)
          }
        }
      }

      const ec = list[nindex]
      if(ec && ec.ptn) {
        if(!(ec.ptn instanceof RegExp)) {
          ec.ptn = new RegExp(ec.ptn)
        }
        if(ec.ptn.test(url)) {
          return await resolveGlobalSiteNindex(nindex)
        }
      }
    }
  } catch (error) {
    console.error("check ec cashback error: ", error)
  }

  return null
}

export async function getNindexFromURL(url) {
  return resolveGlobalSiteNindex(await envCall({
    content: () => send("get", "domainId", url),
    background: () => getId(url)
  }))
}
