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

export async function getNindexFromURL(url) {
  return resolveGlobalSiteNindex(await envCall({
    content: () => send("get", "domainId", url),
    background: () => getId(url)
  }))
}
