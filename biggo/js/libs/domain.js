import { isUrl } from "@/util.shared"
import { getRegion } from "@shared/region"
import storage, { STORAGE_KEY_DOMAIN_MAP, STORAGE_KEY_DOMAIN_REGION_MAP } from "@shared/storage"
import { buildFallbackDomainMap } from "./sync"

export async function getIdProcess(domain, url) {
  if (!url || typeof url != "string") {
    return ""
  }

  if (!url.startsWith("http")) {
    return ""
  }

  return domainLocalQuery(domain, url)
}

export async function domainLocalQuery(domain, url) {
  const hostname = new URL(url).hostname

  let regionMap = await storage.getItem(STORAGE_KEY_DOMAIN_REGION_MAP, () => buildFallbackDomainMap().regionMap)
  if (!regionMap || Object.keys(regionMap).length === 0) {
    regionMap = buildFallbackDomainMap().regionMap
  }
  const regions = regionMap[hostname]
  if (regions) {
    let region = await getRegion()
    if (region === "th") {
      region = "thai"
    }
    if (regions[region]) {
      return regions[region]
    }
    // 沒有匹配的地區，取第一個
    const keys = Object.keys(regions)
    if (keys.length > 0) {
      return regions[keys[0]]
    }
  }

  let domainMap = await storage.getItem(STORAGE_KEY_DOMAIN_MAP, () => buildFallbackDomainMap().map)
  if (!domainMap || Object.keys(domainMap).length === 0) {
    domainMap = buildFallbackDomainMap().map
  }
  const nindex = domainMap[hostname]
  if (nindex) {
    return nindex
  }

  return ""
}

export async function getId(url) {
  if(!isUrl(url)) {
    return ""
  }

  const _url = new URL(url)
  const domain = `${_url.protocol}//${_url.hostname}`

  // google先跳過
  if(_url.hostname.includes(`google.co`)) {
    return ""
  }

  // 目前直接在本地
  return getIdProcess(domain, url)
}
