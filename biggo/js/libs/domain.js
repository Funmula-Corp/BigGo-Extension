import { isUrl } from "@/util.shared"
import wrapQueue from "./queue"
import ga from "./ga"
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

export async function domainQuery(domain, url) {
  const {id, getAt} = await storage.getItem(`domain:${domain}`, {id: null, getAt: 0})
  const isExpire = isIdExpire(getAt)

  if(!id && isExpire) {
    // clear
    storeId(domain, "")
    const idObj = await getIdFromRemote(url)

    try{
      if(idObj) {
        ga("domain_query", idObj+"")
      }
    }catch(e) {
      console.error(e)
    }

    storeId(domain, idObj)
    return idObj
  }

  return id
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
  // return await wrapQueue(`query:domain:${domain}`, () => getIdProcess(domain, url))
}

export function isIdExpire(time) {
  if(!time) {
    return true
  }

  // a week
  const expireTime = 1000 * 60 * 60 * 24 * 7
  return Date.now() - expireTime > time
}

/** 解決像thai跟th */
function fixRegionString(region) {
  if(region === "thai") {
    return "th"
  }

  return region
}

export async function getIdFromRemote(url) {
  if(!isUrl(url)) {
    return ""
  }

  const urlObj = new URL(url)
  const domain = `${urlObj.protocol}//${urlObj.host}`
  const apiUrl = `https://${process.env.API_DOMAIN}/api/store.php?method=domain_lookup&domain=${encodeURIComponent(domain)}`
  const res = await fetch(apiUrl).then(res => res.json()).catch(e => ({}))

  if(!res) {
    return ""
  }

  // 優先使用使用者國家
  const userRegion = await getRegion()
  for(const obj of [...(res.biggo || [])]) {
    if(fixRegionString(obj.region) === userRegion) {
      return obj.id
    }
  }

  if(res.biggo && res.biggo.length > 0) {
    return res.biggo[0].id
  }

  return ""
}

export function storeId(domain, idObj) {
  storage.setItem(`domain:${domain}`, {
    getAt: Date.now(),
    id: idObj
  })
}

export default {
  getId, getIdFromRemote
}
